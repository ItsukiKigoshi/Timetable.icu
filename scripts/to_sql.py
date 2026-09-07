import json
import re
from datetime import datetime, timezone

def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "1" if val else "0"
    if isinstance(val, (int, float)):
        return str(val)
    safe_val = str(val).replace("'", "''")
    return f"'{safe_val}'"

def generate_sql():
    try:
        with open('./scripts/out/dist_courses.json', 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
    except FileNotFoundError:
        print("❌ dist_courses.json not found.")
        return

    # Deduplicate items
    seen_keys = set()
    data = []
    for item in raw_data:
        key = f"{item['year']}-{item.get('rgNo', '')}-{item['courseCode']}-{item['instructor']}"
        if key not in seen_keys:
            seen_keys.add(key)
            data.append(item)

    output = [
        "-- Auto-generated SQL for D1 Sync (Upsert Optimized)",
        "PRAGMA foreign_keys = OFF;",
        "-- Clean up invalid empty records",
        "DELETE FROM courses WHERE rg_no IS NULL OR rg_no = '';"
    ]

    for item in data:
        # 1. Prepare parameters
        raw_rg_no = item.get('rgNo', '')
        instructor = item.get('instructor', '')
        course_code = item.get('courseCode', '')
        year = item.get('year')
        units_val = item.get('units', 0.0)

        instr_part = re.sub(r'[^\w]', '', instructor)[:10].upper()
        dummy_rg_no = f"TEMP-{course_code}-{instr_part}".upper()

        # Check if valid rgNo exists
        has_real_rg_no = bool(raw_rg_no and raw_rg_no.strip() != "")
        target_rg_no = raw_rg_no if has_real_rg_no else dummy_rg_no

        # --- Generate SQL ---

        # 2. Promote TEMP ID if real rgNo becomes available
        if has_real_rg_no:
            update_temp_sql = f"""
            UPDATE courses SET rg_no = {escape_sql(raw_rg_no)} 
            WHERE year={year} AND rg_no = {escape_sql(dummy_rg_no)}
            AND NOT EXISTS (SELECT 1 FROM courses WHERE year={year} AND rg_no = {escape_sql(raw_rg_no)});
            """
            output.append(update_temp_sql.strip())

        # 3. Upsert into main courses table
        course_sql = f"""
        INSERT INTO courses (
            year, term, course_code, rg_no, title_ja, title_en, 
            instructor, room, language, status, units, updated_at
        )
        VALUES (
            {year}, {escape_sql(item['term'])}, {escape_sql(course_code)}, 
            {escape_sql(target_rg_no)}, {escape_sql(item['titleJa'])}, {escape_sql(item['titleEn'])}, 
            {escape_sql(instructor)}, {escape_sql(item['room'])}, {escape_sql(item['language'])}, 
            {escape_sql(item['status'])}, {units_val}, strftime('%s', 'now')
        )
        ON CONFLICT(year, rg_no) DO UPDATE SET 
            course_code=excluded.course_code,
            title_ja=excluded.title_ja, 
            title_en=excluded.title_en, 
            instructor=excluded.instructor, 
            room=excluded.room, 
            status=excluded.status, 
            units=excluded.units, 
            updated_at=strftime('%s', 'now');
        """
        output.append(course_sql.strip())

        # Subquery for course ID resolution
        course_id_where = f"year={year} AND rg_no={escape_sql(target_rg_no)}"
        course_id_subquery = f"(SELECT id FROM courses WHERE {course_id_where} LIMIT 1)"

        # 4. Update child tables
        cat_id = item.get('categoryId')
        if cat_id:
            output.append(f"DELETE FROM course_to_categories WHERE course_id = {course_id_subquery};")
            output.append(f"INSERT OR IGNORE INTO course_to_categories (course_id, category_id) SELECT id, '{cat_id}' FROM courses WHERE {course_id_where} LIMIT 1;")

        output.append(f"DELETE FROM course_schedules WHERE course_id = {course_id_subquery};")
        for s in item.get('schedules', []):
            sch_sql = f"""
            INSERT INTO course_schedules (course_id, day_of_week, start_time, end_time, period, is_long, is_alternative, alt_group_id)
            SELECT id, {escape_sql(s['dayOfWeek'])}, {escape_sql(s['startTime'])}, {escape_sql(s['endTime'])}, 
                   {s['period']}, {1 if s.get('isLong') else 0}, {1 if s.get('isAlternative') else 0}, {escape_sql(s.get('altGroupId'))}
            FROM courses WHERE {course_id_where} LIMIT 1;
            """
            output.append(sch_sql.strip())

    # 5. Save metadata update directly to D1 meta_settings table
    now_iso = datetime.now(timezone.utc).isoformat()
    metadata_sql = f"""
    INSERT INTO meta_settings (key, value, updated_at)
    VALUES ('courseLastUpdatedAt', '{now_iso}', strftime('%s', 'now'))
    ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = strftime('%s', 'now');
    """
    output.append(metadata_sql.strip())

    output.append("PRAGMA foreign_keys = ON;")

    with open('scripts/out/sync_courses.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(output))
    print(f"✅ Generated sync_courses.sql with Upsert ({len(data)} courses)")

if __name__ == "__main__":
    generate_sql()