import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ビルド時のESLintは無効化（依存を最小化するため）
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ビルド時のTypeScriptエラーは検出する（デフォルトのまま）
};

export default nextConfig;
