# icuMAP（非公開情報）経由のHTML解析
# https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx
# HTMLを./scripts/data/icumap/all_courses.htmlへ配置
import json
import os
from bs4 import BeautifulSoup
from utils import (
    parse_full_schedule,
    parse_units,
    save_course_update_metadata,
    get_category_id_from_code,
    TERM_MAP
)

def parse_icumap_html(html_content):
    soup = BeautifulSoup(html_content, 'lxml')

    # 1. テーブルの特定 (IDが ctl00_ContentPlaceHolder1_grv_course)
    table = soup.find('table', id="ctl00_ContentPlaceHolder1_grv_course")

    if not table:
        print("⚠️ テーブルが見つかりませんでした。IDを確認してください。")
        return []

    # 2. 全ての行を取得
    # recursive=Falseを外し入れ子構造の中にある tr も確実に拾う
    rows = table.find_all('tr')

    res_list = []
    seen_rgno = set()

    for row in rows:
        # 3. rgNoの特定 (提供されたHTML内の id に合わせて後方一致)
        rgno_tag = row.select_one('span[id$="_lbl_rgno"]')
        if not rgno_tag:
            continue

        rgno = rgno_tag.get_text(strip=True)
        # ヘッダーや重複を弾く
        if not rgno.isdigit() or rgno in seen_rgno:
            continue
        seen_rgno.add(rgno)

        # 4. IDのプレフィックスを生成
        # 例: "ctl00_ContentPlaceHolder1_grv_course_ctl02_lbl_rgno"
        # -> "ctl00_ContentPlaceHolder1_grv_course_ctl02_lbl_"
        tag_id = str(rgno_tag.get('id', ''))
        base_id = tag_id.replace('lbl_rgno', 'lbl_')

        # 5. キャンセル判定 (打消し線クラスの確認)
        title_ja_tag = row.find('span', id=base_id + "title_j")
        is_cancelled = False
        if title_ja_tag:
            def get_safe_classes(tag):
                if tag is None:
                    return []
                cls = tag.get('class')
                if isinstance(cls, list):
                    return cls # すでにリストならそのまま
                if isinstance(cls, str):
                    return [cls] # 文字列ならリストに包む
                return [] # Noneなどの場合は空リスト
            combined_classes = get_safe_classes(title_ja_tag) + \
                               get_safe_classes(title_ja_tag.parent)
            is_cancelled = "word_line_through" in combined_classes

        # テキスト取得ヘルパー
        def get_text(label):
            tag = row.find('span', id=base_id + label)
            return tag.get_text(strip=True) if tag else ""

        # 6. 学期の正規化
        raw_term = get_text("season")
        term = TERM_MAP.get(raw_term, raw_term)

        course_code = get_text("course_no")

        # 7. オブジェクト構築
        course_obj = {
            "rgNo": rgno,
            "status": "cancelled" if is_cancelled else "active",
            "year": int(get_text("ay") or 2026),
            "term": term,
            "courseCode": course_code,
            "titleJa": get_text("title_j"),
            "titleEn": get_text("title_e"),
            "instructor": get_text("instructor"),
            "room": get_text("room"),
            "language": get_text("lang"),
            "categoryId": get_category_id_from_code(course_code),
            "units": parse_units(get_text("unit")),
            "schedules": parse_full_schedule(get_text("schedule"))
        }

        res_list.append(course_obj)

    return res_list

def run_parser():
    file_path = "scripts/data/icumap/all_courses.html"
    output_file = 'scripts/out/dist_courses.json'

    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            html_data = f.read()

        print("--- icuMAP Parser Start ---")
        results = parse_icumap_html(html_data)

        # 保存
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        # メタデータ更新
        save_course_update_metadata()

        print("--- Process Completed ---")
        print(f"Total courses: {len(results)}")
        print(f"Output: {os.path.abspath(output_file)}")
        print("icuMAP parsing completed.")
    else:
        print(f"Error: {file_path} Not Found")

if __name__ == "__main__":
    run_parser()