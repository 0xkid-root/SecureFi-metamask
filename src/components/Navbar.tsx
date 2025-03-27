/** @format */
'use client';
import '@/app/globals.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { SignOut, List, X, CaretDown, CaretUp, Lightning, GithubLogo, TwitterLogo } from 'phosphor-react';
import Logo from '/public/chainproof.png';
import { CHAIN_CONFIG } from '@/utils/web3-config';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChainMenuOpen, setIsChainMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { chains, switchChain, isPending } = useSwitchChain();
  const currentChain = chains.find((c) => c.id === chainId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#chain-switcher')) {
        setIsChainMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleChainSwitch = async (chainId: number) => {
    if (isPending) return;
    try {
      await switchChain({ chainId });
      setIsChainMenuOpen(false);
    } catch (err) {
      console.error('Failed to switch chain:', err);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getIconPath = (chainId: number) => {
    const chainConfig = Object.values(CHAIN_CONFIG).find((chain) => chain.id === chainId);
    return chainConfig?.iconPath || '/chains/electroneum.png';
  };

  if (!isMounted) {
    return (
      <>
        <nav className="fixed w-full z-50 border-b border-purple-900/60 bg-black/90 backdrop-blur-xl shadow-md shadow-purple-900/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-[10px]"></div>
                  <Image src={Logo} alt="SecureFi Logo" width={34} height={34} className="relative z-10" />
                </div>
                <span className="text-xl font-mono font-bold text-white">ProofChain</span>
              </Link>
              <div className="hidden md:flex items-center space-x-1">
                <NavLink href="/contract-builder">Contract-builder</NavLink>
                <NavLink href="/testcase-generator">Test</NavLink>
                <NavLink href="/audit">Audit</NavLink>
                <NavLink href="/reports">Reports</NavLink>
                <NavLink href="/documentor">Documentor</NavLink>
                <NavLink href="/w3hackHub">W3HackHub</NavLink>
                <NavLink href="/profile">Profile</NavLink>
                <button className="ml-4 px-4 py-2 bg-purple-600 text-white font-bold rounded-lg flex items-center gap-2 opacity-50 cursor-not-allowed">
                  <Lightning weight="fill" className="w-4 h-4" />
                  Loading Wallet...
                </button>
              </div>
              <button className="md:hidden p-2 rounded-lg bg-purple-950/50 border border-purple-900">
                <List weight="bold" className="w-5 h-5 text-purple-400" />
              </button>
            </div>
          </div>
        </nav>
        <main className="pt-16 bg-black">{children}</main>
        <footer className="bg-black border-t border-purple-900 py-12">
          {/* Minimal footer for initial render */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div>
                <div className="flex items-center mb-4">
                  <Image src="/chainproof.png" alt="SecureFi Logo" width={32} height={32} />
                  <span className="ml-2 text-xl font-bold text-white">ProofChain</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </>
    );
  }

  return (
    <>
      <nav className="fixed w-full z-50 border-b border-purple-900/60 bg-black/90 backdrop-blur-xl shadow-md shadow-purple-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-[10px] group-hover:bg-purple-500/30 transition-all duration-300"></div>
                <Image
                  src={Logo}
                  alt="SecureFi Logo"
                  width={34}
                  height={34}
                  className="relative z-10 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-xl font-mono font-bold text-white group-hover:text-purple-400 transition-colors duration-200">
                ProofChain
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <NavLink href="/contract-builder">Contract-builder</NavLink>
              <NavLink href="/testcase-generator">Test</NavLink>
              <NavLink href="/audit">Audit</NavLink>
              <NavLink href="/reports">Reports</NavLink>
              <NavLink href="/documentor">Documentor</NavLink>
              <NavLink href="/w3hackHub">W3HackHub</NavLink>
              <NavLink href="/profile">Profile</NavLink>

              {address ? (
                <>
                  <div className="relative ml-4" id="chain-switcher">
                    <button
                      onClick={() => !isPending && setIsChainMenuOpen(!isChainMenuOpen)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                        isPending
                          ? 'bg-purple-950 cursor-not-allowed'
                          : 'bg-purple-950/50 border border-purple-900 hover:border-purple-600 hover:bg-purple-950/70'
                      } transition-all duration-200`}
                      disabled={isPending}
                    >
                      {currentChain && (
                        <div className="relative">
                          <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-[5px]"></div>
                          <Image
                            src={getIconPath(currentChain.id)}
                            alt={currentChain.name}
                            width={20}
                            height={20}
                            className="rounded-full relative z-10"
                          />
                        </div>
                      )}
                      <span className="text-sm font-medium text-purple-300">
                        {isPending ? 'Switching...' : currentChain?.name || 'Select Network'}
                      </span>
                      {isChainMenuOpen ? (
                        <CaretUp className="w-4 h-4 text-purple-400" />
                      ) : (
                        <CaretDown className="w-4 h-4 text-purple-400" />
                      )}
                    </button>

                    {isChainMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 rounded-lg bg-purple-950/90 backdrop-blur-lg border border-purple-900 shadow-lg shadow-purple-900/20 py-1 overflow-hidden"
                      >
                        {chains.map((chain) => (
                          <button
                            key={chain.id}
                            onClick={() => handleChainSwitch(chain.id)}
                            className={`flex items-center space-x-2 w-full px-4 py-2 text-sm ${
                              currentChain?.id === chain.id
                                ? 'bg-purple-600/20 text-purple-400 border-l-2 border-purple-600'
                                : 'text-purple-300 hover:bg-purple-900/70 hover:text-white'
                            } transition-all duration-200`}
                            disabled={isPending}
                          >
                            <Image
                              src={getIconPath(chain.id)}
                              alt={chain.name}
                              width={18}
                              height={18}
                              className="rounded-full"
                            />
                            <span>{chain.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  <button
                    onClick={handleDisconnect}
                    className="ml-4 flex items-center space-x-2 px-4 py-2 bg-purple-950/70 hover:bg-purple-950 border border-purple-900 hover:border-purple-600 text-white rounded-lg transition-all duration-200 group"
                  >
                    <span className="text-sm font-medium text-purple-300 group-hover:text-purple-400 transition-colors">
                      {formatAddress(address)}
                    </span>
                    <SignOut className="w-4 h-4 text-purple-400" weight="bold" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 shadow-md shadow-purple-600/20 flex items-center gap-2"
                >
                  <Lightning weight="fill" className="w-4 h-4" />
                  Connect Wallet
                </button>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-purple-950/50 hover:bg-purple-950 border border-purple-900 transition-colors duration-200"
            >
              {isOpen ? (
                <X weight="bold" className="w-5 h-5 text-purple-400" />
              ) : (
                <List weight="bold" className="w-5 h-5 text-purple-400" />
              )}
            </button>
          </div>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black/95 backdrop-blur-xl border-b border-purple-900"
          >
            <div className="px-4 pt-2 pb-3 space-y-2">
              <MobileNavLink href="/contract-builder">Contract Builder</MobileNavLink>
              <MobileNavLink href="/testcase-generator">Test Generator</MobileNavLink>
              <MobileNavLink href="/audit">Audit</MobileNavLink>
              <MobileNavLink href="/reports">Reports</MobileNavLink>
              <MobileNavLink href="/documentor">Documentor</MobileNavLink>
              <MobileNavLink href="/profile">Profile</MobileNavLink>

              {address && (
                <div className="pt-4 pb-1">
                  <p className="px-3 text-xs text-purple-500 uppercase tracking-wider font-medium">
                    Select Network
                  </p>
                  <div className="mt-2 space-y-1">
                    {chains.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => handleChainSwitch(chain.id)}
                        className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg ${
                          currentChain?.id === chain.id
                            ? 'bg-purple-600/20 text-purple-400 border-l-2 border-purple-600'
                            : 'text-purple-300 hover:bg-purple-900/80 hover:text-white'
                        } transition-all duration-200`}
                        disabled={isPending}
                      >
                        <Image
                          src={getIconPath(chain.id)}
                          alt={chain.name}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        <span>
                          {isPending && currentChain?.id === chain.id ? 'Switching...' : chain.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                {address ? (
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-purple-950/80 border border-purple-900 text-white rounded-lg hover:bg-purple-950 hover:border-purple-600 transition-all duration-200"
                  >
                    <span className="font-medium text-purple-300">{formatAddress(address)}</span>
                    <SignOut className="w-4 h-4 text-purple-400" weight="bold" />
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                  >
                    <Lightning weight="fill" className="w-5 h-5" />
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      <main className="pt-16 bg-black">{children}</main>

      <footer className="bg-black border-t border-purple-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center mb-4">
                <Image src="/chainproof.png" alt="SecureFi Logo" width={32} height={32} />
                <span className="ml-2 text-xl font-bold text-white">ProofChain</span>
              </div>
              <p className="text-purple-300 mb-4">
                Ensure the security of your smart contracts with AI-driven audits and immutable on-chain verification.
              </p>
              <div className="flex space-x-4">
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-400 transition-colors">
                  <GithubLogo size={24} />
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-400 transition-colors">
                  <TwitterLogo size={24} />
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/audit" className="text-purple-300 hover:text-purple-400 transition-colors">Start Audit</Link></li>
                <li><Link href="/reports" className="text-purple-300 hover:text-purple-400 transition-colors">Reports</Link></li>
                <li><Link href="/search" className="text-purple-300 hover:text-purple-400 transition-colors">Search</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-400 transition-colors">Documentation</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-400 transition-colors">Community</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-400 transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const NavLink = ({ href, children }: NavLinkProps) => (
  <Link href={href} className="px-3 py-2 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-all duration-200">
    {children}
  </Link>
);

function MobileNavLink({ href, children }: NavLinkProps) {
  return (
    <Link href={href} className="block px-3 py-2.5 text-purple-300 hover:text-white hover:bg-purple-600/20 rounded-lg transition-colors duration-200 border-l-2 border-transparent hover:border-purple-600">
      {children}
    </Link>
  );
}

export default LayoutContent;