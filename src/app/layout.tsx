import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "宏观报告Studio",
  description: "宏观经济报告PPT Studio - 可视化配置与渲染PPT页面",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
