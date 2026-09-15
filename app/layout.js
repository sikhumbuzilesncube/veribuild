import './globals.css';
import { Inter } from 'next/font/google';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://veribuild.gatekeeper.co.zw'),
  title: {
    default: 'VeriBuild — Professional BOQs from floor plans in 3 minutes',
    template: '%s · VeriBuild',
  },
  description:
    'Upload your floor plan and get a professional BOQ in 3 minutes — with real material prices from Zimbabwean hardware stores and labour cost estimates.',
  applicationName: 'VeriBuild',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VeriBuild',
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZW',
    url: 'https://veribuild.gatekeeper.co.zw',
    siteName: 'VeriBuild',
    title: 'VeriBuild — Professional BOQs from floor plans in 3 minutes',
    description:
      'Real material prices from Zimbabwean hardware stores, plus labour cost estimates. Built for Zimbabwe.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VeriBuild — BOQ generation for Zimbabwe',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VeriBuild — Professional BOQs from floor plans',
    description:
      'Real material prices from Zimbabwean hardware stores, plus labour cost estimates.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F47B20',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
    }
