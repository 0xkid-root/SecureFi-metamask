import { QueryClient } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import { metaMask } from "wagmi/connectors";

// Define chain keys for type safety
export type ChainKey =
  | 'electroneumMainnet'
  | 'electroneumTestnet'
  // | 'eduChainMainnet'
  // | 'eduChainTestnet'
  // | 'apothemMainnet'
  | 'apothemTestnet';

// Chain configurations with additional fields for consistency
export const electroneumMainnet = {
  id: 52014, // 0xCB2E
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
    default: { name: 'Electroneum Explorer', url: 'https://blockexplorer.electroneum.com' },
  },
  documentationUrl: 'https://developer.electroneum.com',
  iconPath: '/chains/electroneum.png',
} as const;

export const electroneumTestnet = {
  id: 5201420, // 0x4F5CCC; verify this chain ID
  name: 'Electroneum Testnet',
  nativeCurrency: {
    name: 'Electroneum',
    symbol: 'ETN',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/electroneum_testnet'] }, // Placeholder; replace with actual URL
    public: { http: ['https://rpc.ankr.com/electroneum_testnet'] },
  },
  blockExplorers: {
    default: { name: 'Electroneum Testnet Explorer', url: 'https://blockexplorer.thesecurityteam.rocks' } }, // Placeholder; replace with actual URL
  documentationUrl: 'https://developer.electroneum.com',
  iconPath: '/chains/electroneum.png', // Distinct icon
} as const;

// export const eduChainMainnet = {
//   id: 255, // 0xFF; placeholder
//   name: 'EDU Chain Mainnet',
//   nativeCurrency: {
//     name: 'EduCoin',
//     symbol: 'EDU',
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: { http: ['https://rpc.educhain-mainnet.org'] }, // Placeholder
//     public: { http: ['https://rpc.educhain-mainnet.org'] },
//   },
//   blockExplorers: {
//     default: { name: 'EDU Chain Explorer', url: 'https://explorer.educhain-mainnet.org' } }, // Placeholder
//   documentationUrl: 'https://docs.educhain.org', // Placeholder
//   iconPath: '/chains/educhain.png',
// } as const;

// export const eduChainTestnet = {
//   id: 256, // 0x100; placeholder
//   name: 'EDU Chain Testnet',
//   nativeCurrency: {
//     name: 'EduCoin',
//     symbol: 'EDU',
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: { http: ['https://rpc.educhain-testnet.org'] }, // Placeholder
//     public: { http: ['https://rpc.educhain-testnet.org'] },
//   },
//   blockExplorers: {
//     default: { name: 'EDU Chain Testnet Explorer', url: 'https://explorer.educhain-testnet.org' } }, // Placeholder
//   documentationUrl: 'https://docs.educhain.org', // Placeholder
//   iconPath: '/chains/educhain.png',
// } as const;

// export const apothemMainnet = {
//   id: 50, // 0x32; XDC Network Mainnet
//   name: 'Apothem Chain Mainnet',
//   nativeCurrency: {
//     name: 'XDC',
//     symbol: 'XDC',
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: { http: ['https://rpc.xinfin.network'] },
//     public: { http: ['https://rpc.xinfin.network'] },
//   },
//   blockExplorers: {
//     default: { name: 'XDC Explorer', url: 'https://explorer.xinfin.network' } },
//   documentationUrl: 'https://docs.xinfin.org',
//   iconPath: '/chains/apothem.png',
// } as const;

export const apothemTestnet = {
  id: 51, // 0x33; XDC Apothem Testnet
  name: 'Apothem Chain Testnet',
  nativeCurrency: {
    name: 'XDC',
    symbol: 'XDC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.apothem.network'] },
    public: { http: ['https://rpc.apothem.network'] },
  },
  blockExplorers: {
    default: { name: 'XDC Testnet Explorer', url: 'https://explorer.apothem.network' } },
  documentationUrl: 'https://docs.xinfin.org',
  iconPath: '/chains/apothem.png',
} as const;

// Centralized chain config
export const CHAIN_CONFIG = {
  electroneumMainnet,
  electroneumTestnet,
  // eduChainMainnet,
  // eduChainTestnet,
  // apothemMainnet,
  apothemTestnet,
} as const;

// Create Wagmi config
export const config = createConfig({
  chains: [
    electroneumMainnet,
    electroneumTestnet,
    // eduChainMainnet,
    // eduChainTestnet,
    // apothemMainnet,
    apothemTestnet,
  ],
  connectors: [
    metaMask(),
  ],
  transports: {
    [electroneumMainnet.id]: http(),
    [electroneumTestnet.id]: http(),
    // [eduChainMainnet.id]: http(),
    // [eduChainTestnet.id]: http(),
    // [apothemMainnet.id]: http(),
    [apothemTestnet.id]: http(),
  },
});

// Create React Query client with custom options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 2, // Retry failed queries twice
      refetchOnWindowFocus: false, // Avoid refetching on window focus
    },
  },
});