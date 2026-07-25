# 記事の公開手順

この文書は、起稿許可後からブログ公開、転載、X投稿文の引き渡しまでを扱う。記事相談の進め方は`AGENTS.md`、文体と著者像は`docs/writing-voice.md`を正本とする。

## 状態と完了条件

### 起稿許可後

- `draft: true`で記事を作る
- オーナー由来の一次情報と、調査で補った事実を区別する
- 初稿、画像、構成をオーナーが確認する
- 公開前監査を行う

### 公開承認後

- `draft: false`へ変更する
- カバー、本文画像、Zenn、公開前検査を揃える
- 対象を限定してcommit/pushする

### 公開後の引き渡し

- AIは日本語のX投稿文と、必要なら英語Quote-RT文を作る
- X投稿はユーザーが行う。投稿URLを受け取った時に「X投稿済み」と扱う
- dev.to転載はGitHub Actionsの非同期処理であり、記事公開の完了条件に含めない

## 1. ブログ記事

- 配置: `content/post/<slug>/index.md`
- 必須frontmatter: `title`、`date`、`draft`、`description`、`tags`、`cover.image: "cover.png"`
- `tags`の先頭には主カテゴリを置く
- `description`は一覧の注目カードに使われるため、短く内容が分かる文章にする
- 公開時の`date`は現在時刻以前にする。未来日付の記事はActionsが成功しても公開対象から外れる
- 内部リンクは`[テキスト]({{< relref "slug" >}})`を使う

## 2. 画像

### カバー

```bash
cd tools/cover
npm ci
npx playwright install chromium
node generate-cover.js "1行目" "2行目" "../../content/post/<slug>/cover.png"
node generate-cover.js --mobile "短いフック" "" "../../content/post/<slug>/cover-sm.png"
```

- `cover.png`: 1250×500
- `cover-sm.png`: 1080×1080
- `tools/cover/mobile-covers.json`へ短いフックを追加する
- 一括生成器を使う時は`node tools/cover/gen-mobile-covers.js --slug <blogSlug>`で対象を限定する
- 生成後は寸法と日本語表示を確認する

### 本文画像

- 標準は2〜4枚、紹介記事は4〜5枚を目安にする
- 実スクリーンショット、実データから作った図、ブランド図版、linkcardを使う
- AIによる手描きのUI、図表、実機画面を使わない
- フル画質PNGを使い、圧縮、縮小、WebP化を行わない
- 同じURLの画像差し替えはCloudflareやSNSのキャッシュが残るため、ファイル名を変える
- Markdown参照とファイル実在を突合し、Hugoの実ページで配置を見る

画像の詳しい仕様は`docs/site-operations.md`と`tools/cover/README.md`を参照する。

## 3. オーナー確認と公開前監査

オーナーが初稿の事実、温度、記事の主役、著者像を確認した後に監査する。監査項目は`AGENTS.md`と`docs/writing-voice.md`に従う。

監査後、意味や著者像に関わる修正はオーナーへ提示する。公開承認を受けてから`draft: false`へ進む。

## 4. Zenn同期

Zenn記事は本リポジトリの`articles/<zennSlug>.md`に置く。Zenn固有frontmatterは手で選び、本文はブログから生成する。

```bash
node tools/zenn-sync/sync.mjs --slug <blogSlug>
node tools/zenn-sync/sync.mjs --check
```

新記事では、先にZennファイルへ`title`、`emoji`、`type`、`topics`、`published`を用意する。slugは12〜50字にする。ブログslugとの差異は共有manifestで管理する。

同期後は対象記事の差分だけを確認し、対象外記事を巻き込まない。

## 5. 公開前検査

公開前に次を実行する。

```bash
node tools/validate-content.mjs
node tools/zenn-sync/sync.mjs --check
hugo --minify
```

検査はfrontmatter、未来日付、画像、寸法、mobile mapping、Zenn対応、生成本文を確認する。

## 6. commitとpush

- 対象記事、対応するZenn記事、mobile mapping、共有manifestなど必要なファイルだけをaddする
- `git add .`を使わない
- 並行作業がある時はcommitのpathspecを明示する
- pushはオーナーの明示指示がある時だけ行う
- push後は対応するGitHub Actionsのcommit SHAを確認する

## 7. X投稿文の引き渡し

ブログのデプロイ完了後に日本語のフック投稿文を作る。

- 記事URLとカバー画像を付ける
- 日本語は3〜5個のハッシュタグを本文へ含める。基本は`#ClaudeCode`、`#個人開発`と記事固有タグ
- カバー到達確認は記事ページのデプロイ完了後、キャッシュバスター付きURLで一度だけ行う
- `cover.png`を公開前から繰り返し取得しない。Cloudflareに404がキャッシュされる

英語Quote-RTが必要な時は、日本語で方向を相談してから英語文を作る。英語文にも本文中へ3〜5個のハッシュタグを必ず含め、タグなしの文案を完成扱いにしない。基本タグは`#ClaudeCode`、`#MCP`、`#AIagents`、`#buildinpublic`。

## 8. 非同期転載

Zennの英訳公開後、`.github/workflows/crosspost-devto.yml`がdev.toへ転載する。これは非同期処理であり、ブログとZennの公開を止めない。

- 状態台帳: `crossposted-devto.json`
- ブログslugとZenn slug: `tools/article-manifest.mjs`
- 実装: `.github/scripts/crosspost-devto.mjs`

未転載記事を公開日の古い順に走査し、Zennの英訳が済んだ最初の1件だけを1 runで転載する。Zennの自動翻訳は来ない記事があるため、英訳未完とZenn未公開(404)は飛ばして次の候補へ進み、飛ばした記事と理由をログへ残す。それ以外のZennエラーは停止させる。転載順はZennの英訳完了順であり、公開日順にはならない。参照先が未転載の内部リンクは台帳の`pending`に残り、参照先の転載後に`--fix-links`が直す。

転載ペースは1日1本を上限とする。滞留が溜まっても`workflow_dispatch`を連続実行して一度に消化しない。手動実行はワークフローの動作確認のように単発で必要な時だけ行い、その都度オーナーの指示を受ける。

dev.to投稿前に台帳へ`status: posting`の予約をpushする。投稿後の台帳pushに失敗した場合、次回は認証済みユーザーの記事一覧を`canonical_url`で照合し、1件だけ一致した時に台帳を回復する。0件または複数件は自動投稿せず失敗する。

予約だけが残り遠隔0件で停止した場合は、dev.to管理画面とAPIで投稿が無いことをオーナーが確認する。確認後に予約entryを削除してcommitし、次回実行で新しい予約からやり直す。確認なしに予約を消さない。

転載済み記事の本文更新は、明示的な再同期機能が実装されるまで自動反映しない。
