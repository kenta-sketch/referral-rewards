import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full card p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">紹介報酬管理</h1>
        <p className="text-sm text-gray-500 mb-6">
          各担当者は管理者から共有された専用URLからアクセスしてください。
        </p>
        <Link href="/admin" className="btn-primary w-full">
          管理者ログイン
        </Link>
      </div>
    </main>
  );
}
