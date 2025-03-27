"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import {
  FileCode, Robot, CircleNotch, Copy, Check, Rocket, Link, Code,
  Lightning, Shield, ArrowRight, Lock, GasPump, Bug, Download
} from 'phosphor-react';
import { CONTRACT_TEMPLATES, ContractTemplate } from './templates';
import { CHAIN_CONFIG } from '@/utils/web3-config';
import React from 'react';
import jsPDF from 'jspdf';
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useConfig,
  useDeployContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { Abi } from 'viem';

// Initialize Mistral client
const mistralClient = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY!
});

// Enhanced response schema
const ContractSchema = z.object({
  code: z.string(),
  features: z.array(z.string()),
  securityNotes: z.array(z.string()),
  gasAnalysis: z.object({
    estimatedDeploymentCost: z.number(),
    functionCosts: z.record(z.number())
  }).optional(),
  potentialVulnerabilities: z.array(z.string()).optional()
});

// Parameter type definitions for templates
interface ParamType {
  name: string;
  type: 'string' | 'uint256' | 'address';
}

const TEMPLATE_PARAM_TYPES: Record<string, ParamType[]> = {
  'ERC20 Token': [
    { name: 'name', type: 'string' },
    { name: 'symbol', type: 'string' },
    { name: 'initialSupply', type: 'uint256' }
  ],
  'NFT Collection': [
    { name: 'name', type: 'string' },
    { name: 'symbol', type: 'string' },
    { name: 'baseURI', type: 'string' }
  ],
  'Custom Contract': []
};

export default function ContractBuilder() {
  // Core state
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [customFeatures, setCustomFeatures] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractParams, setContractParams] = useState<Record<string, string>>({});

  // Deployment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'compiling' | 'deploying'>('idle');
  const [deployedAddress, setDeployedAddress] = useState<`0x${string}` | null>(null);
  const [deploymentTxHash, setDeploymentTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);

  // Advanced analysis state
  const [securityNotes, setSecurityNotes] = useState<string[]>([]);
  const [gasAnalysis, setGasAnalysis] = useState<{ estimatedDeploymentCost: number; functionCosts: Record<string, number> } | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Hydration-safe state for wallet connection
  const [isClientConnected, setIsClientConnected] = useState<boolean | null>(null);

  const displayedCode = generatedCode || manualCode;

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { chains } = useConfig();
  const { switchChain } = useSwitchChain();
  const { 
    deployContract: deployContractWagmi, 
    data: deployTxHash, 
    isPending: isDeployingWagmi, 
    error: deployContractError 
  } = useDeployContract();
  const { data: receipt, error: receiptError } = useWaitForTransactionReceipt({
    hash: deploymentTxHash,
  });

  // Sync isClientConnected with isConnected after hydration
  useEffect(() => {
    setIsClientConnected(isConnected);
  }, [isConnected]);

  // Reset deployment-related states when the chain changes
  useEffect(() => {
    if (chain?.id) {
      console.log('Chain changed to:', chain.id, chain.name);
      setDeployedAddress(null);
      setDeploymentTxHash(undefined);
      setDeploymentError(null);
      setIsProcessing(false);
      setCurrentStep('idle');
    }
  }, [chain?.id]);

  // Memoized compile function
  const compileContract = useCallback(async () => {
    if (!displayedCode) {
      console.log('No code to compile');
      return { success: false, abi: [], bytecode: '0x' as `0x${string}` };
    }
    setCurrentStep('compiling');
    try {
      console.log('Compiling contract...');
      const compileResponse = await fetch('/api/compile-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode: displayedCode })
      });
      if (!compileResponse.ok) {
        const errorData = await compileResponse.json();
        throw new Error(errorData.error || 'Compilation failed');
      }
      const { abi, bytecode } = await compileResponse.json();
      console.log('Compilation successful:', { abi, bytecode });
      return { success: true, abi, bytecode: bytecode as `0x${string}` };
    } catch (error) {
      console.error('Compilation error:', error);
      setError(error instanceof Error ? error.message : 'Contract compilation failed');
      return { success: false, abi: [], bytecode: '0x' as `0x${string}` };
    }
  }, [displayedCode]);

  // Template selection effect
  useEffect(() => {
    if (selectedTemplate?.defaultParams) {
      setContractParams(selectedTemplate.defaultParams);
      setGeneratedCode(selectedTemplate.baseCode);
    }
  }, [selectedTemplate]);

  // Update deploymentTxHash when deployTxHash changes
  useEffect(() => {
    if (deployTxHash) {
      console.log('Transaction submitted, waiting for confirmation:', deployTxHash);
      setDeploymentTxHash(deployTxHash);
    }
  }, [deployTxHash]);

  // Handle deployment result when receipt or receiptError is available
  useEffect(() => {
    if (receipt?.contractAddress) {
      console.log('Contract deployed at address:', receipt.contractAddress);
      setDeployedAddress(receipt.contractAddress);
      setIsProcessing(false);
      setCurrentStep('idle');
    } else if (receiptError) {
      console.error('Transaction receipt error:', receiptError);
      setDeploymentError(receiptError.message || 'Failed to confirm transaction');
      setIsProcessing(false);
      setCurrentStep('idle');
    }
  }, [receipt, receiptError]);

  // Handle deployContractError (e.g., user rejectsКаждый transaction)
  useEffect(() => {
    if (deployContractError) {
      console.error('Deploy contract error:', deployContractError);
      setDeploymentError(deployContractError.message || 'Deployment failed');
    }
  }, [deployContractError]);

  // Generate enhanced contract
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
            content: `You are an expert Solidity developer with security auditing experience. Generate a secure, optimized smart contract with:
              - Solidity 0.8.19
              - No external libraries
              - Comprehensive security measures (reentrancy guards, overflow checks, etc.)
              - Detailed gas analysis
              - Vulnerability assessment
              Return a JSON object with the following structure:
              {
                "code": "string",
                "features": ["string"],
                "securityNotes": ["string"],
                "gasAnalysis": {
                  "estimatedDeploymentCost": number,
                  "functionCosts": { "functionName": number }
                },
                "potentialVulnerabilities": ["string"]
              }`
          },
          {
            role: "user",
            content: `Template: ${selectedTemplate.name}
              Base Code: ${selectedTemplate.baseCode || 'Create new'}
              Features: ${customFeatures || 'Standard'}
              Parameters: ${JSON.stringify(contractParams)}`
          }
        ],
        responseFormat: { type: "json_object" },
        temperature: 0.1,
        maxTokens: 4096
      });

      const parsedResponse = JSON.parse(response.choices?.[0]?.message?.content as string || '{}');
      const validated = ContractSchema.parse(parsedResponse);

      setGeneratedCode(validated.code);
      setSecurityNotes(validated.securityNotes || []);
      setGasAnalysis(validated.gasAnalysis || null);
      setVulnerabilities(validated.potentialVulnerabilities || []);
    } catch (_) {
      if (_ instanceof z.ZodError) {
        setError(`Validation failed: ${_.message}`);
      } else {
        setError('Failed to generate contract');
      }
      setGeneratedCode(selectedTemplate.baseCode || '');
      setSecurityNotes([]);
      setGasAnalysis(null);
      setVulnerabilities([]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Security analysis
  const analyzeSecurity = async () => {
    if (!displayedCode) return;
    setIsAnalyzing(true);

    try {
      const response = await mistralClient.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "Perform a security audit on this Solidity contract. Identify potential vulnerabilities and suggest improvements."
          },
          { role: "user", content: displayedCode }
        ]
      });
      
      const analysis = response.choices?.[0]?.message?.content as string || '';
      setVulnerabilities(analysis.split('\n').filter((line: string) => line.trim()));
    } catch (_) {
      setError('Security analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Deploy contract with timeout
  const handleDeployContract = async () => {
    console.log('Attempting to deploy contract...');

    setIsProcessing(true);
    setDeploymentError(null);
    setDeployedAddress(null);
    setDeploymentTxHash(undefined);
    setCurrentStep('compiling');

    if (!displayedCode) {
      setDeploymentError('Cannot deploy: No contract code provided.');
      setIsProcessing(false);
      setCurrentStep('idle');
      return;
    }

    const compilationResult = await compileContract();
    if (!compilationResult.success) {
      setDeploymentError('Cannot deploy: Compilation failed. Check the console for details.');
      setIsProcessing(false);
      setCurrentStep('idle');
      return;
    }

    const { abi: compiledAbi, bytecode: compiledBytecode } = compilationResult;

    console.log('Preconditions:', {
      displayedCode: !!displayedCode,
      isClientConnected: !!isClientConnected,
      deployContractWagmi: !!deployContractWagmi,
      abiLength: compiledAbi.length,
      bytecode: compiledBytecode !== '0x',
    });

    if (!displayedCode || !isClientConnected || !deployContractWagmi || !compiledAbi.length || !compiledBytecode || compiledBytecode === '0x') {
      console.log('Deployment aborted due to unmet preconditions');
      setDeploymentError('Cannot deploy: Missing code, ABI, or bytecode. Ensure the contract is compiled successfully.');
      setIsProcessing(false);
      setCurrentStep('idle');
      return;
    }

    setCurrentStep('deploying');

    const DEPLOYMENT_TIMEOUT = 120_000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Deployment timed out. Please try again.')), DEPLOYMENT_TIMEOUT);
    });

    try {
      const currentChainId = chain?.id;
      const supportedChainIds = Object.values(CHAIN_CONFIG).map(chain => chain.id) as (51 | 5201420 | 656476 | 44787)[];

      console.log('Current Chain ID:', currentChainId);
      console.log('Supported Chain IDs:', supportedChainIds);

      // Fixed: Type assertion to match the union type
      if (!currentChainId || !supportedChainIds.includes(currentChainId as 51 | 5201420 | 656476 | 44787)) {
        const firstSupportedChainId = supportedChainIds[0];
        console.log('Switching to chain ID:', firstSupportedChainId);
        if (switchChain) {
          await switchChain({ chainId: firstSupportedChainId });
        }
        throw new Error('Please switch to a supported network');
      }

      const args = Object.entries(contractParams).map(([key, val]) => {
        const paramTypes = selectedTemplate ? TEMPLATE_PARAM_TYPES[selectedTemplate.name] || [] : [];
        const param = paramTypes.find(p => p.name === key);
        if (!param) return val;

        switch (param.type) {
          case 'string': return val;
          case 'uint256': return BigInt(val) * BigInt(10**18);
          case 'address': return val as `0x${string}`;
          default: return val;
        }
      });

      console.log('Deploying contract with args:', args);
      console.log('ABI:', compiledAbi);
      console.log('Bytecode:', compiledBytecode);

      await Promise.race([
        deployContractWagmi({
          abi: compiledAbi,
          bytecode: compiledBytecode,
          args,
        }),
        timeoutPromise,
      ]);
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentError(error instanceof Error ? error.message : 'Deployment failed');
    }
  };

  // Download contract as file
  const downloadContract = () => {
    if (!displayedCode) return;
    const blob = new Blob([displayedCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTemplate?.name || 'Custom'}_Contract.sol`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Download analysis as PDF
  const downloadAnalysisPDF = () => {
    if (!gasAnalysis && vulnerabilities.length === 0 && securityNotes.length === 0) return;

    const doc = new jsPDF();
    let yOffset = 10;

    doc.setFontSize(16);
    doc.text('Contract Analysis Report', 10, yOffset);
    yOffset += 10;

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 10, yOffset);
    yOffset += 10;

    if (securityNotes.length > 0) {
      doc.setFontSize(14);
      doc.text('Security Notes', 10, yOffset);
      yOffset += 10;
      securityNotes.forEach((note, index) => {
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${note}`, 10, yOffset);
        yOffset += 6;
      });
    }

    if (gasAnalysis) {
      yOffset += 5;
      doc.setFontSize(14);
      doc.text('Gas Analysis', 10, yOffset);
      yOffset += 10;
      doc.setFontSize(10);
      doc.text(`Estimated Deployment Cost: ${gasAnalysis.estimatedDeploymentCost} gas`, 10, yOffset);
      yOffset += 6;
      Object.entries(gasAnalysis.functionCosts).forEach(([func, cost]) => {
        doc.text(`${func}: ${cost} gas`, 10, yOffset);
        yOffset += 6;
      });
    }

    if (vulnerabilities.length > 0) {
      yOffset += 5;
      doc.setFontSize(14);
      doc.text('Potential Vulnerabilities', 10, yOffset);
      yOffset += 10;
      vulnerabilities.forEach((vuln, index) => {
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${vuln}`, 10, yOffset);
        yOffset += 6;
      });
    }

    doc.save('Contract_Analysis_Report.pdf');
  };

  // Connect wallet handler
  const connectWallet = async () => {
    try {
      await connect({ connector: connectors[0] });
    } catch (error) {
      setError('Failed to connect wallet');
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-black to-[#2d0047] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-mono font-bold mb-8 text-[#a855f7] text-center"
        >
          Advanced Contract Builder
        </motion.h1>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-2 bg-[#2d0047] text-[#c084fc] rounded-lg shadow-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <motion.div 
            className="md:col-span-1 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-[#1a001a] p-6 rounded-xl border border-[#4b0082] shadow-lg">
              <h2 className="flex items-center gap-2 text-lg font-mono mb-4 text-[#a855f7]">
                <Robot className="text-[#a855f7]" /> Templates
              </h2>
              {CONTRACT_TEMPLATES.map(template => (
                <button
                  key={template.name}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full p-4 mb-2 rounded-lg border transition-all duration-300 ${
                    selectedTemplate?.name === template.name 
                      ? 'border-[#9333ea] bg-[#9333ea]/20' 
                      : 'border-[#4b0082] hover:border-[#a855f7] hover:bg-[#2d0047]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {template.icon}
                    <div className="text-left">
                      <div className="font-semibold text-white">{template.name}</div>
                      <div className="text-xs text-[#c084fc]">{template.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedTemplate && (
              <div className="bg-[#1a001a] p-6 rounded-xl border border-[#4b0082] shadow-lg">
                <h2 className="flex items-center gap-2 text-lg font-mono mb-4 text-[#a855f7]">
                  <Code className="text-[#a855f7]" /> Parameters
                </h2>
                {Object.entries(contractParams).map(([key, value]) => (
                  <div key={key} className="mb-4">
                    <label className="text-sm text-[#c084fc]">{key}</label>
                    <input
                      value={value}
                      onChange={e => setContractParams(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full mt-1 p-2 bg-[#1a001a] rounded border border-[#4b0082] focus:border-[#9333ea] text-white transition-all duration-200"
                    />
                  </div>
                ))}
                <textarea
                  value={customFeatures}
                  onChange={e => setCustomFeatures(e.target.value)}
                  placeholder="Custom features..."
                  className="w-full h-24 p-2 bg-[#1a001a] rounded border border-[#4b0082] focus:border-[#9333ea] text-white transition-all duration-200"
                />
                <button
                  onClick={generateContract}
                  disabled={!selectedTemplate || isGenerating}
                  className="w-full mt-4 p-3 bg-[#9333ea] rounded-lg flex items-center justify-center gap-2 disabled:bg-[#2d0047] hover:bg-[#a855f7] transition-all duration-300"
                >
                  {isGenerating ? <CircleNotch className="animate-spin" /> : <Robot />}
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            )}
          </motion.div>

          {/* Center Panel - Code */}
          <motion.div 
            className="md:col-span-1 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-[#1a001a] rounded-xl border border-[#4b0082] shadow-lg flex-1 flex flex-col">
              <div className="p-4 border-b border-[#4b0082] flex justify-between items-center">
                <span className="flex items-center gap-2 font-mono text-[#a855f7]">
                  <FileCode className="text-[#a855f7]" /> Code
                </span>
                <div className="flex gap-2">
                  <button onClick={analyzeSecurity} className="p-2 hover:bg-[#9333ea]/20 rounded transition-all duration-200" title="Analyze Security">
                    <Bug className="text-[#a855f7]" />
                  </button>
                  <button onClick={downloadContract} className="p-2 hover:bg-[#9333ea]/20 rounded transition-all duration-200" title="Download Contract">
                    <Download className="text-[#a855f7]" />
                  </button>
                  <button 
                    onClick={() => navigator.clipboard.writeText(displayedCode)} 
                    className="p-2 hover:bg-[#9333ea]/20 rounded transition-all duration-200" 
                    title="Copy Code"
                  >
                    {displayedCode ? <Check className="text-[#a855f7]" /> : <Copy className="text-[#a855f7]" />}
                  </button>
                </div>
              </div>
              <textarea
                value={displayedCode}
                onChange={e => { setManualCode(e.target.value); setGeneratedCode(''); }}
                className="flex-1 p-4 font-mono bg-transparent border-none resize-none focus:outline-none text-white"
                placeholder="Your contract code will appear here..."
              />
            </div>
          </motion.div>

          {/* Right Panel - Analysis & Deployment */}
          <motion.div 
            className="md:col-span-1 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-[#1a001a] p-6 rounded-xl border border-[#4b0082] shadow-lg">
              <h2 className="flex items-center gap-2 text-lg font-mono mb-4 text-[#a855f7]">
                <Shield className="text-[#a855f7]" /> Analysis
              </h2>
              {gasAnalysis && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-[#c084fc]">
                    <GasPump className="text-[#a855f7]" /> Gas Analysis
                  </h3>
                  <pre className="text-xs text-[#d8b4fe]">{JSON.stringify(gasAnalysis, null, 2)}</pre>
                </div>
              )}
              {vulnerabilities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#c084fc] flex items-center gap-2">
                    <Lock className="text-[#c084fc]" /> Potential Vulnerabilities
                  </h3>
                  <ul className="text-xs text-[#d8b4fe] list-disc pl-4">
                    {vulnerabilities.map((v, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ArrowRight className="text-[#a855f7]" /> {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={analyzeSecurity}
                disabled={isAnalyzing || !displayedCode}
                className="w-full mt-4 p-2 bg-[#9333ea]/30 rounded flex items-center justify-center gap-2 disabled:bg-[#2d0047]/50 hover:bg-[#9333ea]/50 transition-all duration-300"
              >
                {isAnalyzing ? <CircleNotch className="animate-spin" /> : <Bug />}
                {isAnalyzing ? 'Analyzing...' : 'Run Security Scan'}
              </button>
              <button
                onClick={downloadAnalysisPDF}
                disabled={!gasAnalysis && vulnerabilities.length === 0 && securityNotes.length === 0}
                className="w-full mt-2 p-2 bg-[#9333ea]/30 rounded flex items-center justify-center gap-2 disabled:bg-[#2d0047]/50 hover:bg-[#9333ea]/50 transition-all duration-300"
              >
                <Download /> Download Analysis PDF
              </button>
            </div>

            <div className="bg-[#1a001a] p-6 rounded-xl border border-[#4b0082] shadow-lg">
              <h2 className="flex items-center gap-2 text-lg font-mono mb-4 text-[#a855f7]">
                <Rocket className="text-[#a855f7]" /> Deployment
              </h2>
              {isClientConnected === null ? (
                <div className="text-sm text-[#c084fc]">Loading wallet status...</div>
              ) : !isClientConnected ? (
                <button
                  onClick={connectWallet}
                  className="w-full p-3 bg-[#9333ea] rounded-lg flex items-center justify-center gap-2 hover:bg-[#a855f7] transition-all duration-300"
                >
                  <Lightning /> Connect Wallet
                </button>
              ) : (
                <>
                  <div className="mb-4 text-sm text-[#c084fc]">
                    Network: {chain?.name || 'Unknown'}
                    {chains.length > 0 && <span className="hidden">{chains[0].name}</span>}
                  </div>
                  <div className="mb-4 text-sm text-[#c084fc]">
                    Address: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                  <button
                    onClick={handleDeployContract}
                    disabled={isProcessing || !displayedCode}
                    className="w-full p-3 bg-[#9333ea] rounded-lg flex items-center justify-center gap-2 disabled:bg-[#2d0047] hover:bg-[#a855f7] transition-all duration-300"
                  >
                    {isProcessing ? <CircleNotch className="animate-spin" /> : <Rocket />}
                    {isProcessing ? (currentStep === 'compiling' ? 'Compiling...' : 'Deploying...') : 'Deploy Contract'}
                  </button>
                  {deployedAddress && (
                    <a
                      href={chain?.blockExplorers?.default.url ? `${chain.blockExplorers.default.url}/address/${deployedAddress}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-[#a855f7] text-sm flex items-center gap-2 hover:text-[#d8b4fe] transition-all duration-200"
                    >
                      <Link /> View on Explorer: {deployedAddress.slice(0, 6)}...{deployedAddress.slice(-4)}
                    </a>
                  )}
                  {deploymentError && (
                    <div className="mt-2 text-[#c084fc] text-sm">{deploymentError}</div>
                  )}
                  {deployContractError && (
                    <div className="mt-2 text-[#c084fc] text-sm">
                      Deploy Contract Error: {deployContractError.message}
                    </div>
                  )}
                  <button
                    onClick={() => disconnect()}
                    className="w-full mt-2 p-2 bg-[#9333ea]/30 rounded flex items-center justify-center gap-2 hover:bg-[#9333ea]/50 transition-all duration-300"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <style jsx global>{`
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a855f7' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 1.5em;
        }
        select::-ms-expand {
          display: none;
        }
        select option {
          background-color: #1a001a !important;
          color: #ffffff !important;
        }
        select:focus {
          outline: none;
          border-color: #9333ea;
          box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.3);
        }
      `}</style>
    </div>
  );
}