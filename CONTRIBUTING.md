# Contributing　to　Timetable.icu　(ICUのじかんわり)

Timetable.icuの開発に興味を持っていただきありがとうございます！
後輩への引き継ぎや，ICU生・開発者によるコントリビューションを歓迎します．

## 🛠️　Getting　Started:　開発環境のセットアップ

### 1.　GitLabへのSSHキー登録（未設定の場合）
リポジトリのクローンやプッシュをスムーズに行うため，あらかじめGitLabアカウントにSSHキーを登録してください．
手順は以下の公式ドキュメントを参照してください:
-　**GitLab　公式ドキュメント**:　[GitLabアカウントにSSHキーを追加する](https://docs.gitlab.com/ja-jp/user/ssh/#add-an-ssh-key-to-your-gitlab-account)

### 2.　Bun・uv　のインストール（未インストールの場合）
公式ドキュメントの手順に従ってインストールしてください:
-　**Bun**:　https://bun.com/docs/installation
-　**uv**:　https://docs.astral.sh/uv/getting-started/installation/

### 3.　リポジトリのクローン＆依存関係のインストール
```bash
git　clone　git@gitlab.com:<group-or-user>/timetable-icu.git
cd　timetable-icu
bun　install
```

### 4.　ローカルSQLite　(D1)　インスタンスの作成とマイグレーション
```bash
bun　run　db:migrate:local
```
>　**Note:**　実行中に　`Your　database　may　not　be　available　to　serve　requests　during　the　migration,　continue?　…`　と聞かれたら　`y`　を押してください．

### 5.　カテゴリーデータの初期投入
```bash
bun　wrangler　d1　execute　timetable_icu　--file=./src/db/data/seed_categories.sql
```

### 6.　サンプルデータの変換と投入
サンプルのJSONデータからSQLファイルを生成します:
```bash
uv　run　--project　scripts　python　scripts/to_sql.py　-i　dist_courses_sample.json　-o　sync_courses_sample.sql
```

生成したSQLを実行して，ローカルのSQLiteにサンプルデータをUpsertします:
```bash
bun　run　wrangler　d1　execute　timetable_icu　--file=./scripts/out/sync_courses_sample.sql
```

### 7.　ローカル開発サーバーの起動
```bash
bun　run　dev
```
起動後，`http://localhost:4321`　で確認できます．

---

## 🚀　Project　Structure

```text
/
├──　migrations/　　　　　　　　　　# Drizzle　ORM　のマイグレーションファイル
├──　public/　　　　　　　　　　　　　　# 静的ファイル
├──　scripts/　　　　　　　　　　　　　# シラバススクレイピング・データ変換用Pythonスクリプト
│　　　├──　data/
│　　　│　　　├──　ehandbook/　　　# 一般公開されているシラバスページ（HTML）配置場所
│　　　│　　　└──　icumap/　　　　　　# 学生向けのシラバスページ（HTML）配置場所
│　　　└──　parser.py
├──　src/
│　　　├──　assets/
│　　　├──　components/　　　　　　# Astro　/　React　コンポーネント
│　　　├──　constants/　　　　　　　# グローバル定数
│　　　├──　db/　　　　　　　　　　　　　　# DBスキーマ定義・初期データ
│　　　├──　lib/　　　　　　　　　　　　　# サーバーサイドロジック・認証(BetterAuth)設定
│　　　├──　pages/　　　　　　　　　　　# ルーティング・APIエンドポイント
│　　　├──　styles/　　　　　　　　　　# Tailwind　/　グローバルCSS
│　　　├──　env.d.ts
│　　　└──　middleware.ts
└──　package.json
```

---

## 🧞　開発コマンド一覧

すべてのコマンドはプロジェクトルートから実行します．

|　Command　|　Action　|
|:---|:---|
|　`bun　dev`　|　ローカル開発サーバー起動　(`localhost:4321`)　|
|　`bun　run　build`　|　本番用ビルドを　`./dist/`　に出力　|
|　`bun　preview`　|　ビルド結果のローカルプレビュー　|
|　`bun　exec　playwright　test`　|　Playwright　によるE2E/コンポーネントテスト実行　|
|　`bun　run　format`　|　コードフォーマット　|
|　`bun　wrangler　types`　|　`wrangler.jsonc`　から型定義を生成　|
|　`bun　run　build　&&　bun　x　wrangler　dev`　|　Cloudflare　Workers　環境でのローカルデバッグ　|
|　`bun　wrangler　tail`　|　本番（リモート）環境のリアルタイムログ出力　|
|　`bun　x　generate-license-file　--input　package.json　--output　CREDITS`　|　ライセンス一覧（CREDITS）の出力　|

---

## データベース・スキーマ運用　(Drizzle　&　Cloudflare　D1)

### スキーマ生成・マイグレーション作成
```bash
# BetterAuth　のスキーマ生成
bun　dlx　auth@latest　generate　--config=./src/lib/auth/cli.ts　--output=./src/db/schema/auth.ts

# Drizzle　Kit　でマイグレーションファイル生成　(--custom　や　--name=...　も使用可能)
bun　exec　drizzle-kit　generate

# 直前に生成したマイグレーションファイルの取り消し
bun　exec　drizzle-kit　drop
```

### マイグレーションの適用
```bash
# ローカル環境
bun　run　db:migrate:local

# 本番（リモート）環境
bun　run　db:migrate:remote
```

>　**Tips:**
>　*　**Remote実行のエラー:**　Remoteへのマイグレーションは1度目失敗することがありますが，2回目で成功することがあります．
>　*　**外部キー制約エラー時の対処:**　`wrangler　apply`　では　`PRAGMA　foreign_keys　=　OFF;`　が無効化されることがあります．外部キー制約で通らない場合は以下のように直接SQLを実行できます:
>　　　`bun　wrangler　d1　execute　timetable_icu　--remote　--file=./migrations/xxxx_migration.sql`
>　　　（※ただし，この方法だとD1のマイグレーション履歴が残らないため，実行後に該当SQLファイルを空にして　`apply`　する手法がありますが，過去に通し方を誤ってPasskeyテーブルを消してしまったことがあるため非推奨．慎重に作業してください．）

---

## Course　Data　Insertion　（授業データの更新フロー）

シラバスのHTMLからJSONを生成し，D1データベースへ同期する手順です．

### 1.　HTMLからJSONを生成
```bash
bun　run　db:scrape:icumap　　　　# 学生専用サイトからダウンロードしたHTMLがある前提
bun　run　db:scrape:ehandbook　# 公開情報からダウンロードしたHTMLがある前提
```

### 2.　データベースへ同期（JSON　→　SQL　→　D1）
```bash
# Local　DB
bun　run　db:push:local　　　　　　　# 生成済みJSONからCourses/Categoriesを投入
bun　run　db:sync:local　　　　　　　# HTML　->　JSON　->　Local　DB　を一括実行

# Remote　DB
bun　run　db:push:remote　　　　　　# 生成済みJSONからCourses/Categoriesを投入
bun　run　db:sync:remote　　　　　　# HTML　->　JSON　->　Remote　DB　を一括実行

# 個別にSQLファイルを実行したい場合
bun　wrangler　d1　execute　timetable_icu　--file=scripts/out/sync_courses.sql
```
