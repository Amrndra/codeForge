import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'

import './globals.css'

import { AuthProvider } from '@/context/AuthContext'
import AuthGate from '@/components/auth/AuthGate'

export const metadata: Metadata = {
  title: 'CodeForge — Competitive Programming Platform',
  description: 'CodeForge: A scalable distributed competitive programming platform with real-time judging, live leaderboards, and contest management. Built by Amarendra.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased min-h-screen">
        <AuthProvider>
          <AuthGate>
            {children}
          </AuthGate>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
