import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "邏ｹ莉句ｱ驟ｬ邂｡逅・,
  description: "邏ｹ莉句ｱ驟ｬ縺ｮ蜿悶ｊ蛻・ｮ｡逅・ヤ繝ｼ繝ｫ",
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

