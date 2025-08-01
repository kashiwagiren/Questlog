// RainbowKit configuration utilities for wallet connection
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
// Lisk Sepolia testnet chain configuration
import { liskSepolia } from "wagmi/chains";

/**
 * Wagmi Configuration for Blockchain Interaction
 *
 * PURPOSE:
 * This file configures the connection between the frontend and the blockchain.
 * It defines which network to use, which wallets to support, and where the smart contracts are deployed.
 *
 * USED BY:
 * - main.tsx: Wraps the entire app in WagmiProvider with this config
 * - All components that interact with blockchain (useAccount, useWriteContract, etc.)
 * - RainbowKit wallet connection UI
 *
 * NETWORK: Lisk Sepolia (testnet for development and testing)
 */
export const config = getDefaultConfig({
  appName: "Questlog", // App name shown in wallet connection
  projectId: "your_project_Id", // WalletConnect project ID for wallet support
  chains: [liskSepolia], // Supported blockchain networks
  ssr: false, // Disable server-side rendering (client-only app)
});

/**
 * Smart Contract Addresses
 *
 * IMPORTANT: These must be updated after each deployment!
 * Use the deploy.sh script output or update-frontend.sh script to set these.
 *
 * HOW TO UPDATE:
 * 1. Deploy contracts using: cd questlog && ./deploy.sh
 * 2. Copy addresses from deployment output
 * 3. Update these constants OR use: ./update-frontend.sh <badge_address> <minter_address>
 */

// QuestlogBadge contract - handles soulbound NFT badges
export const QUESTLOG_CONTRACT_ADDRESS =
  "0xb4268cbf5e95a326646703a7435257899c151132";

// QuestMinter contract - handles quest completion and badge minting
export const QUEST_MINTER_CONTRACT_ADDRESS =
  "0xfb4f07c9edd02b3c1659cfebc098300517558e9e"; // Updated after deployment

/**
 * QuestlogBadge Contract ABI (Application Binary Interface)
 *
 * PURPOSE:
 * This defines the interface for interacting with the QuestlogBadge smart contract.
 * It tells the frontend which functions are available and how to call them.
 *
 * FUNCTIONS INCLUDED:
 * - mint: Create new badge NFTs (called by QuestMinter contract)
 * - balanceOf: Get number of badges owned by an address
 * - tokenURI: Get metadata URL for a specific badge
 * - addMinter: Authorize addresses to mint badges (admin only)
 * - minters: Check if address is authorized to mint
 * - burn: Destroy/burn a badge NFT
 *
 * USED BY:
 * - useReadContract hooks to query badge data
 * - useWriteContract hooks to burn badges
 * - AdminPanel for contract management
 * - BadgeCollection to display user badges
 */
export const QUESTLOG_ABI = [
  {
    // mint(address to, string uri) -> uint256 tokenId
    // Creates new badge NFT with metadata URI
    // CALLED BY: QuestMinter contract when user completes quest
    inputs: [
      { internalType: "address", name: "to", type: "address" }, // Recipient wallet address
      { internalType: "string", name: "uri", type: "string" }, // Metadata URI (IPFS or data URI)
    ],
    name: "mint",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }], // Returns new token ID
    stateMutability: "nonpayable", // Requires transaction (costs gas)
    type: "function",
  },
  {
    // balanceOf(address owner) -> uint256 balance
    // Returns number of badges owned by an address
    // CALLED BY: BadgeCollection component to show user's badge count
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view", // Read-only (no gas cost)
    type: "function",
  },
  {
    // tokenURI(uint256 tokenId) -> string uri
    // Returns metadata URI for a specific badge
    // CALLED BY: BadgeCard component to load badge images and descriptions
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view", // Read-only (no gas cost)
    type: "function",
  },
  {
    // addMinter(address account)
    // Authorize an address to mint badges
    // CALLED BY: Contract owner during setup (usually QuestMinter address)
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "addMinter",
    outputs: [],
    stateMutability: "nonpayable", // Requires transaction (costs gas)
    type: "function",
  },
  {
    // minters(address) -> bool
    // Check if an address is authorized to mint badges
    // CALLED BY: AdminPanel to verify minter permissions
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "minters",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view", // Read-only (no gas cost)
    type: "function",
  },
  {
    // burn(uint256 tokenId)
    // Destroy/burn a badge NFT permanently
    // CALLED BY: UserProfile and AdminPanel when user wants to burn badges
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable", // Requires transaction (costs gas)
    type: "function",
  },
] as const; // TypeScript: make this a read-only tuple for better type inference

/**
 * QuestMinter Contract ABI (Application Binary Interface)
 *
 * PURPOSE:
 * This defines the interface for the QuestMinter contract that handles quest completion
 * and automatically mints badges as rewards.
 *
 * FUNCTIONS INCLUDED:
 * - completeQuestWithMetadata: Complete a quest and mint badge in one transaction
 * - getHasCompletedQuest: Check if user has completed a specific quest
 * - getUserCompletedQuests: Get all quests completed by a user
 *
 * USED BY:
 * - QuestBoard component for quest completion transactions
 * - AdminPanel for querying quest completion status
 */
export const QUEST_MINTER_ABI = [
  {
    // completeQuestWithMetadata(bytes32 questId, string badgeURI) -> uint256 tokenId
    // Complete a quest and mint badge NFT in single transaction
    // CALLED BY: QuestBoard.handleCompleteQuest() when user clicks "Complete Quest" button
    inputs: [
      { internalType: "bytes32", name: "questId", type: "bytes32" }, // Unique quest identifier
      { internalType: "string", name: "badgeURI", type: "string" }, // Badge metadata URI
    ],
    name: "completeQuestWithMetadata",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }], // Returns new badge token ID
    stateMutability: "nonpayable", // Requires transaction (costs gas)
    type: "function",
  },
  {
    // getHasCompletedQuest(bytes32 questId, address user) -> bool
    // Check if a user has completed a specific quest
    // CALLED BY: QuestBoard to show completion status on quest cards
    inputs: [
      { internalType: "bytes32", name: "questId", type: "bytes32" },
      { internalType: "address", name: "user", type: "address" },
    ],
    name: "getHasCompletedQuest",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view", // Read-only (no gas cost)
    type: "function",
  },
  {
    // getUserCompletedQuests(address user) -> bytes32[]
    // Get array of all quest IDs completed by a user
    // CALLED BY: AdminPanel and user profile to show quest history
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserCompletedQuests",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view", // Read-only (no gas cost)
    type: "function",
  },
] as const; // TypeScript: make this a read-only tuple for better type inference
