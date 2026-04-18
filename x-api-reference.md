# X API v2 リファレンス（Pay Per Use）

> ソース: https://docs.x.com/overview
> 最終更新: 2026-04-06
> ライブラリ: `twitter-api-v2`（`_playwright/node_modules/`）
> キー: `.env.x-api`

---

## 目次

1. [料金・課金](#料金課金)
2. [レート制限](#レート制限)
3. [認証](#認証)
4. [Posts（投稿）](#posts投稿)
5. [検索](#検索)
6. [タイムライン](#タイムライン)
7. [いいね（Likes）](#いいねlikes)
8. [リポスト（Retweets）](#リポストretweets)
9. [ブックマーク](#ブックマーク)
10. [投稿分析](#投稿分析)
11. [投稿カウント](#投稿カウント)
12. [返信管理](#返信管理)
13. [Users（ユーザー）](#usersユーザー)
14. [フォロー](#フォロー)
15. [ブロック・ミュート](#ブロックミュート)
16. [Media（メディア）](#mediaメディア)
17. [DM（ダイレクトメッセージ）](#dmダイレクトメッセージ)
18. [Lists（リスト）](#listsリスト)
19. [Trends（トレンド）](#trendsトレンド)
20. [Usage（使用状況）](#usage使用状況)
21. [検索オペレータ](#検索オペレータ)
22. [フィルタードストリーム専用オペレータ](#フィルタードストリーム専用オペレータ)

---

## 料金・課金

- **方式**: クレジット先払い制（プリペイド）
- **課金単位**: エンドポイントごとに異なるコスト（具体的な単価はDeveloper Consoleで確認）
- **重複排除**: 同一ポストが24時間UTC内に複数回返されても1回分のみ課金
- **失敗リクエスト**: 課金対象外
- **月間ポスト読み取り上限**: 200万ポ���ト（超過はEnterprise）
- **支出上限**: Developer Consoleで設定可能
- **自動チャージ**: 設定可能
- **契約不要**: いつでも開始・停止

### 課金対象エンドポイント
- ポスト検索（GET /2/tweets、recent/all search）
- ストリーミング（filtered stream）
- タイムライン（user posts、mentions）
- エンゲージメント（liked posts、bookmarks）
- リスト・スペース（list posts、spaces search）

---

## レート制限

15分あたりのリクエスト数（App = Bearer Token、User = OAuth2 User Token）

| エンドポイント | App | User |
|---|---|---|
| `GET /2/tweets` | 3,500 | 5,000 |
| `GET /2/tweets/search/recent` | 450 | 300 |
| `GET /2/users` | 300 | 900 |
| `GET /2/users/search` | 300 | 900 |
| `GET /2/lists/:id/tweets` | 900 | 900 |
| `POST /2/lists` | - | 300 |
| `POST /2/tweets` | - | 10,000/24h |
| `POST /2/media/upload` | 50,000/24h | 500/15min |

---

## 認証

### OAuth 2.0 User Token（主に使う）
ユーザー操作系（投稿・いいね・フォロー等）に必要。スコープで権限を制御。

### Bearer Token（App認証）
読み取り専用エンドポイント（検索・ユーザー取得等）で使用。

### 必要スコープ一覧

| 操作 | スコープ |
|---|---|
| ポスト読み取り | `tweet.read` |
| ポスト作成/削除 | `tweet.write` |
| いいね読み取り | `like.read` |
| いいね操作 | `like.write` |
| フォロー読み取り | `follows.read` |
| フォロー操作 | `follows.write` |
| ブロック読み取り | `block.read` |
| ミュート読み取り | `mute.read` |
| ミュート操作 | `mute.write` |
| ブックマーク読み取り | `bookmark.read` |
| ブックマーク操作 | `bookmark.write` |
| DM読み取り | `dm.read` |
| DM送信 | `dm.write` |
| リスト読み取り | `list.read` |
| リスト操作 | `list.write` |
| メディアアップロード | `media.write` |
| 返信非表示 | `tweet.moderate.write` |
| ユーザー読み取り | `users.read` |

---

## Posts（投稿）

### 投稿作成
```
POST https://api.x.com/2/tweets
```
**認証**: OAuth2 (`tweet.read`, `tweet.write`, `users.read`)

**Body（JSON）**:
| パラメー��� | 型 | 必須 | 説明 |
|---|---|---|---|
| `text` | string | ○ | 投稿テキスト |
| `media` | object | - | `media_ids`（配列、最大4つ）、`tagged_user_ids`（最大10） |
| `poll` | object | - | `options`（2〜4選択肢）、`duration_minutes`（5〜10080） |
| `reply` | object | - | `in_reply_to_tweet_id`（必須） |
| `quote_tweet_id` | string | - | 引用元ポストID |
| `reply_settings` | string | - | リプライ制限 |
| `geo` | object | - | `place_id` |
| `for_super_followers_only` | bool | - | デフォルト: false |
| `paid_partnership` | bool | - | 有料パートナーシップ表示 |
| `made_with_ai` | bool | - | AI生成メディア表示 |
| `community_id` | string | - | コミュニティID |

**レスポンス** (201):
```json
{ "data": { "id": "ツイートID", "text": "テキスト" } }
```

### 投稿削除
```
DELETE https://api.x.com/2/tweets/{id}
```
**認証**: OAuth2 (`tweet.read`, `tweet.write`, `users.read`)

**レスポンス** (200):
```json
{ "data": { "deleted": true } }
```

### 投稿取得（単一）
```
GET https://api.x.com/2/tweets/{id}
```
**認証**: Bearer / OAuth2 / User Token

**クエリ**: `tweet.fields`, `expansions`, `media.fields`, `poll.fields`, `user.fields`, `place.fields`

### 投稿取得（複数）
```
GET https://api.x.com/2/tweets?ids=ID1,ID2,...
```
**認証**: Bearer / OAuth2 / User Token

最大100個のIDをカンマ区切り。

### 引用ポスト取得
```
GET https://api.x.com/2/tweets/{id}/quote_tweets
```
**認証**: Bearer / OAuth2 / User Token

`max_results`: 10〜100（デフォルト10）

### リポスト取得
```
GET https://api.x.com/2/tweets/{id}/retweets
```
**認証**: Bearer / OAuth2 / User Token

`max_results`: 1〜100（デフォルト100）

---

## 検索

### 最近の投稿検索（直近7日間）
```
GET https://api.x.com/2/tweets/search/recent
```
**認証**: Bearer / OAuth2 / User Token

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `query` | string | ○ | 検索クエリ（1〜4096文字） |
| `start_time` | datetime | - | UTC開始時刻 |
| `end_time` | datetime | - | UTC終了時刻 |
| `max_results` | int | - | 10〜100（デフォルト10） |
| `sort_order` | string | - | `recency` / `relevancy` |
| `next_token` | string | - | ページネーション |

### 全期間検索（2006年〜）
```
GET https://api.x.com/2/tweets/search/all
```
**認証**: Bearer Token のみ

パラメータは最近の検���と同じ。`max_results`: 10〜500。

---

## タイムライン

### ホームタイムライン（逆時系列）
```
GET https://api.x.com/2/users/{id}/timelines/reverse_chronological
```
**認証**: OAuth2 (`tweet.read`, `users.read`)

`max_results`: 1〜100。`exclude`: replies, retweets

### ユーザーのポスト一覧
```
GET https://api.x.com/2/users/{id}/tweets
```
**認証**: Bearer / OAuth2 / User Token

`max_results`: 5〜100。`exclude`: replies, retweets

### メンション取得
```
GET https://api.x.com/2/users/{id}/mentions
```
**認証**: Bearer / OAuth2 / User Token

`max_results`: 5〜100

---

## いいね（Likes）

### いいねする
```
POST https://api.x.com/2/users/{id}/likes
```
**認証**: OAuth2 (`like.write`, `tweet.read`, `users.read`)

**Body**: `{ "tweet_id": "ポストID" }`

**レスポンス**: `{ "data": { "liked": true } }`

### いいね解除
```
DELETE https://api.x.com/2/users/{id}/likes/{tweet_id}
```

### いいね済みポスト取得
```
GET https://api.x.com/2/users/{id}/liked_tweets
```
**認証**: OAuth2 (`like.read`, `tweet.read`, `users.read`)

`max_results`: 5〜100

### いいねしたユーザー取得
```
GET https://api.x.com/2/tweets/{id}/liking_users
```
**認証**: OAuth2 (`like.read`, `tweet.read`, `users.read`)

`max_results`: 1〜100（デフォルト100）

---

## リポスト（Retweets）

### リポストする
```
POST https://api.x.com/2/users/{id}/retweets
```
**認証**: OAuth2 (`tweet.read`, `tweet.write`, `users.read`)

**Body**: `{ "tweet_id": "ポストID" }`

**レスポンス**: `{ "data": { "id": "...", "retweeted": true } }`

### リポスト取消
```
DELETE https://api.x.com/2/users/{id}/retweets/{source_tweet_id}
```

### リポストしたユーザー取得
```
GET https://api.x.com/2/tweets/{id}/retweeted_by
```
`max_results`: 1〜100（デフォルト100）

---

## ブックマーク

### ブックマーク一覧取得
```
GET https://api.x.com/2/users/{id}/bookmarks
```
**認証**: OAuth2 (`bookmark.read`, `tweet.read`, `users.read`)

`max_results`: 1〜100

### ブックマーク追加
```
POST https://api.x.com/2/users/{id}/bookmarks
```
**認証**: OAuth2 (`bookmark.write`, `tweet.read`, `users.read`)

**Body**: `{ "tweet_id": "ポストID" }`

### ブックマーク削除
```
DELETE https://api.x.com/2/users/{id}/bookmarks/{tweet_id}
```

---

## 投稿分析

```
GET https://api.x.com/2/tweets/analytics
```
**認証**: OAuth2 (`tweet.read`, `users.read`)

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `ids` | array | ○ | ポストID（1〜100個） |
| `start_time` | datetime | ○ | UTC開始時刻 |
| `end_time` | datetime | ○ | UTC終了時刻 |
| `granularity` | string | ○ | `hourly` / `daily` / `weekly` / `total` |
| `analytics.fields` | array | - | 取得フィールド |

**利用可能フィールド**:
`impressions`, `engagements`, `likes`, `retweets`, `replies`, `quote_tweets`, `bookmarks`, `url_clicks`, `hashtag_clicks`, `permalink_clicks`, `user_profile_clicks`, `detail_expands`, `media_views`, `follows`, `unfollows`, `shares`, `email_tweet`, `app_install_attempts`, `app_opens`

---

## 投稿カウント

### 最近のカウント（直近7日間）
```
GET https://api.x.com/2/tweets/counts/recent
```
**認証**: Bearer Token

| パラメータ | 必須 | 説明 |
|---|---|---|
| `query` | ○ | 検索クエリ（最大4096文字） |
| `granularity` | - | `minute` / `hour` / `day`（デフォルト: hour） |
| `start_time` / `end_time` | - | UTC時刻 |

### 全期間カウント
```
GET https://api.x.com/2/tweets/counts/all
```
パラメータは同じ。Bearer Token認証。

---

## 返信管理

### 返信の表示/非表���
```
PUT https://api.x.com/2/tweets/{tweet_id}/hidden
```
**認証**: OAuth2 (`tweet.moderate.write`, `tweet.read`, `users.read`)

**Body**: `{ "hidden": true }`

---

## Users（ユーザー）

### 自分の情報取得
```
GET https://api.x.com/2/users/me
```
**認証**: OAuth2 (`tweet.read`, `users.read`)

### IDで取得
```
GET https://api.x.com/2/users/{id}
```
**認証**: Bearer / OAuth2 / User Token

### ユーザー名で取得
```
GET https://api.x.com/2/users/by/username/{username}
```
**認証**: Bearer / OAuth2 / User Token

### 複数IDで取得
```
GET https://api.x.com/2/users?ids=ID1,ID2,...
```

### 複��ユーザー名で取得
```
GET https://api.x.com/2/users/by?usernames=name1,name2,...
```

### ユーザー検索
```
GET https://api.x.com/2/users/search
```
**認証**: OAuth2 (`tweet.read` or `users.read`)

| パラメータ | 必須 | 説明 |
|---|---|---|
| `query` | ○ | 検索キーワード（1〜50文字） |
| `max_results` | - | 1〜1000（デフォルト100） |

### ユーザーのポスト取得
```
GET https://api.x.com/2/users/{id}/tweets
```
`max_results`: 5〜100。`exclude`: replies, retweets

---

## フォロー

### フォローする
```
POST https://api.x.com/2/users/{id}/following
```
**認証**: OAuth2 (`follows.write`, `tweet.read`, `users.read`)

**Body**: `{ "target_user_id": "対象ID" }`

**レスポンス**: `{ "data": { "following": true, "pending_follow": false } }`

### フォロー解除
```
DELETE https://api.x.com/2/users/{source_user_id}/following/{target_user_id}
```

### フォロワー取得
```
GET https://api.x.com/2/users/{id}/followers
```
`max_results`: 1〜1000

### フォロー中取得
```
GET https://api.x.com/2/users/{id}/following
```
`max_results`: 1〜1000

---

## ブロッ��・ミュート

### ブロック一覧取得
```
GET https://api.x.com/2/users/{id}/blocking
```
**認証**: OAuth2 (`block.read`, `tweet.read`, `users.read`)

`max_results`: 1〜1000

### ミュートする
```
POST https://api.x.com/2/users/{id}/muting
```
**認証**: OAuth2 (`mute.write`, `tweet.read`, `users.read`)

**Body**: `{ "target_user_id": "対象ID" }`

### ミュート一覧取得
```
GET https://api.x.com/2/users/{id}/muting
```
**認証**: OAuth2 (`mute.read`, `tweet.read`, `users.read`)

`max_results`: 1〜1000（デフォルト100）

---

## Media（メディア）

### シンプルアップロード（画像向け）
```
POST https://api.x.com/2/media/upload
```
**認証**: OAuth2 (`media.write`) / User Token

**Body** (JSON or multipart/form-data):
| パラメータ | 必須 | 説明 |
|---|---|---|
| `media` | ○ | バ��ナリデータ |
| `media_category` | ○ | `tweet_image` / `dm_image` / `subtitles` |
| `media_type` | - | `image/jpeg` / `image/png` / `image/webp` 等 |
| `additional_owners` | - | 追加所有者ID配列 |

**レスポンス**: `media_id`, `media_key`, `size`, `expires_after_secs`

### チャンクアップロード（動画・大きいファイル向け）

**Step 1: Initialize**
```
POST https://api.x.com/2/media/upload/initialize
```
Body: `media_type`, `total_bytes`（最大17GB）, `media_category`（`tweet_video` 等）

**Step 2: Append**
```
POST https://api.x.com/2/media/upload/{id}/append
```
チャンクごとにバ���ナリデータを送信

**Step 3: Finalize**
```
POST https://api.x.com/2/media/upload/{id}/finalize
```
処理完了を待つ（`processing_info.state`が`succeeded`になるまでポーリング）

**Step 4: Status確認**
```
GET https://api.x.com/2/media/upload/{id}/status
```

### メタデータ作成
```
POST https://api.x.com/2/media/metadata/create
```
alt_text等の設定

### 字幕操作
```
POST https://api.x.com/2/media/subtitles/create
DELETE https://api.x.com/2/media/subtitles/delete
```

---

## DM（ダイレクトメッセージ）

### メッセージ送信（参加者ID指定）
```
POST https://api.x.com/2/dm_conversations/with/{participant_id}/messages
```
**認証**: OAuth2 (`dm.write`, `tweet.read`, `users.read`)

**Body**:
```json
{
  "text": "メッセージ本文",
  "attachments": [{ "media_id": "メディアID" }]
}
```
`text`または`attachments`のどちらかは必須。

**レスポンス** (201):
```json
{ "data": { "dm_conversation_id": "...", "dm_event_id": "..." } }
```

### メッセージ送信（会話ID指定）
```
POST https://api.x.com/2/dm_conversations/{dm_conversation_id}/messages
```

### DM会話作成
```
POST https://api.x.com/2/dm_conversations
```
グループDMの作成。

### DMイベント取得（全体）
```
GET https://api.x.com/2/dm_events
```
**認証**: OAuth2 (`dm.read`, `tweet.read`, `users.read`)

`max_results`: 1〜100（デフォルト100）

`event_types`: `MessageCreate` / `ParticipantsJoin` / `ParticipantsLeave`

### DMイベント取得（会話別）
```
GET https://api.x.com/2/dm_conversations/{id}/dm_events
```

### DMイベント削除
```
DELETE https://api.x.com/2/dm_events/{event_id}
```

---

## Lists（リスト）

### リスト作成
```
POST https://api.x.com/2/lists
```
**認証**: OAuth2 (`list.write`, `list.read`, `tweet.read`, `users.read`)

**Body**: `name`（必須、1〜25文字）, `description`（最大100文字）, `private`（デフォルトfalse）

### リスト更新
```
PUT https://api.x.com/2/lists/{id}
```

### リスト削除
```
DELETE https://api.x.com/2/lists/{id}
```

### リスト取得
```
GET https://api.x.com/2/lists/{id}
```

### リストのポスト取得
```
GET https://api.x.com/2/lists/{id}/tweets
```
`max_results`: 1〜100（デフォルト100）

### メンバー管理
```
POST https://api.x.com/2/lists/{id}/members      # 追加
DELETE https://api.x.com/2/lists/{id}/members/{user_id}  # 削除
GET https://api.x.com/2/lists/{id}/members        # 一覧
GET https://api.x.com/2/lists/{id}/followers       # フォロワー
```

### ユーザーのリスト操作
```
GET https://api.x.com/2/users/{id}/owned_lists     # 所有リスト
GET https://api.x.com/2/users/{id}/list_memberships # 所属リスト
GET https://api.x.com/2/users/{id}/followed_lists   # フォロー中リスト
GET https://api.x.com/2/users/{id}/pinned_lists     # ピン留めリスト
POST https://api.x.com/2/users/{id}/pinned_lists    # ピン留め
DELETE https://api.x.com/2/users/{id}/pinned_lists/{list_id}  # ピン解除
POST https://api.x.com/2/users/{id}/followed_lists  # リストフォロー
DELETE https://api.x.com/2/users/{id}/followed_lists/{list_id}  # リストフォロー解除
```

---

## Trends（トレンド）

### WOEID別トレンド取得
```
GET https://api.x.com/2/trends/by/woeid/{woeid}
```
**認証**: Bearer Token

| パラメータ | 必須 | 説明 |
|---|---|---|
| `woeid` | ○ | 地域ID（日本: 23424856、東京: 1118370） |
| `max_trends` | - | 1〜50（デフォルト20） |
| `trend.fields` | - | `trend_name`, `tweet_count` |

### パーソナライズドトレンド
```
GET https://api.x.com/2/trends/personalized
```

---

## Usage（使用状況）

```
GET https://api.x.com/2/usage/tweets
```
**認証**: Bearer Token

| パラメータ | 必須 | 説明 |
|---|---|---|
| `days` | - | 1〜90（デフォルト7） |
| `usage.fields` | - | `cap_reset_day`, `daily_client_app_usage` 等 |

**レスポンス**:
```json
{
  "data": {
    "project_id": "...",
    "project_usage": 12345,
    "project_cap": 2000000,
    "cap_reset_day": 15,
    "daily_project_usage": {...}
  }
}
```

---

## 検索オペレータ

検索API（`/2/tweets/search/recent`, `/2/tweets/search/all`）で使えるオペレータ。

### キーワード・フレーズ
| オペレータ | 説明 | 例 |
|---|---|---|
| `keyword` | 本文内キーワード | `Claude Code` |
| `"exact phrase"` | 完全一致フレーズ | `"Claude Code"` |
| emoji | 絵文字マッチ | `🤖` |

### エンティティ
| オペレータ | 説明 | 例 |
|---|---|---|
| `#` | ハッシュタグ | `#ClaudeCode` |
| `@` | メンション | `@anthropic` |
| `$` | キャッシュタグ | `$AAPL` |

### ユーザー
| オペレータ | 説明 | 例 |
|---|---|---|
| `from:` | 特定ユーザーの投稿 | `from:kitepon_rgb` |
| `to:` | 特定ユーザーへの返信 | `to:kitepon_rgb` |
| `retweets_of:` | 特定ユーザーのRT | `retweets_of:kitepon_rgb` |

### URL
| オペレータ | 説明 |
|---|---|
| `url:` | URL内のトークンマッチ |

### コンテキスト
| オペレータ | 説明 |
|---|---|
| `context:` | ドメイン/エンティティペア |
| `entity:` | エンティティ値 |
| `conversation_id:` | 会話スレッド |
| `list:` | リストメンバーの投稿 |

### 投稿参照
| オペレータ | 説明 |
|---|---|
| `in_reply_to_tweet_id:` | 特定投稿への返信 |
| `retweets_of_tweet_id:` | 特定投稿のRT |
| `quotes_of_tweet_id:` | 特定投稿の引用 |

### 地域
| オペレータ | 説明 |
|---|---|
| `place:` | 位置情報タグ |
| `place_country:` | 国コード |
| `point_radius:` | 地点+半径 |
| `bounding_box:` | 境界ボックス |

### 投稿タイプ
| オペレータ | 説明 |
|---|---|
| `is:retweet` | RTのみ |
| `is:reply` | 返信のみ |
| `is:quote` | 引用のみ |
| `is:verified` | 認証済みユーザー |
| `-is:retweet` | RTを除外 |
| `-is:nullcast` | プロモーション除外 |

### コンテンツタイプ
| オペレータ | 説明 |
|---|---|
| `has:hashtags` | ハッシュタグ付き |
| `has:links` | リンク付き |
| `has:mentions` | メンション付き |
| `has:media` | メディア付き（写真/GIF/動画） |
| `has:images` | 画像付き |
| `has:video_link` | 動画付き |
| `has:geo` | 位置情報付き |

### 言語
| オペレータ | 説明 | 例 |
|---|---|---|
| `lang:` | 言語フィルタ | `lang:ja` |

### 論理演算子
| 演算子 | 説明 | 例 |
|---|---|---|
| スペース | AND | `Claude Code` |
| `OR` | OR | `Claude OR Cursor` |
| `-` | NOT（除外） | `-is:retweet` |
| `()` | グループ化 | `(Claude OR Cursor) lang:ja` |

---

## フィルタードストリーム専用オペレータ

検索オペレータに加え、Filtered Streamでのみ使えるオペレータ。

| オペレータ | 説明 |
|---|---|
| `bio:` | 著者プロフィールのキーワード |
| `bio_name:` | 著者名のキーワード |
| `bio_location:` | 著者位置情報のキーワード |
| `url_title:` | URL先のHTMLタイトル |
| `url_description:` | URL先のmeta description |
| `url_contains:` | URLリテラルマッチ |
| `followers_count:` | フォロワー数範囲 |
| `tweets_count:` | 投稿数範囲 |
| `following_count:` | フォロー数範囲 |
| `listed_count:` | リスト登録数範囲 |
| `sample:` | ランダムサンプリング（1-100%） |
| `source:` | アプリケーション別フィルタ |

---

## 共通パラメータ（fields/expansions）

多くのGETエンドポイントで使える共通のフィールド展開パラメー���。

### tweet.fields
`attachments`, `author_id`, `context_annotations`, `conversation_id`, `created_at`, `edit_controls`, `entities`, `geo`, `id`, `in_reply_to_user_id`, `lang`, `public_metrics`, `possibly_sensitive`, `referenced_tweets`, `reply_settings`, `source`, `text`, `withheld`

### user.fields
`affiliation`, `created_at`, `description`, `entities`, `id`, `location`, `name`, `profile_image_url`, `protected`, `public_metrics`, `url`, `username`, `verified`, `withheld`

### media.fields
`duration_ms`, `height`, `media_key`, `preview_image_url`, `type`, `url`, `width`, `alt_text`, `variants`

### expansions（ポスト系）
`author_id`, `referenced_tweets.id`, `referenced_tweets.id.author_id`, `in_reply_to_user_id`, `attachments.media_keys`, `attachments.poll_ids`, `geo.place_id`, `entities.mentions.username`

### expansions（ユーザー系）
`affiliation.user_id`, `most_recent_tweet_id`, `pinned_tweet_id`
