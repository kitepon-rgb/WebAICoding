# 記事プラン正本 — Codex最上位モードがレートを溶かした話

> 状態: 完了・公開済み（2026-07-17に実記事、Zenn、画像、公開状態を突合してarchive）。下の未チェック項目は当時のplan更新漏れとして履歴のまま残す。

## メタ

- 仮タイトル: **「Codexの最上位モードに任せたら、5時間の枠を1時間で溶かした話」**
  - 代替: 「最上位を選べば賢く配ってくれる、と思ってた——Codexのサブエージェントが全部最上位だった話」
- slug（仮）: `codex-max-mode-quota-drain`（12字以上＝Zenn対応表 不要）
- tags（先頭＝主カテゴリ）: `Codex` / `AIコーディング` / `サブエージェント` / `レートリミット`
- date: **過去時刻で**（未来日付404の罠。`2026-07-11T09:00:00+09:00` 等、公開時点より前）
- 一人称: 俺／自分（クオ君視点）。ベルの「私」ではない

## 芯（動機＝一次情報）

「最上位モード（Codexの Sol/Ultra、Claudeの Ultracode）を選べば、賢いモデルが賢く仕事を割り振ってくれる」と思って任せた。実際は逆で、**親が Sol/Ultra だと、spawn したサブエージェントも全部 Sol/Ultra**。連鎖的に子を呼ぶと最上位モデルが増殖して、レートを一瞬で焼く。しかも**役割ごとに安いモデルを割り当てる指定は、隠しフラグ（`hide_spawn_agent_metadata=true`）で塞がれていた**。

## 一次情報（本人の実体験・盛らない）

- ClaudeをFable5で使い尽くしていた頃、GPT-5.6 がリリース → Codex（Sol）に手を出した
- **5時間のレートリミットを1時間で溶かすのを3回**（＝約15倍速）
- 「さすがにおかしい」と自分で気づいて調べた → Codexセッションのログで `spawn_agent` が `task_name` しか送らず、子が `agent_role: null` で親モデルを継承、`~/.codex/agents/*.toml` を無視しているのを確認
- 調べたら X で同じ地雷を世界中が同時に踏んでいた（答え合わせ）

## 構成（①〜⑥・脇筋なし）

1. Claude を使い切ってた頃、GPT-5.6 が出た。最上位の Sol/Ultra を選んだ。賢いモデルなら仕事も賢く配ってくれるだろうと任せた
2. 5時間の枠を1時間で溶かす。それを3回。異常な速さ
3. おかしいと調べた：親が Sol なら子も全部 Sol。サブエージェントを連鎖で呼ぶたび最上位が増える。役割別に安いモデルを割り当てる指定が、そもそも見えなくなっていた（`hide_spawn_agent_metadata=true` が spawn_agent スキーマから model/effort を削除）
4. 自分だけじゃなかった：2026-07-09〜10、X で報告が噴出。GitHub issue #31814。evi77ain が答え（2行）を出していた
5. 解決：`config.toml` の2行で `agent_type` が露出 → 役割別に配分できる＝レートも減る
6. 締め：「最上位を選ぶ＝最適に配ってくれる」ではなかった、という事実で終える（教訓は盛らない・読者に委ねる）

## 裏取り済みソース（2026-07-11 X／公式リポで確認）

- evi77ain (Eidzoku) 2026-07-10 — 引用元「spawn_agent はモデルもreasoning effortも選ばせない → Sol Ultra が spawn するたび別の Sol Ultra → クオータ爆速枯れ」／解決2行。bookmarks 328・views 2.7万
- 解決の2行:
  ```toml
  [features.multi_agent_v2]
  hide_spawn_agent_metadata = false
  tool_namespace = "agents"
  ```
- レート爆速到達（日英）: @kouyama_fms（20分で5h消滅・40分でweekly35%）／@Nephren__Ka（今日5hリミット2回）／@blue_shyachi（40分で全消費「大食い」）／@FNDEVVE（3分で20xリミット突破）
- 原因＝サブエージェント継承: @acacuce「spawn_agent は task_name のみ、子は agent_role:null で親継承・toml無視」（クオ君の観測と一字一句一致）／@GrantSlatton／@trungnt13／@abrar_gist「0.144.1 の regression」／@dedene の viral スレッド
- 公式: GitHub [openai/codex #31814](https://github.com/openai/codex/issues/31814)「GPT-5.6 Sol cannot specify subagent models, forcing all subagents to also be Sol instances」。関連 #26948（per-launch reasoning_effort は本当はサポートされているのに schema/docs が隠す）
- 仕様: `hide_spawn_agent_metadata` デフォルト true。名前は「メタデータを隠す」だが実際は model-visible な spawn_agent スキーマから model/effort 入力を削除。`tool_namespace="agents"` は名前衝突エラー回避。GPT-5.6 Sol は features トグルと独立に MultiAgent V2 を選ぶ

## writing-voice ガード（初稿から効かせる）

- 否定の持ち出し禁止＝順接で書く。逆接は導入で最大1回
- つまずき演出・思い込み演出・捏造教訓を排す（著者は賢く率直）
- 比喩・ポエム・飾り禁止。字義どおり
- 流行・競合・OpenAI を殴らない。淡々と確かめる側。「大食い」等はX引用として温度を保つ
- 横文字を散らさない（サブエージェント＝子AI 等、日本語で説明 or 一度だけ括弧補足）
- 「正直に言うと」等のAI的保険の前置きを置かない

## 画像方針（カバーだけで終わらせない・本文2〜4枚）

- リード視覚フック1つ必須。Claude手描き厳禁・実物/作図ベース・フル画質PNG
- 候補: ①「親Sol→子も全部Sol」の連鎖を示すブランド図版（figmaker）②before/after のレート消費イメージ or 実Xポストの linkcard ③解決の config 2行を強調した図 or コード ④役割別配分（implementer=Terra/medium 等）の表→図
- カバー: `cover.png`（tools/cover）＋ `cover-sm.png`（--mobile・短見出し）＋ mobile-covers.json に1行

## 公開フロー チェックリスト（当時の履歴）

- [ ] `content/post/<slug>/index.md` 作成（frontmatter・relref・過去date）
- [ ] 本文画像 2〜4枚（figmaker/linkcard/実スクショ）＋実在突合＋hugoビルドで目視
- [ ] cover.png / cover-sm.png 生成 ＋ mobile-covers.json 追記
- [ ] 公開前監査エージェント（writing-voice・著者像・作為・relref）
- [ ] Zenn: `articles/<zennSlug>.md` frontmatter 用意 → `node tools/zenn-sync/sync.mjs`（選択add）
- [ ] CLAUDE.md Articles テーブルに #36 行を追加
- [ ] 選択 add でコミット（`git add .` 禁止）＋ push
- [ ] デプロイ完了を記事ページURLでポーリング → X フック投稿ドラフト（JA）＋英語Quote-RT 3案
