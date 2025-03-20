"use client"

import React, { useState } from "react";
import web3HackhubRaw from "./test.json";

// Define types
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

// Handle JSON import
const hacks: Hack[] = Array.isArray(web3HackhubRaw)
  ? (web3HackhubRaw as Hack[])
  : ((web3HackhubRaw as { const?: Hack[] }).const as Hack[]) || [];

const Page = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchChain, setSearchChain] = useState("");
  const postsPerPage = 7;

  // Get unique categories and chains for dropdowns
  const uniqueCategories = [...new Set(hacks.map(hack => hack.category))];
  const uniqueChains = [...new Set(hacks.map(hack => hack.chain))];

  // Filter hacks based on search criteria
  const filteredHacks = hacks.filter(hack => {
    const matchesCategory = searchCategory 
      ? hack.category.toLowerCase().includes(searchCategory.toLowerCase())
      : true;
    const matchesChain = searchChain
      ? hack.chain.toLowerCase().includes(searchChain.toLowerCase())
      : true;
    return matchesCategory && matchesChain;
  });

  // Calculate totals and trends from filtered data
  const totalAmountHacked = filteredHacks.reduce((sum, hack) => sum + hack.amount_in_usd, 0);
  const totalHacks = filteredHacks.length;

  const attackTrendsMap: { [key: string]: number } = filteredHacks.reduce((acc, hack) => {
    const category = hack.category || "Unknown";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const attackTrends: AttackTrend[] = Object.entries(attackTrendsMap)
    .map(([category, count], index) => ({
      category,
      count,
      color: [
        "#ff4d4f", "#ff7a45", "#ffeb3b", "#b7eb8f", "#36cfc9",
        "#40a9ff", "#9254de", "#d3adf7", "#d9d9d9", "#bfbfbf"
      ][index % 10],
    }))
    .sort((a, b) => b.count - a.count);

  // Pagination
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
            <h2>${(totalAmountHacked / 1000000000).toFixed(2)} Billion</h2>
            <p>Total Amount Hacked Since 2011</p>
          </div>
          <div className="stat-card">
            <h2>{totalHacks}</h2>
            <p>Total Hacks Recorded</p>
          </div>
        </div>
      </header>


{/* Search Section */}
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
              <span className="trend-dot" style={{ backgroundColor: trend.color }}></span>
              <span className="trend-name">{trend.category}</span>
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
                <p><strong>Date:</strong> {new Date(hack.date).toLocaleDateString()}</p>
                <p><strong>Amount Lost:</strong> ${hack.amount_in_usd.toLocaleString()} USD</p>
                <p><strong>Attack Method:</strong> {hack.attacked_method}</p>
                <p><strong>Category:</strong> {hack.category}</p>
                <p><strong>Description:</strong> {hack.description}</p>
                <p>
                  <strong>Reference:</strong>{" "}
                  <a href={hack.reference} target="_blank" rel="noopener noreferrer">
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
          padding: 40px 20px;
          font-family: 'Inter', Arial, sans-serif;
          color: #ffffff;
          min-height: 100vh;
        }

        .header {
          text-align: center;
          padding: 50px 20px;
          background: linear-gradient(135deg, #2a0a3a 0%, #4b0082 100%);
          border-radius: 16px;
          margin-bottom: 40px;
          box-shadow: 0 8px 20px rgba(128, 0, 128, 0.4);
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          opacity: 0.3;
        }
        h1 {
          color: #ffffff;
          font-size: 3rem;
          margin-bottom: 20px;
          font-weight: 800;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 1;
        }
        .subheading {
          color: #d8bfd8;
          font-size: 1.3rem;
          max-width: 700px;
          margin: 0 auto 30px;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }

        .search-section {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin: 20px 0;
          position: relative;
          z-index: 1;
        }
        .search-select {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          color: #ffffff;
          padding: 10px 15px;
          border: 1px solid #4b0082;
          border-radius: 8px;
          font-size: 1rem;
          min-width: 200px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .search-select:hover {
          border-color: #ba55d3;
          background: rgba(255, 255, 255, 0.1);
        }
        .search-select:focus {
          outline: none;
          border-color: #9932cc;
          box-shadow: 0 0 5px rgba(128, 0, 128, 0.5);
        }
        .search-select option {
          background: #2a0a3a;
          color: #ffffff;
        }

        .stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          position: relative;
          z-index: 1;
        }
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          padding: 20px;
          border-radius: 12px;
          min-width: 200px;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 15px rgba(128, 0, 128, 0.5);
        }
        .stat-card h2 {
          color: #ba55d3;
          font-size: 2.2rem;
          margin: 0 0 10px;
          font-weight: 700;
        }
        .stat-card p {
          color: #d8bfd8;
          font-size: 1rem;
          margin: 0;
        }

        .attack-trends {
          background: linear-gradient(145deg, #1a001a, #2a0a3a);
          padding: 30px;
          border-radius: 16px;
          margin-bottom: 40px;
          box-shadow: 0 4px 15px rgba(128, 0, 128, 0.2);
        }
        .attack-trends h2 {
          color: #ffffff;
          font-size: 2rem;
          margin-bottom: 20px;
          font-weight: 700;
        }
        .gradient-bar {
          height: 8px;
          background: linear-gradient(
            90deg,
            #ff4d4f,
            #ff7a45,
            #ffeb3b,
            #b7eb8f,
            #36cfc9,
            #40a9ff,
            #9254de,
            #d3adf7,
            #d9d9d9,
            #bfbfbf
          );
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .trends-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .trend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.1rem;
        }
        .trend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .trend-name {
          color: #d8bfd8;
          flex: 1;
        }
        .trend-count {
          color: #ba55d3;
          font-weight: 600;
        }

        .hack-list {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        .hack-item {
          background: linear-gradient(145deg, #1a001a, #2a0a3a);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(128, 0, 128, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hack-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(128, 0, 128, 0.4);
        }
        .hack-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .hack-header h2 {
          margin: 0;
          color: #800080;
          font-size: 1.5rem;
          font-weight: 600;
        }
        .chain-badge {
          background-color: #4b0082;
          color: #ffffff;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .hack-details p {
          margin: 8px 0;
          color: #d8bfd8;
          font-size: 1rem;
          line-height: 1.5;
        }
        .no-results {
          text-align: center;
          color: #d8bfd8;
          font-size: 1.2rem;
          padding: 20px;
        }
        a {
          color: #9932cc;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        a:hover {
          color: #ba55d3;
          text-decoration: underline;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          margin-top: 40px;
        }
        .pagination-button {
          background: linear-gradient(90deg, #800080, #4b0082);
          color: #ffffff;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s ease, transform 0.2s ease;
        }
        .pagination-button:hover:not(:disabled) {
          background: linear-gradient(90deg, #9932cc, #800080);
          transform: scale(1.05);
        }
        .pagination-button:disabled {
          background: #4b004b;
          cursor: not-allowed;
          opacity: 0.6;
        }
        .page-numbers {
          display: flex;
          gap: 10px;
        }
        .page-number {
          background-color: #2a0a3a;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 6px;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }
        .page-number:hover {
          background-color: #4b0082;
          transform: scale(1.1);
        }
        .page-number.active {
          background-color: #ba55d3;
          font-weight: bold;
          transform: scale(1.1);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .header,
        .attack-trends,
        .hack-item {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Page;