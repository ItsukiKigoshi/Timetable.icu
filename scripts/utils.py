import json
import re
from datetime import datetime, timezone
import os

# --- メタデータ（更新日時）保存用 ---
COURSE_UPDATE_INFO_PATH = './src/db/data/course-last-update.json'

# --- 定数・変換マップ ---
DAY_MAP = {
    'm': 'Mon', 'tu': 'Tue', 'w': 'Wed', 'th': 'Thu', 'f': 'Fri', 'sa': 'Sat', 'su': 'Sun',
    'mon': 'Mon', 'tue': 'Tue', 'wed': 'Wed', 'thu': 'Thu', 'fri': 'Fri', 'sat': 'Sat', 'sun': 'Sun'
}

TERM_MAP = {
    'Autumn': 'Autumn', 'Winter': 'Winter', 'Spring': 'Spring',
    '秋': 'Autumn', '冬': 'Winter', '春': 'Spring',
}

PERIOD_TIMES = {
    1: ("08:45", "10:00"),
    2: ("10:10", "11:25"),
    3: ("11:35", "12:50"),
    4: ("14:00", "15:15"),
    5: ("15:25", "16:40"),
    6: ("16:50", "18:05"),
    7: ("18:15", "19:30"),
}


# --- スケジュール解析ロジック ---
def parse_full_schedule(schedule_raw):
    if not schedule_raw or schedule_raw.strip() == "":
        return []

    # --- 括弧をカンマに置換、または除去して正規化する ---
    # (5/TH, 6/TH) のような形式を 5/TH, 6/TH に変換
    normalized_raw = schedule_raw.replace('(', '').replace(')', '')

    alt_match = re.search(r'<(.*)>', normalized_raw)
    core_str = normalized_raw
    alt_groups_str = []
    if alt_match:
        core_str = normalized_raw.replace(alt_match.group(0), "").strip(', ')
        alt_groups_str = [g.strip() for g in alt_match.group(1).split('or')]

    raw_segments = []
    for p in re.split(r',', core_str):
        p = p.strip()
        if '/' in p: raw_segments.append({"text": p, "isAlternative": False, "altGroupId": None})
    for i, group in enumerate(alt_groups_str):
        group_id = i + 1
        for p in re.split(r',', group):
            p = p.strip()
            if '/' in p: raw_segments.append({"text": p, "isAlternative": True, "altGroupId": group_id})

    final_schedules = []
    for item in raw_segments:
        text = item["text"].lower()
        is_long = False
        if text.startswith('*'):
            is_long = True
            text = text[1:]

        try:
            period_str, day_raw = text.split('/', 1)
            period = int(period_str)
            day_of_week = DAY_MAP.get(day_raw, "Mon")

            # デフォルトの時間を取得
            start_t, end_t = PERIOD_TIMES.get(period, ("00:00", "00:00"))

            if is_long:
                if period == 4:
                    start_t, end_t = ("13:20", "15:15")
                elif period == 5:
                    start_t, end_t = ("15:25", "17:20")
                elif period == 7:
                    start_t, end_t = ("18:15", "20:10")

            final_schedules.append({
                "dayOfWeek": day_of_week,
                "startTime": start_t,
                "endTime": end_t,
                "period": period,
                "isLong": is_long,
                "isAlternative": item["isAlternative"],
                "altGroupId": item["altGroupId"]
            })
        except (ValueError, KeyError):
            continue

    return final_schedules


# Unitsを取り出す
def parse_units(s):
    """
    ICUの単位表記を数値(float)に変換する
    - "2" -> 2.0
    - "1/3" -> 0.3333...
    - "3/(9)" -> 3.0 (括弧内のコマ数は無視)
    - "(9)" -> 0.0 (単位としての実体がない場合)
    """
    if not s:
        return 0.0

    # 1. 括弧とその中身を削除 (例: "3/(9)" -> "3/")
    s_cleaned = re.sub(r'\(.*?\)', '', s).strip()

    # 2. 末尾に残る可能性があるスラッシュを削除 (例: "3/" -> "3")
    s_cleaned = s_cleaned.rstrip('/')

    if not s_cleaned:
        return 0.0

    try:
        # 分数形式 (1/3 など) の処理
        if '/' in s_cleaned:
            num, den = s_cleaned.split('/')
            return float(num) / float(den)
        # 通常の数値
        return float(s_cleaned)
    except (ValueError, ZeroDivisionError):
        return 0.0


# --- Category判定 ---
def get_category_id_from_code(course_code):
    # 先頭の英字部分を抽出 (例: ELA010 -> ELA, JLP001 -> JLP)
    match = re.match(r"([A-Z]+)", course_code)
    if not match:
        return "C009"  # 不明な場合は Others

    prefix = match.group(1)

    # 1. 大学院科目 (Qから始まるもの)
    if prefix.startswith('Q'):
        return "GRAD"

    # 2. 一般教育科目 (GEから始まる GEX, GEN, GES... などすべて)
    if prefix.startswith('GE'):
        return "C003"

    # 3. 世界の言語 (Wから始まるもの)
    if prefix.startswith('W'):
        return "C005"

    # --- 4. 完全一致による特殊マッピング ---
    special_mapping = {
        "ELA": "C001",
        "JLP": "C002",
        "HPE": "C004",
        "ELG": "C010",
        "TCP": "C006",
        "CTP": "C007",
        "SLR": "C008",
        "STH": "MSTH",  # 卒業研究
    }

    if prefix in special_mapping:
        return special_mapping[prefix]

    # --- 5. メジャー科目 (M + Prefix) ---
    major_id = f"M{prefix}"

    # 存在するメジャーIDかチェックするためのセット
    valid_majors = {
        "MAMS", "MANT", "MARC", "MAST", "MBIO", "MBUS", "MCED", "MCHM",
        "MDPS", "MECO", "MEDU", "MEMS", "MENV", "MGLS", "MGSS", "MHST",
        "MIRL", "MISC", "MJPS", "MLAW", "MLED", "MLIT", "MLNG", "MMCC",
        "MMTH", "MMUS", "MPCS", "MPHR", "MPHY", "MPOL", "MPPL", "MPSY", "MSOC"
    }

    if major_id in valid_majors:
        return major_id

    # 5. どれにも当てはまらない場合
    return "C009"



def save_course_update_metadata():
    """
    既存のcourseLastUpdatedAtをhistoryに移してから，
    新しいcourseLastUpdatedAtをUTCで保存する．
    """
    # 1. 現在時刻をUTCで取得
    now_utc = datetime.now(timezone.utc).isoformat()

    # 2. 既存のデータを読み込み
    history = []
    old_last_updated = None

    if os.path.exists(COURSE_UPDATE_INFO_PATH):
        try:
            with open(COURSE_UPDATE_INFO_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # 前回の更新日時を取得
                old_last_updated = data.get("courseLastUpdatedAt")
                # 既存の履歴を取得
                current_history = data.get("history", [])
                if isinstance(current_history, list):
                    history = current_history
                elif isinstance(current_history, str):
                    history = [current_history]
        except Exception as e:
            print(f"Warning: 履歴の読み込みに失敗しました: {e}")

    # 3. 既存の「最新日時」を「履歴」に移動する
    # historyの先頭に、前回の時刻を追加（重複チェック付き）
    if old_last_updated and old_last_updated not in history:
        history.insert(0, old_last_updated)

    # 4. 保存用データ構造の作成
    # courseLastUpdatedAt は今回の新しい時刻に更新
    update_data = {
        "courseLastUpdatedAt": now_utc,
        "history": history
    }

    # 5. 保存処理
    try:
        os.makedirs(os.path.dirname(COURSE_UPDATE_INFO_PATH), exist_ok=True)
        with open(COURSE_UPDATE_INFO_PATH, 'w', encoding='utf-8') as f:
            json.dump(update_data, f, ensure_ascii=False, indent=2)

        print(f"--- Metadata Updated ---")
        print(f"New Last Updated (UTC): {now_utc}")
        print(f"Moved Old Update to History: {old_last_updated}")
        print(f"Total History count: {len(history)}")
    except Exception as e:
        print(f"Error: メタデータの保存に失敗しました: {e}")
