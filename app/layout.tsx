import type { Metadata } from 'next';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { initializeDatabase } from '@/lib/db/init';
import { LangProvider } from '@/lib/i18n';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-kr',
  display: 'swap',
  preload: false,
});

// Initialize DB on server startup
try {
  initializeDatabase();
} catch (e) {
  console.error('DB init error:', e);
}

export const metadata: Metadata = {
  title: {
    default: 'Quiko — 퀴코',
    template: '%s | Quiko',
  },
  description: 'Learn Korean the way Korean works. A personal Korean knowledge engine built on FSRS-5, sentence-first learning, and zero romanization.',
  keywords: ['Korean', 'TOPIK', 'language learning', 'SRS', 'FSRS', 'vocabulary', 'grammar'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansKR.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LangProvider>
            <div className="flex h-screen overflow-hidden bg-background">
              {/* Desktop Sidebar */}
              <Sidebar />

              {/* Main Content */}
              <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {children}
              </main>
            </div>

            {/* Mobile Bottom Nav */}
            <BottomNav />

            <Toaster richColors position="top-right" />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
