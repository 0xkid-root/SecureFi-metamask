// ContractBuilder.tsx
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { ethers } from 'ethers';
import {
  FileCode, Robot, CircleNotch, Copy, Check, Rocket, Link, Code,
  Lightning, Shield, ArrowRight, Lock, GasPump, Bug, Download
} from 'phosphor-react';
import { CONTRACT_TEMPLATES, ContractTemplate } from './templates';
import { connectWallet, CHAIN_CONFIG } from '@/utils/web3';
import React from 'react';
import jsPDF from 'jspdf';

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
  'Custom Contract': [] // No default params
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
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentChain, setCurrentChain] = useState<keyof typeof CHAIN_CONFIG | null>(null);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);

  // Advanced analysis state
  const [securityNotes, setSecurityNotes] = useState<string[]>([]);
  const [gasAnalysis, setGasAnalysis] = useState<{ estimatedDeploymentCost: number; functionCosts: Record<string, number> } | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const displayedCode = generatedCode || manualCode;

  // Network detection
  const detectCurrentNetwork = async (): Promise<keyof typeof CHAIN_CONFIG | null> => {
    try {
      if (!window.ethereum) return null;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = '0x' + network.chainId.toString(16);
      
      for (const [key, config] of Object.entries(CHAIN_CONFIG)) {
        if (chainId.toLowerCase() === config.chainId.toLowerCase()) {
          setCurrentChain(key as keyof typeof CHAIN_CONFIG);
          return key as keyof typeof CHAIN_CONFIG;
        }
      }
      setCurrentChain(null);
      return null;
    } catch (err) {
      console.error('Network detection error:', err);
      setError('Failed to detect network');
      return null;
    }
  };

  // Wallet connection handling
  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length > 0) {
          setWalletConnected(true);
          await detectCurrentNetwork();
        }
      }
    };
    checkWallet();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setWalletConnected(accounts.length > 0);
        detectCurrentNetwork();
      });
      window.ethereum.on('chainChanged', detectCurrentNetwork);
    }
  }, []);

  // Template selection effect
  useEffect(() => {
    if (selectedTemplate?.defaultParams) {
      setContractParams(selectedTemplate.defaultParams);
      setGeneratedCode(selectedTemplate.baseCode);
    }
  }, [selectedTemplate]);

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
                "code": "string", // The generated Solidity code
                "features": ["string"], // Array of feature descriptions
                "securityNotes": ["string"], // Array of security notes
                "gasAnalysis": { // Optional gas analysis object
                  "estimatedDeploymentCost": number,
                  "functionCosts": { "functionName": number }
                },
                "potentialVulnerabilities": ["string"] // Optional array of vulnerabilities
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

      // Log the raw response for debugging
      console.log("Mistral API Response:", response.choices?.[0]?.message?.content);

      const parsedResponse = JSON.parse(response.choices?.[0]?.message?.content as string || '{}');

      // Validate the response with Zod
      const validated = ContractSchema.parse(parsedResponse);

      setGeneratedCode(validated.code);
      setSecurityNotes(validated.securityNotes || []);
      setGasAnalysis(validated.gasAnalysis || null);
      setVulnerabilities(validated.potentialVulnerabilities || []);
    } catch (err) {
      console.error('Generation error:', err);
      if (err instanceof z.ZodError) {
        setError(`Validation failed: ${err.message}`);
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
    } catch (err) {
      setError('Security analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Deploy contract
  const deployContract = async () => {
    if (!displayedCode || !walletConnected) return;

    setIsDeploying(true);
    setDeploymentError(null);

    try {
      const { signer } = await connectWallet();
      const chain = await detectCurrentNetwork();
      if (!chain || (chain !== 'electroneumMainnet' && chain !== 'electroneumTestnet')) {
        throw new Error('Switch to Electroneum Network');
      }

      const compileResponse = await fetch('/api/compile-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode: displayedCode })
      });

      if (!compileResponse.ok) throw new Error('Compilation failed');
      const { abi, bytecode } = await compileResponse.json();

      const factory = new ethers.ContractFactory(abi, bytecode, signer);

      // Process constructor arguments based on template parameter types
      const paramTypes = selectedTemplate ? TEMPLATE_PARAM_TYPES[selectedTemplate.name] || [] : [];
      const args = Object.entries(contractParams).map(([key, val]) => {
        const param = paramTypes.find(p => p.name === key);
        if (!param) return val; // Fallback to raw value if type not found

        switch (param.type) {
          case 'string':
            return val; // Pass strings as-is
          case 'uint256':
            return ethers.parseUnits(val, 18); // Parse numbers with 18 decimals
          case 'address':
            if (!ethers.isAddress(val)) throw new Error(`Invalid address: ${val}`);
            return val;
          default:
            return val;
        }
      });

      const contract = await factory.deploy(...args);
      const receipt = await contract.deploymentTransaction()?.wait();
      
      setDeployedAddress(receipt?.contractAddress || '');
    } catch (err: unknown) {
      setDeploymentError((err as Error).message);
    } finally {
      setIsDeploying(false);
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
              {!walletConnected ? (
                <button
                  onClick={connectWallet}
                  className="w-full p-3 bg-[#9333ea] rounded-lg flex items-center justify-center gap-2 hover:bg-[#a855f7] transition-all duration-300"
                >
                  <Lightning /> Connect Wallet
                </button>
              ) : (
                <>
                  <div className="mb-4 text-sm text-[#c084fc]">
                    Network: {currentChain ? CHAIN_CONFIG[currentChain].chainName : 'Not connected'}
                  </div>
                  <button
                    onClick={deployContract}
                    disabled={isDeploying || !displayedCode}
                    className="w-full p-3 bg-[#9333ea] rounded-lg flex items-center justify-center gap-2 disabled:bg-[#2d0047] hover:bg-[#a855f7] transition-all duration-300"
                  >
                    {isDeploying ? <CircleNotch className="animate-spin" /> : <Rocket />}
                    {isDeploying ? 'Deploying...' : 'Deploy Contract'}
                  </button>
                  {deployedAddress && (
                    <a
                      href={currentChain ? `${CHAIN_CONFIG[currentChain].blockExplorerUrls[0]}/address/${deployedAddress}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-[#a855f7] text-sm flex items-center gap-2 hover:text-[#d8b4fe] transition-all duration-200"
                    >
                      <Link /> View on Explorer: {deployedAddress}
                    </a>
                  )}
                  {deploymentError && (
                    <div className="mt-2 text-[#c084fc] text-sm">{deploymentError}</div>
                  )}
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