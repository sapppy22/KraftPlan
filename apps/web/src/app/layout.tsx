import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'ForgeFit — AI-Powered Workout Plans',
  description: 'Discover, customize, and execute structured gym workout plans. Track your progress and crush your PRs.',
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
