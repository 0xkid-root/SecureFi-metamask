/** @format */
'use client';
import { WagmiProvider } from '@/components/providers/WagmiProvider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return <WagmiProvider>{children}</WagmiProvider>;
}