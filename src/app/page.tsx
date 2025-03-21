'use client';
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
  Shield,
  ArrowRight,
  Star,
  Code,
  Lightning,
  FileSearch,
  FileText,
  TestTube,
  Eye,
  CloudArrowUp,
  Brain,
  File,
  Flask,
  Archive,
  CheckCircle,
} from 'phosphor-react';
import Image from 'next/image';
import Link from 'next/link';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Chain configuration (extended with more cryptocurrencies)
const CHAIN_CONFIG = {
  electroneumMainnet: {
    chainId: '0xCB2E',
    chainName: 'Electroneum Mainnet',
    nativeCurrency: {
      name: 'Electroneum',
      symbol: 'ETN',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.ankr.com/electroneum'],
    blockExplorerUrls: ['https://blockexplorer.electroneum.com'],
    iconPath: '/chains/electroneum.png',
  },
  ethereumMainnet: {
    chainName: 'Ethereum Mainnet',
    iconPath: '/chains/ethereum.png',
  },
  bitcoinMainnet: {
    chainName: 'Bitcoin Mainnet',
    iconPath: '/chains/bitcoin.png',
  },
  binanceSmartChain: {
    chainName: 'Binance Smart Chain',
    iconPath: '/chains/binance.png',
  },
  polygonMainnet: {
    chainName: 'Polygon Mainnet',
    iconPath: '/chains/polygon.png',
  },
  cardanoMainnet: {
    chainName: 'Cardano Mainnet',
    iconPath: '/chains/cardano.png',
  },
  solanaMainnet: {
    chainName: 'Solana Mainnet',
    iconPath: '/chains/solana.png',
  },
};

// Features, recentAudits, and steps remain unchanged
const features = [
  {
    icon: Shield,
    title: 'AI-Powered Audit',
    description: 'Leverage AI-driven smart contract security analysis for comprehensive risk detection.',
    category: 'Security',
  },
  {
    icon: Lightning,
    title: 'Multi-Chain Compatibility',
    description: 'Audit smart contracts across multiple blockchain networks, ensuring wide-ranging security.',
    category: 'Blockchain',
  },
  {
    icon: Code,
    title: 'On-Chain Verification',
    description: 'Ensure transparency by storing all audit reports immutably on the blockchain.',
    category: 'Transparency',
  },
  {
    icon: FileText,
    title: 'Automated Documentation',
    description: 'Generate AI-powered, detailed documentation for Solidity smart contracts effortlessly.',
    category: 'Efficiency',
  },
  {
    icon: TestTube,
    title: 'Comprehensive Test Suite',
    description: 'Automate test case generation using multi-framework support for robust contract validation.',
    category: 'Testing',
  },
  {
    icon: Eye,
    title: 'Real-Time Threat Monitoring',
    description: 'Continuously monitor deployed contracts for vulnerabilities and security threats.',
    category: 'Monitoring',
  },
];

const recentAudits = [
  {
    contractHash: '0x123...abc',
    stars: 5,
    summary: 'No critical vulnerabilities found. Code follows best practices.',
    auditor: '0xABc...123',
    timestamp: 1703116800,
    chain: 'electroneumMainnet',
  },
  {
    contractHash: '0x456...def',
    stars: 4,
    summary: 'Minor optimizations suggested. Overall secure implementation.',
    auditor: '0xDEf...456',
    timestamp: 1703030400,
    chain: 'electroneumMainnet',
  },
  {
    contractHash: '0x789...ghi',
    stars: 5,
    summary: 'Excellent implementation with robust security measures.',
    auditor: '0xGHi...789',
    timestamp: 1702944000,
    chain: 'electroneumMainnet',
  },
];

const steps = [
  {
    icon: CloudArrowUp,
    title: 'Submit Your Contract',
    description: 'Upload or paste your Solidity smart contract code for security auditing.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Our advanced AI scans your code for vulnerabilities and security risks.',
  },
  {
    icon: File,
    title: 'Automated Documentation',
    description: 'Instantly generate detailed documentation for your smart contract.',
  },
  {
    icon: Flask,
    title: 'Comprehensive Testing',
    description: 'Automatically create a test suite following industry best practices.',
  },
  {
    icon: Archive,
    title: 'Immutable Audit Report',
    description: 'Store your audit report permanently on the blockchain for transparency.',
  },
  {
    icon: CheckCircle,
    title: 'Final Verification',
    description: 'Get your smart contract verified and ready for secure deployment.',
  },
];

// Define the cryptocurrencies for the 3D orbiting animation
const orbitingChains = [
  { chain: 'bitcoinMainnet', orbitRadius: 5, speed: 0.02, inclination: Math.PI / 4 },
  { chain: 'binanceSmartChain', orbitRadius: 6, speed: 0.015, inclination: Math.PI / 3 },
  { chain: 'polygonMainnet', orbitRadius: 7, speed: 0.01, inclination: Math.PI / 6 },
  { chain: 'electroneumMainnet', orbitRadius: 8, speed: 0.008, inclination: Math.PI / 5 },
  { chain: 'cardanoMainnet', orbitRadius: 9, speed: 0.006, inclination: Math.PI / 8 },
  { chain: 'solanaMainnet', orbitRadius: 10, speed: 0.004, inclination: Math.PI / 10 },
];

// 3D Cryptocurrency Sphere Component
const CryptoSphere = ({ chain, orbitRadius, speed, inclination }: { chain: string; orbitRadius: number; speed: number; inclination: number }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = React.useState(false);
  const texture = useTexture(CHAIN_CONFIG[chain as keyof typeof CHAIN_CONFIG].iconPath);

  useFrame((state) => {
    if (!hovered && meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.position.x = orbitRadius * Math.cos(time * speed);
      meshRef.current.position.z = orbitRadius * Math.sin(time * speed);
      meshRef.current.position.y = orbitRadius * Math.sin(time * speed) * Math.sin(inclination);
      meshRef.current.rotation.y += 0.01; // Rotate the sphere for a spinning effect
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.5 : 1}
    >
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial map={texture} emissive={hovered ? new THREE.Color(0x800080) : new THREE.Color(0x000000)} emissiveIntensity={hovered ? 1 : 0} />
    </mesh>
  );
};

// 3D Scene Component
const CryptoScene = () => {
  const centerMeshRef = useRef<THREE.Mesh>(null!);
  const texture = useTexture(CHAIN_CONFIG.ethereumMainnet.iconPath);

  useFrame(() => {
    if (centerMeshRef.current) {
      centerMeshRef.current.rotation.y += 0.005; // Rotate the central Ethereum sphere
    }
  });

  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
      <pointLight position={[0, 0, 0]} intensity={1} color={0x800080} />
      <ambientLight intensity={0.3} />

      {/* Ethereum at the Center */}
      <mesh ref={centerMeshRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial map={texture} emissive={0x800080} emissiveIntensity={0.5} />
      </mesh>

      {/* Orbiting Cryptocurrencies */}
      {orbitingChains.map((chain, index) => (
        <CryptoSphere
          key={index}
          chain={chain.chain}
          orbitRadius={chain.orbitRadius}
          speed={chain.speed}
          inclination={chain.inclination}
        />
      ))}
    </>
  );
};

export default function Home() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
    });

    const handleMouseMove = (e: MouseEvent) => {
      const elements = document.getElementsByClassName('hover-gradient-effect');
      Array.from(elements).forEach((element) => {
        const htmlElement = element as HTMLElement;
        const rect = htmlElement.getBoundingClientRect();
        htmlElement.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        htmlElement.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-purple-800/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-7xl font-mono font-bold mb-6 text-white">
                NEXT-GEN<br /> SMART CONTRACT<br />
                <span className="text-purple-400">SECURITY</span>
              </h1>
              <p className="text-purple-300 text-lg mb-8 max-w-xl">
                Safeguard your smart contracts with advanced AI-powered analysis, detailed documentation, and robust on-chain verification. Engineered for cross-chain excellence across leading networks like Electroneum, Ethereum, Binance Smart Chain, Polygon, and more.
              </p>
              <div className="flex gap-4">
                <Link href="/audit">
                  <button className="hover-gradient-effect px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 flex items-center gap-2">
                    Start Audit <ArrowRight weight="bold" />
                  </button>
                </Link>
                <Link href="/reports">
                  <button className="hover-gradient-effect px-6 py-3 bg-black hover:bg-purple-900/50 text-white border border-purple-800 rounded-lg transition-all duration-200">
                    View Reports
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-black rounded-lg" />
              <Image
                src="/screenshot.png"
                alt="AuditFi Interface"
                width={600}
                height={400}
                className="rounded-lg shadow-2xl border border-purple-900"
                priority={true}
                layout="responsive"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-3 px-4 py-1 rounded-full bg-purple-900/50 border border-purple-800">
              <span className="text-purple-400 text-sm font-semibold">Simple Process</span>
            </div>
            <h2 className="text-4xl font-bold font-mono mb-4 text-white">
              How It <span className="text-purple-400">Works</span>
            </h2>
            <p className="text-purple-300 text-lg max-w-2xl mx-auto">
              Secure your smart contracts with our streamlined six-step process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="relative hover-gradient-effect bg-purple-950/30 backdrop-blur-sm rounded-xl p-6 border border-purple-900 hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/20"
              >
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg shadow-purple-600/30">
                  {index + 1}
                </div>
                <step.icon size={36} className="text-purple-400 mb-4" weight="duotone" />
                <h3 className="text-xl font-semibold mb-2 text-white">{step.title}</h3>
                <p className="text-purple-300">{step.description}</p>
                {index < 5 && (
                  <ArrowRight
                    className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-purple-400"
                    size={24}
                    weight="bold"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-800/20 rounded-full filter blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-3 px-4 py-1 rounded-full bg-purple-900/50 border border-purple-800">
              <span className="text-purple-400 text-sm font-semibold">Cutting-edge Solutions</span>
            </div>
            <h2 className="text-4xl font-bold font-mono mb-4 text-white">
              Powered by <span className="text-purple-400">Advanced Technology</span>
            </h2>
            <p className="text-purple-300 text-lg max-w-2xl mx-auto">
              Combining AI analysis with blockchain verification for comprehensive smart contract security
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="hover-gradient-effect bg-purple-950/30 backdrop-blur-sm rounded-xl p-6 border border-purple-900 hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/20 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <feature.icon size={36} className="text-purple-400 mb-4" weight="duotone" />
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-purple-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Network Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block mb-3 px-4 py-1 rounded-full bg-purple-900/50 border border-purple-800">
              <span className="text-purple-400 text-sm font-semibold">Network Support</span>
            </div>
            <h2 className="text-4xl font-bold font-mono mb-4 text-white">
              <span className="text-purple-400">Electroneum</span> Network Integration
            </h2>
            <p className="text-purple-300 text-lg max-w-2xl mx-auto">
              Optimized for the Electroneum Network ecosystem with native support for ETN tokens
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <motion.div
              data-aos="fade-up"
              className="hover-gradient-effect flex items-center space-x-6 bg-purple-950/30 backdrop-blur-sm rounded-xl p-8 border border-purple-900 hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/20"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-900/30 rounded-full filter blur-md" />
                <Image
                  src="/chains/electroneum.png"
                  alt="Electroneum Network"
                  width={60}
                  height={60}
                  className="rounded-full relative z-10 ring-2 ring-purple-600 p-1"
                />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1 text-white">Electroneum Network Mainnet</h3>
                <p className="text-purple-300">
                  Native Token: <span className="text-purple-400 font-semibold">ETN</span>
                </p>
                <div className="flex items-center mt-3 space-x-4">
                  <a
                    href="https://blockexplorer.electroneum.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                  >
                    <FileSearch size={16} />
                    <span>Block Explorer</span>
                  </a>
                  <a
                    href="https://developer.electroneum.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                  >
                    <Code size={16} />
                    <span>Documentation</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recent Audits */}
      <section className="py-20 relative bg-black">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black to-transparent" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <div className="inline-block mb-3 px-4 py-1 rounded-full bg-purple-900/50 border border-purple-800">
                <span className="text-purple-400 text-sm font-semibold">Verified Security</span>
              </div>
              <h2 className="text-3xl font-mono font-bold text-white">
                Recent <span className="text-purple-400">Audits</span>
              </h2>
            </div>
            <Link
              href="/reports"
              className="text-purple-400 hover:text-purple-300 mt-4 md:mt-0 transition-colors duration-200 flex items-center gap-2 border border-purple-800 px-4 py-2 rounded-lg hover:bg-purple-900/50"
            >
              View All Audits <ArrowRight weight="bold" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-purple-900 bg-black backdrop-blur-md shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-purple-950/50 text-purple-400 text-sm">
                    <th className="py-4 px-4 text-left font-mono font-normal">CONTRACT</th>
                    <th className="py-4 px-4 text-left font-mono font-normal">CHAIN</th>
                    <th className="py-4 px-4 text-left font-mono font-normal">RATING</th>
                    <th className="py-4 px-4 text-left font-mono font-normal">SUMMARY</th>
                    <th className="py-4 px-4 text-left font-mono font-normal">AUDITOR</th>
                    <th className="py-4 px-4 text-left font-mono font-normal">DATE</th>
                    <th className="py-4 px-4 w-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudits.map((audit, index) => (
                    <tr
                      key={index}
                      className="border-t border-purple-900/50 hover:bg-purple-900/20 transition-colors duration-200"
                    >
                      <td className="py-6 px-4 font-mono text-white">{audit.contractHash}</td>
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="absolute inset-0 bg-purple-900/30 rounded-full filter blur-[1px]" />
                            <Image
                              src={CHAIN_CONFIG[audit.chain as keyof typeof CHAIN_CONFIG].iconPath}
                              alt={CHAIN_CONFIG[audit.chain as keyof typeof CHAIN_CONFIG].chainName}
                              width={20}
                              height={20}
                              className="rounded-full relative z-10"
                            />
                          </div>
                          <span className="text-purple-300 text-sm">
                            {CHAIN_CONFIG[audit.chain as keyof typeof CHAIN_CONFIG].chainName}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              weight={i < audit.stars ? 'fill' : 'regular'}
                              className={i < audit.stars ? 'text-purple-400' : 'text-purple-900'}
                              size={16}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-6 px-4 text-purple-300 max-w-md">
                        <div className="truncate">{audit.summary}</div>
                      </td>
                      <td className="py-6 px-4 font-mono text-white">{audit.auditor}</td>
                      <td className="py-6 px-4 text-purple-300">
                        {new Date(audit.timestamp * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-6 px-4">
                        <Link
                          href={`/reports/${audit.contractHash}`}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-900/50 hover:bg-purple-900/70 transition-colors duration-200"
                        >
                          <ArrowRight className="w-4 h-4 text-purple-400" weight="bold" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Cryptocurrencies Section (Updated with 3D Animation) */}
      <section className="py-20 relative bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-800/20 rounded-full filter blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-3 px-4 py-1 rounded-full bg-purple-900/50 border border-purple-800">
              <span className="text-purple-400 text-sm font-semibold">Cross-Chain Support</span>
            </div>
            <h2 className="text-4xl font-bold font-mono mb-4 text-white">
              Supported <span className="text-purple-400">Cryptocurrencies</span>
            </h2>
            <p className="text-purple-300 text-lg max-w-2xl mx-auto">
              Audit smart contracts across leading blockchain networks with seamless multi-chain compatibility
            </p>
          </motion.div>

          <div className="relative h-[600px] w-full">
            <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
              <CryptoScene />
              <OrbitControls enablePan={false} enableZoom={true} minDistance={10} maxDistance={30} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute left-0 top-1/4 w-1/3 h-1/2 bg-purple-900/20 rounded-full filter blur-3xl" />
        <div className="absolute right-0 bottom-1/4 w-1/3 h-1/2 bg-purple-800/20 rounded-full filter blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="relative rounded-2xl overflow-hidden border border-purple-800 shadow-2xl shadow-purple-600/20 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20" />
            <div className="relative p-16 text-center">
              <h2 className="text-5xl font-bold font-mono mb-6 text-white">
                Ready to <span className="text-purple-400">Secure</span> Your Smart Contracts?
              </h2>
              <p className="text-purple-300 text-lg mb-10 max-w-2xl mx-auto">
                Get started with our AI-powered audit platform and ensure your protocol's security with enterprise-grade analysis tools
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/audit">
                  <button className="hover-gradient-effect px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-600/30">
                    Start Free Audit <ArrowRight weight="bold" />
                  </button>
                </Link>
                <Link href="/documentation">
                  <button className="hover-gradient-effect px-8 py-4 bg-black hover:bg-purple-900/50 text-white border border-purple-800 font-bold rounded-lg transition-all duration-200 flex items-center gap-2">
                    View Documentation <FileText weight="bold" />
                  </button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-purple-300">
                <div className="flex items-center gap-2">
                  <Shield size={18} weight="fill" className="text-purple-400" />
                  <span>100% Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lightning size={18} weight="fill" className="text-purple-400" />
                  <span>Instant Results</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={18} weight="fill" className="text-purple-400" />
                  <span>Detailed Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}