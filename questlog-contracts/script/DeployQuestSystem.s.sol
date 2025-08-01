// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import Foundry's scripting framework for deployment
import "forge-std/Script.sol";
// Import our smart contracts to deploy
import "../src/QuestlogBadge.sol";
import "../src/QuestMinter.sol";

/**
 * @title DeployQuestSystem - Complete Quest System Deployment Script
 * @dev This script deploys both QuestlogBadge and QuestMinter contracts and sets up their integration
 * 
 * DEPLOYMENT PROCESS:
 * 1. Deploy QuestlogBadge contract (the NFT collection for badges)
 * 2. Deploy QuestMinter contract (points to QuestlogBadge address)
 * 3. Authorize QuestMinter as a minter on QuestlogBadge
 * 4. Output contract addresses for frontend configuration
 * 
 * USAGE:
 * - Run via: forge script script/DeployQuestSystem.s.sol:DeployQuestSystem --rpc-url $RPC_URL --broadcast
 * - Or use the deploy.sh script which includes verification
 * 
 * POST-DEPLOYMENT:
 * - Copy the contract addresses from console output
 * - Update frontend wagmi.ts configuration with new addresses
 * - Verify contracts are properly linked and authorized
 */
contract DeployQuestSystem is Script {
    /**
     * @dev Main deployment function - called by forge script command
     * 
     * ENVIRONMENT REQUIREMENTS:
     * - PRIVATE_KEY must be set in .env file
     * - RPC_URL should point to target network (Lisk Sepolia in this case)
     * 
     * SECURITY NOTE: Private key is loaded from environment, never hardcoded
     */
    function run() external {
        // Load deployer's private key from .env file (managed by Foundry)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Begin broadcasting transactions to the network
        // All transactions between startBroadcast and stopBroadcast will be sent to blockchain
        vm.startBroadcast(deployerPrivateKey);

        // STEP 1: Deploy QuestlogBadge contract (the NFT collection)
        QuestlogBadge questlogBadge = new QuestlogBadge("Questlog Badge", "QLB");
        console.log("QuestlogBadge deployed to:", address(questlogBadge));

        // STEP 2: Deploy QuestMinter contract (quest completion handler)
        // Pass QuestlogBadge address so QuestMinter knows which contract to mint from
        QuestMinter questMinter = new QuestMinter(address(questlogBadge));
        console.log("QuestMinter deployed to:", address(questMinter));

        // STEP 3: CRITICAL - Authorize QuestMinter to mint badges
        // Without this, QuestMinter.completeQuestWithMetadata() calls will fail
        questlogBadge.addMinter(address(questMinter));
        console.log("QuestMinter added as minter on QuestlogBadge");

        // Stop broadcasting transactions
        vm.stopBroadcast();
        
        // NOTE: Console output addresses should be copied to frontend configuration
        // Use update-frontend.sh script or manually update wagmi.ts
    }
}
