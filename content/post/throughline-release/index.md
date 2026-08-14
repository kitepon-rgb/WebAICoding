---
title: "Throughline を npm に公開した — Claude CodeのツールI/OをSQLiteに退避するhook"
date: 2026-04-18T12:00:00+09:00
draft: false
description: "Claude Codeのコンテキストの大半はツールI/Oの残骸。それだけSQLiteに退避して会話本文だけ残すhookをnpmに出した。"
tags: ["Claude Code", "OSS"]
cover:
  image: "cover.png"
---

[Throughline](https://github.com/kitepon/Throughline) っていうClaude Code用のhookプラグインをnpmに公開した。

![Throughline — Claude Codeのコンテキスト消費を約9割削りつつ、判断に必要な記憶はほぼ全部残す](overlay.png)

## 何をするか

Claude Codeのセッションで、コンテキストの大半は「ツールI/O」の残骸で埋まってる。ファイルを読んだ中身、grepの結果、Bashの出力。AIがその場で使って、判断して、次に進んだ時点で役目を終えてるデータ。でも最後までコンテキストに居座ってトークンを食い続ける。

Throughlineは会話を3層に分けて管理する。

| 層 | 中身 | コンテキストへの注入 |
|---|---|---|
| L2 | 会話本文（ユーザー発言 + AI応答） | 直近20ターンはそのまま注入 |
| L1 | L2を要点を欠落させない程度（1/5）に要約したもの | 20ターンより古いターンはL1を注入 |
| L3 | ツールI/O・システムメッセージ・thinking | 注入せずSQLiteに退避、必要になったらClaude自身が取り出す |

![L1/L2/L3の3層メモリ。L2はそのまま、L1は1/5要約、L3（ツールI/O）だけSQLiteへ退避してコンテキストから抜く](fig1.png)

ツールI/Oはコンテキストから完全に抜くので、読み終わったgrep結果やBash出力がセッション最後まで居座らない。古い会話は1/5に圧縮されるが要点は残るので、数十ターン前の判断の文脈もちゃんと追える。

手元の50ターンセッションで実測すると、125,000トークン使ってた会話が、13,000トークンに収まる。

## インストール

```bash
npm install -g throughline
throughline install
```

`install` は `~/.claude/settings.json` にhookを登録する。PC内の全Claude Codeプロジェクトで自動で動く。プロジェクトごとの設定は不要。

## セッション間の引き継ぎ

Throughlineは会話をSQLiteに退避してるので、`/clear` してもデータ自体は残ってる。次のセッションに記憶を持ち越したい時は、前のセッションで `/tl` って打つ。

`/tl` を打った時だけ、次のセッションに引き継がれる。打たなければ新規セッションとして始まる。並行ウィンドウを開いても、VSCodeを再起動しても、「`/tl`を打たない限り誤爆しない」ようにできてる。

引き継ぎ時には、前のClaudeが書いた「次の一手メモ」と、最終ターンの内部推論（thinking）も一緒に渡る。次のClaudeは「過去ログを読む」じゃなく「中断地点から続ける」モードで動く。

## トークンモニター

副産物として、マルチセッション対応のトークンモニターもついてくる。

```bash
throughline monitor
```

```
[Throughline] 1 セッション
▶ Throughline  2ed5039c  ████░░░░░░░░░░░░░░░░  205.1k /  21%  残 794.9k  claude-opus-4-6
```

transcriptのJSONLからAPIの実測値（`message.usage`）を読むので、`文字数÷4`の推定じゃなくて正確な値が出る。1Mコンテキストの自動検出にも対応。

## 要件

- Node.js 22.5+（`node:sqlite` 組み込みモジュールを使うため）
- Claude Code（hooks対応）
- Claude Max契約（L1要約のHaiku呼び出しに使う、APIキーは不要）
- Windows / macOS / Linux

## 依存関係

ゼロ。npmに公開してるtarballは `.mjs` ファイルだけ。ビルドもネイティブバインディングも不要。

---

設計の経緯や試行錯誤は [こちらの記事]({{< relref "throughline-declare-over-detect" >}}) に書いた。

{{< linkcard url="https://github.com/kitepon/Throughline" title="kitepon/Throughline" desc="Claude CodeのツールI/OをSQLiteに退避し、会話本文だけ残すhook。L1/L2/L3の3層メモリ・トークンモニタ同梱。依存ゼロ・MIT。" site="GitHub" image="og-throughline.png" >}}

MIT。バグ報告・PRも歓迎です。
