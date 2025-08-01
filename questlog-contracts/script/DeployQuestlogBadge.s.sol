// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import {QuestlogBadge} from "../src/QuestlogBadge.sol";

/**
 * @title DeployQuestlogBadge - Single Contract Deployment Script
 * @dev This script only deploys the QuestlogBadge contract (legacy/standalone deployment)
 * 
 * NOTE: This script is superseded by DeployQuestSystem.s.sol which deploys the complete system.
 * This script is kept for reference or if you only need the badge contract without quest functionality.
 * 
 * LIMITATIONS:
 * - Only deploys QuestlogBadge, not the complete quest system
 * - Requires manual setup of minter permissions
 * - Use DeployQuestSystem.s.sol for full functionality instead
 */
contract DeployQuestlogBadge is Script {
    function run() external {
        // Load the deployer's private key from .env file
        // NOTE: Never hardcode private keys in smart contracts!
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Begin broadcasting deployment transaction to blockchain
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the QuestlogBadge contract with name and symbol
        QuestlogBadge badge = new QuestlogBadge("Questlog", "QLB");

        // Set the deployer as an authorized minter (for testing/admin purposes)
        // NOTE: In production, you'd typically authorize the QuestMinter contract instead
        badge.addMinter(msg.sender);

        // Stop broadcasting transactions
        vm.stopBroadcast();
        
        // NOTE: Consider using DeployQuestSystem.s.sol instead for complete functionality
    }
}
