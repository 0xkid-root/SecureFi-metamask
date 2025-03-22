// src/app/contract-builder/templates.ts
import React, { ReactNode } from 'react';
import { Cube, Lightning, Gear, Coin, Lock, CheckSquare } from 'phosphor-react';

export interface ContractTemplate {
  name: string;
  description: string;
  icon: ReactNode;
  features: string[];
  defaultParams?: Record<string, string>;
  baseCode: string;
}

// Custom implementation of ERC20 without OpenZeppelin
const ERC20_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CustomToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    bool public paused;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(bool isPaused);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    constructor(string memory name_, string memory symbol_, uint256 initialSupply) {
        name = name_;
        symbol = symbol_;
        owner = msg.sender;
        _mint(msg.sender, initialSupply * 10**decimals);
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public whenNotPaused returns (bool) {
        require(to != address(0), "Transfer to zero address");
        
        uint256 senderBalance = _balances[msg.sender];
        require(senderBalance >= amount, "Insufficient balance");
        
        _balances[msg.sender] = senderBalance - amount;
        _balances[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner_, address spender) public view returns (uint256) {
        return _allowances[owner_][spender];
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public whenNotPaused returns (bool) {
        require(to != address(0), "Transfer to zero address");
        
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");
        
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "Insufficient balance");
        
        _balances[from] = fromBalance - amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] = currentAllowance - amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function _mint(address to, uint256 amount) internal virtual {
        require(to != address(0), "Mint to zero address");
        totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) public {
        uint256 accountBalance = _balances[msg.sender];
        require(accountBalance >= amount, "Burn amount exceeds balance");
        _balances[msg.sender] = accountBalance - amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
    
    function pause() public onlyOwner {
        paused = true;
        emit Paused(true);
    }
    
    function unpause() public onlyOwner {
        paused = false;
        emit Paused(false);
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}`;

// Custom implementation of NFT without OpenZeppelin
const NFT_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CustomNFT {
    string public name;
    string public symbol;
    address public owner;
    bool public paused;
    
    string private baseURI;
    uint256 private _nextTokenId;
    
    // Token data
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => string) private _tokenURIs;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(bool isPaused);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    constructor(string memory name_, string memory symbol_, string memory baseURI_) {
        name = name_;
        symbol = symbol_;
        baseURI = baseURI_;
        owner = msg.sender;
    }
    
    function balanceOf(address owner_) public view returns (uint256) {
        require(owner_ != address(0), "Zero address");
        return _balances[owner_];
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner_ = _owners[tokenId];
        require(owner_ != address(0), "Token doesn't exist");
        return owner_;
    }
    
    function approve(address to, uint256 tokenId) public {
        address owner_ = ownerOf(tokenId);
        require(msg.sender == owner_ || isApprovedForAll(owner_, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(owner_, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token doesn't exist");
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public {
        require(msg.sender != operator, "Self approval");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address owner_, address operator) public view returns (bool) {
        return _operatorApprovals[owner_][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public whenNotPaused {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        require(ownerOf(tokenId) == from, "Wrong owner");
        require(to != address(0), "Zero address");
        
        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    function mint(address to) public onlyOwner whenNotPaused returns (uint256) {
        require(to != address(0), "Zero address");
        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        _balances[to] += 1;
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner_ = ownerOf(tokenId);
        return (spender == owner_ || getApproved(tokenId) == spender || isApprovedForAll(owner_, spender));
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token doesn't exist");
        string memory _tokenURI = _tokenURIs[tokenId];
        return bytes(_tokenURI).length > 0 ? _tokenURI : string(abi.encodePacked(baseURI, tokenId));
    }
    
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }
    
    function pause() public onlyOwner {
        paused = true;
        emit Paused(true);
    }
    
    function unpause() public onlyOwner {
        paused = false;
        emit Paused(false);
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}`;

// Custom implementation of Crowdfunding Contract
const CROWDFUNDING_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Crowdfunding {
    address public owner;
    string public projectName;
    uint256 public fundingGoal;
    uint256 public deadline;
    uint256 public totalFunds;
    bool public completed;

    mapping(address => uint256) public contributions;
    address[] public contributors;

    event Contribution(address indexed contributor, uint256 amount);
    event GoalReached(uint256 totalFunds);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event Refund(address indexed contributor, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier beforeDeadline() {
        require(block.timestamp < deadline, "Deadline passed");
        _;
    }

    modifier afterDeadline() {
        require(block.timestamp >= deadline, "Before deadline");
        _;
    }

    constructor(string memory _projectName, uint256 _fundingGoal, uint256 _duration) {
        owner = msg.sender;
        projectName = _projectName;
        fundingGoal = _fundingGoal * 1 ether;
        deadline = block.timestamp + (_duration * 1 days);
    }

    function contribute() external payable beforeDeadline {
        require(msg.value > 0, "Contribution must be greater than 0");
        require(!completed, "Funding completed");

        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
        }
        contributions[msg.sender] += msg.value;
        totalFunds += msg.value;

        emit Contribution(msg.sender, msg.value);

        if (totalFunds >= fundingGoal) {
            completed = true;
            emit GoalReached(totalFunds);
        }
    }

    function withdrawFunds() external onlyOwner afterDeadline {
        require(completed, "Goal not reached");
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds to withdraw");

        (bool sent, ) = owner.call{value: amount}("");
        require(sent, "Failed to send funds");

        emit FundsWithdrawn(owner, amount);
    }

    function refund() external afterDeadline {
        require(!completed, "Goal reached, no refunds");
        uint256 amount = contributions[msg.sender];
        require(amount > 0, "No contributions");

        contributions[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send refund");

        emit Refund(msg.sender, amount);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}`;

// Custom implementation of Staking Contract
const STAKING_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Staking {
    address public owner;
    uint256 public rewardRate; // Rewards per second
    uint256 public totalStaked;

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaim;
    }

    mapping(address => Stake) public stakes;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(uint256 _rewardRate) {
        owner = msg.sender;
        rewardRate = _rewardRate;
    }

    function stake() external payable {
        require(msg.value > 0, "Stake amount must be greater than 0");

        Stake storage userStake = stakes[msg.sender];
        if (userStake.amount > 0) {
            updateRewards(msg.sender);
        } else {
            userStake.startTime = block.timestamp;
        }

        userStake.amount += msg.value;
        userStake.lastClaim = block.timestamp;
        totalStaked += msg.value;

        emit Staked(msg.sender, msg.value);
    }

    function unstake(uint256 amount) external {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");

        updateRewards(msg.sender);

        userStake.amount -= amount;
        totalStaked -= amount;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send funds");

        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external {
        updateRewards(msg.sender);
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        rewards[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: reward}("");
        require(sent, "Failed to send rewards");

        emit RewardClaimed(msg.sender, reward);
    }

    function updateRewards(address user) internal {
        Stake storage userStake = stakes[user];
        if (userStake.amount > 0) {
            uint256 timeElapsed = block.timestamp - userStake.lastClaim;
            rewards[user] += (userStake.amount * rewardRate * timeElapsed) / 1e18;
            userStake.lastClaim = block.timestamp;
        }
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }

    function getStakeInfo(address user) external view returns (uint256 amount, uint256 pendingReward) {
        Stake memory userStake = stakes[user];
        uint256 timeElapsed = block.timestamp - userStake.lastClaim;
        pendingReward = rewards[user] + (userStake.amount * rewardRate * timeElapsed) / 1e18;
        return (userStake.amount, pendingReward);
    }
}`;

// Custom implementation of Voting Contract
const VOTING_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Voting {
    address public owner;
    string public proposal;
    uint256 public votingEndTime;
    bool public votingClosed;

    struct Vote {
        bool hasVoted;
        bool support;
    }

    mapping(address => Vote) public votes;
    uint256 public votesFor;
    uint256 public votesAgainst;

    event Voted(address indexed voter, bool support);
    event VotingClosed(bool approved);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier votingOpen() {
        require(block.timestamp < votingEndTime && !votingClosed, "Voting closed");
        _;
    }

    constructor(string memory _proposal, uint256 _duration) {
        owner = msg.sender;
        proposal = _proposal;
        votingEndTime = block.timestamp + (_duration * 1 days);
    }

    function vote(bool support) external votingOpen {
        Vote storage voter = votes[msg.sender];
        require(!voter.hasVoted, "Already voted");

        voter.hasVoted = true;
        voter.support = support;

        if (support) {
            votesFor += 1;
        } else {
            votesAgainst += 1;
        }

        emit Voted(msg.sender, support);
    }

    function closeVoting() external onlyOwner {
        require(block.timestamp >= votingEndTime || votesFor + votesAgainst > 0, "Voting still active");
        votingClosed = true;
        emit VotingClosed(votesFor > votesAgainst);
    }

    function getVotingResult() external view returns (string memory, uint256, uint256, bool) {
        return (proposal, votesFor, votesAgainst, votingClosed ? votesFor > votesAgainst : false);
    }
}`;

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    name: 'ERC20 Token',
    description: 'Create a custom ERC20 token with advanced features',
    icon: React.createElement(Cube, { size: 24 }),
    features: ['Mintable', 'Burnable', 'Pausable', 'Access Control'],
    defaultParams: {
      name: 'My Token',
      symbol: 'MTK',
      initialSupply: '1000000'
    },
    baseCode: ERC20_BASE
  },
  {
    name: 'NFT Collection',
    description: 'Launch your own NFT collection with ERC721',
    icon: React.createElement(Lightning, { size: 24 }),
    features: ['Minting', 'Metadata Support', 'Access Control', 'Pausable'],
    defaultParams: {
      name: 'My NFT Collection',
      symbol: 'MNFT',
      baseURI: 'ipfs://'
    },
    baseCode: NFT_BASE
  },
  {
    name: 'Custom Contract',
    description: 'Build a custom smart contract from scratch',
    icon: React.createElement(Gear, { size: 24 }),
    features: ['Full Customization', 'AI Assistance', 'Best Practices', 'Security First'],
    baseCode: ''
  },
  {
    name: 'Crowdfunding',
    description: 'Create a crowdfunding campaign with refund support',
    icon: React.createElement(Coin, { size: 24 }), // Replaced PiggyBank with Coin
    features: ['Funding Goal', 'Refunds', 'Deadline', 'Owner Withdrawal'],
    defaultParams: {
      projectName: 'My Crowdfunding Project',
      fundingGoal: '10', // In Ether
      duration: '30' // In days
    },
    baseCode: CROWDFUNDING_BASE
  },
  {
    name: 'Staking',
    description: 'Set up a staking contract with rewards',
    icon: React.createElement(Lock, { size: 24 }),
    features: ['Stake/Unstake', 'Reward System', 'Owner Control', 'Real-time Rewards'],
    defaultParams: {
      rewardRate: '1000000000000000' // Rewards per second (adjust as needed)
    },
    baseCode: STAKING_BASE
  },
  {
    name: 'Voting',
    description: 'Create a decentralized voting system',
    icon: React.createElement(CheckSquare, { size: 24 }), // Replaced Ballot with CheckSquare
    features: ['Proposal Voting', 'Deadline', 'Result Tracking', 'Owner Closure'],
    defaultParams: {
      proposal: 'Should we proceed with the project?',
      duration: '7' // In days
    },
    baseCode: VOTING_BASE
  }
];