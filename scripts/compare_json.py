# ehandbookとicuMAPから生成されたJSONファイルの差分を調査するためのPython Script
# 比較したいJSONをscripts/out/dist_courses_ehandbook.jsonとscripts/out/dist_courses_icumap.jsonに置いて実行する
# 結果: ehandbookにはキャンセルされたコースが含まれていない
import json
import re

def generate_compare_key(item):
    """
    rgNoに依存せず、データの中身だけでキーを作る。
    ehandbookとicuMAPの『共通項』だけで構成。
    """
    # 1. 科目コード (空白・大文字小文字を正規化)
    code = re.sub(r'\s+', '', str(item.get('courseCode', ''))).upper()

    # 2. 年度と学期
    year = str(item.get('year', ''))
    term = str(item.get('term', ''))

    # 3. タイトル (表記揺れ対策として先頭3文字のみ)
    # icuMAPとehandbookで「：」や「　」の使い方が違う場合があるため
    title = re.sub(r'[^\w]', '', str(item.get('titleJa', '')))[:3]

    # 4. (オプション) 教員名を含めると精度は上がるが、
    # STAFF表記などでズレるなら含めないほうが一致する

    return f"{code}-{year}-{term}-{title}"

def load_json_with_fallback(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    result_dict = {}
    for item in data:
        key = generate_compare_key(item)
        # すでに同じキーがある場合は、情報量が多い方（rgNoがある方など）を優先しても良い
        result_dict[key] = item
    return result_dict

def compare():
    path_eh = 'scripts/out/dist_courses_ehandbook.json'
    path_im = 'scripts/out/dist_courses_icumap.json'

    # フォールバック付きでロード
    eh_data = load_json_with_fallback(path_eh)
    im_data = load_json_with_fallback(path_im)

    eh_keys = set(eh_data.keys())
    im_keys = set(im_data.keys())

    # 差分抽出
    only_im = im_keys - eh_keys
    only_eh = eh_keys - im_keys

    print("--- 統計 ---")
    print(f"ehandbook 総数 (Unique): {len(eh_keys)}")
    print(f"icuMAP    総数 (Unique): {len(im_keys)}")
    print(f"差分（純粋な件数差）    : {len(im_keys) - len(eh_keys)}")

    print(f"\n--- icuMAP にのみ存在 ({len(only_im)}件) ---")
    for k in sorted(list(only_im)):
        item = im_data[k]
        print(f"[{item['rgNo']}]\t{item['year']}\t{item['term']}\t{item['status']}\t{item['courseCode']}\t{item['titleJa'][:20]}")

    print(f"\n--- ehandbook にのみ存在 ({len(only_eh)}件) ---")
    for k in sorted(list(only_eh)):
        item = eh_data[k]
        print(f"[{item['rgNo']}]\t{item['year']}\t{item['term']}\t{item['status']}\t{item['courseCode']}\t{item['titleJa'][:20]}")

if __name__ == "__main__":
    compare()