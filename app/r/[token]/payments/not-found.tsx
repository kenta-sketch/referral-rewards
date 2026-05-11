export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="card p-8 text-center max-w-sm w-full">
        <h1 className="text-lg font-bold mb-2">アクセス権がありません</h1>
        <p className="text-sm text-gray-500">
          このページは支払い担当者のみアクセスできます。<br />
          管理者にお問い合わせください。
        </p>
      </div>
    </main>
  );
}
