# [ICUのじかんわり | Timetable.icu](https://timetable.icu/)
ICU生の時間割・履修計画アプリの決定版

## できること
### 🔎 あなたにピッタリのコースを見つける
- 公式授業一覧から取得されたすべてのコースを検索
### 📅 完璧な時間割を組む
- Long 4, 5, 6, 7など，ICUならではのコマ割りも表示
### 🔄 マルチデバイス同期
- ログインしてすべてのデバイスで最新の時間割を共有

## Screenshots
| Page | Screenshots |
| :---: | :---: |
| Home | ![Home](https://gitlab.com/-/project/81459553/uploads/f15de3cae7b1d26157d90fe93865c1ad/Screen_Shot_2026-04-23_at_23.59.02.png) |
| Explore | ![Explore](https://gitlab.com/-/project/81459553/uploads/9cc6a871a66a6ae2102d1c736075e34c/Screen_Shot_2026-04-23_at_23.58.59.png) |
| Timetable | ![Timetable](https://gitlab.com/-/project/81459553/uploads/e1528b102b0561314df2642b05f54a64/Screen_Shot_2026-04-23_at_23.58.54.png) |

---

## 🛠️ Tech Stack

- **Frontend:** [Astro](https://astro.build/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [DaisyUI](https://daisyui.com/), TypeScript
- **Backend:** [Astro](https://astro.build/), [BetterAuth](https://better-auth.com/) (Google OAuth), [Drizzle ORM](https://orm.drizzle.team/)
- **Infra:** [Cloudflare Workers](https://www.cloudflare.com/developer-platform/products/workers/), [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **Test / Runtime:** [Playwright](https://playwright.dev/), [Bun](https://bun.com/)

> 技術構成はこちらの記事でも解説されています:
> [国際基督教大学の非公式時間割/履修計画アプリ「ICUのじかんわり」をAstro+Cloudflare Workers+D1でつくりました | Zenn](https://zenn.dev/itsukikigoshi/articles/timetable-icu)

---

## 💻 Development & Contributing

開発環境のセットアップ，データベースのマイグレーション手順，授業データのスクレイピング方法などの詳細は **[CONTRIBUTING.md](./CONTRIBUTING.md)** をご覧ください

---

## 🎯 目標

<!-- - [ ] ようこに卒業までつかってもらう -->
- [x] 100人のTermly Active UserをICU内で獲得する
    - [ ] Google / DuckDuckGoで「ICU 履修登録」「ICU 時間割」「ICU academic planning」「ICU registration」で1番目
- [x] 私が卒業しても自動で更新される状態にする
  - [x] 授業データを公開情報のみで構築する
    - [x] 教室情報は各自に打ち込んでもらえるように
    - [x] regnoはsyllabus公開後にリンクから取得
    - [x] GitLab CI/CD

### 大切にしたいこと
- [x] **とにかく時間割作成に使いやすいものである**
    - [x] long時間割対応 (しょうもないことだがアイデンティティ)
    - [x] 軽量 (めざせ 全ページPageSpeedInsights 100): 全ページ97点以上達成，充分だろう
- [x] **ICUらしくある**
    - [x] いろいろなものがひしめくリベラルアーツの感じを楽しく表現する
    <!-- - [x] 隠し要素 --> 
- [ ] **プロジェクトとして持続可能なものである**
    - [ ] 後輩に引き継ぐ前提で作る，その価値があるものにする
    - [ ] 後進育成（Web/アプリ開発入門，ハッカソン）
    - [x] オープンソース
    - [ ] ICUのいろいろな団体とコラボする / CTLなどでも使ってもらいたい
    - [x] 木越が責任を持って取り組む
- [ ] **Transparency**
    - [ ] Share Issues, Feature Requests
    - [ ] 透明性のある予算と，ちゃんと収支均衡を取る

### 挑戦したいこと
- [ ] PR（対面宣伝，Instagram等での連携，受験生へのリーチ）
- [ ] コンポーネントテストの拡充
- [x] ちゃんと[Webアナリティクス](https://www.cloudflare.com/application-services/products/analytics/)を取って開発の励みにする

---

<details>
<summary>歴代ICU時間割アプリの歴史・競合調査・参考情報</summary>

### ライバル
- [ICUrriculum](https://icu-courses.com)
- [Timetable4ICU](https://www.timetable4icu.com/): ~~2026のスケジュールは更新されていない~~
- すごい時間割
- Penmark

### 歴代のTimetable for ICU
- **過去のTimetable for ICU**
  - **1代目「ICUTTABLE」**: 不明
  - **2代目「ICUTTABLE#2」**: [開発者インタビュー](http://weeklygiants.co/?p=1805) / 新井友朗さん（ID17-18か？）
  - **3代目「Timetable For ICU」**: [私の芽―ICU時間割アプリを作る](http://weeklygiants.co/?p=8872) / 千葉彌平さん（ID19） ([GitHub](https://github.com/YasuChiba/TimeTableForICU-ios-public) / [Twitter](https://x.com/TimeTableForICU) / [Facebook](https://www.facebook.com/timetableforicu/))
  - **4代目「Timetable4ICU」**: Kohshi Yamaguchi (ID24-25?) ([Site](https://www.timetable4icu.com/) / [GitHub](https://github.com/kohshi54/Timetable4ICU) / [Twitter](https://x.com/timetable4icu))

### 参考になりそうなサイト
- [Hupass](https://hupass.hu-jagajaga.com/)
- [現在の時間割](https://www.icu.ac.jp/news/2406181000.html)
- Twinte
- [Webサービス公開前のチェックリスト](https://zenn.dev/catnose99/articles/547cbf57e5ad28)
</details>