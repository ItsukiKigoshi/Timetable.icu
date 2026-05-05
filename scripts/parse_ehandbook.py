# ehandbook(公開情報)経由のHTML解析
# https://campus.icu.ac.jp/public/ehandbook/SearchCourseAndSyllabus.aspx
# 英語, 日本語のHTMLを./scripts/data/ehandbook/に
# all_courses_cla_en.html, all_courses_cla_ja.html, all_courses_doctor_en.html, all_courses_doctor_ja.html, all_courses_master_en.html, all_courses_master_ja.html
# の6ファイルを配置
import json
import os
import re
from bs4 import BeautifulSoup
from utils import parse_full_schedule, parse_units, get_category_id_from_code, TERM_MAP, save_course_update_metadata

def generate_unique_key(item):
    """
    科目コード、教員名、学期を組み合わせて、rgNoがない場合でも
    個体を識別できるユニークキーを生成する。
    """
    # 記号や空白による不一致を防ぐため正規化
    instructor = re.sub(r'[\s,]', '', item.get('instructor', '')).lower()
    return f"{item['rgNo']}-{item['courseCode']}-{instructor}-{item['year']}{item['term']}"

def parse_ehandbook_html(html_content, is_english=True):
    soup = BeautifulSoup(html_content, 'lxml')
    table_id = "ctl00_ContentPlaceHolder1_grv_course_e" if is_english else "ctl00_ContentPlaceHolder1_grv_course_j"
    table = soup.find('table', id=table_id)

    if not table:
        return []

    rows = table.find_all('tr')[1:]  # ヘッダーをスキップ
    data_list = []

    for row in rows:
        cols = row.find_all('td')
        if len(cols) < 8:
            continue

        # 1. rgNoの抽出
        link_tag = cols[2].find('a')
        rgno = ""
        if link_tag and 'href' in link_tag.attrs:
            href_value = str(link_tag['href'])
            match = re.search(r'regno=([0-9]+)', href_value)
            if match:
                rgno = match.group(1)

        # 2. 学期の変換 (Autumn, Winter, Spring 等に正規化)
        raw_term = cols[1].get_text(strip=True)
        term = TERM_MAP.get(raw_term, raw_term)

        # 3. データの一次格納
        item = {
            "rgNo": rgno,
            "year": int(cols[0].get_text(strip=True) or 2026),
            "term": term,
            "courseCode": cols[2].get_text(strip=True),
            "title": cols[3].get_text(strip=True),
            "schedule_raw": cols[4].get_text(strip=True),
            "instructor": cols[5].get_text(strip=True),
            "units_raw": cols[6].get_text(strip=True),
            "language": cols[7].get_text(strip=True),
        }
        # 紐付け用のキーを生成して保持
        item["_merge_key"] = generate_unique_key(item)
        data_list.append(item)

    return data_list

def merge_and_format(en_list, ja_list):
    # 日本語データを検索しやすいように辞書化
    ja_lookup = {item['_merge_key']: item['title'] for item in ja_list}

    final_results = []
    for en_item in en_list:
        # キーを使用して日本語タイトルを取得
        title_ja = ja_lookup.get(en_item['_merge_key'], en_item['title'])

        course_obj = {
            "rgNo": en_item["rgNo"],
            "status": "active",
            "year": en_item["year"],
            "term": en_item["term"],
            "courseCode": en_item["courseCode"],
            "titleJa": title_ja,
            "titleEn": en_item["title"],
            "instructor": en_item["instructor"],
            "room": "",  # ehandbookからは取得不可
            "language": en_item["language"],
            "categoryId": get_category_id_from_code(en_item["courseCode"]),
            "units": parse_units(en_item["units_raw"]),
            "schedules": parse_full_schedule(en_item["schedule_raw"])
        }
        final_results.append(course_obj)

    return final_results

def run_parser():
    base_dir = "scripts/data/ehandbook"
    # 解析対象のファイルペアを定義
    target_files = [
        ("all_courses_cla_en.html", "all_courses_cla_ja.html", "CLA"),
        ("all_courses_master_en.html", "all_courses_master_ja.html", "Master"),
        ("all_courses_doctor_en.html", "all_courses_doctor_ja.html", "Doctor")
    ]

    output_file = 'scripts/out/dist_courses.json'
    all_combined_results = []
    total_found_files = 0

    print("--- ehandbook Parser Start ---")

    for en_file, ja_file, label in target_files:
        path_en = os.path.join(base_dir, en_file)
        path_ja = os.path.join(base_dir, ja_file)

        if os.path.exists(path_en) and os.path.exists(path_ja):
            print(f"Processing {label}...")
            with open(path_en, "r", encoding="utf-8") as f:
                html_en = f.read()
            with open(path_ja, "r", encoding="utf-8") as f:
                html_ja = f.read()

            raw_en = parse_ehandbook_html(html_en, is_english=True)
            raw_ja = parse_ehandbook_html(html_ja, is_english=False)

            # このカテゴリのEN/JAをマージ
            merged = merge_and_format(raw_en, raw_ja)
            all_combined_results.extend(merged)

            print(f"  - {label} items: {len(merged)}")
            total_found_files += 2
        else:
            print(f"Warning: Files for {label} not found. Skipping...")

    if not all_combined_results:
        print("Error: No data processed. Check file paths.")
        return

    # rgNoがある場合は rgNoを、ない場合は _merge_key を使って重複を排除
    unique_dict = {}
    for c in all_combined_results:
        # rgNoがあれば優先、なければ予備のキーを使う
        key = c['rgNo'] if c['rgNo'] else generate_unique_key(c)
        # まだ登録されていないか、既存データが空文字で今回データがrgNo持ちなら上書き
        if key not in unique_dict:
            unique_dict[key] = c
    final_list = list(unique_dict.values())

    # 保存
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, ensure_ascii=False, indent=2)

    save_course_update_metadata()

    print("--- Process Completed ---")
    print(f"Total processed items (after deduplication): {len(final_list)}")
    print(f"Output: {os.path.abspath(output_file)}")

if __name__ == "__main__":
    run_parser()