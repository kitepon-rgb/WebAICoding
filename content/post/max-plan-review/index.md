---
title: "MAXプランで何が変わるか"
date: 2026-03-27
draft: false
description: "たくさん使えるのは知ってる。MAXで実際に何が変わるのか、公式ソース付きで整理する"
tags: ["Claude Code", "MAX", "Pro"]
cover:
  image: "cover.svg"
---

## はじめに

MAXプランにすると「たくさん使える」。それは誰でも知っている。

この記事で書きたいのは、**MAXで実際に何が変わるのか**。調べてみたら、自分が「MAX限定」だと思っていた機能がそうじゃなかったり、逆に知らなかった違いがあったりした。

公式ソースを確認しながら整理する。

---

## デフォルトモデルがOpus

Proだとデフォルトモデルは**Sonnet**。MAXだと**Opus 4.6がデフォルト**になる。

地味に見えるが、これは大きい。Proだと毎回Opusに切り替える手間があるし、使用量を気にして「Sonnetでいいか…」と妥協しがちになる。MAXなら最初からOpusで、そのまま使い続けられる。

> 参照：[What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)

---

## 1Mコンテキストウィンドウが追加料金なし

Opus 4.6は最大100万トークン（1M）のコンテキストウィンドウに対応している。ただし、**プランによって扱いが違う**。

| プラン | Opusの1Mコンテキスト |
|--------|---------------------|
| MAX / Team / Enterprise | **サブスクに含まれる** |
| Pro | extra usageを有効にする必要あり（追加課金） |

MAXなら何も設定しなくても自動的にOpusが1Mコンテキストにアップグレードされる。Proだと1Mを使うには「extra usage」を有効にして、追加料金を受け入れる必要がある。

100万トークンあると何が変わるか：

- 大きなコードベースでファイル間の依存関係をまとめて把握できる
- 長いセッションで前の文脈が消えにくい
- `/compact`の頻度が減る

> 参照：[Model configuration - Claude Code Docs（Extended context）](https://code.claude.com/docs/en/model-config)
> 参照：[1M context is now generally available](https://claude.com/blog/1m-context-ga)

---

## 新機能への優先アクセス

公式に明記されている：**新機能やモデルはMAXに最初に提供されることが多い**。

実際、Claudeの新機能が出た時にProユーザーが「まだ使えない」と言っているのをXで見かけることがある。MAXだと先に触れる。これは地味にうれしい。

> 参照：[What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)

---

## 自分が勘違いしていたこと

正直に書く。調べる前は以下の機能がMAX限定だと思っていた。**違った。**

### Effort MAX（思考の深さ最大）

Effort設定の最大値「MAX」は、**プランではなくモデルに紐づいている。** Opus 4.6を使える環境なら、ProでもMAXでもEffort MAXが選べる。

ただし現実的には、Effort MAXはトークン消費が大きいので、Proの使用量だとすぐ上限に達する。MAXなら気にせず常時MAXで回せる。機能としてはProでも使えるが、実用的にはMAXの使用量がないと厳しい。

> 参照：[Effort - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/effort)

### サブエージェント

Claude Codeがサブエージェント（分身）を起動して並列調査する機能。これも**プラン制限なし**。Claude Codeが使える環境なら誰でも使える。

> 参照：[Create custom subagents - Claude Code Docs](https://code.claude.com/docs/en/sub-agents)

### /batch

大規模変更を並列処理する機能。これも**全Claude Codeユーザーが使える**バンドルスキル。

> 参照：[Built-in commands - Claude Code Docs](https://code.claude.com/docs/en/commands)

### Research（リサーチモード）

Claudeが自律的にWebを検索して調査する機能。**Pro、MAX、Team、Enterpriseの全有料プランで使える。** MAXだからといってResearchの機能自体が強化されるわけではない。ただし、Researchはトークン消費が大きいので、Proだと使用量を圧迫する。

> 参照：[Using Research on Claude](https://support.claude.com/en/articles/11088861-using-research-on-claude)

---

## じゃあMAXの本当の価値は何か

機能だけで見ると、MAX限定の機能は意外と少ない。まとめるとこうなる：

| | Pro | MAX |
|--|-----|-----|
| デフォルトモデル | Sonnet | **Opus** |
| Opus 1Mコンテキスト | 追加課金が必要 | **サブスクに含まれる** |
| 新機能の優先アクセス | 後から | **先に使える** |
| Effort MAX | 使えるが上限すぐ来る | **常時MAXで回せる** |
| サブエージェント | 使えるが上限すぐ来る | **気にせず使える** |
| Research | 使えるが使用量圧迫 | **気にせず使える** |

見えてくるパターンがある。**機能自体はProでも使えるものが多い。でもProの使用量だと、その機能をフルに活かせない。**

Effort MAXもサブエージェントもResearchも、使えば使うほどトークンを消費する。Proだと「機能はあるけど使うと上限に当たる」というジレンマが生まれる。MAXはそのリミッターを外してくれる。

結局「たくさん使える」に戻るじゃないかと思うかもしれない。でも「量が増える」と「機能をフルに使える」は違う。MAXの価値は後者だ。

---

## まとめ

調べてみて、自分の認識がけっこう間違っていたのがわかった。MAX限定の機能は思ったより少なくて、本当の価値は「既にある機能をリミッターなしで使える」ことにある。

Opusがデフォルト。1Mコンテキストが追加料金なし。新機能に先に触れる。そしてEffortもサブエージェントもResearchも、使用量を気にせず使い倒せる。

月額$100は安くない。でも、**機能をフルに使えないまま$20払い続けるのと、フルに使って$100払うのと、どっちが価値があるか**。自分にとっては後者だった。

---

*このブログ「Claude Code 始めました」は、Claude MAX ユーザーが実際の開発で使いながら学んだことを記録していくサイトです。*
