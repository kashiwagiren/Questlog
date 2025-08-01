// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/QuestlogBadge.sol";

contract QuestlogBadgeTest is Test {
    QuestlogBadge badge;
    address owner = address(this);
    address user = address(0xBEEF);

    function setUp() public {
        badge = new QuestlogBadge("Questlog","QLB");
        badge.addMinter(owner);
    }

    function testMintAndSoulbound() public {
        uint256 id = badge.mint(user, "ipfs://abcdefghijklmnopqrstuvwxyz/badge01.json");
        assertEq(badge.ownerOf(id), user);
        vm.expectRevert("QuestlogBadge: soulbound tokens are non-transferable");
        vm.prank(user);
        badge.transferFrom(user, owner, id);
    }
}
