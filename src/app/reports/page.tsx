/** @format */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { readContract } from '@wagmi/core';
import { config } from '@/utils/web3-config';
import {
  MagnifyingGlass,
  Star,
  ArrowSquareOut,
  X,
  FunnelSimple,
  Download,
  ListChecks,
  CircleNotch,
} from 'phosphor-react';
import Image from 'next/image';
import { CHAIN_CONFIG } from '@/utils/web3-config';
import { CONTRACT_ADDRESSES, AUDIT_REGISTRY_ABI, ChainKey } from '@/utils/contracts';

interface AuditReport {
  contractHash: string;
  transactionHash: string;
  stars: number;
  summary: string;
  auditor: string;
  timestamp: number;
  chain: ChainKey;
}

interface FilterState {
  search: string;
  chain: string;
  dateRange: 'all' | 'day' | 'week' | 'month';
  minStars: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ReportsPage() {
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    chain: 'all',
    dateRange: 'all',
    minStars: 0,
  });

  const { } = useAccount();

  const fetchAllChainAudits = useCallback(async () => {
    setIsLoading(true);
    const allAudits: AuditReport[] = [];
    const BATCH_SIZE = 10;

    for (const [chainKey, chainData] of Object.entries(CHAIN_CONFIG) as [
      ChainKey,
      typeof CHAIN_CONFIG[keyof typeof CHAIN_CONFIG]
    ][]) {
      if (!CONTRACT_ADDRESSES[chainKey]) {
        console.warn(`No contract address for ${chainKey}`);
        continue;
      }

      try {
        console.log(`Fetching from ${chainKey} (ID: ${chainData.id})...`);
        let totalContracts: bigint = 0n;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            totalContracts = (await readContract(config, {
              address: CONTRACT_ADDRESSES[chainKey],
              abi: AUDIT_REGISTRY_ABI,
              functionName: 'getTotalContracts',
              chainId: chainData.id,
            })) as bigint;
            break;
          } catch (error) {
            console.warn(`Attempt ${attempt + 1} failed for getTotalContracts on ${chainKey}:`, error);
            if (attempt === 2) throw error;
            await delay(1000);
          }
        }

        console.log(`Found ${totalContracts.toString()} contracts on ${chainKey}`);

        let processed = 0;
        while (processed < Number(totalContracts)) {
          try {
            const auditBatch = (await readContract(config, {
              address: CONTRACT_ADDRESSES[chainKey],
              abi: AUDIT_REGISTRY_ABI,
              functionName: 'getAllAudits',
              args: [BigInt(processed), BigInt(BATCH_SIZE)],
              chainId: chainData.id,
            })) as [`0x${string}`[], number[], string[], `0x${string}`[], bigint[]];

            console.log(`Audit batch for ${chainKey} at ${processed}:`, auditBatch);

            if (!auditBatch || auditBatch.length !== 5) {
              console.warn(`Invalid audit batch returned for ${chainKey} at ${processed}`);
              break;
            }

            const [contractHashes, stars, summaries, auditors, timestamps] = auditBatch;
            for (let i = 0; i < contractHashes.length; i++) {
              allAudits.push({
                contractHash: contractHashes[i],
                transactionHash: '',
                stars: stars[i],
                summary: summaries[i],
                auditor: auditors[i],
                timestamp: Number(timestamps[i]),
                chain: chainKey,
              });
            }
            processed += contractHashes.length;
            console.log(`Processed ${processed}/${totalContracts} on ${chainKey}`);
            await delay(500);
          } catch (batchError) {
            console.error(`Error fetching batch at ${processed} from ${chainKey}:`, batchError);
            break;
          }
        }
      } catch (chainError) {
        console.error(`Error processing ${chainKey}:`, chainError);
        continue;
      }
    }

    console.log(`Total audits collected: ${allAudits.length}`);
    setReports(allAudits.sort((a, b) => b.timestamp - a.timestamp));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAllChainAudits();
  }, [fetchAllChainAudits]);

  const getFilteredReports = () => {
    return reports.filter((report) => {
      if (
        filters.search &&
        !report.contractHash.toLowerCase().includes(filters.search.toLowerCase()) &&
        !report.auditor.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      if (filters.chain !== 'all' && report.chain !== filters.chain) {
        return false;
      }

      if (filters.minStars > 0 && report.stars < filters.minStars) {
        return false;
      }

      if (filters.dateRange !== 'all') {
        const now = Date.now() / 1000;
        const ranges = {
          day: 86400,
          week: 604800,
          month: 2592000,
        };
        if (now - report.timestamp > ranges[filters.dateRange]) {
          return false;
        }
      }

      return true;
    });
  };

  const exportReport = (report: AuditReport) => {
    const formattedReport = {
      contractHash: report.contractHash,
      stars: report.stars,
      summary: report.summary,
      auditor: report.auditor,
      timestamp: report.timestamp,
      chain: report.chain,
      chainName: CHAIN_CONFIG[report.chain].name,
      exportDate: new Date().toISOString(),
      network: {
        name: CHAIN_CONFIG[report.chain].name,
        chainId: CHAIN_CONFIG[report.chain].id,
        contractAddress: CONTRACT_ADDRESSES[report.chain],
      },
      auditDate: new Date(report.timestamp * 1000).toLocaleString(),
    };

    try {
      const blob = new Blob([JSON.stringify(formattedReport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-${report.contractHash.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-mono font-bold text-white mb-4">Audit Reports</h1>
          <p className="text-purple-300">View and analyze smart contract audits across multiple chains</p>
        </div>

        <div className="mb-8">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by contract hash or auditor address..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-gray-800/50 border border-purple-900 text-purple-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-purple-600"
              />
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-purple-950/50 border border-purple-900 text-purple-300 rounded-lg hover:bg-purple-950 hover:border-purple-600 transition-colors duration-200 flex items-center gap-2"
            >
              <FunnelSimple size={20} />
              Filters
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-gray-900/50 border border-purple-900 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Chain</label>
                  <select
                    value={filters.chain}
                    onChange={(e) => setFilters({ ...filters, chain: e.target.value })}
                    className="w-full bg-gray-800/50 border border-purple-900 text-purple-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
                  >
                    <option value="all">All Chains</option>
                    {Object.entries(CHAIN_CONFIG).map(([key, chain]) => (
                      <option key={key} value={key}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Time Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters({ ...filters, dateRange: e.target.value as FilterState['dateRange'] })
                    }
                    className="w-full bg-gray-800/50 border border-purple-900 text-purple-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
                  >
                    <option value="all">All Time</option>
                    <option value="day">Last 24 Hours</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Minimum Stars</label>
                  <select
                    value={filters.minStars}
                    onChange={(e) => setFilters({ ...filters, minStars: Number(e.target.value) })}
                    className="w-full bg-gray-800/50 border border-purple-900 text-purple-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600"
                  >
                    <option value={0}>Any Rating</option>
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <option key={stars} value={stars}>
                        {stars}+ Stars
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="bg-gray-900/50 border border-purple-900 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-900">
                  <th className="py-4 px-6 text-left text-sm font-mono text-gray-400">CONTRACT</th>
                  <th className="py-4 px-6 text-left text-sm font-mono text-gray-400">CHAIN</th>
                  <th className="py-4 px-6 text-left text-sm font-mono text-gray-400">RATING</th>
                  <th className="py-4 px-6 text-left text-sm font-mono text-gray-400">AUDITOR</th>
                  <th className="py-4 px-6 text-left text-sm font-mono text-gray-400">DATE</th>
                  <th className="py-4 px-6 text-right text-sm font-mono text-gray-400">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredReports().map((report) => (
                  <tr
                    key={`${report.contractHash}-${report.chain}`}
                    className="border-b border-purple-900/50 hover:bg-purple-950/20 transition-colors duration-200"
                  >
                    <td className="py-4 px-6 font-mono text-purple-300">
                      {report.contractHash.slice(0, 10)}...{report.contractHash.slice(-8)}
                    </td>
                    <td className="py-4 px-6 text-purple-300">
                      <div className="flex items-center gap-2">
                        <Image
                          src={CHAIN_CONFIG[report.chain].iconPath}
                          alt={CHAIN_CONFIG[report.chain].name}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        <span>{CHAIN_CONFIG[report.chain].name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            weight={i < report.stars ? 'fill' : 'regular'}
                            className={i < report.stars ? 'text-purple-400' : 'text-gray-600'}
                            size={16}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-purple-300">
                      {report.auditor.slice(0, 6)}...{report.auditor.slice(-4)}
                    </td>
                    <td className="py-4 px-6 text-gray-400">
                      {new Date(report.timestamp * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-2 hover:bg-purple-950 rounded-lg transition-colors duration-200"
                          title="View Details"
                        >
                          <ArrowSquareOut size={20} className="text-purple-400" />
                        </button>
                        <button
                          onClick={() => exportReport(report)}
                          className="p-2 hover:bg-purple-950 rounded-lg transition-colors duration-200"
                          title="Export Report"
                        >
                          <Download size={20} className="text-purple-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-purple-400">
              <CircleNotch className="animate-spin inline-block mr-2" size={20} />
              Loading audits...
            </div>
          )}

          {!isLoading && getFilteredReports().length === 0 && (
            <div className="py-12 text-center text-purple-400">
              <ListChecks className="inline-block mr-2" size={20} />
              No audit reports found matching your criteria
            </div>
          )}
        </div>

        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border border-purple-900 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white">Audit Report Details</h3>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-1 hover:bg-purple-950 rounded-lg transition-colors duration-200"
                  >
                    <X size={20} className="text-purple-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Contract Hash</label>
                    <div className="font-mono bg-gray-800/50 px-3 py-2 rounded-lg text-purple-300">
                      {selectedReport.contractHash}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Chain</label>
                    <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg text-purple-300">
                      <Image
                        src={CHAIN_CONFIG[selectedReport.chain].iconPath}
                        alt={CHAIN_CONFIG[selectedReport.chain].name}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span>{CHAIN_CONFIG[selectedReport.chain].name}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Security Rating</label>
                    <div className="flex gap-1 bg-gray-800/50 px-3 py-2 rounded-lg">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          weight={i < selectedReport.stars ? 'fill' : 'regular'}
                          className={i < selectedReport.stars ? 'text-purple-400' : 'text-gray-600'}
                          size={20}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Summary</label>
                    <div className="bg-gray-800/50 px-3 py-2 rounded-lg text-purple-300">{selectedReport.summary}</div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Auditor</label>
                    <div className="font-mono bg-gray-800/50 px-3 py-2 rounded-lg text-purple-300 flex items-center justify-between">
                      <span>{selectedReport.auditor}</span>
                      <a
                        href={`${CHAIN_CONFIG[selectedReport.chain].blockExplorers.default.url}/address/${selectedReport.auditor}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        View on Explorer <ArrowSquareOut size={16} />
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Timestamp</label>
                    <div className="bg-gray-800/50 px-3 py-2 rounded-lg text-purple-300">
                      {new Date(selectedReport.timestamp * 1000).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-purple-900">
                    <button
                      onClick={() => exportReport(selectedReport)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
                    >
                      <Download size={20} />
                      Export Report
                    </button>
                    <a
                      href={`${CHAIN_CONFIG[selectedReport.chain].blockExplorers.default.url}/tx/${selectedReport.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-950/50 text-purple-300 rounded-lg hover:bg-purple-950 hover:border-purple-600 border border-purple-900 transition-colors duration-200 flex items-center gap-2"
                      style={{
                        opacity: selectedReport.transactionHash ? 1 : 0.5,
                        pointerEvents: selectedReport.transactionHash ? 'auto' : 'none',
                      }}
                    >
                      View on Explorer
                      <ArrowSquareOut size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}