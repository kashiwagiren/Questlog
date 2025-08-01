#!/bin/bash

# Frontend Configuration Update Script
# Run this after deploying contracts to update the frontend configuration

echo "🔧 Frontend Configuration Update"
echo "================================"
echo ""

if [ $# -ne 2 ]; then
    echo "Usage: $0 <questlog_badge_address> <quest_minter_address>"
    echo ""
    echo "Example:"
    echo "$0 0x1234567890123456789012345678901234567890 0x0987654321098765432109876543210987654321"
    echo ""
    echo "💡 Get these addresses from the deployment output"
    exit 1
fi

QUESTLOG_BADGE_ADDRESS=$1
QUEST_MINTER_ADDRESS=$2

# Validate addresses (basic check for 0x prefix and 42 characters)
if [[ ! $QUESTLOG_BADGE_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "❌ Invalid QuestlogBadge address format: $QUESTLOG_BADGE_ADDRESS"
    exit 1
fi

if [[ ! $QUEST_MINTER_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "❌ Invalid QuestMinter address format: $QUEST_MINTER_ADDRESS"
    exit 1
fi

echo "🎯 QuestlogBadge Address: $QUESTLOG_BADGE_ADDRESS"
echo "🎯 QuestMinter Address: $QUEST_MINTER_ADDRESS"
echo ""

# Check if frontend directory exists
WAGMI_FILE="../questlog-frontend/src/config/wagmi.ts"

if [ ! -f "$WAGMI_FILE" ]; then
    echo "❌ wagmi.ts file not found at $WAGMI_FILE"
    exit 1
fi

# Create backup
cp "$WAGMI_FILE" "$WAGMI_FILE.backup"
echo "📋 Created backup: $WAGMI_FILE.backup"

# Update QuestlogBadge address
sed -i "s/export const QUESTLOG_CONTRACT_ADDRESS =.*/export const QUESTLOG_CONTRACT_ADDRESS = \"$QUESTLOG_BADGE_ADDRESS\";/" "$WAGMI_FILE"

# Update QuestMinter address
sed -i "s/export const QUEST_MINTER_CONTRACT_ADDRESS =.*/export const QUEST_MINTER_CONTRACT_ADDRESS = \"$QUEST_MINTER_ADDRESS\";/" "$WAGMI_FILE"

echo "✅ Updated contract addresses in $WAGMI_FILE"
echo ""

# Show the updated configuration
echo "📋 Updated configuration:"
grep "export const.*_CONTRACT_ADDRESS" "$WAGMI_FILE"
echo ""

echo "🎉 Frontend configuration updated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Go to questlog-frontend directory: cd ../questlog-frontend"
echo "2. Start the development server: npm run dev"
echo "3. Test the quest completion flow"
echo ""
echo "🔄 If you need to rollback, use: mv $WAGMI_FILE.backup $WAGMI_FILE"
