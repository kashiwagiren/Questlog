# Questlog Contracts - Deployment Guide

Smart contract deployment to Lisk Sepolia Testnet and other EVM-compatible networks.

## 🚀 Quick Deploy

### Prerequisites

1. **Foundry Installation**:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your private key and RPC URL
   ```

### Deploy to Lisk Sepolia (Current Deployment)

```bash
# Deploy QuestlogBadge contract
forge script script/DeployQuestlogBadge.s.sol \
  --rpc-url $LISK_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# Deploy QuestMinter contract
forge script script/DeployQuestSystem.s.sol \
  --rpc-url $LISK_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

## 📋 Current Deployments

### Lisk Sepolia Testnet

- **QuestlogBadge**: `0xb4268cbf5e95a326646703a7435257899c151132`
- **QuestMinter**: `0x09f3dd43ba9f9efcffeea8e5632b0c9b71bed90c`
- **Network ID**: 4202
- **Block Explorer**: [Lisk Sepolia Explorer](https://sepolia-blockscout.lisk.com/)

### Verification Status
- ✅ QuestlogBadge: Verified on Blockscout
- ✅ QuestMinter: Verified on Blockscout

## 🌐 Multi-Network Deployment

### Supported Networks

```bash
# Ethereum Sepolia
forge script script/DeployQuestlogBadge.s.sol \
  --rpc-url $ETHEREUM_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Polygon Mumbai
forge script script/DeployQuestlogBadge.s.sol \
  --rpc-url $POLYGON_MUMBAI_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Arbitrum Sepolia
forge script script/DeployQuestlogBadge.s.sol \
  --rpc-url $ARBITRUM_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Optimism Sepolia
forge script script/DeployQuestlogBadge.s.sol \
  --rpc-url $OPTIMISM_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Network Configuration

Update `foundry.toml` for additional networks:

```toml
[rpc_endpoints]
ethereum_sepolia = "${ETHEREUM_SEPOLIA_RPC_URL}"
polygon_mumbai = "${POLYGON_MUMBAI_RPC_URL}"
arbitrum_sepolia = "${ARBITRUM_SEPOLIA_RPC_URL}"
optimism_sepolia = "${OPTIMISM_SEPOLIA_RPC_URL}"

[etherscan]
ethereum_sepolia = { key = "${ETHERSCAN_API_KEY}" }
polygon_mumbai = { key = "${POLYGONSCAN_API_KEY}" }
arbitrum_sepolia = { key = "${ARBISCAN_API_KEY}" }
optimism_sepolia = { key = "${OPTIMISTIC_ETHERSCAN_API_KEY}" }
```

## ⚙️ Environment Configuration

### Required Environment Variables

```bash
# Private Key (for deployment)
PRIVATE_KEY=your_private_key_without_0x_prefix

# RPC URLs
LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
ETHEREUM_SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your-key
ARBITRUM_SEPOLIA_RPC_URL=https://arbitrum-sepolia.publicnode.com
OPTIMISM_SEPOLIA_RPC_URL=https://optimism-sepolia.publicnode.com

# Block Explorer API Keys (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_api_key

# Contract Configuration
INITIAL_OWNER=your_wallet_address
BASE_URI=https://your-metadata-api.com/metadata/
```

## 🧪 Testing & Validation

### Run Test Suite

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testMintBadge

# Coverage report
forge coverage
```

### Gas Optimization

```bash
# Gas report
forge test --gas-report

# Optimize compilation
forge build --optimize
```

### Security Checks

```bash
# Static analysis (requires slither)
slither src/

# Formal verification (requires certora)
certoraRun certora/specs/QuestlogBadge.spec
```

## 📊 Contract Details

### QuestlogBadge.sol

- **Type**: ERC721 Soulbound Token
- **Features**:
  - Non-transferable badges
  - Metadata URI management
  - Owner-controlled minting
  - Enumerable token tracking

### QuestMinter.sol

- **Type**: Quest Management Contract
- **Features**:
  - Quest creation and management
  - Completion verification
  - Badge minting integration
  - Multi-quest workflows

## 🔒 Security Considerations

### Access Control
- ✅ Owner-only minting functions
- ✅ Role-based permissions
- ✅ Pausable functionality for emergencies

### Soulbound Implementation
- ✅ Transfer restrictions (except mint/burn)
- ✅ Cannot be listed on marketplaces
- ✅ Permanent achievement records

### Upgrade Safety
- ✅ Immutable contract design
- ✅ No proxy patterns (reduces complexity)
- ✅ Clear ownership transfer mechanisms

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
name: Smart Contract CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive
      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
      - name: Run tests
        run: forge test
      - name: Check gas optimization
        run: forge test --gas-report
```

## 🐛 Troubleshooting

### Common Issues

1. **Deployment Failures**:
   - Check private key format (no 0x prefix)
   - Verify sufficient ETH for gas fees
   - Ensure RPC URL is accessible

2. **Verification Failures**:
   - Check block explorer API key
   - Wait for block confirmation before verification
   - Ensure contract source matches deployment

3. **Test Failures**:
   - Update git submodules: `git submodule update --init --recursive`
   - Check Foundry version compatibility
   - Verify test environment setup

### Support

- **GitHub Issues**: [Report issues](https://github.com/questlog/questlog-contracts/issues)
- **Documentation**: [Full README](./README.md)
- **Discord**: Join our community server
