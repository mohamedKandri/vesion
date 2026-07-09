import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'VESION — Software Engineering Company',
    template: '%s · VESION',
  },
  description:
    'VESION designs and builds premium websites, web & mobile applications, AI solutions, and cloud infrastructure for companies that expect excellence.',
  keywords: [
    'software development',
    'web applications',
    'mobile apps',
    'AI solutions',
    'cloud',
    'UI/UX design',
    'cybersecurity',
  ],
  openGraph: {
    type: 'website',
    siteName: 'VESION',
    title: 'VESION — Software Engineering Company',
    description:
      'Premium software engineering: websites, web & mobile apps, AI, cloud, and security consulting.',
    url: APP_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VESION — Software Engineering Company',
    description:
      'Premium software engineering: websites, web & mobile apps, AI, cloud, and security consulting.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a12' },
    { media: '(prefers-color-scheme: light)', color: '#fafafc' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
