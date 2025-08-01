import { QUESTLOG_CONTRACT_ADDRESS } from "../config/wagmi";

/**
 * Utility functions for contract interaction and debugging
 */

export const CONTRACT_INFO = {
  address: QUESTLOG_CONTRACT_ADDRESS,
  network: "Lisk Sepolia",
  explorer: `https://sepolia-blockscout.lisk.com/address/${QUESTLOG_CONTRACT_ADDRESS}`,
};

/**
 * Helper function to display contract information in console
 */
export const logContractInfo = () => {
  console.log("🔗 QuestlogBadge Contract Info:");
  console.log("📍 Address:", CONTRACT_INFO.address);
  console.log("🌐 Network:", CONTRACT_INFO.network);
  console.log("🔍 Explorer:", CONTRACT_INFO.explorer);
};

/**
 * Helper function to check if an address is a valid Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
