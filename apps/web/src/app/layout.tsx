import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'CRM Agenti - Dashboard',
  description: 'Gestione ordini, provvigioni e documenti',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <Script id="error-logger" strategy="beforeInteractive">
          {`
            window.onerror = function(message, source, lineno, colno, error) {
              console.error('CRM-ERROR [Global]:', message, { source, lineno, colno, error });
            };
            window.onunhandledrejection = function(event) {
              console.error('CRM-ERROR [Promise]:', event.reason);
            };
          `}
        </Script>
      </head>
      <body className="antialiased">
        <Providers>{children || null}</Providers>
      </body>
    </html>
  );
}
