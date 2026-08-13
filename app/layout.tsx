import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Manrope } from 'next/font/google'
import { AccessibilityProvider } from '@/components/accessibility/accessibility-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const APP_URL = 'https://clm-snowy.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Christian Leadership Movement | Transforming Leaders, Transforming the Nations',
  description:
    'Apply to join the Christian Leadership Movement — developing Christ-centred leaders through training, mentorship, and discipleship across South Africa.',
  icons: {
    icon: '/images/logo.jpeg',
    apple: '/images/logo.jpeg',
  },
  openGraph: {
    title: 'Christian Leadership Movement',
    description:
      'Apply to join the Christian Leadership Movement — developing Christ-centred leaders through training, mentorship, and discipleship across South Africa.',
    url: APP_URL,
    siteName: 'Christian Leadership Movement',
    images: [
      {
        url: `${APP_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Christian Leadership Movement',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Christian Leadership Movement',
    description:
      'Apply to join the Christian Leadership Movement — developing Christ-centred leaders through training, mentorship, and discipleship across South Africa.',
    images: [`${APP_URL}/opengraph-image`],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0c1a63' },
    { media: '(prefers-color-scheme: dark)', color: '#080c1c' },
  ],
}

const themeScript = `
(function() {
  try {
    var p = JSON.parse(localStorage.getItem('clm-a11y') || '{}');
    var el = document.documentElement;
    if (p.theme === 'dark') el.classList.add('dark');
    else if (p.theme === 'light') el.classList.remove('dark');
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) el.classList.add('dark');
    if (p.highContrast) el.classList.add('high-contrast');
    if (p.fontScale) el.style.setProperty('--font-scale', String(p.fontScale));
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background antialiased">
        <AccessibilityProvider>{children}</AccessibilityProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
