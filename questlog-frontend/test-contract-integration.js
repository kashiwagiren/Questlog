// Test script to verify contract integration
// Run this in browser console after connecting wallet

// Check if contract is accessible
console.log("Contract Address:", "0x59f9419c6647c484eaFeC2dcF51b9dF9f415567f");
console.log("Network: Lisk Sepolia");
console.log(
  "Explorer: https://blockscout.sepolia.lisk.com/address/0x59f9419c6647c484eaFeC2dcF51b9dF9f415567f"
);

// Test metadata generation
function testMetadata() {
  const sampleQuest = {
    title: "Test Quest",
    reward: "Test Badge",
    badgeImage:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9ImdvbGQiLz48L3N2Zz4=",
    category: "social",
    difficulty: "easy",
    xpReward: 100,
  };

  const metadata = {
    name: sampleQuest.reward,
    description: `Badge earned for completing: ${sampleQuest.title}`,
    image: sampleQuest.badgeImage,
    attributes: [
      {
        trait_type: "Quest",
        value: sampleQuest.title,
      },
      {
        trait_type: "Category",
        value: sampleQuest.category,
      },
      {
        trait_type: "Difficulty",
        value: sampleQuest.difficulty,
      },
      {
        trait_type: "XP Reward",
        value: sampleQuest.xpReward,
      },
    ],
  };

  const metadataURI = `data:application/json;base64,${btoa(
    JSON.stringify(metadata)
  )}`;

  console.log("Sample Quest:", sampleQuest);
  console.log("Generated Metadata:", metadata);
  console.log("Metadata URI:", metadataURI);
  console.log("URI Length:", metadataURI.length);

  return { metadata, metadataURI };
}

// Test the metadata generation
console.log("\n=== Testing Metadata Generation ===");
testMetadata();

// Instructions for manual testing
console.log(`
=== Manual Testing Steps ===

1. Connect your wallet to the application
2. Go to Quest Board - check for minter status indicator
3. If not authorized, go to Admin Panel > Contract tab
4. Copy your address and give it to contract owner to add as minter
5. Create a test quest with requirements
6. Join the quest and complete requirements
7. Click "Complete Quest" to test NFT minting
8. Check transaction in explorer: https://blockscout.sepolia.lisk.com/
9. Verify NFT appears in your wallet

=== Contract Owner Tasks ===

1. Add users as minters using addMinter function
2. Monitor gas costs for minting
3. Check contract events in explorer
4. Test with different metadata sizes

=== Troubleshooting ===

- "Not authorized" error: User needs to be added as minter
- Transaction fails: Check gas limits and network connectivity  
- Metadata not showing: Verify base64 encoding and JSON structure
- Images not loading: Check image URL/data URI format
`);
