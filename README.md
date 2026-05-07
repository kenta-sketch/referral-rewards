# 紹介報酬管理ツール（referral-rewards）

紹介報酬の取り分を、担当者ごとの専用URLで個別に表示するWebアプリです。

## 機能

### 担当者向け（`/r/{token}`）
- 自分の累計報酬を「即時受取（税込）」と「繰延受取（×3、翌年以降）」の両軸で表示
- 確定済み案件ごとの配分を一覧
- 受取方式（即時/繰延）を案件単位で切り替え
- 自分でトスアップ申告（管理者承認は実施人数の確定をもって行う）
- 支払いステータス（未払い／支払予定／支払済）の確認

### 管理者向け（`/admin`）
- 担当者の追加・編集（紹介ツリー編集／URL再発行）
- 案件の追加・確定（実施人数とクローザー入力で自動配分）
- 各受取者の支払いステータス更新
- 全体サマリー

### 配分ロジック（PostgreSQL関数で実装済）
- 単価10万円固定 × 実施人数 × 階層別シェア
- 直接紹介（第1階層）→ 100%
- 第2階層が紹介 → 紹介者50% / 親50%
- 第3階層以下が紹介 → 紹介者50% / 親25% / 祖父25%
- 離脱者（is_active=false）は配分時にスキップ、直近の有効な祖先に巻き上げ
- 過去の確定済み案件はツリー変更後も配分が変わらない（snapshot保存）

---

## デプロイ手順

### 1. Supabase Service Role Key を取得

[Supabase Dashboard](https://supabase.com/dashboard) → このプロジェクト → Project Settings → API → **service_role** secret をコピー

⚠️ Service Role Key はサーバー側専用、ブラウザに渡してはいけません。

### 2. Vercel にデプロイ

このディレクトリで Vercel CLI を実行:

```bash
npx vercel --yes
```

初回はログインを求められます。GitHubアカウントなどで認証してください。

### 3. 環境変数を設定

[Vercel Dashboard](https://vercel.com/dashboard) → 該当プロジェクト → Settings → Environment Variables で以下を設定:

| 変数名 | 値 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qwkranrdjuqndxrihuuw.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | （手順1で取得した値） |
| `ADMIN_PASSWORD` | 任意のパスワード（管理者ログイン用） |
| `ADMIN_SESSION_SECRET` | ランダムな長い文字列（48文字以上推奨） |
| `NEXT_PUBLIC_APP_ORIGIN` | デプロイ後の本番URL（例: `https://your-app.vercel.app`） |

`ADMIN_SESSION_SECRET` の生成例：

```bash
openssl rand -hex 48
```

### 4. 環境変数反映のため再デプロイ

```bash
npx vercel --prod
```

---

## ローカル開発（任意）

```bash
npm install
cp .env.example .env.local
# .env.local を編集して値を入れる
npm run dev
```

http://localhost:3000 で起動。

---

## 構造

```
app/
  layout.tsx                       ルートレイアウト
  page.tsx                         トップ（管理者ログインへ誘導）
  r/[token]/                       担当者ページ（トークンURL）
    page.tsx                       マイダッシュボード
    not-found.tsx                  無効URL用
    toss-up/page.tsx               トスアップ申告フォーム
    actions.ts                     トスアップ・受取方式変更のServer Actions
    _components/ReceiptTypeSelector.tsx
  admin/
    layout.tsx                     ベース（passthrough）
    login/page.tsx                 管理者ログイン
    (authed)/                      認証必須エリア（route group）
      layout.tsx                   管理画面ナビゲーション
      page.tsx                     サマリー
      members/...                  担当者管理
      deals/...                    案件管理
      actions.ts                   管理者操作のServer Actions
      _components/CopyButton.tsx
lib/
  supabase.ts                      Service Role 専用Supabaseクライアント
  auth.ts                          管理者認証（HMAC署名Cookie）
  format.ts                        表示フォーマッタ
  types.ts                         型定義
middleware.ts                      /admin/* の認証ガード
```

---

## データベース

Supabase プロジェクト ID: `qwkranrdjuqndxrihuuw`（東京リージョン）

スキーマと配分計算ロジックは適用済み。新しい環境にコピーする場合は
`supabase/migrations/` 配下のSQL（このリポには未同梱、ダッシュボードのSQL Editor履歴を参照）を再実行してください。

### テーブル
- `members` 紹介ツリーのメンバー（access_token で本人特定）
- `deals` 案件（紹介先＋トスアップ者＋実施人数）
- `payouts` 配分レコード（確定時に自動生成、税込・繰延の両金額を保持）
- `admins` （未使用、将来の複数管理者対応用）

### RPC関数
- `confirm_deal(deal_id, actual_headcount, closer_member_id)` 案件確定 → 配分計算
- `calc_payouts_for_deal(deal_id)` 配分の単独再計算

---

## セキュリティメモ

- すべてのテーブルに RLS が有効化されており、anon/authenticatedからは一切見えない設定
- データアクセスは Next.js のサーバー側で `SUPABASE_SERVICE_ROLE_KEY` を使い、各エンドポイントで認可ロジック（トークン照合 or 管理者Cookie検証）を実装している
- 担当者URL は流出すると本人なりすましが可能。流出疑いがあれば `/admin/members/[id]` から再発行
- 管理者は単一のパスワード＋HMAC署名Cookie（30日有効）で保護
