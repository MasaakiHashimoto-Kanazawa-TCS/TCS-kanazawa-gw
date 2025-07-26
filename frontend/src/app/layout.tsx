import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Plant Monitor',
  description: '植物監視システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  )
}