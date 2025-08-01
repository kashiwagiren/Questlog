# Questlog Smart Contracts

**Soulbound NFT Badge System for Web3 Achievements**

A comprehensive smart contract system built with **Solidity** and **Foundry** that enables decentralized quest completion and awards **soulbound NFT badges** as permanent proof of achievement.

> **Part of the Questlog Ecosystem**  
> - **Frontend**: [questlog-frontend](https://github.com/questlog/questlog-frontend) - React UI application
> - **Backend**: [questlog-backend](https://github.com/questlog/questlog-backend) - Database and API services  
> - **Smart Contracts**: [questlog-contracts](https://github.com/questlog/questlog-contracts) - This repository

## 🌐 Live Deployment

**Network**: Lisk Sepolia Testnet

- **QuestlogBadge Contract**: [`0xb4268cbf5e95a326646703a7435257899c151132`](https://sepolia-blockscout.lisk.com/address/0xb4268cbf5e95a326646703a7435257899c151132)
- **QuestMinter Contract**: [`0x09f3dd43ba9f9efcffeea8e5632b0c9b71bed90c`](https://sepolia-blockscout.lisk.com/address/0x09f3dd43ba9f9efcffeea8e5632b0c9b71bed90c)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Smart Contracts](#-smart-contracts)
- [Key Features](#-key-features)
- [Installation](#-installation)
- [Deployment](#-deployment)
- [Usage](#-usage)
- [Testing](#-testing)
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

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  QuestMinter    │    │ QuestlogBadge   │
│   (React/TS)    │───▶│   Contract      │───▶│   Contract      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Wagmi/RainbowKit│    │ Quest Validation│    │ Soulbound NFTs  │
│ Wallet Connect  │    │ Badge Minting   │    │ ERC721 Standard │
│ Transaction UI  │    │ Access Control  │    │ Non-Transferable│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Integration Flow

1. **Frontend**: User completes quest in React application
2. **Backend**: Quest data stored and validated in database  
3. **Smart Contracts**: Badge minting triggered via Web3 transaction
4. **Blockchain**: Permanent soulbound NFT badge stored on-chain

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

### 🌐 Frontend Integration
- **Wagmi Compatible**: Works seamlessly with React Web3 hooks
- **Event Emission**: Real-time updates for frontend synchronization
- **Error Handling**: Comprehensive error messages for better UX

## 🚀 Installation

### Prerequisites

- **Foundry** - Smart contract development framework
- **Git** - Version control
- **Node.js** - For additional tooling

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/questlog/questlog-contracts.git
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
export const QUEST_MINTER_ADDRESS = '0x09f3dd43ba9f9efcffeea8e5632b0c9b71bed90c';

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

## 📊 Gas Costs

| Operation | Estimated Gas | USD Cost* |
|-----------|---------------|-----------|
| Complete Quest | ~85,000 | $0.15 |
| Mint Badge | ~75,000 | $0.13 |  
| Check Badge Status | ~25,000 | $0.04 |

*Based on 20 gwei gas price and $2000 ETH

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Write tests for new functionality
4. Ensure all tests pass: `forge test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Web3 community**
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Quest Completion│    │ Completion      │    │ Soulbound NFT   │
│ UI & Validation │    │ Verification    │    │ Badge Minting   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Contract Interaction Flow

1. **User completes quest** in frontend (Discord join, social task, etc.)
2. **Frontend calls** `QuestMinter.completeQuestWithMetadata()`
3. **QuestMinter verifies** user hasn't completed quest before
4. **QuestMinter calls** `QuestlogBadge.mint()` to create NFT badge
5. **Badge is minted** as soulbound token to user's wallet
6. **Events emitted** for real-time frontend updates

---

## 📜 Smart Contracts

### 1. QuestlogBadge.sol

**Purpose**: ERC721 soulbound NFT contract for achievement badges

**Key Features**:

- ✅ **Soulbound Tokens**: Can only be minted or burned, never transferred
- ✅ **Authorized Minters**: Only approved contracts can mint badges
- ✅ **Metadata Storage**: Each badge has associated IPFS metadata
- ✅ **Burn Functionality**: Badge holders can destroy their badges

**Core Functions**:

```solidity
function mint(address to, string calldata uri) external onlyMinter returns (uint256)
function addMinter(address account) external onlyOwner
function burn(uint256 tokenId) external
```

### 2. QuestMinter.sol

**Purpose**: Quest completion logic and badge distribution system

**Key Features**:

- ✅ **Quest Completion Tracking**: Prevents duplicate quest completions
- ✅ **Dynamic Quest IDs**: No need to pre-register quests
- ✅ **Automatic Badge Minting**: Awards NFT badges upon quest completion
- ✅ **User Query Functions**: Get user's completed quests and badges

**Core Functions**:

```solidity
function completeQuestWithMetadata(bytes32 questId, string calldata badgeURI) external returns (uint256)
function getUserCompletedQuests(address user) external view returns (bytes32[] memory)
function getHasCompletedQuest(bytes32 questId, address user) external view returns (bool)
```

---

## 🚀 Key Features

### Soulbound NFT Technology

- **Non-Transferable**: Badges stay permanently with the earner
- **Proof of Achievement**: Verifiable on-chain accomplishments
- **Profile Building**: Accumulate badges to build Web3 reputation

### Flexible Quest System

- **Dynamic Quest IDs**: Use `keccak256("quest-name")` for unique identifiers
- **No Pre-Registration**: Create new quest types on-the-fly
- **Metadata Flexibility**: Store badge images/descriptions on IPFS

### Gas-Optimized Design

- **Counters Library**: Safe token ID increment without overflow risk
- **Efficient Storage**: Optimized mappings for quest completion tracking
- **Event-Driven**: Real-time frontend updates via contract events

---

## 🛠️ Installation

### Prerequisites

- **Node.js** 18+ and **npm**
- **Foundry** for Solidity development

### Setup

1. **Clone the repository**:

```bash
git clone https://github.com/your-username/questlog-contracts.git
cd questlog-contracts
```

2. **Install Foundry dependencies**:

```bash
forge install
```

3. **Create environment file**:

```bash
cp .env.example .env
# Add your PRIVATE_KEY to .env
```

4. **Compile contracts**:

```bash
forge build
```

---

## 🚀 Deployment

### Option 1: Automated Deployment (Recommended)

Use the included deployment script:

```bash
./deploy.sh
```

This script will:

- ✅ Deploy QuestlogBadge contract
- ✅ Deploy QuestMinter contract
- ✅ Set up minter permissions
- ✅ Verify contracts on block explorer

### Option 2: Manual Deployment

```bash
# Deploy to Lisk Sepolia testnet
forge script script/DeployQuestSystem.s.sol:DeployQuestSystem \
    --rpc-url https://rpc.sepolia-api.lisk.com \
    --broadcast \
    --verify

# Update frontend configuration
./update-frontend.sh <questlog_badge_address> <quest_minter_address>
```

### Environment Variables Required

```env
PRIVATE_KEY=your_private_key_here_without_0x_prefix
```

---

## 💻 Usage

### Complete a Quest

```solidity
// Example: User completes Discord join quest
bytes32 questId = keccak256("discord-join-quest");
string memory badgeURI = "ipfs://QmHash.../badge-metadata.json";

uint256 tokenId = questMinter.completeQuestWithMetadata(questId, badgeURI);
```

### Check Quest Completion

```solidity
// Check if user completed specific quest
bool hasCompleted = questMinter.getHasCompletedQuest(
    keccak256("discord-join-quest"),
    userAddress
);

// Get all completed quests for user
bytes32[] memory completedQuests = questMinter.getUserCompletedQuests(userAddress);
```

### Quest ID Examples

```solidity
keccak256("discord-join")           // Discord server join
keccak256("twitter-follow")         // Social media follow
keccak256("first-transaction")      // On-chain activity
keccak256("community-contribution") // Custom achievements
```

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
forge test

# Run with gas reporting
forge test --gas-report

# Run specific test file
forge test --match-path test/QuestSystem.t.sol

# Run with verbose output
forge test -vvv
```

### Test Coverage

- ✅ **Soulbound Token Logic**: Prevents transfers while allowing mint/burn
- ✅ **Quest Completion**: Verifies duplicate prevention and badge minting
- ✅ **Access Control**: Tests minter authorization and owner functions
- ✅ **Integration**: End-to-end quest completion and badge awarding

---

## 🌐 Frontend Integration

### Wagmi Configuration

```typescript
// src/config/wagmi.ts
export const QUESTLOG_CONTRACT_ADDRESS =
  "0xb4268cbf5e95a326646703a7435257899c151132";
export const QUEST_MINTER_ADDRESS =
  "0x09f3dd43ba9f9efcffeea8e5632b0c9b71bed90c";
```

### React Hook Example

```typescript
import { useWriteContract } from "wagmi";

const { writeContract } = useWriteContract();

const completeQuest = async (questId: string, badgeURI: string) => {
  const hash = await writeContract({
    address: QUEST_MINTER_ADDRESS,
    abi: questMinterABI,
    functionName: "completeQuestWithMetadata",
    args: [keccak256(questId), badgeURI],
  });
};
```

### Event Listening

```typescript
// Listen for quest completion events
const { data: logs } = useWatchContractEvent({
  address: QUEST_MINTER_ADDRESS,
  abi: questMinterABI,
  eventName: "QuestCompleted",
  onLogs: (logs) => {
    // Update UI when quests are completed
  },
});
```

---

## 🔒 Security Considerations

### Access Control

- **Owner-Only Functions**: Critical functions restricted to contract owner
- **Minter Authorization**: Only approved contracts can mint badges
- **Input Validation**: All functions validate inputs and prevent zero addresses

### Soulbound Security

- **Transfer Prevention**: `_beforeTokenTransfer` override blocks all transfers
- **Burn Protection**: Only token owners or contract owner can burn badges
- **Immutable References**: Contract addresses are immutable after deployment

### Best Practices

- **OpenZeppelin Integration**: Uses battle-tested contract libraries
- **Event Emission**: All state changes emit events for transparency
- **Gas Optimization**: Efficient storage patterns and counter usage

---

## 📁 Project Structure

```
questlog-contracts/
├── src/
│   ├── QuestlogBadge.sol      # Soulbound NFT contract
│   └── QuestMinter.sol        # Quest completion logic
├── script/
│   ├── DeployQuestSystem.s.sol   # Complete deployment script
│   └── DeployQuestlogBadge.s.sol # Badge-only deployment
├── test/
│   ├── QuestlogBadge.t.sol    # Badge contract tests
│   └── QuestSystem.t.sol      # Integration tests
├── lib/                       # Foundry dependencies
├── foundry.toml              # Foundry configuration
├── deploy.sh                 # Automated deployment script
└── update-frontend.sh        # Frontend configuration updater
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
