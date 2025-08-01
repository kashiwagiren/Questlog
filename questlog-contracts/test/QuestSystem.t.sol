// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/QuestlogBadge.sol";
import "../src/QuestMinter.sol";

contract QuestSystemTest is Test {
    QuestlogBadge badge;
    QuestMinter minter;
    address owner = address(this);
    address user1 = address(0xBEEF);
    address user2 = address(0xCAFE);

    function setUp() public {
        // Deploy contracts
        badge = new QuestlogBadge("Questlog Badge", "QLB");
        minter = new QuestMinter(address(badge));
        
        // Setup permissions - QuestMinter can mint badges
        badge.addMinter(address(minter));
    }

    function testCompleteQuestWithMetadata() public {
        vm.startPrank(user1);
        
        bytes32 questId = keccak256("discord-quest");
        string memory badgeURI = "ipfs://discord-badge.json";
        
        // Complete quest and mint badge
        uint256 tokenId = minter.completeQuestWithMetadata(questId, badgeURI);
        
        // Verify quest completion
        assertTrue(minter.getHasCompletedQuest(questId, user1));
        
        // Verify badge was minted
        assertEq(badge.balanceOf(user1), 1);
        assertEq(badge.ownerOf(tokenId), user1);
        assertEq(badge.tokenURI(tokenId), badgeURI);
        
        // Verify user's completed quests
        bytes32[] memory completedQuests = minter.getUserCompletedQuests(user1);
        assertEq(completedQuests.length, 1);
        assertEq(completedQuests[0], questId);
        
        vm.stopPrank();
    }
    
    function testCannotCompleteQuestTwice() public {
        vm.startPrank(user1);
        
        bytes32 questId = keccak256("unique-quest");
        string memory badgeURI = "ipfs://unique-badge.json";
        
        // Complete quest first time
        minter.completeQuestWithMetadata(questId, badgeURI);
        
        // Try to complete again - should revert
        vm.expectRevert("Quest already completed");
        minter.completeQuestWithMetadata(questId, badgeURI);
        
        vm.stopPrank();
    }
    
    function testMultipleUsersCanCompleteQuest() public {
        bytes32 questId = keccak256("community-quest");
        string memory badgeURI = "ipfs://community-badge.json";
        
        // User 1 completes quest
        vm.prank(user1);
        uint256 token1 = minter.completeQuestWithMetadata(questId, badgeURI);
        
        // User 2 completes same quest
        vm.prank(user2);
        uint256 token2 = minter.completeQuestWithMetadata(questId, badgeURI);
        
        // Both should have completed the quest
        assertTrue(minter.getHasCompletedQuest(questId, user1));
        assertTrue(minter.getHasCompletedQuest(questId, user2));
        
        // Both should have badges
        assertEq(badge.balanceOf(user1), 1);
        assertEq(badge.balanceOf(user2), 1);
        assertEq(badge.ownerOf(token1), user1);
        assertEq(badge.ownerOf(token2), user2);
        
        // Tokens should be different
        assertTrue(token1 != token2);
    }
    
    function testMultipleQuestsPerUser() public {
        vm.startPrank(user1);
        
        bytes32 quest1 = keccak256("quest-1");
        bytes32 quest2 = keccak256("quest-2");
        
        // Complete two different quests
        uint256 token1 = minter.completeQuestWithMetadata(quest1, "ipfs://badge1.json");
        uint256 token2 = minter.completeQuestWithMetadata(quest2, "ipfs://badge2.json");
        
        // Verify both quests completed
        assertTrue(minter.getHasCompletedQuest(quest1, user1));
        assertTrue(minter.getHasCompletedQuest(quest2, user1));
        
        // Verify user has 2 badges
        assertEq(badge.balanceOf(user1), 2);
        assertEq(badge.ownerOf(token1), user1);
        assertEq(badge.ownerOf(token2), user1);
        
        // Verify completed quests list
        bytes32[] memory completedQuests = minter.getUserCompletedQuests(user1);
        assertEq(completedQuests.length, 2);
        
        vm.stopPrank();
    }
    
    function testOnlyMinterCanMintThroughContract() public {
        // Try to call questlogBadge.mint directly without being a minter
        vm.prank(user1);
        vm.expectRevert("QuestlogBadge: caller is not a minter");
        badge.mint(user1, "ipfs://direct-mint.json");
        
        // But can mint through QuestMinter contract
        vm.prank(user1);
        uint256 tokenId = minter.completeQuestWithMetadata(
            keccak256("valid-quest"), 
            "ipfs://valid-badge.json"
        );
        
        assertEq(badge.balanceOf(user1), 1);
        assertEq(badge.ownerOf(tokenId), user1);
    }

    function testGetUserCompletedQuests() public {
        bytes32 quest1 = keccak256("quest-1");
        bytes32 quest2 = keccak256("quest-2");
        bytes32 quest3 = keccak256("quest-3");
        
        vm.startPrank(user1);
        minter.completeQuestWithMetadata(quest1, "ipfs://1.json");
        minter.completeQuestWithMetadata(quest2, "ipfs://2.json");
        vm.stopPrank();
        
        // User2 completes quest3
        vm.prank(user2);
        minter.completeQuestWithMetadata(quest3, "ipfs://3.json");
        
        // Check user1's completed quests
        bytes32[] memory user1Completed = minter.getUserCompletedQuests(user1);
        assertEq(user1Completed.length, 2);
        
        // Check user2's completed quests
        bytes32[] memory user2Completed = minter.getUserCompletedQuests(user2);
        assertEq(user2Completed.length, 1);
        assertEq(user2Completed[0], quest3);
    }
}
