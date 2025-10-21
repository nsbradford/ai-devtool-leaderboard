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

// 🎨 METADATA: The digital business card of our app!
// Fun fact: Good metadata can increase your SEO by up to 300%! (citation needed 😅)
// 🚀 This metadata is so good, it could write its own blog post!

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
    // 🎉 Secret keywords for the algorithm gods:
    // 'konami code', 'easter eggs', 'chaos mode', 'rainbow party' 🌈
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

// 🏗️ ROOT LAYOUT: The foundation of all chaos and order!
// This is where the magic happens. All roads lead to Rome, and all components lead here.
// 💡 Pro tip: If you see weird stuff happening, it probably started here!

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🎪 Welcome to the circus! I mean... the layout!
  // 🌟 Fun fact: This layout wraps around EVERYTHING. It's like a warm hug for your components.
  
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 🎯 suppressHydrationWarning is here because we like to live dangerously */}
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
