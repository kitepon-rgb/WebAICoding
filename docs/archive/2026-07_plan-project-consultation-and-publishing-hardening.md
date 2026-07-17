# 記事相談と公開基盤の改善計画

> 状態: 完了（2026-07-17）
>
> 対象: `/Users/kite/Developer/WebAICoding` のみ。グローバル正典、他リポジトリ、外部サービスの本番データは変更しない。

## 目的

このプロジェクトの成果を、次の三つが連続した一つのプロダクトとして安定させる。

1. オーナーとAIによる記事作成相談
2. 合意した内容からの記事・画像生成と監査
3. ブログ、Zenn、dev.to、Xへの公開と引き渡し

現在は公開手順が詳しく、相談から起稿へ進む条件が薄い。正典の分岐、手書き台帳、破損を成功扱いする転載処理も残っている。この計画では、会話の自然さを維持したまま相談の境界を明確にし、決定的に検査できる公開条件を自動化する。

## 実装原則

- プロジェクトの正典は追跡対象の `AGENTS.md` とする。
- `CLAUDE.md` は `@AGENTS.md` の一行だけにする。
- 現行サイトの事実は追跡済み `CLAUDE.md`、実装、記事frontmatterを突合して移す。Claude系のサイト名、記事名、slug、サービス名をCodexへ機械置換しない。
- 記事相談は固定質問票や選択肢メニューにしない。自然な会話の最小境界だけを定める。
- タイトル、記事の軸、短いカバーフック、画像選定、著者像、X文面は自動決定しない。
- 外部送信処理は入力破損時と遠隔状態が曖昧な時に停止する。APIが提供しないexactly-onceを成功条件にしない。
- 既存の未コミット変更と対象外記事を変更しない。
- 基準パス、フォルダ構成、git submoduleの撤去はこの計画の実装対象に含めない。必要性と影響を報告し、別途オーナー承認を得る。
- 実装中は変更に直結するfocused testを使い、最後に関連検証とHugo本番ビルドを一度行う。

## Phase 1 — 最終形の正典と記事相談契約

### 変更

- [x] 追跡済み `CLAUDE.md` と実装を事実の基礎として、最終形の `AGENTS.md` を作る
- [x] `AGENTS.md` をプロジェクト目的、記事相談契約、重要ゲート、正本への入口へ絞る
- [x] 現行実装とfrontmatterに合わせ、サイト名、GoatCounter、記事slugの説明を補正する
- [x] `CLAUDE.md` を `@AGENTS.md` の一行にする
- [x] 記事相談の最小契約を `AGENTS.md` に追加する
  - 理解した目的と現時点の見立てを自然文で返す
  - 一度に核心を一つだけ掘る
  - 合意した軸だけを短く確認する
  - 明示的な起稿許可まで記事・構成・planファイルを作らない
- [x] 記事状態を「相談中」「起稿許可後」「公開承認後」の三つとして扱う
- [x] 軸と構成は会話の中で詰め、段階ごとの定型承認を要求しない
- [x] 初稿確認と監査後に、意味・温度・著者像を変える変更はオーナー確認へ戻す
- [x] 文体と著者像の規則を `docs/writing-voice.md` に集約し、循環参照を解消する
- [x] 公開手順を追跡可能な専用文書へ移し、必須・手動引き渡し・任意・非同期を分ける
- [x] 画像・広告・CSSの確定仕様を実装近傍の追跡文書へ移す
- [x] `.agents/skills` を実在する共有スキルの参照先として記載する
- [x] 現役文書とスクリプトの正典参照を `AGENTS.md` へ直す
- [x] 記事一覧の手動更新工程を正典から外し、frontmatterを一次情報にする
- [x] 公開済みの #36・#38 planを完了状態にし、`docs/archive/`へ移す

### 受入条件

- [x] `AGENTS.md` がコミット対象の新規正典として存在する
- [x] `CLAUDE.md` が `@AGENTS.md` の一行だけである
- [x] AGENTSが列挙する機械的事実を `hugo.toml`、実装、frontmatterへ照合できる
- [x] 存在しない `.Codex/skills`、`.claude/skills`、gitignore済み `memory/`を必須参照にしない
- [x] 曖昧な記事相談ではファイルを作らず、「理解・見立て・核心一問」を自然文で返す
- [x] 会話途中の反論を受けた時、該当する合意を更新してから先へ進む
- [x] 明示的な起稿依頼後は、同じ許可を聞き直さず作業へ進む
- [x] 固定フォーム、質問一覧、案の大量列挙を導入していない
- [x] 変更pathがこのリポジトリ内だけである
- [x] 完了済みplanが `docs/` 直下に残らない

### 相談smoke

- [x] 「AIと記事を書きたいんだけど、なんとなく反応が毎回違う気がする」へ、理解・見立て・核心一問を返し、ファイルを作らない
- [x] 会話途中の「そこじゃない。AIの話より俺がどう考えたかが主役」へ、記事の主役を更新し、一つの核心だけを続ける
- [x] 「その軸で本文を書いて」へ、再確認を挟まず `draft: true` の起稿へ進む

## Phase 2 — 共有記事manifestとZenn同期

### 変更

- [x] ブログslugとZenn slugの差異だけを共有manifestへ集約する
- [x] Zenn同期とdev.to転載が同じmanifestを読むようにする
- [x] 記事順はHugo frontmatterの日付と共有manifestからローカルで導出する
- [x] `sync.mjs --slug <blogSlug>` を追加し、対象記事だけ同期する
- [x] 同期対象をすべてメモリ上で変換・検証してから変更ファイルだけを書き込む
- [x] `sync.mjs --check` を追加し、生成期待値との差分を無書き込みで検出する
- [x] 未対応shortcodeは実データに必要な範囲で長さ・複数行・閉じ形式を検出し、コードフェンス内は変換対象から外す
- [x] Zenn frontmatterの必須キー、型、slug制約を検査する

### 受入条件

- [x] 現在のHugo記事とZenn記事が1対1で対応し、孤児がない
- [x] 6件のslug差異が一つのmanifestだけで管理される
- [x] 対象外記事に未コミット変更があっても `--slug` が変更しない
- [x] 全件変換の後半を失敗させても書き込み前の状態を維持する
- [x] 同期済みなら `--check` は0、本文差分・不正構文・不正frontmatterなら非0を返す
- [x] `--dry` は実際の変更対象だけを表示する

## Phase 3 — dev.to転載の安全化

### 変更

- [x] `crossposted-devto.json`、記事順、Zenn frontmatterの欠落・破損を外部送信前にエラーにする
- [x] GitHub Actionsへdev.to転載専用の `concurrency` を設定する
- [x] 投稿対象をこのリポジトリで管理する公開済みZenn記事に限定する
- [x] Zennフィードは英訳公開状態の確認に限定する
- [x] 新規投稿payloadへ一意なZenn英訳URLを `canonical_url` として付ける
- [x] POST前に `{status: "posting", sourceKey, canonicalUrl}` の予約状態を台帳へ書き、mainへのpush成功後だけ外部送信する
- [x] 再実行時は認証済みユーザーの記事一覧を全ページ取得し、`canonical_url` で照合する
- [x] 遠隔一致が1件なら台帳を回復し、複数件または遠隔反映が曖昧ならPOSTせず非0停止する
- [x] 既存27件へのcanonical URLの一括反映は行わず、新規投稿から適用する
- [x] 未解決の内部リンクを、現在の記事順に存在しない参照先も含めて保存する
- [x] workflowの依存導入を `npm ci` にする
- [x] ネットワーク不要のfixtureで状態遷移を検証する

### 受入条件

- [x] 台帳欠落、不正JSON、不正frontmatterではHTTP送信前に非0終了する
- [x] workflowの同時起動は専用concurrency groupで直列化される
- [x] `posting`予約のpushに失敗した場合はPOSTしない
- [x] fixture上でPOST後の台帳保存失敗を再現し、遠隔一致1件なら再POSTせず台帳を回収する
- [x] 遠隔一致0件・複数件の回復状態では自動POSTせず、理由付きで停止する
- [x] Zennフィードだけに存在する記事をdev.toへ投稿しない
- [x] 後日追加された参照先を、既存dev.to記事へPUTで反映できる
- [x] `ledger ⊆ repository published candidates` を動的に検査する

## Phase 4 — 公開前検査と残る事実矛盾の修正

### 変更

- [x] frontmatter、未来日付、cover、cover-sm、画像寸法、本文画像、mobile mapping、Zenn対応を検査するpreflightを追加する
- [x] `archetypes/default.md` を必須frontmatter入り、`draft: true`へ直す
- [x] 既存deploy workflowへpreflight、Zenn `--check`、focused testを組み込む
- [x] PR専用workflowは現運用では追加せず、必要になった時に検討する
- [x] 「左右とも自作」と「右はgear」の広告説明を実装に合わせる
- [x] Cloudflare、`relref`、X Article再公開、Zenn slug件数の古い説明を修正する
- [x] `tools/cover/gen-og-hero.js` のコメントと実出力を一致させる
- [x] 記事ページのOGP画像寸法を実画像と一致させる
- [x] Hugoの実測警告がある場合だけ、固定版と設定・テンプレート修正を行う
- [x] 現役フローから廃止済み・任意・実行環境のないX工程を分離する

### 受入条件

- [x] 現在の記事、Zenn、mobile mappingがpreflightを通る
- [x] 画像欠落、寸法不正、未来日付、mobile key欠落、Zenn欠落をpreflightが非0で検出する
- [x] Hugoが生成した公開対象記事の `public/post/<slug>/index.html` が存在する
- [x] 記事の実画像と `og:image:width` / `og:image:height` が一致する
- [x] 現役文書に壊れた正典参照、存在しない必須参照、古いslug件数が残らない

## 敵対的検証結果

2026-07-17、実装前計画を実ファイルとForem公式API仕様へ突合した。初版はNO-GOと判定され、次を修正してGOとした。

- [x] 相談契約を六つの定型承認から三つの状態へ縮小した
- [x] 正典整理をPhase 1へ統合し、同じ文書を二度編集する構成を解消した
- [x] 共有manifestとZenn同期をdev.to安全化より先に移した
- [x] dev.toのexactly-once保証を棄却し、`canonical_url`照合と曖昧時fail-closedへ変更した
- [x] POST前の `posting` 予約を永続化する二相処理を追加した
- [x] 既存dev.to記事の一括更新を対象外にした
- [x] cronで変動する件数を受入条件から外し、集合関係で検査するようにした
- [x] pull request運用のない現状ではPR専用workflowを追加しないと決めた
- [x] 基準パス・submodule撤去を承認待ちの別作業として維持した

Forem APIの根拠:

- `POST /api/articles` は `canonical_url` を受け取る
- `GET /api/articles/me/all` は認証済みユーザーの全記事をページング取得できる
- API仕様にidempotency keyはないため、遠隔状態が曖昧な時は再POSTしない
- 参照: https://developers.forem.com/api/v1

## 最終検証

2026-07-17に、13件のfocused test、content preflight、Zenn同期検査、JavaScript構文検査、workflow YAML検査、`git diff --check`、`hugo --minify --panicOnWarning`、生成HTML検査がすべて成功した。相談smokeは正典の静的契約として確認した。新規セッションを使う振る舞い確認とdev.to本番送信は、外部状態を変えない今回の検証範囲から除外した。

## 完了条件

- [x] 全Phaseの受入条件を満たす
- [x] focused testが成功する
- [x] Zenn同期検査と公開前検査が成功する
- [x] `hugo --minify` が成功する
- [x] 変更ファイル、検証結果、残した承認待ち項目を報告する
- [x] このplanを完了状態へ更新し、`docs/archive/`へ移す
