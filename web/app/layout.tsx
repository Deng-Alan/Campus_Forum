import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '武冈三中校园论坛',
  description: '武冈三中校园论坛（初中版）——校园趣事、学习互助、匿名树洞与表白墙。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

