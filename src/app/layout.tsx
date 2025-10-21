// copywrite 2025 anysphere inc
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Code Review Adoption Tracker',
  description:
    'Track adoption of AI code review tools in active open-source repositories. Real-time data from GitHub showing which AI tools are being adopted by developers.',
  keywords: [
    'AI code review',
    'GitHub',
    'open source',
    'developer tools',
    'code analysis',
    'machine learning',
    'software development',
  ],
  authors: [
    { name: 'Nick Bradford', url: 'https://www.nsbradford.com/#person' },
  ],
  creator: 'Nick Bradford',
  publisher: 'Nick Bradford',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.aitooltracker.dev',
    title: 'AI Code Review Adoption Tracker',
    description:
      'Track adoption of AI code review tools in active open-source repositories. Real-time data from GitHub showing which AI tools are being adopted by developers.',
    siteName: 'AI Code Review Adoption Tracker',
    images: [
      {
        url: '/icons/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'AI Code Review Adoption Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Code Review Adoption Tracker',
    description:
      'Track adoption of AI code review tools in active open-source repositories. Real-time data from GitHub showing which AI tools are being adopted by developers.',
    images: ['/icons/android-chrome-512x512.png'],
    creator: '@nsbradford',
  },
  alternates: {
    canonical: 'https://www.aitooltracker.dev',
  },
  category: 'technology',
  classification: 'AI Developer Tools',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/icons/favicon.ico',
    shortcut: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
    other: [
      { rel: 'manifest', url: '/icons/site.webmanifest' },
      {
        rel: 'icon',
        url: '/icons/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/icons/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/icons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y1ZFB5L3CP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y1ZFB5L3CP');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'AI Code Review Adoption Tracker',
              description:
                'Track adoption of AI code review tools in active open-source repositories. Real-time data from GitHub showing which AI tools are being adopted by developers.',
              url: 'https://www.aitooltracker.dev',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Web',
              author: {
                '@type': 'Person',
                name: 'Nick Bradford',
                url: 'https://www.nsbradford.com/#person',
              },
              creator: {
                '@type': 'Person',
                name: 'Nick Bradford',
                url: 'https://www.nsbradford.com/#person',
              },
              publisher: {
                '@type': 'Person',
                name: 'Nick Bradford',
                url: 'https://www.nsbradford.com/#person',
              },
              dateCreated: '2024-01-01',
              dateModified: new Date().toISOString().split('T')[0],
              keywords: [
                'AI code review',
                'GitHub',
                'open source',
                'developer tools',
                'code analysis',
                'machine learning',
                'software development',
              ],
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
