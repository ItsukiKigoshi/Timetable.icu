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
-  [x] 私が卒業しても自動で更新される状態にする
  - [x] 授業データを公開情報のみで構築する
    - [x] 教室情報は各自に打ち込んでもらえるように
    - [x] regnoはsyllabus公開後にリンクから取得
  - [ ] GitLab CI/CD?
      
# 大切にしたいこと

- [x] とにかく時間割作成に使いやすいものである
    - [x] long時間割対応 (しょうもないことだがアイデンティティ)
    - [x] 軽量 (めざせ 全ページPageSpeedInsights 100): 全ページ97点以上達成，充分だろう
- [x] ICUらしくある
    - [x] いろいろなものがひしめくリベラルアーツの感じを楽しく表現する
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
- [ ] コンポーネントテスト
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

- [Astro](https://astro.build/)
- [React](https://react.dev/)
- [Tailwindcss](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [TypeScript](https://www.typescriptlang.org/)

### Backend

- [Astro](https://astro.build/)
- [BetterAuth](https://better-auth.com/) (Google OAuth/Passkey)
- [Drizzle ORM](https://orm.drizzle.team/)
- [TypeScript](https://www.typescriptlang.org/)

### Infra

- [Cloudflare Workers](https://www.cloudflare.com/developer-platform/products/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)

### Test
- [Playwright](https://playwright.dev/)

### Runtime/Package Manager
- [Bun](https://bun.sh/)

技術構成はこちらの記事でも解説されています: [国際基督教大学の非公式時間割/履修計画アプリ「ICUのじかんわり」をAstro+Cloudflare Workers+D1でつくりました | Zenn](https://zenn.dev/itsukikigoshi/articles/timetable-icu)

## 🚀 Project Structure

```text
/
├── migrations/
│   └── migration.sql
├── public/
│   └── favicon.svg
├── scripts/
│   ├── data/
│   │   ├── ehandbook/  // 一般公開されているシラバスページ（HTML）はここに入れる
│   │   └── icumap/     // 学生向けのシラバスページ（HTML）はここに入れる
│   └── parser.py
├── src/
│   ├── assets/
│   │   └── astro.svg
│   ├── components/
│   │   └── Component.astro
│   ├── constants/
│   │   └── config.ts // Constants used globally
│   ├── db/
│   │   ├── data/
│   │   └── schema/
│   ├── lib/
│   │   └── server.ts // schema definitions, auth-related files
│   ├── pages/
│   │   ├── api/
│   │   │   └── api.ts
│   │   ├── index.astro
│   │   └── en/
│   │       └── index.astro
│   ├── styles/
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
bunx playwright test
```

Format Code
```bash
bunx biome check --write
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
bunx drizzle-kit generate
```

一度生成したmigrationファイルをなかったことにする

```bash
bunx drizzle-kit drop
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