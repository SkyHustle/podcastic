import { type Metadata } from 'next'
import Providers from '@/components/Providers'
import '@/styles/tailwind.css'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: {
    template: '%s - ',
    default: 'Podcastic - Control Player with Voice',
  },
  description: 'Podcasting app you could control with your voice.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-white antialiased">
      <head>
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap"
        />
      </head>
      <body className="flex min-h-full">
        <Providers>
          <div className="w-full">{children}</div>
        </Providers>
      </body>
      <Analytics />
    </html>
  )
}
