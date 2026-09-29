import type { Metadata, Viewport } from 'next'
import { Assistant, Heebo } from 'next/font/google'
import { SwRegister } from '@/components/SwRegister'
import './globals.css'

const heebo = Heebo({ subsets: ['hebrew', 'latin'], weight: ['700', '800'], variable: '--font-heebo', display: 'swap' })
const assistant = Assistant({ subsets: ['hebrew', 'latin'], weight: ['400', '600'], variable: '--font-assistant', display: 'swap' })

export const metadata: Metadata = {
  title: 'אתגר 6 השבועות · גריפ',
  description: 'מעקב יומי לאתגר 6 השבועות של גריפ',
  applicationName: 'גריפ 42',
  appleWebApp: { capable: true, title: 'גריפ 42', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#FAF9F5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${assistant.variable}`}>
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  )
}
