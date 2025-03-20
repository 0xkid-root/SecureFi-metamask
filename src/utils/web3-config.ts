import { QueryClient } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import { metaMask } from "wagmi/connectors";

export type ChainKey = 'electroneumMainnet' | 'electroneumTestnet';

// Chain configurations with iconPath added
export const electroneumMainnet = {
  id: 52014,
  name: 'Electroneum Mainnet',
  nativeCurrency: {
    name: 'Electroneum',
    symbol: 'ETN',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/electroneum'] },
    public: { http: ['https://rpc.ankr.com/electroneum'] }
  },
  blockExplorers: {
    default: { name: 'Electroneum Explorer', url: 'https://blockexplorer.electroneum.com' }
  },
  iconPath: '/chains/electroneum.png' // Added for ReportsPage.tsx
} as const;

export const electroneumTestnet = {
  id: 5201420,
  name: 'Electroneum Testnet',
  nativeCurrency: {
    name: 'Electroneum',
    symbol: 'ETN',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/electroneum_testnet'] },
    public: { http: ['https://rpc.ankr.com/electroneum_testnet'] }
  },
  blockExplorers: {
    default: { name: 'Electroneum Testnet Explorer', url: 'https://blockexplorer.thesecurityteam.rocks' }
  },
  iconPath: '/chains/electroneum.png' // Added for ReportsPage.tsx
} as const;

export const CHAIN_CONFIG = {
  electroneumMainnet: electroneumMainnet,
  electroneumTestnet: electroneumTestnet
} as const;

// Create Wagmi config
export const config = createConfig({
  chains: [electroneumMainnet, electroneumTestnet],
  connectors: [metaMask()],
  transports: {
    [electroneumMainnet.id]: http(),
    [electroneumTestnet.id]: http()
  }
});

// Create React Query client
export const queryClient = new QueryClient();