import Link from "next/link";
import { seedDemoDataAction, resetAllDataAction } from "../actions";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 w-full">
      <div className="mb-4">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
          ← サマリーへ
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">デモデータ管理</h1>
      <p className="text-xs text-gray-500 mb-6">
        商談や説明のために、サンプルの組織構造と案件をワンクリックで投入できます。
      </p>

      {/* デモ投入 */}
      <div className="card p-6 mb-4 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          デモデータを投入
        </h2>
        <p className="text-sm text-gray-700 mb-3">
          以下を一括生成します（既存データには追加されます）：
        </p>
        <ul className="text-sm text-gray-600 mb-4 list-disc pl-5 space-y-1">
          <li>営業統括 1名（ルート）</li>
          <li>リーダー 2名（うち1名クローザー、1名支払い担当）</li>
          <li>営業 3名（第3階層、各リーダー配下）</li>
          <li>確定済み案件 2件（支払予定 / 支払済の彩り付き）</li>
          <li>打ち合わせ予定の案件 2件</li>
          <li>打ち合わせ日未設定の案件 1件</li>
        </ul>
        <form action={seedDemoDataAction}>
          <button type="submit" className="btn-primary">
            デモデータを投入する
          </button>
        </form>
      </div>

      {/* 全削除 */}
      <div className="card p-6 border-2 border-red-300">
        <h2 className="text-lg font-semibold text-red-700 mb-2">
          全データを削除（リセット）
        </h2>
        <p className="text-sm text-gray-700 mb-2">
          すべての担当者・案件・配分・支払い記録を削除します。
          <b className="text-red-700">元に戻せません。</b>
        </p>
        <p className="text-xs text-gray-500 mb-4">
          ※ 本番運用中の環境では絶対に押さないでください。
          商談前にデモデータをクリーンに入れ替えたい時の用途です。
        </p>
        <form
          action={resetAllDataAction}
        >
          <button
            type="submit"
            className="btn-danger"
            formNoValidate
          >
            全データを削除する
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        この機能はDB側に <code>seed_demo_data()</code> /{" "}
        <code>reset_all_data()</code> 関数が定義されている環境でのみ動作します。
        本番環境では関数が無いため、押してもエラーになるだけで安全です。
      </p>
    </div>
  );
}
