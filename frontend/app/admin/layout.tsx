import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: '武冈三中校园论坛后台',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 这里保持简单，只负责为 /admin 下面的页面提供布局和标题
  return <>{children}</>
}

