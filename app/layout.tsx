import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "紹介報酬管理",
  description: "紹介報酬の取り分管理ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
