# Questlog Smart Contracts

**Soulbound NFT Badge System for Web3 Achievements**

A comprehensive smart contract system built with **Solidity** and **Foundry** that enables decentralized quest completion and awards **soulbound NFT badges** as permanent proof of achievement.

> **Part of the Questlog Ecosystem**  
> - **Frontend**: [questlog-frontend](https://github.com/kashiwagiren/Questlog/blob/main/questlog-frontend/README.md) - React UI application
> - **Smart Contracts**: [questlog-contracts](https://github.com/kashiwagiren/Questlog/blob/main/questlog-contracts/README.md) - This repository  
> - **Backend**: [questlog-backend](https://github.com/kashiwagiren/Questlog/blob/main/questlog-backend/README.md) - Database and API services

## 🌐 Live Deployment

**Network**: Lisk Sepolia Testnet

- **QuestlogBadge Contract**: [`0xb4268cbf5e95a326646703a7435257899c151132`](https://sepolia-blockscout.lisk.com/address/0xb4268cbf5e95a326646703a7435257899c151132?tab=contract)
- **QuestMinter Contract**: [`0xFB4F07C9eDd02b3c1659Cfebc098300517558E9E`](https://sepolia-blockscout.lisk.com/address/0xFB4F07C9eDd02b3c1659Cfebc098300517558E9E?tab=contract)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Repository Structure](#-repository-structure)
- [Smart Contracts](#-smart-contracts)
- [Key Features](#-key-features)
- [Installation](#-installation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Frontend Integration](#-frontend-integration)
- [Security Considerations](#-security-considerations)

---

## 🌟 Overview

The Questlog smart contract system enables:

- **Quest Completion Tracking**: Users complete various tasks/challenges
- **Soulbound NFT Badges**: Non-transferable achievement tokens (ERC721)
- **Duplicate Prevention**: Each quest can only be completed once per user
- **Flexible Quest System**: Dynamic quest IDs - no need to pre-register quests
- **Cross-Device Synchronization**: On-chain storage for permanent records
- **Frontend Integration**: Seamless Web3 integration with the React frontend
- **Access Control**: Secure minting with proper authorization

## 📁 Repository Structure

```
questlog-contracts/
├── src/                     # Smart contract source code
│   ├── QuestlogBadge.sol   # Main soulbound NFT contract (ERC721)
│   └── QuestMinter.sol     # Quest completion and minting logic
├── script/                 # Deployment scripts
│   ├── DeployQuestlogBadge.s.sol   # Badge contract deployment
│   └── DeployQuestSystem.s.sol      # Complete system deployment
├── test/                   # Test suite
│   ├── QuestlogBadge.t.sol # Badge contract tests
│   └── QuestSystem.t.sol   # System integration tests
├── lib/                    # Dependencies
│   ├── forge-std/          # Foundry standard library
│   └── openzeppelin-contracts/  # OpenZeppelin contracts
├── broadcast/              # Deployment artifacts
├── out/                    # Compiled contracts
├── flat/                   # Flattened contracts for verification
│   ├── QuestlogBadgeFlattened.sol
│   └── QuestMinterFlattened.sol
├── foundry.toml           # Foundry configuration
├── deploy.sh              # Deployment script
└── .env.example           # Environment template
```

## 💎 Smart Contracts

### QuestlogBadge.sol
**Soulbound NFT Badge Contract (ERC721)**

- **Purpose**: Issues non-transferable achievement NFTs
- **Features**:
  - Soulbound tokens (cannot be transferred after minting)
  - Custom metadata for each quest badge
  - Owner-only minting through QuestMinter
  - Gas-optimized for badge collections

```solidity
// Key functions
function mintBadge(address to, uint256 questId, string memory tokenURI) external onlyMinter
function hasBadge(address user, uint256 questId) external view returns (bool)
function getUserBadges(address user) external view returns (uint256[] memory)
```

### QuestMinter.sol  
**Quest Completion and Minting Logic**

- **Purpose**: Validates quest completion and mints badges
- **Features**:
  - Quest completion verification
  - Duplicate prevention (one badge per quest per user)
  - Access control and security
  - Integration with frontend payment system

```solidity
// Key functions
function completeQuest(uint256 questId, string memory tokenURI) external payable
function hasCompletedQuest(address user, uint256 questId) external view returns (bool)
function getCompletedQuests(address user) external view returns (uint256[] memory)
```

## ✨ Key Features

### 🏆 Soulbound NFT System
- **Non-transferable**: Badges permanently linked to earner's wallet
- **ERC721 Compatible**: Standard NFT interface for marketplace support
- **Custom Metadata**: Each badge has unique quest-specific artwork and data

### 🔒 Security & Access Control
- **Owner-Only Minting**: Only authorized minter can issue badges
- **Duplicate Prevention**: Built-in checks prevent multiple badges for same quest
- **Reentrancy Protection**: Secure against common attack vectors

### ⚡ Gas Optimization
- **Efficient Storage**: Optimized data structures for reduced gas costs
- **Batch Operations**: Support for multiple badge operations
- **Minimal External Calls**: Reduced transaction complexity

## 🚀 Installation

### Prerequisites

- **Foundry** - Smart contract development framework
- **Git** - Version control
- **Node.js** - For additional tooling

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kashiwagiren/Questlog/questlog-contracts.git
   cd questlog-contracts
   ```

2. **Install dependencies**:
   ```bash
   forge install
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env
   # Add your private key and RPC URLs
   ```

4. **Compile contracts**:
   ```bash
   forge build
   ```

## 🧪 Testing

### Run Test Suite

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vv

# Run specific test file
forge test --match-path test/QuestlogBadge.t.sol

# Run with gas reporting
forge test --gas-report
```

### Test Coverage

```bash
# Generate coverage report
forge coverage

# Generate detailed HTML report
forge coverage --report lcov
genhtml lcov.info -o coverage
```

## 🚀 Deployment

### Local Testing

```bash
# Start local Anvil node
anvil

# Deploy to local network
forge script script/DeployQuestSystem.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Testnet Deployment (Lisk Sepolia)

```bash
# Deploy to Lisk Sepolia
forge script script/DeployQuestSystem.s.sol \
  --rpc-url https://rpc.sepolia-api.lisk.com \
  --broadcast \
  --verify
```

### Using Deploy Script

```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy with environment variables
./deploy.sh
```

## 🔗 Frontend Integration

### Wagmi Configuration

```typescript
import { questlogBadgeABI, questMinterABI } from './abis';

// Contract addresses (Lisk Sepolia)
export const QUESTLOG_BADGE_ADDRESS = '0xb4268cbf5e95a326646703a7435257899c151132';
export const QUEST_MINTER_ADDRESS = '0xFB4F07C9eDd02b3c1659Cfebc098300517558E9E';

// Wagmi contract configuration
export const questlogBadgeContract = {
  address: QUESTLOG_BADGE_ADDRESS,
  abi: questlogBadgeABI,
} as const;
```

### Example Usage

```typescript
// Complete a quest and mint badge
const { write } = useContractWrite({
  ...questMinterContract,
  functionName: 'completeQuest',
});

// Check if user has badge
const { data: hasBadge } = useContractRead({
  ...questlogBadgeContract, 
  functionName: 'hasBadge',
  args: [userAddress, questId],
});
```

## 🔐 Security Considerations

### Auditing

- **OpenZeppelin**: Built on battle-tested contract libraries
- **Custom Logic**: Additional security reviews recommended
- **Test Coverage**: Comprehensive test suite included

### Best Practices

- **Access Control**: Proper role-based permissions
- **Input Validation**: All parameters validated on-chain
- **Event Logging**: Comprehensive event emission for transparency
- **Upgrade Safety**: Immutable contracts for security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Write tests for new functionality
4. Ensure all tests pass: `forge test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Contract Interaction Flow

1. **User completes quest** in frontend (Discord join, social task, etc.)
2. **Frontend calls** `QuestMinter.completeQuestWithMetadata()`
3. **QuestMinter verifies** user hasn't completed quest before
4. **QuestMinter calls** `QuestlogBadge.mint()` to create NFT badge
5. **Badge is minted** as soulbound token to user's wallet
6. **Events emitted** for real-time frontend updates

---

## 📄 License

This project is licensed under the MIT License

---
