import { QueryClient } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import { metaMask } from "wagmi/connectors";

// Define chain keys for type safety
export type ChainKey =
  | 'electroneumMainnet'
  | 'electroneumTestnet'
  | 'eduChainTestnet'
  | 'apothemTestnet';

// Chain configurations
export const electroneumMainnet = {
  id: 52014,
  name: 'Electroneum Mainnet',
  nativeCurrency: { name: 'Electroneum', symbol: 'ETN', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/electroneum'] },
    public: { http: ['https://rpc.ankr.com/electroneum'] },
  },
  blockExplorers: {
    default: { name: 'Electroneum Explorer', url: 'https://blockexplorer.electroneum.com' },
  },
  documentationUrl: 'https://developer.electroneum.com',
  iconPath: '/chains/electroneum.png',
} as const;

export const electroneumTestnet = {
  id: 5201420,
  name: 'Electroneum Testnet',
  nativeCurrency: { name: 'Electroneum', symbol: 'ETN', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/electroneum_testnet'] },
    public: { http: ['https://rpc.ankr.com/electroneum_testnet'] },
  },
  blockExplorers: {
    default: { name: 'Electroneum Testnet Explorer', url: 'https://blockexplorer.thesecurityteam.rocks' } },
  documentationUrl: 'https://developer.electroneum.com',
  iconPath: '/chains/electroneum.png',
} as const;

export const eduChainTestnet = {
  id: 656476, // Correct chain ID for Open Campus Codex Sepolia
  name: 'EDU Chain Testnet',
  nativeCurrency: { name: 'EduCoin', symbol: 'EDU', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://open-campus-codex-sepolia.drpc.org'] }, // Updated RPC URL
    public: { http: ['https://open-campus-codex-sepolia.drpc.org'] },
  },
  blockExplorers: {
    default: { name: 'EDU Chain Testnet Explorer', url: 'https://edu-chain-testnet.blockscout.com/' } },
  documentationUrl: 'https://docs.educhain.org',
  iconPath: '/chains/educhain.png',
} as const;

export const apothemTestnet = {
  id: 51,
  name: 'Apothem Chain Testnet',
  nativeCurrency: { name: 'XDC', symbol: 'XDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.apothem.network'] },
    public: { http: ['https://rpc.apothem.network'] },
  },
  blockExplorers: {
    default: { name: 'XDC Testnet Explorer', url: 'https://explorer.apothem.network' } },
  documentationUrl: 'https://docs.xinfin.org',
  iconPath: '/chains/apothem.png',
} as const;

export const CHAIN_CONFIG = {
  electroneumMainnet,
  electroneumTestnet,
  eduChainTestnet,
  apothemTestnet,
} as const;

export const config = createConfig({
  chains: [
    electroneumMainnet,
    electroneumTestnet,
    eduChainTestnet,
    apothemTestnet,
  ],
  connectors: [
    metaMask(),
  ],
  transports: {
    [electroneumMainnet.id]: http(),
    [electroneumTestnet.id]: http(),
    [eduChainTestnet.id]: http(),
    [apothemTestnet.id]: http(),
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});