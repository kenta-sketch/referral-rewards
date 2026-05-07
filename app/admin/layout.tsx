// このレイアウトは /admin 配下すべて（ログイン画面含む）に適用される。
// ログインページはこのレイアウト＋ルートレイアウトで完結。
// 認証後の画面は app/admin/(authed)/layout.tsx でナビを描画する。
export default function AdminBaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
