// ContractBuilder.tsx
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { parseEther } from 'viem';
import {
  FileCode,
  Robot,
  CircleNotch,
  Copy,
  Check,
  Rocket,
  Link,
  Code,
  Lightning,
  Shield,
  ArrowRight
} from 'phosphor-react';
import { useAccount, useConnect, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_TEMPLATES, ContractTemplate } from './templates';
import { CHAIN_CONFIG } from '@/utils/web3';
import React from 'react';

const mistralClient = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY!
});

const ContractSchema = z.object({
  code: z.string(),
  features: z.array(z.string()),
  securityNotes: z.array(z.string())
});

export default function ContractBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [customFeatures, setCustomFeatures] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractParams, setContractParams] = useState<Record<string, string>>({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentChain, setCurrentChain] = useState<keyof typeof CHAIN_CONFIG | null>(null);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [securityNotes, setSecurityNotes] = useState<string[]>([]);
  const [manualCode, setManualCode] = useState('');
  const displayedCode = generatedCode || manualCode;

  const handleManualCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualCode(e.target.value);
    setGeneratedCode('');
  };

  const { chain, address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    setWalletConnected(isConnected);
    if (chain) {
      const chainConfig = Object.entries(CHAIN_CONFIG).find(
        ([_, config]) => config.chainId.toLowerCase() === chain.id.toString(16).toLowerCase()
      );
      if (chainConfig) {
        setCurrentChain(chainConfig[0] as keyof typeof CHAIN_CONFIG);
      }
    }
  }, [isConnected, chain]);

  useEffect(() => {
    if (selectedTemplate?.defaultParams) {
      setContractParams(selectedTemplate.defaultParams);
      setGeneratedCode(selectedTemplate.baseCode);
    } else {
      setContractParams({});
      setGeneratedCode('');
    }
  }, [selectedTemplate]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const generateContract = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await mistralClient.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: `You are an expert Solidity developer. Generate a secure and optimized smart contract based on these requirements:

        Important Rules:
        1. Use Solidity version 0.8.19
        2. DO NOT use ANY external imports or libraries
        3. Include all necessary functionality directly in the contract
        4. Add proper access control and safety checks
        5. Include events for all state changes
        6. Implement comprehensive security measures
        7. Add gas optimizations
        8. Return response in exact JSON format
        
        Security Considerations:
        - Include reentrancy guards where needed
        - Add proper access control
        - Implement input validation
        - Add checks for integer overflow
        - Validate addresses
        - Include event emissions
        - Handle edge cases`
          },
          {
            role: "user",
            content: `Generate a contract with these specifications:
        Template: ${selectedTemplate.name}
        Base Code: ${selectedTemplate.baseCode || 'Create new contract'}
        Custom Features: ${customFeatures || 'Standard features'}
        Parameters: ${JSON.stringify(contractParams)}
        
        Return in this exact format:
        {
          "code": "complete solidity code",
          "features": ["list of implemented features"],
          "securityNotes": ["list of security measures implemented"]
        }`
          }
        ],
        responseFormat: { type: "json_object" },
        temperature: 0.1,
        maxTokens: 4096
      });

      const responseText = response.choices?.[0]?.message?.content || '';
      const parsedResponse = JSON.parse(typeof responseText === 'string' ? responseText : '');
      const validatedResponse = ContractSchema.parse(parsedResponse);

      setGeneratedCode(validatedResponse.code);
      setSecurityNotes(validatedResponse.securityNotes);
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Failed to generate contract. Please try again.');
      if (selectedTemplate.baseCode) {
        setGeneratedCode(selectedTemplate.baseCode);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const deployContract = async () => {
    if (!displayedCode || !isConnected) return;

    setIsDeploying(true);
    setDeploymentError(null);

    try {
      if (!chain || (chain.id.toString(16) !== CHAIN_CONFIG.electroneumMainnet.chainId && 
          chain.id.toString(16) !== CHAIN_CONFIG.electroneumTestnet.chainId)) {
        throw new Error('Please switch to Electroneum Network (Mainnet or Testnet) to deploy contracts');
      }

      const response = await fetch('/api/compile-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode: displayedCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorDetails = errorData.details || (await response.text());
        throw new Error(`Compilation failed: ${errorDetails}`);
      }

      const { abi, bytecode } = await response.json();
      const constructorAbi = abi.find((item: any) => item.type === 'constructor');
      const constructorArgs = Object.values(contractParams).map((value, index) => {
        const input = constructorAbi?.inputs?.[index];
        if (!input) return value;
        switch (input.type) {
          case 'uint256':
            return parseEther(value.toString());
          case 'address':
            return value;
          default:
            return value;
        }
      });

      writeContract({        
        address: address!,
        abi,
        args: constructorArgs,
        functionName: 'constructor',
      });

    } catch (error: any) {
      console.error('Deployment failed:', error);
      setDeploymentError(error.message || 'Deployment failed');
      setIsDeploying(false);
    }
  };

  useEffect(() => {
    if (hash && isConfirmed) {
      setDeployedAddress(hash);
      setIsDeploying(false);
    }
  }, [hash, isConfirmed]);

  const getExplorerUrl = () => {
    if (!currentChain || !deployedAddress) return null;
    const baseUrl = CHAIN_CONFIG[currentChain].blockExplorerUrls[0];
    return `${baseUrl}/address/${deployedAddress}`;
  };

  const handleConnectWallet = () => {
    try {
      connect({ connector: connectors[0] });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-black text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <div className="inline-block mb-3 px-4 py-1 rounded-full bg-purple-600/20 border border-purple-600/30">
            <span className="text-purple-400 text-sm font-semibold">Smart Contract Development</span>
          </div>
          <h1 className="text-3xl font-mono font-bold mb-4 text-purple-400">Smart Contract Builder</h1>
          <p className="text-purple-300">Generate and deploy secure smart contracts on Electroneum Network</p>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-2 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          {deployedAddress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-purple-600/20 border border-purple-600/30 text-purple-400 px-4 py-3 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1">Contract deployed successfully!</p>
                  <p className="text-sm font-mono">{deployedAddress}</p>
                </div>
                <a
                  href={getExplorerUrl() || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors duration-200"
                >
                  <Link size={20} weight="bold" />
                  View on Explorer
                </a>
              </div>
            </motion.div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Templates and Parameters */}
          <div className="flex flex-col space-y-4">
            <div className="bg-purple-950/30 rounded-lg border border-purple-900 hover:border-purple-600/50 transition-colors duration-300 shadow-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Robot className="text-purple-400" size={20} weight="duotone" />
                <span className="font-mono text-white">Contract Templates</span>
              </div>

              <div className="space-y-4">
                {CONTRACT_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full p-4 rounded-lg border transition-all duration-200 text-left hover:shadow-md
                      ${selectedTemplate?.name === template.name
                        ? 'border-purple-600 bg-purple-600/20 text-white shadow-purple-600/20'
                        : 'border-purple-900 hover:border-purple-600/50'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`${selectedTemplate?.name === template.name ? 'text-purple-400' : 'text-purple-300'}`}>
                        {template.icon}
                      </div>
                      <span className="font-semibold text-white">{template.name}</span>
                    </div>
                    <p className="text-xs text-purple-300 mb-2">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateContract}
              disabled={!selectedTemplate || isGenerating}
              className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 ${isGenerating || !selectedTemplate
                ? 'bg-purple-950 text-purple-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20'
                }`}
            >
              {isGenerating ? (
                <>
                  <CircleNotch className="animate-spin" size={20} weight="bold" />
                  Generating...
                </>
              ) : (
                <>
                  <Robot size={20} weight="duotone" />
                  Generate Contract
                </>
              )}
            </button>

            {selectedTemplate && (
              <div className="bg-purple-950/30 rounded-lg border border-purple-900 hover:border-purple-600/50 transition-colors duration-300 shadow-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="text-purple-400" size={20} weight="duotone" />
                  <span className="font-mono text-white">Contract Parameters</span>
                </div>

                <div className="p-6">
                  {Object.entries(contractParams).map(([key, value]) => (
                    <div key={key} className="mb-4">
                      <label className="text-sm text-purple-300 mb-1 block">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setContractParams((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="w-full bg-transparent rounded-lg border border-purple-900 p-2 text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/50 transition-all duration-200"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm text-purple-300 mb-1 block">
                      Custom Features
                    </label>
                    <textarea
                      value={customFeatures}
                      onChange={(e) => setCustomFeatures(e.target.value)}
                      placeholder="Describe additional features..."
                      className="w-full h-24 bg-transparent rounded-lg border border-purple-900 p-2 text-white resize-none focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/50 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Code Display and Deployment */}
          <div className="flex flex-col">
            <div className="flex-1 bg-purple-950/30 rounded-lg border border-purple-900 hover:border-purple-600/50 transition-colors duration-300 shadow-lg">
              <div className="p-4 border-b border-purple-900 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileCode className="text-purple-400" size={20} weight="duotone" />
                  <span className="font-mono text-white">Generated Contract</span>
                </div>
                {displayedCode && (
                  <button
                    onClick={() => copyToClipboard(displayedCode)}
                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition-colors duration-200 px-2 py-1 rounded-md hover:bg-purple-600/20"
                  >
                    {copySuccess ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
                    {copySuccess ? 'Copied!' : 'Copy Code'}
                  </button>
                )}
              </div>

              <div className="code-container">
                {displayedCode ? (
                  <>
                    <div className="line-numbers">
                      {Array.from({ length: displayedCode.split('\n').length }, (_, i) => i + 1).map(lineNumber => (
                        <span key={lineNumber} className="line-number">
                          {lineNumber}
                        </span>
                      ))}
                    </div>
                    <textarea
                      value={displayedCode}
                      onChange={handleManualCodeChange}
                      className="code-input font-mono text-sm text-white bg-transparent border-none resize-none outline-none p-4 w-full h-full absolute top-0 left-0 overflow-y-scroll custom-scrollbar"
                    />
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-purple-300">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-md"></div>
                      <Robot size={48} className="mb-4 relative z-10 text-purple-400" weight="duotone" />
                    </div>
                    <p>Select a template and generate your contract to see the code here</p>
                  </div>
                )}
              </div>
            </div>
            
            {displayedCode && (
              <div className="border-t border-purple-900 p-4 bg-purple-950/30 rounded-b-lg shadow-lg">
                {!walletConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    className="w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200 shadow-lg shadow-purple-600/20"
                  >
                    <Lightning size={20} weight="fill" />
                    Connect Wallet to Deploy
                  </button>
                ) : (
                  <div className="space-y-4">
                    {currentChain ? (
                      <div className="text-sm flex items-center gap-2 bg-purple-600/20 border border-purple-600/30 rounded-lg px-3 py-2">
                        <span className="text-purple-300">Network:</span>
                        <span className="text-purple-400 font-mono flex items-center gap-1">
                          <img 
                            src={CHAIN_CONFIG[currentChain].iconPath}
                            alt={CHAIN_CONFIG[currentChain].chainName}
                            className="w-4 h-4 rounded-full"
                          />
                          {CHAIN_CONFIG[currentChain].chainName}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-yellow-400 bg-yellow-600/20 border border-yellow-600/30 rounded-lg px-3 py-2">
                        Please connect to Electroneum Network (Mainnet or Testnet) to deploy
                      </div>
                    )}

                    <button
                      onClick={deployContract}
                      disabled={isDeploying || !currentChain || (currentChain !== 'electroneumMainnet' && currentChain !== 'electroneumTestnet')}
                      className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors duration-200
                        ${isDeploying || !currentChain || (currentChain !== 'electroneumMainnet' && currentChain !== 'electroneumTestnet')
                          ? 'bg-purple-950 text-purple-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20'
                        }`}
                    >
                      {isDeploying ? (
                        <>
                          <CircleNotch className="animate-spin" size={20} weight="bold" />
                          Deploying Contract...
                        </>
                      ) : (
                        <>
                          <Rocket size={20} weight="fill" />
                          Deploy Contract
                        </>
                      )}
                    </button>
                    
                    {deploymentError && (
                      <div className="mt-4 text-red-400 text-sm bg-red-600/20 border border-red-600/30 rounded-lg p-3">
                        {deploymentError}
                      </div>
                    )}
                    
                    {securityNotes.length > 0 && (
                      <div className="mt-4 bg-purple-600/10 border border-purple-600/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="text-purple-400" size={16} weight="fill" />
                          <h3 className="text-sm font-semibold text-purple-400">Security Notes</h3>
                        </div>
                        <ul className="text-xs text-purple-300 space-y-1">
                          {securityNotes.map((note, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <ArrowRight className="text-purple-400 mt-0.5 flex-shrink-0" size={12} />
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .code-container {
          position: relative;
          width: 100%;
          height: 600px;
        }

        .line-numbers {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          padding: 4px;
          text-align: right;
          color: #A78BFA;
          font-size: 14px;
          font-family: monospace;
          white-space: nowrap;
          overflow-y: auto;
          z-index: 1;
          background-color: #1A1523;
          border-right: 1px solid #6B46C1;
        }

        .line-number {
          display: block;
          padding: 0 8px;
        }

        .code-input {
          padding-left: 50px;
          z-index: 2;
          height: 100%;
          scrollbar-width: thin;
          scrollbar-color: rgba(107, 70, 193, 0.3) transparent;
        }

        .code-input::-webkit-scrollbar {
          width: 6px;
        }

        .code-input::-webkit-scrollbar-track {
          background: transparent;
        }

        .code-input::-webkit-scrollbar-thumb {
          background-color: rgba(107, 70, 193, 0.3);
          border-radius: 3px;
        }

        .code-input::-webkit-scrollbar-thumb:hover {
          background-color: rgba(107, 70, 193, 0.5);
        }
      `}</style>
    </div>
  );
}