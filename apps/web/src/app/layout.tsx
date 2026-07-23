import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/lib/providers';

const title = 'KraftPlan — AI-Powered Workout Plans';
const description =
  'Discover, customize, and execute structured gym workout plans. Track your progress and crush your PRs.';

export const metadata: Metadata = {
  metadataBase: new URL('https://kraftplan.pages.dev'),
  title: {
    default: title,
    template: '%s · KraftPlan',
  },
  description,
  applicationName: 'KraftPlan',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title,
    description,
    siteName: 'KraftPlan',
    images: [{ url: '/logo-kraftplan.png', width: 784, height: 1168, alt: 'KraftPlan' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/logo-kraftplan.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0F0F10',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
