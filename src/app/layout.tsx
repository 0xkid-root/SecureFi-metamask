// // src/app/layout.tsx
import '@/app/globals.css';
import { WagmiProvider } from '@/components/providers/WagmiProvider';
import LayoutContent from '@/components/Navbar';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-[#0A0B0D] text-white min-h-screen">
        <WagmiProvider>
          <LayoutContent>{children}</LayoutContent>
        </WagmiProvider>
      </body>
    </html>
  );
}