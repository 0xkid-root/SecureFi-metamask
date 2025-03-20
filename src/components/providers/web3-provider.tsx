'use client';

import { createConfig, http, WagmiProvider } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Custom chain configurations for Electroneum
const electroneumMainnet = {
  id: 52014,
  name: 'Electroneum Mainnet',
  nativeCurrency: {
    name: 'Electroneum',
    symbol: 'ETN',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/electroneum'] },
    public: { http: ['https://rpc.ankr.com/electroneum'] },
  },
  blockExplorers: {
    default: { name: 'BlockExplorer', url: 'https://blockexplorer.electroneum.com' },
  },
};

const electroneumTestnet = {
  id: 5201420,
  name: 'Electroneum Testnet',
  nativeCurrency: {
    name: 'Electroneum',
    symbol: 'ETN',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/electroneum_testnet'] },
    public: { http: ['https://rpc.ankr.com/electroneum_testnet'] },
  },
  blockExplorers: {
    default: { name: 'BlockExplorer', url: 'https://blockexplorer.thesecurityteam.rocks' },
  },
};

// Configure chains and providers
const config = createConfig({
  chains: [electroneumMainnet, electroneumTestnet, mainnet, sepolia],
  transports: {
    [electroneumMainnet.id]: http(),
    [electroneumTestnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

// Create a client
const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}