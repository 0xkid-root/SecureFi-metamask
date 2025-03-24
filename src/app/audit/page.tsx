'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { ethers } from 'ethers';
import { 
  Star,
  Warning,
  CheckCircle,
  FileCode,
  Cube,
  Lock,
  Timer,
  CircleNotch,
  ArrowSquareOut,
  Lightning,
  Shield,
  UploadSimple,
  GithubLogo,
  DownloadSimple
} from 'phosphor-react';
import { CONTRACT_ADDRESSES, AUDIT_REGISTRY_ABI } from '@/utils/contracts';
import { CHAIN_CONFIG } from '@/utils/web3-config';
import { useAccount, useConnect, useWalletClient } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsPDF from 'jspdf';
import Image from 'next/image';

// Initialize Mistral client
const mistralClient = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY!
});

// Define the vulnerability analysis schema
const VulnerabilitySchema = z.object({
  stars: z.number().min(0).max(5),
  summary: z.string(),
  vulnerabilities: z.object({
    critical: z.array(z.string()),
    high: z.array(z.string()),
    medium: z.array(z.string()),
    low: z.array(z.string())
  }),
  recommendations: z.array(z.string()),
  gasOptimizations: z.array(z.string())
});

// Interface definitions
interface AuditResult {
  stars: number;
  summary: string;
  vulnerabilities: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  recommendations: string[];
  gasOptimizations: string[];
}

interface SeverityConfig {
  color: string;
  label: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

interface TransactionState {
  isProcessing: boolean;
  hash: string | null;
  error: string | null;
}

// Constants
const COOLDOWN_TIME = 25;
const SEVERITY_CONFIGS: Record<string, SeverityConfig> = {
  critical: { 
    color: 'text-red-400', 
    label: 'Critical', 
    bgColor: 'bg-red-600/20',
    borderColor: 'border-red-600/30',
    icon: <Warning className="text-red-400" size={20} weight="fill" />
  },
  high: { 
    color: 'text-orange-400', 
    label: 'High Risk',
    bgColor: 'bg-orange-600/20',
    borderColor: 'border-orange-600/30',
    icon: <Warning className="text-orange-400" size={20} weight="fill" />
  },
  medium: { 
    color: 'text-yellow-400', 
    label: 'Medium Risk',
    bgColor: 'bg-yellow-600/20',
    borderColor: 'border-yellow-600/30',
    icon: <Warning className="text-yellow-400" size={20} weight="fill" />
  },
  low: { 
    color: 'text-purple-400', 
    label: 'Low Risk',
    bgColor: 'bg-purple-600/20',
    borderColor: 'border-purple-600/30',
    icon: <Warning className="text-purple-400" size={20} weight="bold" />
  }
};

export default function AuditPage() {
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isReviewBlurred, setIsReviewBlurred] = useState(true);
  const [currentChain, setCurrentChain] = useState<keyof typeof CHAIN_CONFIG | null>(null);
  const [txState, setTxState] = useState<TransactionState>({
    isProcessing: false,
    hash: null,
    error: null
  });
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);

  // Wagmi hooks
  const { isConnected, chain } = useAccount();
  const { connectAsync } = useConnect();
  const { data: walletClient } = useWalletClient();

  // Convert WalletClient to ethers.js signer
  const getSigner = async () => {
    if (!walletClient) throw new Error('Wallet client not available');
    const provider = new ethers.BrowserProvider(walletClient.transport);
    return await provider.getSigner();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const isSolidityCode = (code: string): boolean => {
    const pragmaPattern = /pragma\s+solidity\s+(?:\^|\>=|\<=|~)?\s*\d+\.\d+(\.\d+)?|pragma\s+solidity\s+[\d\s\^\>\<\=\.\~]+/;
    const hasPragma = pragmaPattern.test(code);
    const hasContractLike = /(?:contract|library|interface|abstract\s+contract)\s+\w+/.test(code);
    const hasSolidityKeywords = /(?:function|mapping|address|uint\d*|bytes\d*|struct|enum|event|modifier)\s+\w+/.test(code);
    return (hasPragma || hasContractLike) && hasSolidityKeywords;
  };

  const detectCurrentNetwork = async () => {
    try {
      if (!isConnected || !chain) return null;
      for (const [key, config] of Object.entries(CHAIN_CONFIG)) {
        if (chain.id === config.id) {
          setCurrentChain(key as keyof typeof CHAIN_CONFIG);
          return key as keyof typeof CHAIN_CONFIG;
        }
      }
      setCurrentChain(null);
      return null;
    } catch (error) {
      console.error('Error detecting network:', error);
      return null;
    }
  };

  const registerAuditOnChain = async () => {
    if (!result || !code) return;

    setTxState({ isProcessing: true, hash: null, error: null });

    try {
      if (!isConnected) {
        await connectAsync({ connector: metaMask() });
      }

      if (!walletClient) throw new Error('Wallet client not available');

      const signer = await getSigner();
      const contractHash = ethers.keccak256(ethers.toUtf8Bytes(code));
      const detectedChain = await detectCurrentNetwork();

      if (!detectedChain) {
        throw new Error('Please connect to a supported network: Electroneum Mainnet, Testnet, or Apothem Testnet');
      }

      if (!CONTRACT_ADDRESSES[detectedChain]) {
        throw new Error(`Audit registration not supported on ${CHAIN_CONFIG[detectedChain].name}. Please switch to a supported network.`);
      }

      const contractAddress = CONTRACT_ADDRESSES[detectedChain];
      const contract = new ethers.Contract(contractAddress, AUDIT_REGISTRY_ABI, signer);
      const tx = await contract.registerAudit(contractHash, result.stars, result.summary);
      const receipt = await tx.wait();

      setTxState({ isProcessing: false, hash: receipt.transactionHash, error: null });
      setIsReviewBlurred(false);
    } catch (error) {
      console.error('Failed to register audit:', error);
      setTxState({
        isProcessing: false,
        hash: null,
        error: error instanceof Error ? error.message : 'Failed to register audit'
      });
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.sol')) {
      setError('Please upload a valid Solidity file (.sol extension).');
      return;
    }

    try {
      const text = await file.text();
      if (!isSolidityCode(text)) {
        setError('The uploaded file does not contain valid Solidity code.');
        return;
      }
      setCode(text);
      setError(null);
    } catch (err) {
      setError(`Failed to read the file: ${err}`);
    }
  };

  const fetchGithubCode = async () => {
    if (!githubUrl) {
      setError('Please enter a valid GitHub repository URL.');
      return;
    }

    const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+(\/blob\/[\w-]+\/[\w-]+\.sol)?$/;
    if (!githubRegex.test(githubUrl)) {
      setError('Please enter a valid GitHub URL (e.g., https://github.com/user/repo or https://github.com/user/repo/blob/branch/file.sol).');
      return;
    }

    setIsFetchingGithub(true);
    setError(null);

    try {
      let rawUrl = githubUrl
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
      
      if (!rawUrl.endsWith('.sol')) {
        rawUrl += '/main/contracts/Contract.sol';
      }

      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error('Failed to fetch file from GitHub.');
      const text = await response.text();
      if (!isSolidityCode(text)) throw new Error('Fetched file is not valid Solidity code.');

      setCode(text);
      setGithubUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch code from GitHub.');
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const exportToPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    let yOffset = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxHeight = pageHeight - margin;

    doc.setFillColor(40, 40, 40);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

    const checkPageOverflow = (additionalHeight: number) => {
      if (yOffset + additionalHeight > maxHeight) {
        doc.addPage();
        doc.setFillColor(40, 40, 40);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
        yOffset = margin;
      }
    };

    doc.setFontSize(20);
    doc.setTextColor(128, 0, 128);
    doc.text('Smart Contract Audit Report', margin, yOffset);
    yOffset += 10;

    checkPageOverflow(10);
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`Security Score: ${result.stars}/5`, margin, yOffset);
    yOffset += 10;

    checkPageOverflow(12);
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Summary:', margin, yOffset);
    yOffset += 6;
    const summaryLines = doc.splitTextToSize(result.summary || 'No summary available.', 170);
    checkPageOverflow(summaryLines.length * 6);
    doc.text(summaryLines, margin, yOffset);
    yOffset += summaryLines.length * 6 + 5;

    checkPageOverflow(12);
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Vulnerabilities:', margin, yOffset);
    yOffset += 6;

    let hasVulnerabilities = false;
    Object.entries(result.vulnerabilities).forEach(([severity, issues]) => {
      const config = SEVERITY_CONFIGS[severity];
      let severityColor: [number, number, number];
      switch (severity) {
        case 'critical': severityColor = [255, 0, 0]; break;
        case 'high': severityColor = [255, 165, 0]; break;
        case 'medium': severityColor = [255, 255, 0]; break;
        case 'low': severityColor = [128, 0, 128]; break;
        default: severityColor = [255, 255, 255];
      }

      checkPageOverflow(6);
      doc.setTextColor(...severityColor);
      doc.text(`${config.label}:`, margin, yOffset);
      yOffset += 6;

      if (issues.length > 0) {
        hasVulnerabilities = true;
        issues.forEach((issue) => {
          const issueLines = doc.splitTextToSize(`- ${issue}`, 160);
          checkPageOverflow(issueLines.length * 6);
          doc.setTextColor(255, 255, 255);
          doc.text(issueLines, margin + 5, yOffset);
          yOffset += issueLines.length * 6;
        });
      } else {
        checkPageOverflow(6);
        doc.setTextColor(255, 255, 255);
        doc.text(`- No ${severity} risk vulnerabilities found.`, margin + 5, yOffset);
        yOffset += 6;
      }
      yOffset += 2;
    });

    if (!hasVulnerabilities) {
      checkPageOverflow(6);
      doc.setTextColor(255, 255, 255);
      doc.text('- No vulnerabilities found.', margin + 5, yOffset);
      yOffset += 6;
    }

    checkPageOverflow(12);
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Recommendations:', margin, yOffset);
    yOffset += 6;

    if (result.recommendations?.length > 0) {
      result.recommendations.forEach((rec) => {
        const recLines = doc.splitTextToSize(`- ${rec}`, 160);
        checkPageOverflow(recLines.length * 6);
        doc.text(recLines, margin + 5, yOffset);
        yOffset += recLines.length * 6;
      });
    } else {
      checkPageOverflow(6);
      doc.text('- No recommendations provided.', margin + 5, yOffset);
      yOffset += 6;
    }

    checkPageOverflow(12);
    yOffset += 5;
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Gas Optimizations:', margin, yOffset);
    yOffset += 6;

    if (result.gasOptimizations?.length > 0) {
      result.gasOptimizations.forEach((opt) => {
        const optLines = doc.splitTextToSize(`- ${opt}`, 160);
        checkPageOverflow(optLines.length * 6);
        doc.text(optLines, margin + 5, yOffset);
        yOffset += optLines.length * 6;
      });
    } else {
      checkPageOverflow(6);
      doc.text('- No gas optimizations provided.', margin + 5, yOffset);
      yOffset += 6;
    }

    doc.save('audit-report.pdf');
  };

  const analyzeContract = async () => {
    if (!code.trim()) {
      setError('Please enter your smart contract code.');
      return;
    }
    if (!isSolidityCode(code)) {
      setError('Invalid input. Please ensure your code is a valid Solidity smart contract.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setIsReviewBlurred(true);

    try {
      const response = await mistralClient.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: `You are a professional smart contract security auditor. Analyze the provided Solidity smart contract with zero tolerance for security issues.
            
            Rating System (Extremely Strict):
            - 5 stars: ONLY if contract has zero vulnerabilities and follows all best practices
            - 4 stars: ONLY if no critical/high vulnerabilities, max 1-2 medium issues
            - 3 stars: No critical but has high severity issues needing attention
            - 2 stars: Has critical vulnerability or multiple high severity issues
            - 1 star: Multiple critical and high severity vulnerabilities
            - 0 stars: Fundamental security flaws making contract unsafe
            
            Critical Issues (Any reduces rating to 2 or lower):
            - Reentrancy vulnerabilities
            - Unchecked external calls
            - Integer overflow/underflow risks
            - Access control flaws
            - Unprotected selfdestruct
            - Missing input validation

            Return response in the following JSON format:
            {
              "stars": number,
              "summary": "string",
              "vulnerabilities": {
                "critical": ["string"],
                "high": ["string"],
                "medium": ["string"],
                "low": ["string"]
              },
              "recommendations": ["string"],
              "gasOptimizations": ["string"]
            }`
          },
          { role: "user", content: code }
        ],
        responseFormat: { type: "json_object" },
        temperature: 0.1,
        maxTokens: 2048
      });

      const responseText = response.choices?.[0]?.message?.content;
      if (typeof responseText !== 'string') throw new Error('Invalid response format');
      const parsedResponse = JSON.parse(responseText);
      const validatedResponse = VulnerabilitySchema.parse(parsedResponse);

      if (validatedResponse.vulnerabilities.critical.length > 0) validatedResponse.stars = Math.min(validatedResponse.stars, 2);
      if (validatedResponse.vulnerabilities.high.length > 0) validatedResponse.stars = Math.min(validatedResponse.stars, 3);
      if (validatedResponse.vulnerabilities.critical.length > 2) validatedResponse.stars = 0;

      setResult(validatedResponse);
      setShowResult(true);
      setCooldown(COOLDOWN_TIME);
      await detectCurrentNetwork();
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    detectCurrentNetwork();
  }, [isConnected, chain]);

  return (
    <div className="min-h-screen py-12 bg-black text-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-block mb-3 px-4 py-1 rounded-full bg-purple-600/20 border border-purple-600/30">
            <span className="text-purple-400 text-sm font-semibold">AI Security Analysis</span>
          </div>
          <h1 className="text-3xl font-mono font-bold text-purple-400 mb-4">Smart Contract Audit</h1>
          <p className="text-purple-300">Get instant AI-powered security analysis for your smart contracts</p>
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
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Code Input Panel */}
          <div className="h-[700px] flex flex-col">
            <div 
              className="relative flex-1 bg-purple-950/30 rounded-lg border border-purple-900 hover:border-purple-600/50 transition-colors duration-300 shadow-lg"
              style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
            >
              <div className="absolute inset-0">
                <div className="p-4 border-b border-purple-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="text-purple-400" size={20} weight="duotone" />
                    <span className="font-mono text-white">Solidity Code</span>
                  </div>
                  <label className="cursor-pointer flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 px-3 py-1 rounded-lg border border-purple-600/30 transition-colors duration-200">
                    <UploadSimple className="text-purple-400" size={20} weight="bold" />
                    <span className="text-purple-300 text-sm">Upload .sol</span>
                    <input
                      type="file"
                      accept=".sol"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isAnalyzing}
                    />
                  </label>
                </div>
                <div className="h-[calc(100%-60px)] custom-scrollbar">
                  {code ? (
                    <SyntaxHighlighter
                      language="solidity"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        height: '100%',
                        background: 'transparent',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        overflow: 'auto'
                      }}
                      wrapLines={true}
                    >
                      {code}
                    </SyntaxHighlighter>
                  ) : (
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="// Paste your Solidity code here..."
                      className="w-full h-full p-4 bg-transparent font-mono text-sm focus:outline-none resize-none code-editor text-white"
                      spellCheck="false"
                      disabled={isAnalyzing}
                    />
                  )}
                </div>
              </div>

              {/* Cooldown Overlay */}
              <AnimatePresence>
                {cooldown > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center"
                  >
                    <div className="bg-purple-950/80 p-6 rounded-lg border border-purple-600/30 shadow-lg">
                      <Lock className="text-purple-400 mb-4 mx-auto" size={32} weight="bold" />
                      <div className="text-2xl font-mono mb-2 text-center text-white">Cooldown</div>
                      <div className="flex items-center justify-center gap-2">
                        <Timer className="text-purple-400" size={20} weight="fill" />
                        <span className="text-xl text-white">{cooldown}s</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="Enter GitHub URL (e.g., https://github.com/user/repo)"
                  className="w-full py-2 px-4 bg-purple-950/30 border border-purple-900 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-600/50 font-mono text-sm"
                  disabled={isAnalyzing || isFetchingGithub}
                />
                <GithubLogo className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} weight="fill" />
              </div>
              <button
                onClick={fetchGithubCode}
                disabled={isAnalyzing || isFetchingGithub || !githubUrl}
                className={`py-2 px-4 rounded-lg font-bold flex items-center gap-2 transition-all duration-200 ${
                  isAnalyzing || isFetchingGithub || !githubUrl
                    ? 'bg-purple-950 text-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20'
                }`}
              >
                {isFetchingGithub ? (
                  <>
                    <CircleNotch className="animate-spin" size={20} weight="bold" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <GithubLogo size={20} weight="fill" />
                    Fetch from GitHub
                  </>
                )}
              </button>
            </div>

            <button
              onClick={analyzeContract}
              disabled={isAnalyzing || !code || cooldown > 0}
              className={`mt-4 w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                isAnalyzing || !code || cooldown > 0
                  ? 'bg-purple-950 text-purple-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <CircleNotch className="animate-spin" size={20} weight="bold" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightning size={20} weight="fill" />
                  Analyze Contract
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="h-[700px]">
            {result && showResult ? (
              <div 
                className="h-full bg-purple-950/30 rounded-lg border border-purple-900 hover:border-purple-600/50 transition-colors duration-300 shadow-lg relative"
                style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
              >
                <div className="p-4 border-b border-purple-900 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Shield className="text-purple-400" size={20} weight="duotone" />
                    <span className="font-mono text-white">Analysis Results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportToPDF}
                      className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition-colors duration-200"
                    >
                      <DownloadSimple size={16} weight="bold" />
                      Export as PDF
                    </button>
                    {txState.hash && currentChain && (
                      <a 
                        href={`${CHAIN_CONFIG[currentChain].blockExplorers.default.url}/tx/${txState.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition-colors duration-200"
                      >
                        View Transaction <ArrowSquareOut size={16} weight="bold" />
                      </a>
                    )}
                  </div>
                </div>

                <div className={`h-[calc(100%-60px)] custom-scrollbar overflow-auto p-6 transition-all duration-300 ${isReviewBlurred ? 'blur-md select-none' : ''}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          weight={i < result.stars ? "fill" : "regular"}
                          className={i < result.stars ? "text-purple-400" : "text-purple-900"}
                          size={24}
                        />
                      ))}
                    </div>
                    <span className="text-purple-300">Security Score</span>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-mono text-sm text-purple-400 mb-2">SUMMARY</h3>
                    <div className="bg-purple-900/50 px-4 py-3 rounded-lg border border-purple-800/70 text-white">
                      {result.summary}
                    </div>
                  </div>

                  <div className="mb-6 space-y-4">
                    <h3 className="font-mono text-sm text-purple-400 mb-2">VULNERABILITIES</h3>
                    {Object.entries(result.vulnerabilities).map(([severity, issues]) => {
                      if (issues.length === 0) return null;
                      const config = SEVERITY_CONFIGS[severity];
                      return (
                        <div key={severity} className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
                          <div className="flex items-center gap-2 mb-2">
                            {config.icon}
                            <span className={`font-semibold ${config.color}`}>{config.label}</span>
                          </div>
                          <ul className="space-y-2">
                            {issues.map((issue, index) => (
                              <li key={index} className="text-purple-300 text-sm">
                                • {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mb-6">
                    <h3 className="font-mono text-sm text-purple-400 mb-2">RECOMMENDATIONS</h3>
                    <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="text-purple-400 mt-1 flex-shrink-0" size={16} weight="fill" />
                            <span className="text-purple-300">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-mono text-sm text-purple-400 mb-2">GAS OPTIMIZATIONS</h3>
                    <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                      <ul className="space-y-2">
                        {result.gasOptimizations.map((opt, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Cube className="text-purple-400 mt-1 flex-shrink-0" size={16} weight="fill" />
                            <span className="text-purple-300">{opt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {isReviewBlurred && (
                  <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30">
                    <div className="bg-purple-950 p-8 rounded-xl border border-purple-600/30 shadow-xl text-center">
                      <Shield className="text-purple-400 mb-6 mx-auto" size={48} weight="duotone" />
                      <h3 className="text-xl font-bold text-white mb-3">Verify Contract Security</h3>
                      <p className="text-purple-300 mb-6 max-w-sm">Register this audit on the blockchain to verify its security status and view the full report</p>
                      <button
                        onClick={registerAuditOnChain}
                        disabled={txState.isProcessing}
                        className={`px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg shadow-purple-600/20 ${
                          txState.isProcessing ? 'cursor-not-allowed opacity-70' : ''
                        }`}
                      >
                        {txState.isProcessing ? (
                          <>
                            <CircleNotch className="animate-spin" size={20} weight="bold" />
                            Registering Audit...
                          </>
                        ) : (
                          <>
                            <Lock size={20} weight="fill" />
                            Register Audit On-Chain
                          </>
                        )}
                      </button>
                      {currentChain ? (
                        <div className="mt-4 text-purple-400 text-sm flex items-center justify-center gap-2">
                          <Image 
                            src={CHAIN_CONFIG[currentChain].iconPath}
                            alt={CHAIN_CONFIG[currentChain].name}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                          Will register on {CHAIN_CONFIG[currentChain].name}
                        </div>
                      ) : (
                        <div className="mt-4 text-yellow-400 text-sm">
                          Please connect to a supported network
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {txState.error && (
                  <div className="absolute bottom-4 left-4 right-4 bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-2 rounded-lg">
                    {txState.error}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full bg-purple-950/30 rounded-lg border border-purple-900 flex items-center justify-center text-purple-300 p-8">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-2xl"></div>
                    <Shield size={80} className="text-purple-400 relative z-10" weight="duotone" />
                  </div>
                  <h3 className="text-xl font-mono mb-4 text-white">Smart Contract Analyzer</h3>
                  <p className="text-purple-300 mb-6 max-w-md mx-auto">
                    Paste your Solidity code, upload a .sol file, or fetch from GitHub to get a comprehensive security assessment
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-600/30">
                      Vulnerability Detection
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-600/30">
                      Security Scoring
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-600/30">
                      Gas Optimization
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-600/30">
                      On-Chain Verification
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(107, 70, 193, 0.3) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(107, 70, 193, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(107, 70, 193, 0.5);
        }
        .code-editor::selection {
          background: rgba(107, 70, 193, 0.2);
        }
      `}</style>
    </div>
  );
}