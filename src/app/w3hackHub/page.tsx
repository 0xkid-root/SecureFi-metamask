"use client";

import React, { useState } from "react";
import web3HackhubRaw from "./test.json";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  Scale,
  CoreScaleOptions,
  TooltipItem,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Hack {
  date: string;
  target: string;
  amount: string;
  attacked_method: string;
  reference: string;
  chain: string;
  category: string;
  description: string;
  amount_in_usd: number;
}

interface AttackTrend {
  category: string;
  count: number;
  color: string;
}

const hacks: Hack[] = Array.isArray(web3HackhubRaw)
  ? (web3HackhubRaw as Hack[])
  : ((web3HackhubRaw as { const?: Hack[] }).const as Hack[]) || [];

const Page = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchChain, setSearchChain] = useState("");
  const postsPerPage = 7;

  const uniqueCategories = [...new Set(hacks.map((hack) => hack.category))];
  const uniqueChains = [...new Set(hacks.map((hack) => hack.chain))];

  const filteredHacks = hacks.filter((hack) => {
    const matchesCategory = searchCategory
      ? hack.category.toLowerCase().includes(searchCategory.toLowerCase())
      : true;
    const matchesChain = searchChain
      ? hack.chain.toLowerCase().includes(searchChain.toLowerCase())
      : true;
    return matchesCategory && matchesChain;
  });

  const totalAmountHacked = filteredHacks.reduce(
    (sum, hack) => sum + hack.amount_in_usd,
    0
  );
  const totalHacks = filteredHacks.length;

  const attackTrendsMap: { [key: string]: number } = filteredHacks.reduce(
    (acc, hack) => {
      const category = hack.category || "Unknown";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as { [key: string]: number }
  );

  const attackTrends: AttackTrend[] = Object.entries(attackTrendsMap)
    .map(([category, count], index) => ({
      category,
      count,
      color: [
        "#b7eb8f", // Token (light green)
        "#d9d9d9", // Other (light gray)
        "#36cfc9", // Borrowing and Lending (cyan)
        "#d3adf7", // Yield Aggregator (light purple)
        "#ff7a45", // CeFi (orange)
        "#40a9ff", // Exchange (DEX) (blue)
        "#9254de", // Gaming / Metaverse (purple)
        "#bfbfbf", // Bridge (gray)
        "#ff4d4f", // Stablecoin (red)
        "#ffeb3b", // NFT (yellow)
      ][index % 10],
    }))
    .sort((a, b) => b.count - a.count);

  // Prepare data for the graph (total amount hacked over time)
  const sortedHacks = [...hacks].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const monthlyData: { [key: string]: number } = {};
  let cumulativeAmount = 0;

  sortedHacks.forEach((hack) => {
    const date = new Date(hack.date);
    const monthYear = `${date.toLocaleString("default", {
      month: "short",
    })} ${date.getFullYear()}`;
    cumulativeAmount += hack.amount_in_usd;
    monthlyData[monthYear] = cumulativeAmount;
  });

  const labels = Object.keys(monthlyData);
  const dataPoints = Object.values(monthlyData);

  const chartData: ChartData<"line"> = {
    labels: labels,
    datasets: [
      {
        label: "Cumulative Amount Hacked (USD)",
        data: dataPoints,
        borderColor: "#ba55d3",
        backgroundColor: "rgba(186, 85, 211, 0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#d8bfd8",
          font: { size: 12 },
          maxTicksLimit: 5,
        },
      },
      y: {
        grid: {
          color: "rgba(216, 191, 216, 0.1)",
        },
        ticks: {
          color: "#d8bfd8",
          font: { size: 12 },
          callback: function (
            this: Scale<CoreScaleOptions>,
            tickValue: string | number
          ): string {
            const value = Number(tickValue);
            if (value >= 1_000_000_000) {
              return `${(value / 1_000_000_000).toFixed(1)}B`;
            } else if (value >= 1_000_000) {
              return `${(value / 1_000_000).toFixed(1)}M`;
            } else {
              return `$${value.toLocaleString()}`;
            }
          },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "#2a0a3a",
        titleColor: "#ffffff",
        bodyColor: "#d8bfd8",
        borderColor: "#ba55d3",
        borderWidth: 1,
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 8,
        cornerRadius: 4,
        callbacks: {
          title: (tooltipItems: TooltipItem<"line">[]) => {
            return tooltipItems[0].label;
          },
          label: (context: TooltipItem<"line">) => {
            const value = context.parsed.y;
            return `$${value.toLocaleString()}`;
          },
        },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
    interaction: {
      mode: "nearest" as const,
      intersect: false,
      axis: "x",
    },
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentHacks = filteredHacks.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredHacks.length / postsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="container">
      <header className="header">
        <h1>Web3 HackHub: Gain Insights into Blockchain Hacks</h1>
        <p className="subheading">
          Explore through all the hacks since 2011. Delve into a comprehensive
          database of blockchain breaches, providing insights into the evolution
          of cybersecurity challenges and the lessons learned from each incident
          since 2011.
        </p>

        <div className="stats">
          <div className="stat-card">
            <h2>${(totalAmountHacked / 1_000_000_000).toFixed(2)} Billion</h2>
            <p>Total Amount Hacked</p>
          </div>
          <div className="stat-card">
            <h2>{totalHacks}</h2>
            <p>Total Hacks Recorded</p>
          </div>
        </div>
      </header>

      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="search-section">
        <select
          value={searchCategory}
          onChange={(e) => {
            setSearchCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="search-select"
        >
          <option value="">All Categories</option>
          {uniqueCategories.map((category, index) => (
            <option key={index} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={searchChain}
          onChange={(e) => {
            setSearchChain(e.target.value);
            setCurrentPage(1);
          }}
          className="search-select"
        >
          <option value="">All Chains</option>
          {uniqueChains.map((chain, index) => (
            <option key={index} value={chain}>
              {chain}
            </option>
          ))}
        </select>
      </div>

      <section className="attack-trends">
        <h2>Attack Trends</h2>
        <div className="gradient-bar"></div>
        <div className="trends-list">
          {attackTrends.map((trend, index) => (
            <div key={index} className="trend-item">
              <div className="trend-left">
                <span
                  className="trend-dot"
                  style={{ backgroundColor: trend.color }}
                ></span>
                <span className="trend-name">{trend.category}</span>
              </div>
              <span className="trend-count">{trend.count}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="hack-list">
        {currentHacks.length > 0 ? (
          currentHacks.map((hack, index) => (
            <div key={index} className="hack-item">
              <div className="hack-header">
                <h2>{hack.target}</h2>
                <span className="chain-badge">{hack.chain}</span>
              </div>
              <div className="hack-details">
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(hack.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Amount:</strong> $
                  {hack.amount_in_usd.toLocaleString()} USD
                </p>
                <p>
                  <strong>Method:</strong> {hack.attacked_method}
                </p>
                <p>
                  <strong>Category:</strong> {hack.category}
                </p>
                <p>
                  <strong>Description:</strong> {hack.description}
                </p>
                <p>
                  <strong>Ref:</strong>{" "}
                  <a
                    href={hack.reference}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Link
                  </a>
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No hacks found matching your criteria.</p>
        )}
      </div>

      <div className="pagination">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-button"
        >
          ← Previous
        </button>
        <div className="page-numbers">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={`page-number ${currentPage === i + 1 ? "active" : ""}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          Next →
        </button>
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: "Inter", Arial, sans-serif;
          color: #ffffff;
          min-height: 100vh;
        }

        .header {
          text-align: center;
          padding: 30px 15px;
          background: linear-gradient(135deg, #2a0a3a 0%, #4b0082 100%);
          border-radius: 16px;
          margin-bottom: 20px;
          box-shadow: 0 8px 20px rgba(128, 0, 128, 0.4);
          position: relative;
          overflow: hidden;
        }

        h1 {
          font-size: clamp(1.8rem, 5vw, 3rem);
          margin-bottom: 15px;
          font-weight: 800;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 1;
        }

        .subheading {
          font-size: clamp(1rem, 3vw, 1.3rem);
          max-width: 90%;
          margin: 0 auto 20px;
          line-height: 1.6;
          color: #d8bfd8;
        }

        .chart-container {
          position: relative;
          width: 100%;
          height: 300px;
          margin: 20px auto;
          max-width: 800px;
          background: #1a001a;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 4px 15px rgba(128, 0, 128, 0.2);
        }

        .search-section {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          justify-content: center;
          margin: 20px 0;
        }

        .search-select {
          background: #2a0a3a;
          color: #d8bfd8;
          padding: 10px;
          border: 1px solid #4b0082;
          border-radius: 8px;
          font-size: 1rem;
          width: 100%;
          max-width: 300px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .search-select:hover {
          border-color: #ba55d3;
          background: #4b0082;
        }

        .search-select option {
          background: #2a0a3a;
          color: #d8bfd8;
        }

        .stats {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          padding: 0 10px;
        }

        .stat-card {
          background: rgba(75, 0, 130, 0.2);
          padding: 15px 30px;
          border-radius: 12px;
          flex: 1 1 200px;
          max-width: 300px;
          min-width: 200px;
          text-align: center;
          transition: transform 0.3s ease;
          border: 1px solid rgba(186, 85, 211, 0.3);
        }

        .stat-card h2 {
          color: #ba55d3;
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          margin: 0 0 5px;
          font-weight: 700;
        }

        .stat-card p {
          color: #d8bfd8;
          font-size: clamp(0.9rem, 2vw, 1.1rem);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .attack-trends {
          background: linear-gradient(145deg, #1a001a, #2a0a3a);
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 20px;
        }

        .attack-trends h2 {
          font-size: clamp(1.5rem, 4vw, 2rem);
          margin-bottom: 15px;
        }

        .gradient-bar {
          height: 6px;
          background: linear-gradient(
            90deg,
            #ff4d4f,
            #ff7a45,
            #ffeb3b,
            #b7eb8f,
            #36cfc9,
            #40a9ff,
            #9254de
          );
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .trends-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .trend-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: clamp(0.9rem, 2.5vw, 1.1rem);
        }

        .trend-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .trend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }

        .trend-name {
          color: #d8bfd8;
        }

        .trend-count {
          color: #d8bfd8;
        }

        .hack-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .hack-item {
          background: linear-gradient(145deg, #1a001a, #2a0a3a);
          padding: 15px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(128, 0, 128, 0.2);
          transition: transform 0.3s ease, background 0.3s ease;
        }

        .hack-item:hover {
          transform: scale(1.02);
          background: linear-gradient(145deg, #2a0a3a, #4b0082);
        }

        .hack-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          gap: 10px;
        }

        .hack-header h2 {
          color: #800080;
          font-size: clamp(1.2rem, 3vw, 1.5rem);
          margin: 0;
        }

        .chain-badge {
          background-color: #4b0082;
          color: #ffffff;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: clamp(0.7rem, 2vw, 0.9rem);
          border: 1px solid #ba55d3;
        }

        .hack-details p {
          margin: 6px 0;
          color: #d8bfd8;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
        }

        .hack-details strong {
          color: #ffffff;
        }

        .hack-details a {
          color: #40c4ff;
          text-decoration: none;
        }

        .hack-details a:hover {
          text-decoration: underline;
        }

        .no-results {
          text-align: center;
          color: #d8bfd8;
          font-size: clamp(1rem, 3vw, 1.2rem);
          padding: 15px;
        }

        .pagination {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
          padding: 0 10px;
        }

        .pagination-button {
          background: linear-gradient(90deg, #800080, #4b0082);
          color: #ffffff;
          padding: 8px 15px;
          border: none;
          border-radius: 8px;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .pagination-button:disabled {
          background: #2a0a3a;
          cursor: not-allowed;
        }

        .pagination-button:hover:not(:disabled) {
          background: linear-gradient(90deg, #ba55d3, #800080);
        }

        .page-numbers {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .page-number {
          background-color: #2a0a3a;
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          border: none;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .page-number:hover {
          background-color: #4b0082;
          transform: scale(1.1);
        }

        .page-number.active {
          background-color: #ba55d3;
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .container {
            padding: 15px;
          }

          .header {
            padding: 20px 10px;
          }

          .chart-container {
            height: 250px;
          }

          .search-section {
            flex-direction: column;
            align-items: center;
          }

          .search-select {
            max-width: 100%;
          }

          .stats {
            flex-direction: column;
            align-items: center;
          }

          .stat-card {
            max-width: 100%;
            padding: 15px 20px;
          }

          .attack-trends {
            padding: 15px;
          }

          .hack-item {
            padding: 10px;
          }
        }

        @media (max-width: 480px) {
          .chart-container {
            height: 200px;
          }

          .pagination-button {
            padding: 6px 12px;
          }

          .page-number {
            padding: 5px 10px;
          }

          .stat-card {
            padding: 10px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Page;