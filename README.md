# [ICUのじかんわり | Timetable.icu](https://timetable.icu/)
ICU生の時間割・履修計画アプリの決定版

## できること
### 🔎あなたにピッタリのコースを見つける
- 公式授業一覧から取得されたすべてのコースを検索
### 📅完璧な時間割を組む
-  Long 4, 5, 6, 7など、ICUならではのコマ割りも表示
### 🔄マルチデバイス同期
-  ログインしてすべてのデバイスで最新の時間割を共有

## Screenshots
| Page | Screenshots |
| :---: | :---: |
| Home | ![Home](/uploads/f15de3cae7b1d26157d90fe93865c1ad/Screen_Shot_2026-04-23_at_23.59.02.png){width=900 height=563} |
| Explore | ![Explore](/uploads/9cc6a871a66a6ae2102d1c736075e34c/Screen_Shot_2026-04-23_at_23.58.59.png){width=900 height=563} |
| Timetable | ![Timetable](/uploads/e1528b102b0561314df2642b05f54a64/Screen_Shot_2026-04-23_at_23.58.54.png){width=900 height=563} |

# 目標

<!-- - [ ] ようこに卒業までつかってもらう -->
- [ ] 100人のTermly Active UserをICU内で獲得する
    - [ ] Google / DuckDuckGoで「ICU 履修登録」「ICU 時間割」「ICU academic planning」「ICU registration」で1番目
    - [ ] Share機能
      - [ ] 画像: 画面とロゴ，URL; アプリを知ってもらう機会にする
      - [ ] リンク: 「あなたもつくる？」の導線
-  [x] 私が卒業しても自動で更新される状態にする
  - [x] 授業データを公開情報のみで構築する
    - [x] 教室情報は各自に打ち込んでもらえるように
    - [x] regnoはsyllabus公開後にリンクから取得
  - [ ] GitLab CI/CD?
      
# 大切にしたいこと

- [x] とにかく時間割作成に使いやすいものである
    - [x] long時間割対応 (しょうもないことだがアイデンティティ)
    - [x] 軽量 (めざせ 全ページPageSpeedInsights 100): 全ページ97点以上達成，充分だろう
- [ ] ICUらしくある
    - [ ] いろいろなものがひしめくリベラルアーツの感じを楽しく表現する
    <!-- - [x] 隠し要素 --> 
- [ ] プロジェクトとして持続可能なものである
    - [ ] 後輩に引き継ぐ前提で作る，その価値があるものにする
    - [ ] 後進育成
      - [ ] Web/アプリ開発入門
      - [ ] ハッカソン
    - [x] オープンソース
    - [ ] ICUのいろいろな団体とコラボする
    - [ ] できればCTLなどでも使ってもらいたい
    - [x] 木越が責任を持って取り組む
- [ ] Transparency
    - [ ] Share Issues, Feature Requests
    - [ ] 透明性のある予算と，ちゃんと収支均衡を取る

# まだできないこと

- [ ] Google Calendar / .icsエクスポート？
- [x] FeatureRequest/Feedback (他の人も見られる?)
    - [ ] Google Formにいかずとも簡単に送れるように
    - [ ] With Upvote
- [ ] 実際の履修登録 (リンク貼る)
    - [ ] Registration Website
- [ ] 卒業要件との照らし合わせ (リンク貼る)
    - [ ] Grad Requirement Checklist
    - [ ] 卒業要件PDF (ehandbook)
- [ ] 授業評価（TES）を見ること (リンク貼る)
    - [ ] 見やすくして掲載は要検討
    - [ ] TODO - Over Year TES解析
        - [ ] RegIDが違うのでまずは経年でコースを統合(instructorとcorusenoが一致する?)して解析; Python
        - [ ] 経年評価や同一講師の授業評価を可視化
- [ ] オフラインで確認すること
    - [ ] 代わりに: Apple/Google Calendarへのエクスポート
    - [x] 代わりに: スクショしやすい画面配置
- [x] マニュアル登録: できるようになった

# 挑戦したいこと

- [ ] PR
    - [ ] 対面で宣伝
    - [ ] Instagram等でICU関連の団体/個人に宣伝してもらう
    - [ ] 受験生にリーチ
        - [ ] 「こんなサイトを学生が作る大学なんだ！」+入学後に使ってもらう
- コンポーネントテスト
- [x] ちゃんと[Webアナリティクス](https://www.cloudflare.com/application-services/products/analytics/)を取って開発の励みにする

# ライバル

- [ICUrriculum](https://icu-courses.com)
- [Timetable4ICU](https://www.timetable4icu.com/): 2026のスケジュールは更新されていない
- すごい時間割
- Penmark

# 参考

- [Hupass](https://hupass.hu-jagajaga.com/)
- [現在の時間割](https://www.icu.ac.jp/news/2406181000.html)
- Twinte
- [Webサービス公開前のチェックリスト](https://zenn.dev/catnose99/articles/547cbf57e5ad28)
- 過去のTimetable for icu
  - 1代目「ICUTTABLE」
    - 不明
  - 2代目「ICUTTABLE#2」: [ICU生向け時間割アプリ「ICUTTABLE#2」開発者インタビュー](http://weeklygiants.co/?p=1805)
    - 新井友朗さん（ID17-18か？）
  - 3代目「Timetable For ICU」:  [私の芽―ICU時間割アプリを作る](http://weeklygiants.co/?p=8872)
    - 千葉彌平さん（ID19; お会いしたことある, 確か平島大先生のご紹介?） 
        - 課題: Apple Developers Programの登録料を賄えない
    - [GitHub](https://github.com/YasuChiba/TimeTableForICU-ios-public)
    - [Twitter](https://x.com/TimeTableForICU)
    - [Facebook](https://www.facebook.com/timetableforicu/)
  - 4代目 : [Timetable4ICU - 国際基督教大学の時間割アプリ](https://www.timetable4icu.com/)
    - Kohshi Yamaguchi (ID24-25?; お会いしたことある)
      - Apple Developers Programの登録料は気にならないとお会いしたときに仰っていた
    - 3代目のスクリーンショットと比較する限り，3代目を引き継いだ？
    - [GitHub](https://github.com/kohshi54/Timetable4ICU)
    - [Twitter](https://x.com/timetable4icu)

---

# Development

## 技術選定

### Frontend

- Astro
- React
- Tailwindcss
- DaisyUI
- Typescript

### Backend

- Astro
- BetterAuth (Google OAuth/Passkey)
- Drizzle ORM
- Typescript

### Infra

- Cloudflare Workers
- Cloudflare D1

### Test
- Playwright

## 🚀 Project Structure

```text
/
├── public/
│   └── favicon.svg
├── migrations/
│   └── migration.sql
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Component.astro
│   ├── layouts
│   │   └── Layout.astro
│   ├── lib
│   │   └── server.ts // schema definitions, auth-related files
│   ├── pages
│   │   └── index.astro
│   ├── styles
│   │   └── global.css
│   ├── env.d.ts // Type for Astro
│   └── middleware.ts
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command               | Action                                           |
|:----------------------|:-------------------------------------------------|
| `bun install`         | Installs dependencies                            |
| `bun dev`             | Starts local dev server at `localhost:4321`      |
| `bun run build`       | Build your production site to `./dist/`          |
| `bun preview`         | Preview your build locally, before deploying     |
| `bun astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help` | Get help using the Astro CLI                     |

Run Test
```bash
bun x playwright test
```

Format Code
```bash
bun x biome check --write
```

Create types from wrangler.jsonc

```bash
bunx wrangler types
```

### Schema Definition, Migration

Create schema for BetterAuth

```bash
bun x auth@latest generate --config=./src/lib/auth/cli.ts --output=./src/db/schema/auth.ts
```

Create migration file by Drizzle Kit

```bash
bun x drizzle-kit generate
```

一度生成したmigrationファイルをなかったことにする

```bash
bun x drizzle-kit drop
```

Migration to D1
Remoteは1度目は通らないことがあるが2回目やればいけるときがある

```bash
bun db:migrate:local
```

```bash
bun db:migrate:remote
```

もし外部キー制約が通らない場合

```shell
bun wrangler d1 execute timetable_icu --remote --file=./migrations/0012_smart_mojo.sql
```

などとしてmigration出来るが，これではD1のmigration履歴が残らないため，上記execute後に上記
sqlファイルの中身を一旦空にしてapplyする方法がある．私は一度これをやってPasskey Tableを消してしまったので推奨しない．
-->しかし，wrangler applyではPRAGMA foreign_keys = OFF;が勝手に無効化されることがあるので，bun wrangler d1 executeでやらなければいけない場面もありそう．

Debug with Cloudflare Environment

```bash
bun run build && bun x wrangler dev
```

D1でのSQL文実行例
```bash
bun wrangler d1 execute timetable_icu --file=scripts/out/sync_courses.sql
```

### Corse data insertion

Create JSON from HTML

```bash
bun db:scrape:icumap    # 学生専用サイトからダウンロードしたHTMLがある前提
bun db:scrape:ehandbook # 公開情報からダウンロードしたHTMLがある前提
```

Local DBにJSONからcourses/categoriesを入れる

```bash
bun db:push:local
```

HTML->JSON->Local DBを一括で実行

```bash
bun db:sync:local
```

Remote DBにJSONからcourses/categoriesを入れる

```bash
bun db:push:remote
```

HTML->JSON->Remote DBを一括で実行

```bash
bun db:sync:remote
```

ライセンス出力

```bash
bun x generate-license-file --input package.json --output CREDITS
```

リモートのログ出力

```bash
bun wrangler tail
```
<!--
# 工程表
- [x] Astro App Initialise
- [x] BetterAuth
    - [x] Google OAuth
    - [x] Passkey
        - [x] ~~Session情報最適化 (KV/JWT?; 毎RequestでWorkersに行かなくてもいいようにできる?)~~:
          とりあえずはmiddlewareの情報を使って最適化できそう
    - [ ] アカウント削除機能
      - [ ] アカウント削除の前には必ずもう一度OAuth認証をはさむなどして本人確認を．
      - [ ] 他のサイトを見習って，削除操作から14日後に本当に削除，それまではキャンセルが効くようにしよう
- [x] Get Syllabi Data
    - [x] ブラウザ保存->Pythonパース？
    - [x] Pythonで完結
    - [ ] 定期的に自動で: GitHub CI/CD (ICUのサーバに負荷をかけないように，出来れば公開情報だけを元に; regnoが公開されていないのが問題)
- [x] 時間割
    - [ ] C-week対応
    - [x] Calendar形式で表示
        - [x] Termセレクター
        - [x] 表示をSophisticate
            - [x] ~~クリック時の挙動は, カレンダーアプリなどと同様にその1つのイベントにdropdownが出てくるのが良い？~~:
              スマホ操作を考えるなら今の挙動が良い
            - [x] 開始時間->CorseID タイトル->場所かな
            - [x] Roomを表示するのはログイン済みユーザだけ！
        - [ ] 理系の選択式の演習UI: 優先度低し
          - [ ] DBは設計済み
          - [ ] フロントエンドの開発だけでいける
            - [ ] 演習選択Dialog
            - [ ] 選択式の演習であることをCourseHeaderのScheduleに表示
    - [x] ~~現在の曜日を強調，現在時刻に赤線?（もしくはその日に線）~~: Not Planned
    - [x] Modal　Componentにサブタイトルをつけて統一
    - [x] 保存機能
        - [x] Drizzle ORM
        - [x] Schema定義
        - [x] D1 Deploy
          - [ ] 帰国したらD1のlocationを日本に移す？（せっかくEdge DBなのに毎回海を越えてたら意味ない）
          - [ ] データが消えないように細心の注意を払う必要がある
          - [ ] よほどlatencyが目立たないかぎり，公式移行機能がつくまで待つという手もある
        - [x] 未ログインユーザはLocalStorageへ
            - [x] LocalStorageから同期後の通知で，ちゃんとデータが統合されたことを明示
              - [x] Snack通知
              - [ ] update_atの値が最新の方を使うようにする
              - [ ] 失敗時のログ（LocalStorageに格納）と手動同期ボタン
    - [x] ログインしてるなら時間割にRoomを出す！
    - [x] lg未満ではコースタイトルを出さずコースナンバーとルームだけ！
    - [x] show/hide機能
        - [x] Listにだけ表示されるようにする
        - [x] もしくは時間割上に網線で表示される（+"非表示の授業は単位数にカウントされません"みたいなメッセージ）か
        - [x] user courses schemaに追加（boolean; 0/1）
    - [x] List形式で表示
    - [x] コース詳細モーダルがBuggyなのどうにかした方が良い
        - [x] コースを削除してもモーダルが閉じない
        - [x] ロングの後ろがクリックできるけど空（ロングはその後ろの時間も占有するべき？）
        - [x] モーダル内のアコーディオンの反応が悪い（これはDaisyUIのせい？）
    - [x] ~~Google Calendar / .icsエクスポート？~~: Currently not planned
        - [x] 授業開始日と終了日
        - [x] 休講日を除く
        - [x] [学年暦](https://www.icu.ac.jp/about/calendar/)
        - [x] 「公式の Google Calendarも便利だよ」
    - [x] Urgent: 表示するコースをyear termによって限定，を徹底する
    - [x] 原因は，useTimetableのsource of truthをFlatSchedule型からUserCourseWithDetails型に変えた時にその辺の実装もごっそり削ってしまったこと
        - [x] commit #ab319e13が犯人, production環境でこのミスは許されるものではない
        - [x] このcommit以前の実装を参照
    - [x] その上で削除時，非表示時，メモ追加時にlocalStorageにはすべてのコースを保存することを徹底．
    - [x] .filter(uc => uc.year === selectedYear && uc.term === selectedTerm)を3箇所でかける実装は危ない
    - [x] useTimetableのなかでcoursesをsource of truthとして持ちつつuseEffectで表示するコース一覧（displayCourses）も持つ必要がある
        - [x] displaySchedule(FlatSchedule[]型)のUserCourse[]型バージョン．
    - [x] 実装ミスに気づけるようにCourse Headerに常にYear Termを表示
    - [x] コース追加の導線を整理: コースが無ければ新規コースを追加
- [x] 授業検索
    - [x] 全体の条件クリアボタン（year, term以外）
    - [x] キーワード検索にCourse ID, regidを含む!
    - [x] キャンセルされた授業をそのように明示: 追加できないように
        - [x] 現状では非表示，このままでもいいか？
    - [x] 開講言語
        - [x] 絞り込み機能
    - [ ] Foundation, Area Majorの絞り込み
        - [ ] CourseCodeを「アルファベット」(String 3-4文字）と「数字」（0-999; 数字として保存してフロントで3文字に加工）の方が良い？
        - [ ] そもそも100から始まればfoundation, 2-300から始まればarea major?そのルールは絶対？
        - [ ] GLOBを使えばワイルドカードで100番台は持ってこられる
        - [ ] 一番確実なのは公式の結果をそのまま挿入することだが，なるべくやりたくない: colistはこれをやらざるをえないかも
    - [x] メジャーとそれ以外を分離, もしくはタグ形式で
    - [x] Issue: Co-Listに非対応; ehandbookを参照しながらColistが何かを解説
        - [x] ~~コマをクリックでその時間の授業を検索~~
        - [x] ~~授業詳細: Dialogueか個別ページ (Dynamic Routing)~~: とりあえず Not Planned
    - [x] ~~空きコマ検索: 現状の機能でも工夫次第で対応できるのでとりあえずは優先度低い~~: Not Planned
         - [x] ~~slots(この名称もscheduleにするべき？)が2つ以上なら空きコマ検索モードにする？~~
            - [x] ~~デフォルトでは1slotしかUIで選択出来ないようにし，「クリア」と「閉じる」の間の「□空きコマを探す(?)」をチェックすると複数コマが選択できるようになる~~
            - [x] 既にコースが登録されていれば勝手にスケジュールを入れてくれる
            - [x] ~~「選択したスケジュールで履修できるコマを表示します」などヘルプメッセージを入れる~~
        - [x] ~~選択したコマ以外にscheduleを持たない授業を検索するオプション(「選択していないすべてのコマが，scheduleに含まれない」=「選択したコマだけがscheduleに含まれる」)~~
        - [x] ~~もしくはdefaultではOR検索(使う場面あるか？)~~
        - [x] ~~時間割ページから飛べるように~~
    - [ ] I'm Feeling Lucky （ランダムなコースを2個ずつくらい表示する)
    - [ ] 先輩のおすすめコース
- [x] 体育にも対応した単位数表示
    - [x] DB
        - [x] Schema追加
        - [x] HTMLからJSON (Python)
        - [x] JSONからSQL (Python; SQLでのデータ追加が必要なのはremoteだけ？)
        - [x] Localに追加
        - [x] Remoteに追加
    - [x] 検索
        - [x] 表示
        - [x] 絞り込み（上限・下限; スライダ?）
    - [x] 時間割
        - [x] 表示
        - [x] 合計単位数表示（体育どうする！）
- [x] 色選択
    - [x] 色を表示する方法
        - [x] 背景色: ちゃんとカラーパレットを設定すればいい感じになると思う
        - [x] 棒（上）
        - [x] 棒（左）
- [x] 独自スケジュール
    - [x] そもそも必要？このアプリはスケジュール管理アプリではなく履修計画アプリ．
      - [x] スケジュール管理には外部のそれに特化したサービス（GCal, Apple Calendar等を使ってほしい） 
    - [x] しかし，ELAを追加したい需要は確実にある
      - [x] とりあえず独自の開始/終了時間は認めずコマに収まる予定の追加機能？
    - [x] DB定義
    - [x] 追加方法
        - [x] サイドドロワー？スマホで使いにくい？
        - [x] 別ページにするので落ち着いた
    - [x] 表示方法
    - [x] メモ
    - [x] カスタム色追加
    - [x] 検索: Scheduleがない授業の追加を許可（Listがあるので現在でも追加して良いっちゃ良い）
    - [x] 手動追加機能 Known Issues
      - [x] 削除がうまく働いていない
          - [x] toggleCourseがcustomCourseに関する操作を許容していない？
          - [x] customCourseとscheduleがないcourseが消せない
      - [x] TimetableInterfaceのModalのopen管理で，複数が同時に開いてしまう
          - [x] ->remoteでcustomCourseとuserCoursesが同じidを持っているために起きているエラー．
          - [x] 削除もID重複によるものかも．ID指定だけではtoggleCourseはできない
          - [x] localStorageではcustomCourseのidに"custom-"のprefixがつくのでid重複（->Modal誤開閉や削除操作の失敗）は起きない
          - [x] customCourseは"customCourseId"をもっているので，"id"は持たないようにするとか？いや，customCourseIdはschedulesが持っているもの
      - [x] !userではCustomCourseにroomを追加しても表示されない in CourseHeader & TimetableGrid
- [x] Catalogue.icuで移行を促すMessage
    - [x] ~~移行機能 (直接新アプリのAPIを叩く?)~~: Not Planned
- [x] Refactor
    - [x] Componentの役割の明確化
      - [x] Astro: APIを叩く，データを撮ってくるなどの操作
      - [x] React: 描画
    - [x] Componentがごちゃごちゃしている．絶対必要!
    - [x] Long4まわりの表示をSophisticate, refactor
    - [x] useTimetableの挙動: そもそもHooks必要?
    - [x] ~~WorkersならPreactの方が良い？~~: 資料の多さを鑑みてとりあえずReactにとどまる
- [x] Design
    - [x] カラーテーマ当てる
    - [x] コンポーネントの丸みなど調整する
    - [x] ~~Storybookなどcomponent test?~~: not planned with storybook
    - [x] AIみの排除
        - [x] グラデーション
        - [x] アニメーション
        - [x] ボーダー
        - [x] 背景色
        - [x] 安易にtransparent/opacityいじらない
        - [x] フォント（こだわろう; 明朝?）
        - [x] 他のAIみの少ないサイトを参照
            - [x] ICUで撮った写真をフォトフレームみたいにして入れると人間らしくなるのでは？
            - [x] landing pageのみSSG?
- [x] Landing Page
    - [x] 背景画像と言語選択のコントラスト
    - [x] 背景画像最適化: そもそもブラーをかけておく，画質落とす
    - [x] できることとできないことを明示
        - [x] まずはじめに「授業を検索して」「時間割を作れる」という基本機能をかくべき！（できればスクショ付きで？）
        - [x] 検索->時間割（複数のコマから比較できるよ）->同期
    - [x] オープンソース: ソースコードへのリンクを掲載
    - [x] Members
        - [x] 自己紹介
        - [x] リンク
        - [x] Join the Team!
            - [x] 連絡用のメールアドレス
                - [x] 独自domain
            - [x] Form?
- [ ] ログイン時にユーザの操作でログインが中止された状態をフロントで拾う
- [x] [多言語対応](https://docs.astro.build/en/guides/internationalization/)
    - [x] Default localeをjaとenどっちにするか？
    - [x] おそらく利用者の母語はほとんど日本語だが，英語も分かる．逆に，一部に英語は分かるが日本語が苦手な人もいる．
- [x] Google OAuthをpublish
    - [x] 組織内アカウントなら審査なしでいける
  - [x] [サイトの所有権を確認する](https://support.google.com/webmasters/answer/9008080?hl=ja&sjid=3952852442816250357-NC)
    - [x] [Google Search Console](https://search.google.com/search-console)
    - [x] [Bing Webmaster Tool](https://www.bing.com/webmasters): DuckDuckGo
        - [ ] IndexNow
- [x] スケジュールがない授業を追加できない
- [x] SEO
    - [x] meta description
    - [x] リッチリザルト
        - [x] パンくず
        - [x] [テスト](https://search.google.com/test/rich-results)
    - [x] タイトルつける
    - [x] OGP
        - [x] og:title
        - [x] og:description
        - [x] og:url
        - [x] og:image
            - [x] よいもの？
    - [x] Semantic HTML
        - [ ] div乱用をrefactor
- [x] Deploy to Workers
- [x] リンク
    - [x] ~~学年暦~~
    - [x] ~~4年間の全体像を考える~~
    - [x] ~~ログインが必要なサイトはその旨を明示~~
    - [x] 公式リンク
        - [x] ICU Portal
        - [x] ICU Map
            - [x] Course Offerings
    - [x] 「どうやって履修計画を立てたらいいか分からない？でも大丈夫！ICUにはあなたの履修をサポートする窓口がたくさんあります！」
        - [x] CTL
            - [ ] 履修計画テンプレート
            - [ ] 履修計画ワークショップ
            - [ ] イベントなどでコラボレーション？
        - [x] Major一覧
            - [x] ehandbook
            - [x] メジャーインフォメーションサイト
            - [x]  メジャー選択要件
        - [x] ICU IBS
            - [x] 相談方法
            - [x] Social Media
    - [ ] 学生による活動
        - [ ] Weekly Giants
        - [x] ~~選択肢を提示する意味でICUrriculumやTimetable4ICUも載せる？~~
    - [x] トップページのロード速度は落とさぬように．
- [x] サポートボタンをログインボタンの下において分かりやすく
- [x] performance
    - [x] 画像最適化: 必要なピクセル数以下に抑える
- [x] PR
    - [x] Zenn記事
        - [x] Drizzle, BetterAuth, D1
    - [ ] Weekly Giant寄稿
    - [ ] 対面
      - [ ] ~~ちらし~~: 大学の認可が降りない
      - [ ] 部活
- [x] Roomはicu.ac.jpを持つユーザのみ
    - [x] 未ログインユーザーにはAPIからも返さない!!
    - [x] LocalStorageからroomは消した
- [x] ICUを卒業しても更新できる環境を整える
    - [x] OAuthで組織外のものを用意する
        - [x] これは準備しておいて，いつでも切り替えられるようにしておくべき
        - [x] OAuthクライアントを切り替えてもユーザのデータが引き継がれることを確認
          - [x] 少なくともローカルではちゃんとデータが引き継げた
        - [x] API側でドメイン制限をかける
    - [x] シラバスのパースを公開データでかける
        - [x] Room情報が取れないことが問題
            - [x] ~~既存のデータに上書きできるようにする？~~
                - [x] ~~CustomCourseで既存コースの上書きまで担当するとフロントエンドでの条件分岐が多くなりすぎるので，なるべくofficialCourseとcustomの世界は分けたい~~
            - [x] メモに書いてもらう（「@」（全角半角どちらでも）から始めた行は画面にも表示されるようになるとか？）: これいいね！解決．
            - [x] ~~Google Calendarに登録して，自分でやってもらう~~
- [x] ~~編集機能: オーバーライドしても表示されるのは1授業~~: Not Planned, 場所のオーバーライドはメモ欄から．スケジュールは面倒だが独自スケジュールで
- [x] 時間割になにも授業が無ければExploreに誘導
    - [x] 手書き風&アニメーション?
- [ ] 副産物
    - [ ] 授業ヒートマップ
- [ ] ブランディング
    - [x] 名前
        - timetable.icu $7.20 Renews at $14.20
            - [x] ICUのじかんわり
            - [x] Timetable.icu
    - [x] ロゴつくりなおす
        - [x] 3Dみ
        - [x] たぬき
    - [x] 開発者と顔を明示し，信頼を得る
    - [x] かわいいデザイン
        - [x] 絵文字を多用するAI-Designに負けない!
    - [x] ちゃんとランディングページを作る: Astroのいいところ
    - [x] SEO
- [x] 法務
    - [x] 文体・構成を統一
    - [x] MarkdownにもStyleを当てる（Header&Footer）
    - [x] Privacy Policy
        - [x] 更新しやすい，かつかこの差分が見やすいように基盤を整える（Gitベースで構築できたらが楽か？）
        - [x] わかりやすく
        - [x] 取得する情報（例付きで）
            - [x] ICUのGoogleアカウントログインで提供される最低限の情報
            - [x] 名前
            - [x] Email
            - [x] プロフィール写真
            - [x] （パスワードは保存されない）
            - [x] 管理者を除いて，他のユーザは閲覧不可
            - [x] 目的を明示: ICUアカウントを必須にしているのは，教室情報などの学内情報にアクセスできる人を制限するため
            - [x] 登録した情報（データの復旧時のために平文で保持することはやむを得ないと判断）
            - [x] 授業コード
            - [x] メモ
            - [x] ログインしていない場合はユーザ・履修データが送信されない（統計情報は除く）
            - [x] 利用状況調査のために，ログイン情報とはまったく結びついていない利用統計（閲覧されたページ，時間，国，referer(どのサイトからアクセスしたか)，OS, ブラウザ）を取得している．
            - [x] Cloudflare AnalyticsはIPアドレスどこまで残してる？
        - [ ] 将来の引き継ぎに備え，データの持ち出しが起きないようなチェック体制，コンプライアンス
        - [ ] 時間割情報のE2E暗号化?: ユーザに秘密鍵を持たせて暗号化した情報をサーバに保存
    - [x] 利用規約
        - [x] わかりやすく
        - [x] ポチポチして利用規約つくれるサイト？
        - [ ] 卒業後のアカウント削除に関する規程
--->