import { QueryClient } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import { metaMask } from "wagmi/connectors";

export type ChainKey =
  | 'electroneumTestnet'
  | 'eduChainTestnet'
  | 'apothemTestnet'
  | 'celoAlfajoresTestnet';

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
  id: 656476,
  name: 'EDU Chain Testnet',
  nativeCurrency: { name: 'EduCoin', symbol: 'EDU', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://open-campus-codex-sepolia.drpc.org'] },
    public: { http: ['https://open-campus-codex-sepolia.drpc.org'] },
  },
  blockExplorers: {
    default: { name: 'EDU Chain Testnet Explorer', url: 'https://edu-chain-testnet.blockscout.com/' } },
  documentationUrl: 'https://docs.open-campus.xyz/',
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

export const celoAlfajoresTestnet = {
  id: 44787,
  name: 'Celo Alfajores Testnet',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://celo-alfajores.drpc.org'] },
    public: { http: ['https://celo-alfajores.drpc.org'] },
  },
  blockExplorers: {
    default: { name: 'Celo Alfajores Explorer', url: 'https://alfajores.celoscan.io/' } },
  documentationUrl: 'https://docs.celo.org',
  iconPath: '/chains/celo.png',
} as const;

export const CHAIN_CONFIG = {
  electroneumTestnet,
  eduChainTestnet,
  apothemTestnet,
  celoAlfajoresTestnet,
} as const;

export const config = createConfig({
  chains: [
    electroneumTestnet,
    eduChainTestnet,
    apothemTestnet,
    celoAlfajoresTestnet,
  ],
  connectors: [
    metaMask(),
  ],
  transports: {
    [electroneumTestnet.id]: http(),
    [eduChainTestnet.id]: http(),
    [apothemTestnet.id]: http(),
    [celoAlfajoresTestnet.id]: http(),
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