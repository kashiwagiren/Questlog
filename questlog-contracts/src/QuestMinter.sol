// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import the QuestlogBadge contract to interact with it
import "./QuestlogBadge.sol";
// Import OpenZeppelin's Ownable for admin functions (though currently unused - could be removed)
import "@openzeppelin/contracts/access/Ownable.sol"; // NOTE: This import is currently unused but kept for future admin features

/**
 * @title QuestMinter - Quest Completion and Badge Distribution System
 * @dev This contract manages the quest completion process and automatically mints achievement badges
 * 
 * CORE PURPOSE:
 * - Allow users to complete quests and receive soulbound NFT badges as proof
 * - Track which quests each user has completed to prevent duplicate completions
 * - Provide a flexible system that doesn't require pre-registering quests
 * 
 * HOW THE SYSTEM WORKS:
 * 1. User completes a quest through the frontend (Discord join, social media task, etc.)
 * 2. Frontend calls completeQuestWithMetadata() with quest ID and badge metadata
 * 3. Contract verifies user hasn't completed this quest before
 * 4. Contract marks quest as completed and mints a badge NFT via QuestlogBadge contract
 * 5. User receives soulbound badge in their wallet as permanent proof of achievement
 * 
 * INTEGRATION POINTS:
 * - Called by frontend React app when users complete quests
 * - Interacts with QuestlogBadge contract to mint badges
 * - Events are monitored by frontend for real-time UI updates
 * - Quest completion data can be queried for user profiles and statistics
 */
contract QuestMinter is Ownable {
    // Reference to the QuestlogBadge contract that actually mints the NFT badges
    // 'immutable' means this address is set once in constructor and never changes (gas optimization)
    QuestlogBadge public immutable questlogBadge;
    
    // STORAGE MAPPINGS - Track quest completion state
    
    // Nested mapping: user address → quest ID → completion status
    // Example: hasCompletedQuest[0x123...][keccak256("discord-quest")] = true
    mapping(address => mapping(bytes32 => bool)) public hasCompletedQuest;
    
    // Array of completed quest IDs per user for easy frontend querying
    // Example: userCompletedQuests[0x123...] = [questId1, questId2, questId3...]
    mapping(address => bytes32[]) public userCompletedQuests;
    
    // EVENT DEFINITIONS - These allow frontend to track contract activity in real-time
    
    // Emitted when a user successfully completes a quest and receives a badge
    // 'indexed' parameters allow efficient filtering of events
    event QuestCompleted(bytes32 indexed questId, address indexed user, uint256 tokenId);
    
    /**
     * @dev Contract constructor - sets up the connection to QuestlogBadge contract
     * @param _questlogBadge Address of the deployed QuestlogBadge contract
     * 
     * CALLED BY: Deployment script (DeployQuestSystem.s.sol) during initial setup
     * 
     * IMPORTANT: The QuestlogBadge contract must authorize this QuestMinter as a minter
     * after deployment, or the mint calls will fail!
     */
    constructor(address _questlogBadge) {
        questlogBadge = QuestlogBadge(_questlogBadge); // Create interface to interact with badge contract
        // NOTE: Ownable constructor automatically sets msg.sender as owner
    }
    
    /**
     * @dev Complete a quest and automatically mint a badge NFT as reward
     * @param questId Unique identifier for the completed quest (e.g., keccak256("discord-join"))
     * @param badgeURI Metadata URI for the badge (IPFS link to JSON with image, description, etc.)
     * @return tokenId The ID of the newly minted badge NFT
     * 
     * CALLED BY: 
     * - Frontend React app when user completes quests
     * - Integration services that verify quest completion
     * 
     * QUEST ID EXAMPLES:
     * - keccak256("discord-join") for Discord server join quests
     * - keccak256("twitter-follow") for social media quests  
     * - keccak256("first-transaction") for on-chain activity quests
     * 
     * PROCESS FLOW:
     * 1. Check if user has already completed this specific quest
     * 2. Mark quest as completed in storage mappings
     * 3. Add quest ID to user's completed quests list
     * 4. Call QuestlogBadge.mint() to create the NFT badge
     * 5. Emit event for frontend tracking
     * 6. Return the new token ID for confirmation
     */
    function completeQuestWithMetadata(
        bytes32 questId,
        string calldata badgeURI
    ) external returns (uint256) {
        // Prevent users from completing the same quest multiple times
        require(!hasCompletedQuest[msg.sender][questId], "Quest already completed");
        
        // UPDATE STORAGE STATE
        // Mark this specific quest as completed for this user
        hasCompletedQuest[msg.sender][questId] = true;
        // Add quest ID to user's list of completed quests (for easy querying)
        userCompletedQuests[msg.sender].push(questId);
        
        // MINT BADGE NFT
        // Call the QuestlogBadge contract to mint a new badge for the user
        // This will fail if QuestMinter is not authorized as a minter on QuestlogBadge
        uint256 tokenId = questlogBadge.mint(msg.sender, badgeURI);
        
        // EMIT EVENT for frontend tracking and real-time updates
        emit QuestCompleted(questId, msg.sender, tokenId);
        
        return tokenId; // Return token ID so caller can confirm successful minting
    }
    
    /**
     * @dev Get all quest IDs that a specific user has completed
     * @param user The address to check completed quests for
     * @return Array of quest IDs (bytes32) that the user has completed
     * 
     * CALLED BY:
     * - Frontend to display user's achievement history
     * - User profile pages to show completed quests
     * - Analytics services to track quest completion rates
     * 
     * USAGE EXAMPLE:
     * bytes32[] memory completedQuests = questMinter.getUserCompletedQuests(userAddress);
     * // completedQuests might contain: [keccak256("discord-join"), keccak256("first-tx")]
     */
    function getUserCompletedQuests(address user) external view returns (bytes32[] memory) {
        return userCompletedQuests[user]; // Return the entire array of completed quest IDs
    }
    
    /**
     * @dev Check if a specific user has completed a specific quest
     * @param questId The unique identifier of the quest to check
     * @param user The address of the user to check
     * @return bool True if user has completed the quest, false otherwise
     * 
     * CALLED BY:
     * - Frontend before allowing quest completion (prevent duplicates)
     * - Quest verification systems
     * - User interface to show completion status
     * 
     * USAGE EXAMPLE:
     * bool hasCompleted = questMinter.getHasCompletedQuest(
     *     keccak256("discord-join"), 
     *     userAddress
     * );
     */
    function getHasCompletedQuest(bytes32 questId, address user) external view returns (bool) {
        return hasCompletedQuest[user][questId]; // Look up in the nested mapping
    }
}
