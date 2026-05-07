export default function MemberNotFound() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="card p-8 text-center max-w-sm w-full">
        <h1 className="text-lg font-bold mb-2">URLが無効です</h1>
        <p className="text-sm text-gray-500">
          このURLは無効化されているか、存在しません。<br />
          管理者にお問い合わせください。
        </p>
      </div>
    </main>
  );
}
