'use client';
import React, { useEffect, useState } from 'react';
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
import { CHAIN_CONFIG, ChainKey } from '@/utils/web3-config';
import { handleAskQuestion } from '@/utils/askQuestionHandler';
// import { handleSearchWithMistral } from '@/utils/searchHandler';

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
    chain: 'eduChainTestnet',
  },
  {
    contractHash: '0x456...def',
    stars: 4,
    summary: 'Minor optimizations suggested. Overall secure implementation.',
    auditor: '0xDEf...456',
    timestamp: 1703030400,
    chain: 'celoAlfajoresTestnet',
  },
  {
    contractHash: '0x789...ghi',
    stars: 5,
    summary: 'Excellent implementation with robust security measures.',
    auditor: '0xGHi...789',
    timestamp: 1702944000,
    chain: 'apothemTestnet',
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

const cookbookQuestions = [
  {
    question: 'How do I deploy ERC-20 token on Linea?',
    icon: CloudArrowUp,
  },
  {
    question: 'What does the Solmate ERC4626 contract do?',
    icon: File,
  },
  {
    question: 'What are the features of the Uniswap protocol?',
    icon: Lightning,
  },
];

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState('');

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
      {/* Ask AI Assistant Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-800/20 rounded-full filter blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block mb-3 px-4 py-1 rounded-full bg-purple-900/50 border border-purple-800">
              <span className="text-purple-400 text-sm font-semibold">ProofChain</span>
            </div>
          </motion.div>

          <div className="flex flex-col items-center gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full max-w-2xl text-center"
            >
              <h3 className="text-3xl sm:text-4xl font-mono font-bold mb-6 text-white">
                Audit, Build, and Test Smart Contracts<br />
                with <span className="text-purple-400">ProofChain</span>
              </h3>
              <p className="text-gray-100 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                Use ProofChain’s AI-driven tools to audit, build, and test your smart contracts with precision, ensuring security and efficiency across any blockchain.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gray-900/90 backdrop-blur-md rounded-lg p-6 border border-purple-700 shadow-2xl shadow-purple-600/30 w-full max-w-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-purple-400">Ask AI Assistant</span>
                </h3>
                <button
                  onClick={() => setAnswer('')}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  Clear Chat
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {!answer && !isLoading && (
                  <div className="bg-purple-950/50 p-4 rounded-lg">
                    <p className="text-gray-200">
                      Ask me anything about the ProofChain!
                    </p>
                  </div>
                )}

                {isLoading && !searchResults && (
                  <div className="bg-purple-950/50 p-4 rounded-lg flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-purple-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p className="text-gray-200">Thinking...</p>
                  </div>
                )}

                {answer && !isLoading && (
                  <div className="bg-purple-950/50 p-4 rounded-lg">
                    <div
                      className="text-gray-200"
                      dangerouslySetInnerHTML={{ __html: answer }}
                    />
                    <div className="flex gap-2 mt-2">
                      <button className="text-gray-400 hover:text-gray-200">👍</button>
                      <button className="text-gray-400 hover:text-gray-200">👎</button>
                    </div>
                  </div>
                )}

                <div className="w-full">
                  <div className="grid grid-cols-1 gap-3">
                    {cookbookQuestions.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setQuestion(item.question)}
                        className="hover-gradient-effect bg-gray-800/50 hover:bg-gray-700/50 text-left p-2 rounded-lg transition-all duration-200 border border-purple-700 hover:border-purple-600 shadow-lg shadow-purple-600/20"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon
                            size={20}
                            className="text-purple-400"
                            weight="duotone"
                          />
                          <h4 className="text-gray-200 text-sm font-semibold">{item.question}</h4>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 relative">
                <input
                  type="text"
                  placeholder="Ask anything about ProofChain"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion(question, setIsLoading, setAnswer, setQuestion)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-purple-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  onClick={() => handleAskQuestion(question, setIsLoading, setAnswer, setQuestion)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300"
                >
                  <ArrowRight size={20} weight="bold" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-black to-purple-900/40" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-15" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-950/30 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-800/30 rounded-full filter blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/chains/educhain.png"
                  alt="Blockchain"
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span className="text-purple-400 text-sm font-semibold">Built for Web3</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold mb-6 text-white leading-tight">
                Secure Smart Contracts<br />
                with <span className="text-purple-400">AI-Powered Insights</span>
              </h1>
              <p className="text-gray-100 text-lg sm:text-xl mb-8 max-w-xl leading-relaxed">
                Leverage advanced AI-driven analysis, detailed documentation, and on-chain verification to safeguard your smart contracts across any blockchain network.
              </p>
              <div className="flex gap-4">
                <Link href="/audit">
                  <button className="hover-gradient-effect px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg shadow-purple-600/40">
                    Start Audit <ArrowRight weight="bold" />
                  </button>
                </Link>
                <Link href="/reports">
                  <button className="hover-gradient-effect px-6 py-3 bg-transparent hover:bg-purple-900/60 text-white border border-purple-500 hover:border-purple-400 rounded-lg transition-all duration-300 flex items-center gap-2">
                    View Reports <FileText weight="bold" />
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-black rounded-lg" />
              <div className="relative bg-gray-900/80 backdrop-blur-md rounded-lg p-4 border border-purple-800 shadow-2xl shadow-purple-600/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <pre className="text-sm text-gray-200 font-mono whitespace-pre-wrap overflow-x-auto">
                  <code>
                    {`function tradingFunction(NormalCurve memory self)
  returns (int256 invariant)
{
  // α√τ
  uint256 stdDevSqrtTau = self.computeStdDevSqrtTau();

  // Get the bounds and check if one of the reserves has reached the bounds.
  (uint256 upperBoundX, uint256 lowerBoundX) = self.getReserveXBounds();
  (uint256 upperBoundY, uint256 lowerBoundY) = self.getReserveYBounds();

  // Check if the reserves are within the boundary before computing its respective invariant term.
  // This is required because the invariant term will error for 0 or 1 as x approaches its bounds.
  // Taking the percent point function of 0 or 1 will result in avoid.
`}
                  </code>
                </pre>
              </div>
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

      {/* Advanced Threat Detection Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
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
              <span className="text-purple-400 text-sm font-semibold">Threat Detection</span>
            </div>
            <h2 className="text-4xl font-bold font-mono mb-4 text-white">
              Uncover Threats with <span className="text-purple-400">AI-Powered Precision</span>
            </h2>
            <p className="text-purple-300 text-lg max-w-2xl mx-auto">
              Identify vulnerabilities in your smart contracts with advanced AI analysis, detailed insights, and real-time metrics.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative bg-gray-900/90 backdrop-blur-md rounded-lg p-6 border border-purple-700 shadow-2xl shadow-purple-600/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-purple-400 text-sm font-semibold">Finding Vulnerabilities</span>
              </div>
              <pre className="text-sm text-gray-200 font-mono whitespace-pre-wrap overflow-x-auto">
                <code>
                  {`contract VulnerableContract {
  mapping(address => uint256) public userBalances;

  function withdrawBalance() public {
    uint256 amountToWithdraw = userBalances[msg.sender];
    require(amountToWithdraw > 0, "Insufficient balance");

    userBalances[msg.sender] = 0;
    (bool success, ) = msg.sender.call{value: amountToWithdraw}("");
    require(success, "Transfer failed");
  }

  function deposit() public payable {
    userBalances[msg.sender] += msg.value;
  }
}`}
                </code>
              </pre>
              <div className="absolute top-20 left-4 w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
              <div className="absolute top-28 left-4 w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
            </motion.div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gray-900/90 backdrop-blur-md rounded-lg p-6 border border-purple-700 shadow-2xl shadow-purple-600/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Reentrancy Threat</h3>
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full">High Severity</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-purple-400 font-semibold">What is it</h4>
                    <p className="text-gray-200">
                      A reentrancy attack occurs when a function makes an external call to another contract before updating its state, allowing the called contract to re-enter the function and manipulate the state.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-purple-400 font-semibold">Why it matters</h4>
                    <p className="text-gray-200">
                      Reentrancy can lead to unauthorized withdrawals, as seen in the DAO hack. In this contract, the `withdrawBalance` function is vulnerable because it sends funds before updating the balance.
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-900/90 backdrop-blur-md rounded-lg p-4 border border-purple-700 shadow-2xl shadow-purple-600/30 text-center"
                >
                  <h4 className="text-purple-400 font-semibold mb-2">Simulations/Second</h4>
                  <p className="text-2xl font-bold text-white">169,230</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-900/90 backdrop-blur-md rounded-lg p-4 border border-purple-700 shadow-2xl shadow-purple-600/30 text-center"
                >
                  <h4 className="text-purple-400 font-semibold mb-2">Total Simulations</h4>
                  <p className="text-2xl font-bold text-white">23,169,206</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="bg-gray-900/90 backdrop-blur-md rounded-lg p-4 border border-purple-700 shadow-2xl shadow-purple-600/30 text-center"
                >
                  <h4 className="text-purple-400 font-semibold mb-2">Total Coverage</h4>
                  <p className="text-2xl font-bold text-white">42.92%</p>
                </motion.div>
              </div>
            </div>
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
              <span className="text-purple-400">Multi-Network</span> Integration
            </h2>
            <p className="text-purple-300 text-lg max-w-2xl mx-auto">
              Optimized for multiple blockchain ecosystems with native token support
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-6">
            {Object.keys(CHAIN_CONFIG).map((chain, index) => {
              const chainConfig = CHAIN_CONFIG[chain as ChainKey];
              return (
                <motion.div
                  key={chain}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  className="hover-gradient-effect flex items-center space-x-6 bg-purple-950/30 backdrop-blur-sm rounded-xl p-6 border border-purple-900 hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/20 w-full sm:w-[calc(50%-12px)]"
                >
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-purple-900/30 rounded-full filter blur-md" />
                    <Image
                      src={chainConfig.iconPath}
                      alt={chainConfig.name}
                      width={60}
                      height={60}
                      className="rounded-full relative z-10 ring-2 ring-purple-600 p-1"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mb-1 text-white">{chainConfig.name}</h3>
                    <p className="text-purple-300">
                      Native Token:{" "}
                      <span className="text-purple-400 font-semibold">
                        {chainConfig.nativeCurrency.symbol}
                      </span>
                    </p>
                    <div className="flex items-center mt-3 space-x-4">
                      <a
                        href={chainConfig.blockExplorers.default.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                      >
                        <FileSearch size={16} />
                        <span>Block Explorer</span>
                      </a>
                      <a
                        href={chainConfig.documentationUrl}
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
              );
            })}
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
                            {CHAIN_CONFIG[audit.chain as ChainKey] ? (
                              <Image
                                src={CHAIN_CONFIG[audit.chain as ChainKey].iconPath}
                                alt={CHAIN_CONFIG[audit.chain as ChainKey].name}
                                width={20}
                                height={20}
                                className="rounded-full relative z-10"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-purple-900 text-white flex items-center justify-center text-xs">
                                ?
                              </div>
                            )}
                          </div>
                          <span className="text-purple-300 text-sm">
                            {CHAIN_CONFIG[audit.chain as ChainKey]?.name || 'Unknown Chain'}
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
                  <button className="hover-gradient-effect px-8 py-4 bg-transparent hover:bg-purple-900/60 text-white border border-purple-500 hover:border-purple-400 rounded-lg transition-all duration-200 flex items-center gap-2">
                    Read Documentation <FileText weight="bold" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}