/**
 * Blockchain Transaction Validation Utilities
 *
 * PURPOSE:
 * This file provides utilities for validating and verifying blockchain transaction hashes.
 * Used when displaying transaction links in badges and verifying transaction existence.
 *
 * FEATURES:
 * - Transaction hash format validation (0x prefix, length, hex format)
 * - Blockchain verification via block explorer APIs
 * - User-friendly error messages for invalid hashes
 * - Network-specific block explorer URL generation
 *
 * USED BY:
 * - BadgeCard component when user clicks "View Transaction" button
 * - AdminPanel for transaction verification
 * - Any component that needs to validate transaction hashes
 */

export interface TransactionValidationResult {
  isValid: boolean; // Whether the hash format is valid
  error?: string; // Human-readable error message if invalid
  details?: {
    // Detailed validation breakdown
    length: number; // Actual character length
    hasPrefix: boolean; // Whether it starts with 0x
    isHex: boolean; // Whether it contains only hexadecimal characters
  };
}

/**
 * Validate Transaction Hash Format
 *
 * PURPOSE:
 * Checks if a string matches the expected format for an Ethereum/EVM transaction hash.
 * Does NOT verify if the transaction exists on blockchain (see validateTransactionExists for that).
 *
 * HASH FORMAT REQUIREMENTS:
 * - Must start with "0x" prefix
 * - Must be exactly 66 characters total (0x + 64 hex chars)
 * - Must contain only hexadecimal characters (0-9, a-f, A-F)
 *
 * CALLED BY:
 * - BadgeCard.handleViewTransaction() before opening block explorer
 * - Any component that needs to validate hash format
 *
 * @param hash - The transaction hash string to validate
 * @returns ValidationResult with isValid flag and error details
 */
export const validateTransactionHash = (
  hash: string | undefined
): TransactionValidationResult => {
  // Check if hash is provided
  if (!hash) {
    return {
      isValid: false,
      error: "Transaction hash is required",
    };
  }

  // Remove any whitespace that might have been copy-pasted
  const cleanHash = hash.trim();

  // Check length (should be 66 characters: 0x + 64 hex chars)
  if (cleanHash.length !== 66) {
    return {
      isValid: false,
      error: `Invalid length: expected 66 characters, got ${cleanHash.length}`,
      details: {
        length: cleanHash.length,
        hasPrefix: cleanHash.startsWith("0x"),
        isHex: /^0x[a-fA-F0-9]+$/.test(cleanHash),
      },
    };
  }

  // Check if it starts with 0x (EVM standard)
  if (!cleanHash.startsWith("0x")) {
    return {
      isValid: false,
      error: "Transaction hash must start with '0x'",
      details: {
        length: cleanHash.length,
        hasPrefix: false,
        isHex: /^[a-fA-F0-9]+$/.test(cleanHash.substring(2)), // Check if rest is hex
      },
    };
  }

  // Check if the remaining 64 characters are valid hexadecimal
  const hexPart = cleanHash.substring(2); // Remove 0x prefix
  if (!/^[a-fA-F0-9]{64}$/.test(hexPart)) {
    return {
      isValid: false,
      error: "Transaction hash contains invalid hexadecimal characters",
      details: {
        length: cleanHash.length,
        hasPrefix: true,
        isHex: false,
      },
    };
  }

  // All validation checks passed
  return {
    isValid: true,
    details: {
      length: cleanHash.length,
      hasPrefix: true,
      isHex: true,
    },
  };
};

/**
 * Simple Boolean Validation Check
 *
 * PURPOSE:
 * Provides a quick true/false check for transaction hash validity
 * without detailed error information. Useful for simple conditional checks.
 *
 * CALLED BY: Components that just need a quick validity check
 *
 * @param hash - The transaction hash to validate
 * @returns true if hash format is valid, false otherwise
 */
export const isValidTransactionHash = (hash: string | undefined): boolean => {
  return validateTransactionHash(hash).isValid;
};

/**
 * Validates a transaction exists on the blockchain via API call
 * @param hash - The transaction hash to check
 * @param networkUrl - The block explorer API base URL
 * @returns Promise<boolean> indicating if transaction exists
 */
export const validateTransactionExists = async (
  hash: string,
  networkUrl: string = "https://sepolia-blockscout.lisk.com/api/v2"
): Promise<{ exists: boolean; error?: string }> => {
  try {
    const response = await fetch(`${networkUrl}/transactions/${hash}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      return { exists: true };
    } else if (response.status === 404) {
      return { exists: false, error: "Transaction not found on blockchain" };
    } else {
      return { exists: false, error: `API error: ${response.status}` };
    }
  } catch (error) {
    return {
      exists: false,
      error: `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Get the appropriate block explorer URL for a transaction hash
 * @param hash - The transaction hash
 * @param network - The network name (default: 'lisk-sepolia')
 * @returns The full URL to view the transaction
 */
export const getTransactionUrl = (
  hash: string,
  network: string = "lisk-sepolia"
): string => {
  const urls: Record<string, string> = {
    "lisk-sepolia": "https://sepolia-blockscout.lisk.com/tx",
    "lisk-mainnet": "https://blockscout.lisk.com/tx",
    ethereum: "https://etherscan.io/tx",
    "ethereum-sepolia": "https://sepolia.etherscan.io/tx",
    polygon: "https://polygonscan.com/tx",
    bsc: "https://bscscan.com/tx",
    arbitrum: "https://arbiscan.io/tx",
    optimism: "https://optimistic.etherscan.io/tx",
    base: "https://basescan.org/tx",
  };

  const baseUrl = urls[network] || urls["lisk-sepolia"];
  return `${baseUrl}/${hash}`;
};
