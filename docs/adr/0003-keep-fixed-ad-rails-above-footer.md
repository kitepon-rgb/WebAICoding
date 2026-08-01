# ADR 0003: 固定広告レールをフッター上端で退避させる

## Status

Accepted

## Context

PC記事ページの左右広告レールは、本文の左右ガターへ`position: fixed`で配置している。
通常の閲覧中は安定した位置を保てる一方、ページ末尾ではフッターがviewportへ入っても
`bottom: 1.25rem`のまま残るため、広告とフッターが重なっていた。

レールを本文レイアウトへ組み込むと、本文幅、左右対称のガター配置、スクロール中の固定表示を
同時に変更してしまう。今回必要なのは、既存配置を保ったままフッターとの境界だけを直すことである。

## Decision

- レールの`position: fixed`、左右ガター中央、1100px以上という既存契約は維持する。
- 通常時の下余白は`--rail-bottom: 1.25rem`を維持する。
- フッターがviewportへ入った時は、viewport下端からフッター上端までの距離を`--rail-footer-offset`へ設定する。
- レールの`bottom`は両変数の合計とし、フッター上端との間にも通常と同じ余白を残す。
- scroll／resize処理は`requestAnimationFrame`で1frameにつき1回へ制限する。

## Consequences

- 記事本文の途中では従来と同じ位置に表示される。
- ページ末尾では左右レールが同時に上がり、viewportがフッターより下まで見せる場合もフッターへ重ならない。
- 配信元、広告HTML、本文カラム、Caddyやnginxの配信構成は変わらない。
- rollbackは`--rail-footer-offset`と同期処理を撤去し、`bottom: var(--rail-bottom)`へ戻す。
