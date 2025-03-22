import React, { ReactNode } from 'react';
import { Cube, Lightning, Gear, Lock, ChartPie, Clock } from 'phosphor-react';

export interface ContractTemplate {
  name: string;
  description: string;
  icon: ReactNode;
  features: string[];
  defaultParams?: Record<string, string>;
  baseCode: string;
}

// Updated ERC20_BASE with advanced features
const ERC20_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CustomToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    bool public paused;
    
    // Fee-on-transfer settings
    uint256 public feePercent; // Fee percentage (e.g., 100 = 1%)
    address public feeRecipient;
    bool public feeEnabled;
    
    // Anti-bot settings
    uint256 public maxTransferAmount; // Max amount per transfer (0 = unlimited)
    uint256 public transferCooldown; // Cooldown in seconds between transfers
    mapping(address => uint256) private _lastTransfer;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Reentrancy guard
    bool private _locked;
    
    // EIP-2612 permit support
    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant PERMIT_TYPEHASH = keccak256(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );
    mapping(address => uint256) public nonces;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(bool isPaused);
    event FeeUpdated(bool enabled, uint256 feePercent, address feeRecipient);
    event AntiBotUpdated(uint256 maxTransferAmount, uint256 transferCooldown);
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor(string memory name_, string memory symbol_, uint256 initialSupply) {
        name = name_;
        symbol = symbol_;
        owner = msg.sender;
        _mint(msg.sender, initialSupply * 10**decimals);
        
        // Initialize EIP-2612 DOMAIN_SEPARATOR
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
        
        // Default anti-bot settings
        maxTransferAmount = 0; // Unlimited by default
        transferCooldown = 0; // No cooldown by default
        feeEnabled = false; // Fees disabled by default
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public whenNotPaused nonReentrant returns (bool) {
        _checkAntiBot(msg.sender, amount);
        return _transfer(msg.sender, to, amount);
    }
    
    function allowance(address owner_, address spender) public view returns (uint256) {
        return _allowances[owner_][spender];
    }
    
    function approve(address spender, uint256 amount) public whenNotPaused returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public whenNotPaused nonReentrant returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");
        _approve(from, msg.sender, currentAllowance - amount);
        _checkAntiBot(from, amount);
        return _transfer(from, to, amount);
    }
    
    function permit(
        address owner_,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(block.timestamp <= deadline, "Permit expired");
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, owner_, spender, value, nonces[owner_]++, deadline))
            )
        );
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress != address(0) && recoveredAddress == owner_, "Invalid signature");
        _approve(owner_, spender, value);
    }
    
    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(_balances[from] >= amount, "Insufficient balance");
        
        uint256 amountAfterFee = amount;
        if (feeEnabled && feePercent > 0 && feeRecipient != address(0)) {
            uint256 fee = (amount * feePercent) / 10000;
            amountAfterFee = amount - fee;
            _balances[feeRecipient] += fee;
            emit Transfer(from, feeRecipient, fee);
        }
        
        _balances[from] -= amount;
        _balances[to] += amountAfterFee;
        emit Transfer(from, to, amountAfterFee);
        return true;
    }
    
    function _approve(address owner_, address spender, uint256 amount) internal {
        require(spender != address(0), "Approve to zero address");
        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }
    
    function _mint(address to, uint256 amount) internal virtual {
        require(to != address(0), "Mint to zero address");
        totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
        emit Minted(to, amount);
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) public nonReentrant {
        uint256 accountBalance = _balances[msg.sender];
        require(accountBalance >= amount, "Burn amount exceeds balance");
        _balances[msg.sender] = accountBalance - amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
        emit Burned(msg.sender, amount);
    }
    
    function burnFrom(address account, uint256 amount) public nonReentrant {
        uint256 currentAllowance = _allowances[account][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");
        _approve(account, msg.sender, currentAllowance - amount);
        require(_balances[account] >= amount, "Burn amount exceeds balance");
        _balances[account] -= amount;
        totalSupply -= amount;
        emit Transfer(account, address(0), amount);
        emit Burned(account, amount);
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
    
    function setFee(bool enabled, uint256 newFeePercent, address newFeeRecipient) public onlyOwner {
        require(newFeePercent <= 1000, "Fee too high"); // Max 10%
        require(newFeeRecipient != address(0), "Invalid fee recipient");
        feeEnabled = enabled;
        feePercent = newFeePercent;
        feeRecipient = newFeeRecipient;
        emit FeeUpdated(enabled, newFeePercent, newFeeRecipient);
    }
    
    function setAntiBot(uint256 newMaxTransferAmount, uint256 newTransferCooldown) public onlyOwner {
        maxTransferAmount = newMaxTransferAmount;
        transferCooldown = newTransferCooldown;
        emit AntiBotUpdated(newMaxTransferAmount, newTransferCooldown);
    }
    
    function _checkAntiBot(address sender, uint256 amount) internal {
        if (maxTransferAmount > 0) {
            require(amount <= maxTransferAmount, "Transfer exceeds max amount");
        }
        if (transferCooldown > 0) {
            require(block.timestamp >= _lastTransfer[sender] + transferCooldown, "Transfer cooldown");
            _lastTransfer[sender] = block.timestamp;
        }
    }
}`;

// Updated NFT_BASE with advanced features
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
    
    // Reentrancy guard
    bool private _locked;
    
    // EIP-2981 royalty support
    uint256 public royaltyPercent; // Royalty percentage (e.g., 100 = 1%)
    address public royaltyRecipient;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(bool isPaused);
    event RoyaltyUpdated(address recipient, uint256 percent);
    event TokenBurned(uint256 indexed tokenId);
    event TokenURIsUpdated(uint256 indexed tokenId, string uri);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor(string memory name_, string memory symbol_, string memory baseURI_) {
        name = name_;
        symbol = symbol_;
        baseURI = baseURI_;
        owner = msg.sender;
        royaltyPercent = 250; // 2.5% default royalty
        royaltyRecipient = msg.sender;
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
    
    function approve(address to, uint256 tokenId) public whenNotPaused {
        address owner_ = ownerOf(tokenId);
        require(msg.sender == owner_ || isApprovedForAll(owner_, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(owner_, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token doesn't exist");
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public whenNotPaused {
        require(msg.sender != operator, "Self approval");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address owner_, address operator) public view returns (bool) {
        return _operatorApprovals[owner_][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public whenNotPaused nonReentrant {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        require(ownerOf(tokenId) == from, "Wrong owner");
        require(to != address(0), "Zero address");
        
        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    function mint(address to) public onlyOwner whenNotPaused nonReentrant returns (uint256) {
        require(to != address(0), "Zero address");
        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        _balances[to] += 1;
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }
    
    function batchMint(address to, uint256 amount) public onlyOwner whenNotPaused nonReentrant returns (uint256[] memory) {
        require(to != address(0), "Zero address");
        require(amount > 0, "Amount must be greater than 0");
        uint256[] memory tokenIds = new uint256[](amount);
        
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _nextTokenId++;
            _owners[tokenId] = to;
            _balances[to] += 1;
            tokenIds[i] = tokenId;
            emit Transfer(address(0), to, tokenId);
        }
        return tokenIds;
    }
    
    function burn(uint256 tokenId) public nonReentrant {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        address owner_ = ownerOf(tokenId);
        delete _tokenApprovals[tokenId];
        delete _tokenURIs[tokenId];
        _balances[owner_] -= 1;
        delete _owners[tokenId];
        emit Transfer(owner_, address(0), tokenId);
        emit TokenBurned(tokenId);
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner_ = ownerOf(tokenId);
        return (spender == owner_ || getApproved(tokenId) == spender || isApprovedForAll(owner_, spender));
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token doesn't exist");
        string memory _tokenURI = _tokenURIs[tokenId];
        return bytes(_tokenURI).length > 0 ? _tokenURI : string(abi.encodePacked(baseURI, _toString(tokenId)));
    }
    
    function setTokenURI(uint256 tokenId, string memory newURI) public onlyOwner {
        require(_owners[tokenId] != address(0), "Token doesn't exist");
        _tokenURIs[tokenId] = newURI;
        emit TokenURIsUpdated(tokenId, newURI);
    }
    
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }
    
    function setRoyalty(address recipient, uint256 percent) public onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(percent <= 1000, "Royalty too high"); // Max 10%
        royaltyRecipient = recipient;
        royaltyPercent = percent;
        emit RoyaltyUpdated(recipient, percent);
    }
    
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address, uint256) {
        require(_owners[tokenId] != address(0), "Token doesn't exist");
        uint256 royaltyAmount = (salePrice * royaltyPercent) / 10000;
        return (royaltyRecipient, royaltyAmount);
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
    
    // Helper function to convert uint256 to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}`;

// New Staking Contract Template
const STAKING_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract StakingContract {
    address public owner;
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    bool public paused;
    
    uint256 public rewardRate; // Rewards per second per staked token
    uint256 public totalStaked;
    
    struct Stake {
        uint256 amount;
        uint256 lastRewardTimestamp;
        uint256 accumulatedRewards;
    }
    
    mapping(address => Stake) public stakes;
    
    // Reentrancy guard
    bool private _locked;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event Paused(bool isPaused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor(address stakingToken_, address rewardToken_, uint256 rewardRate_) {
        owner = msg.sender;
        stakingToken = IERC20(stakingToken_);
        rewardToken = IERC20(rewardToken_);
        rewardRate = rewardRate_;
    }
    
    function stake(uint256 amount) public whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        updateRewards(msg.sender);
        stakes[msg.sender].amount += amount;
        totalStaked += amount;
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Staked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) public whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        updateRewards(msg.sender);
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }
    
    function claimRewards() public whenNotPaused nonReentrant {
        updateRewards(msg.sender);
        uint256 rewards = stakes[msg.sender].accumulatedRewards;
        require(rewards > 0, "No rewards to claim");
        stakes[msg.sender].accumulatedRewards = 0;
        require(rewardToken.transfer(msg.sender, rewards), "Reward transfer failed");
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    function updateRewards(address user) internal {
        if (stakes[user].amount > 0) {
            uint256 timeElapsed = block.timestamp - stakes[user].lastRewardTimestamp;
            stakes[user].accumulatedRewards += (stakes[user].amount * rewardRate * timeElapsed) / 1e18;
        }
        stakes[user].lastRewardTimestamp = block.timestamp;
    }
    
    function pendingRewards(address user) public view returns (uint256) {
        if (stakes[user].amount == 0) return stakes[user].accumulatedRewards;
        uint256 timeElapsed = block.timestamp - stakes[user].lastRewardTimestamp;
        return stakes[user].accumulatedRewards + (stakes[user].amount * rewardRate * timeElapsed) / 1e18;
    }
    
    function setRewardRate(uint256 newRate) public onlyOwner {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
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

// New Governance Contract Template
const GOVERNANCE_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GovernanceContract {
    address public owner;
    bool public paused;
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 endTime;
        bool executed;
        bool passed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public votingPower;
    uint256 public proposalCount;
    uint256 public votingDuration;
    
    // Reentrancy guard
    bool private _locked;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event Paused(bool isPaused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor(uint256 votingDuration_) {
        owner = msg.sender;
        votingDuration = votingDuration_;
    }
    
    function setVotingPower(address voter, uint256 power) public onlyOwner {
        votingPower[voter] = power;
    }
    
    function createProposal(string memory description) public whenNotPaused nonReentrant returns (uint256) {
        require(votingPower[msg.sender] > 0, "No voting power");
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            endTime: block.timestamp + votingDuration,
            executed: false,
            passed: false
        });
        emit ProposalCreated(proposalCount, msg.sender, description);
        return proposalCount;
    }
    
    function vote(uint256 proposalId, bool support) public whenNotPaused nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.endTime, "Voting period ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(votingPower[msg.sender] > 0, "No voting power");
        
        hasVoted[proposalId][msg.sender] = true;
        uint256 weight = votingPower[msg.sender];
        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }
        emit Voted(proposalId, msg.sender, support, weight);
    }
    
    function executeProposal(uint256 proposalId) public onlyOwner nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Already executed");
        
        proposal.executed = true;
        if (proposal.forVotes > proposal.againstVotes) {
            proposal.passed = true;
            // Execute proposal logic here (e.g., update contract state)
        }
        emit ProposalExecuted(proposalId, proposal.passed);
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

// New Vesting Contract Template
const VESTING_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract VestingContract {
    address public owner;
    IERC20 public token;
    bool public paused;
    
    struct VestingSchedule {
        address beneficiary;
        uint256 startTime;
        uint256 duration;
        uint256 totalAmount;
        uint256 releasedAmount;
    }
    
    mapping(address => VestingSchedule) public schedules;
    
    // Reentrancy guard
    bool private _locked;
    
    event VestingScheduleCreated(address indexed beneficiary, uint256 totalAmount, uint256 startTime, uint256 duration);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event Paused(bool isPaused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor(address token_) {
        owner = msg.sender;
        token = IERC20(token_);
    }
    
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 duration
    ) public onlyOwner whenNotPaused nonReentrant {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(totalAmount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(schedules[beneficiary].totalAmount == 0, "Schedule already exists");
        
        schedules[beneficiary] = VestingSchedule({
            beneficiary: beneficiary,
            startTime: startTime,
            duration: duration,
            totalAmount: totalAmount,
            releasedAmount: 0
        });
        emit VestingScheduleCreated(beneficiary, totalAmount, startTime, duration);
    }
    
    function release(address beneficiary) public nonReentrant {
        VestingSchedule storage schedule = schedules[beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(block.timestamp >= schedule.startTime, "Vesting not started");
        
        uint256 vestedAmount = _calculateVestedAmount(schedule);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;
        require(releasableAmount > 0, "No tokens to release");
        
        schedule.releasedAmount += releasableAmount;
        require(token.transfer(beneficiary, releasableAmount), "Transfer failed");
        emit TokensReleased(beneficiary, releasableAmount);
    }
    
    function _calculateVestedAmount(VestingSchedule memory schedule) internal view returns (uint256) {
        if (block.timestamp < schedule.startTime) return 0;
        if (block.timestamp >= schedule.startTime + schedule.duration) return schedule.totalAmount;
        return (schedule.totalAmount * (block.timestamp - schedule.startTime)) / schedule.duration;
    }
    
    function vestedAmount(address beneficiary) public view returns (uint256) {
        return _calculateVestedAmount(schedules[beneficiary]);
    }
    
    function releasableAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = schedules[beneficiary];
        return _calculateVestedAmount(schedule) - schedule.releasedAmount;
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

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    name: 'ERC20 Token',
    description: 'Create a custom ERC20 token with advanced features',
    icon: React.createElement(Cube, { size: 24 }),
    features: [
      'Mintable',
      'Burnable',
      'Pausable',
      'Access Control',
      'Fee-on-Transfer',
      'Anti-Bot Mechanisms',
      'EIP-2612 Permit'
    ],
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
    features: [
      'Minting',
      'Batch Minting',
      'Burnable',
      'Metadata Support',
      'Access Control',
      'Pausable',
      'EIP-2981 Royalties'
    ],
    defaultParams: {
      name: 'My NFT Collection',
      symbol: 'MNFT',
      baseURI: 'ipfs://'
    },
    baseCode: NFT_BASE
  },
  {
    name: 'Staking Contract',
    description: 'Create a staking contract for earning rewards',
    icon: React.createElement(Lock, { size: 24 }),
    features: [
      'Staking',
      'Reward Distribution',
      'Pausable',
      'Access Control',
      'Reentrancy Protection'
    ],
    defaultParams: {
      stakingToken: '0x0000000000000000000000000000000000000000',
      rewardToken: '0x0000000000000000000000000000000000000000',
      rewardRate: '1000000000000000' // 0.001 tokens per second per staked token
    },
    baseCode: STAKING_BASE
  },
  {
    name: 'Governance Contract',
    description: 'Create a governance contract for on-chain voting',
    icon: React.createElement(ChartPie, { size: 24 }),
    features: [
      'Proposal Creation',
      'Voting',
      'Pausable',
      'Access Control',
      'Reentrancy Protection'
    ],
    defaultParams: {
      votingDuration: '604800' // 7 days in seconds
    },
    baseCode: GOVERNANCE_BASE
  },
  {
    name: 'Vesting Contract',
    description: 'Create a vesting contract for token distribution',
    icon: React.createElement(Clock, { size: 24 }),
    features: [
      'Vesting Schedules',
      'Token Release',
      'Pausable',
      'Access Control',
      'Reentrancy Protection'
    ],
    defaultParams: {
      token: '0x0000000000000000000000000000000000000000'
    },
    baseCode: VESTING_BASE
  },
  {
    name: 'Custom Contract',
    description: 'Build a custom smart contract from scratch',
    icon: React.createElement(Gear, { size: 24 }),
    features: [
      'Full Customization',
      'AI Assistance',
      'Best Practices',
      'Security First'
    ],
    baseCode: ''
  }
];