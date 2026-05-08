import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full card p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">邏ｹ莉句ｱ驟ｬ邂｡逅・/h1>
        <p className="text-sm text-gray-500 mb-6">
          蜷・球蠖楢・・邂｡逅・・°繧牙・譛峨＆繧後◆蟆ら畑URL縺九ｉ繧｢繧ｯ繧ｻ繧ｹ縺励※縺上□縺輔＞縲・        </p>
        <Link href="/admin" className="btn-primary w-full">
          邂｡逅・・Ο繧ｰ繧､繝ｳ
        </Link>
      </div>
    </main>
  );
}

