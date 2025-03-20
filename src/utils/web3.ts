import { ethers } from 'ethers';

type EthereumEvent = 
  | { type: 'accountsChanged'; value: string[] }
  | { type: 'chainChanged'; value: string }
  | { type: 'connect'; value: { chainId: string } }
  | { type: 'disconnect'; value: { code: number; message: string } };

type EthereumEventListener<T extends EthereumEvent['type']> = (
  ...args: Extract<EthereumEvent, { type: T }>['value'] extends never
    ? []
    : [Extract<EthereumEvent, { type: T }>['value']]
) => void;

interface EthereumProvider extends ethers.Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on<T extends EthereumEvent['type']>(event: T, listener: EthereumEventListener<T>): void;
  removeListener<T extends EthereumEvent['type']>(event: T, listener: EthereumEventListener<T>): void;
}

interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

interface ChainConfig {
  chainId: string; // Keep as hex string for EIP-1193 compatibility
  chainName: string;
  nativeCurrency: NativeCurrency;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  iconPath: string;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider | any;
  }
}

export const CHAIN_CONFIG: Record<string, ChainConfig> = {
  electroneumMainnet: {
    chainId: '0xCB2E', // 52014 in hex
    chainName: 'Electroneum Mainnet',
    nativeCurrency: { name: 'Electroneum', symbol: 'ETN', decimals: 18 },
    rpcUrls: ['https://rpc.ankr.com/electroneum'],
    blockExplorerUrls: ['https://blockexplorer.electroneum.com'],
    iconPath: '/chains/electroneum.png'
  },
  electroneumTestnet: {
    chainId: '0x4F5E0C', // 5201420 in hex
    chainName: 'Electroneum Testnet',
    nativeCurrency: { name: 'Electroneum', symbol: 'ETN', decimals: 18 },
    rpcUrls: ['https://rpc.ankr.com/electroneum_testnet'],
    blockExplorerUrls: ['https://blockexplorer.thesecurityteam.rocks'],
    iconPath: '/chains/electroneum.png'
  }
} as const;

export type ChainKey = keyof typeof CHAIN_CONFIG;

interface WalletConnection {
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  address: string;
}

interface EthereumError extends Error {
  code: number;
}

export const connectWallet = async (): Promise<WalletConnection> => {
  if (!window.ethereum) throw new Error('Please install MetaMask');
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const switchNetwork = async (chainKey: ChainKey): Promise<void> => {
  if (!window.ethereum) throw new Error('Please install MetaMask');
  const chain = CHAIN_CONFIG[chainKey];
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chain.chainId }],
    });
  } catch (error) {
    const switchError = error as EthereumError;
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: chain.chainId,
            chainName: chain.chainName,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: chain.rpcUrls,
            blockExplorerUrls: chain.blockExplorerUrls
          }],
        });
      } catch (addError) {
        console.error('Error adding chain:', addError);
        throw addError;
      }
    } else {
      console.error('Error switching chain:', switchError);
      throw switchError;
    }
  }
};

export const isSupportedNetwork = (chainId: string): boolean => {
  return Object.values(CHAIN_CONFIG).some(
    chain => chain.chainId.toLowerCase() === chainId.toLowerCase()
  );
};