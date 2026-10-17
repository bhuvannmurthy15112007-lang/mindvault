import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DatabaseErrorModal } from '@/components/ui/DatabaseErrorModal';
import DynamicGalaxyBackground from '@/components/3d/GalaxyBackgroundWrapper';

export const metadata: Metadata = {
  title: 'MindVault | A Database-Driven Multiplayer Gaming Platform',
  description: 'Enterprise DBMS multiplayer platform featuring Prediction Arena, Detective, Escape Room, and Drawice.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-vault-dark text-gray-100 cyber-grid selection:bg-cyan-500 selection:text-black isolate">
        <DynamicGalaxyBackground />
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
            {children}
          </main>
          <Footer />
          <DatabaseErrorModal />
        </AuthProvider>
      </body>
    </html>
  );
}
