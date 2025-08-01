#!/bin/bash

# QuestMinter System Deployment Script
# Run this script to deploy the new quest system

echo "🚀 QuestMinter System Deployment"
echo "================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your PRIVATE_KEY:"
    echo "echo 'PRIVATE_KEY=your_private_key_here' > .env"
    echo ""
    echo "⚠️  Make sure to use your actual private key (without 0x prefix)"
    exit 1
fi

# Source environment variables
source .env

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set in .env file"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Build contracts
echo "🔨 Building contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Contracts built successfully"
echo ""

# Deploy contracts
echo "🌐 Deploying to Lisk Sepolia..."
echo "RPC: https://rpc.sepolia-api.lisk.com"
echo ""

forge script script/DeployQuestSystem.s.sol:DeployQuestSystem \
    --rpc-url https://rpc.sepolia-api.lisk.com \
    --broadcast \
    --verify

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy the deployed contract addresses from the output above"
    echo "2. Update wagmi.ts in the frontend with the new addresses"
    echo "3. Test the quest completion flow"
    echo ""
    echo "💡 Tip: Check the broadcast/ directory for deployment details"
else
    echo ""
    echo "❌ Deployment failed"
    echo "Check the error messages above for details"
fi
