import type { Metadata, Viewport } from 'next';
import { DM_Mono } from 'next/font/google';
import { ServiceWorkerRegister } from '../components/ServiceWorkerRegister';
import './globals.css';

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: 'Passagens Citadas',
  description: 'Detecta passagens bíblicas citadas durante a pregação',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Passagens',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // evita zoom acidental no celular durante o culto
  themeColor: '#0f0f14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={dmMono.variable}>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
