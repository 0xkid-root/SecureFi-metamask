/** @format */
// No 'use client' directive - this is a Server Component
import '@/app/globals.css';
import ClientProviders from '@/components/ClientProviders'; // New Client Component
import LayoutContent from '@/components/Navbar';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-[#0A0B0D] text-white min-h-screen">
        <ClientProviders>
          <LayoutContent>{children}</LayoutContent>
        </ClientProviders>
      </body>
    </html>
  );
}