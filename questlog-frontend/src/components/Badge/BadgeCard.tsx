import React from "react";
import { Calendar, ExternalLink } from "lucide-react";
import { Badge } from "@backend/types/badge";
import IPFSService from "../../services/ipfs";
import { useNotification } from "../UI/NotificationSystem";
import {
  isValidTransactionHash,
  validateTransactionExists,
  getTransactionUrl,
  validateTransactionHash,
} from "../../utils/transactionValidation";

interface BadgeCardProps {
  badge: Badge;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const { addNotification } = useNotification();

  // Check if transaction exists on the blockchain
  const handleViewTransaction = async () => {
    if (!badge.transactionHash) {
      addNotification({
        type: "error",
        title: "No Transaction Hash",
        message: "This badge doesn't have a transaction hash",
      });
      return;
    }

    // Validate the transaction hash format
    const validation = validateTransactionHash(badge.transactionHash);
    if (!validation.isValid) {
      addNotification({
        type: "error",
        title: "Invalid Transaction Hash",
        message: validation.error || "Transaction hash format is invalid",
      });
      return;
    }

    // Get the transaction URL
    const url = getTransactionUrl(badge.transactionHash, "lisk-sepolia");

    try {
      // Verify the transaction exists on the blockchain
      const { exists, error } = await validateTransactionExists(
        badge.transactionHash
      );

      if (!exists) {
        addNotification({
          type: "warning",
          title: "Transaction Not Found",
          message:
            error ||
            "This transaction may not exist on the blockchain or is still being processed",
        });
        // Still open the link so user can see the block explorer
      } else {
        addNotification({
          type: "info",
          title: "Opening Transaction",
          message: "Loading transaction details in block explorer...",
        });
      }
    } catch (error) {
      // If API call fails, still open the link but show a warning
      addNotification({
        type: "info",
        title: "Opening Transaction",
        message:
          "Unable to verify transaction status, opening block explorer...",
      });
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case "common":
        return {
          border: "border-gray-500/50",
          glow: "shadow-gray-500/20",
          text: "text-gray-400",
          bg: "bg-gray-500/10",
        };
      case "rare":
        return {
          border: "border-blue-500/50",
          glow: "shadow-blue-500/20",
          text: "text-blue-400",
          bg: "bg-blue-500/10",
        };
      case "epic":
        return {
          border: "border-purple-500/50",
          glow: "shadow-purple-500/20",
          text: "text-purple-400",
          bg: "bg-purple-500/10",
        };
      case "legendary":
        return {
          border: "border-yellow-500/50",
          glow: "shadow-yellow-500/20",
          text: "text-yellow-400",
          bg: "bg-yellow-500/10",
        };
      default:
        return {
          border: "border-gray-500/50",
          glow: "shadow-gray-500/20",
          text: "text-gray-400",
          bg: "bg-gray-500/10",
        };
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "social":
        return "text-blue-400 bg-blue-400/10";
      case "gaming":
        return "text-purple-400 bg-purple-400/10";
      case "defi":
        return "text-green-400 bg-green-400/10";
      case "nft":
        return "text-pink-400 bg-pink-400/10";
      case "community":
        return "text-orange-400 bg-orange-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const rarityStyle = getRarityStyle(badge.rarity);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 ${rarityStyle.border} ${rarityStyle.glow} bg-gradient-to-br from-gray-800/50 to-gray-900/50 transition-all duration-300 hover:scale-105 group backdrop-blur-sm`}
    >
      {/* Badge Image */}
      <div className="relative">
        <img
          src={IPFSService.getDisplayUrl(badge.imageUrl)}
          alt={badge.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110 relative z-10"
          onError={() => {
            console.error("Failed to load badge image:", badge.imageUrl);
            console.log("Badge data:", badge);
            // Don't replace with random image, just log the error
          }}
        />

        {/* Rarity Badge */}
        <div className="absolute top-3 right-3 z-20">
          <span
            className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${rarityStyle.text} ${rarityStyle.bg} border ${rarityStyle.border}`}
          >
            {badge.rarity}
          </span>
        </div>

        {/* Category Tag */}
        <div className="absolute top-3 left-3 z-20">
          <span
            className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${getCategoryColor(
              badge.category
            )}`}
          >
            {badge.category}
          </span>
        </div>

        {/* Soulbound Indicator */}
        <div className="absolute bottom-3 right-3 bg-gray-900/80 px-2 py-1 rounded-full z-20">
          <span className="text-xs text-purple-400 font-medium">Soulbound</span>
        </div>
      </div>

      {/* Badge Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
            {badge.name}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            {badge.description}
          </p>
        </div>

        {/* Earned Date */}
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Earned {badge.earnedAt.toLocaleDateString()}</span>
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === "development" && badge.transactionHash && (
          <div className="text-xs text-gray-500 font-mono border border-gray-700 rounded p-2">
            <div>TX Hash: {badge.transactionHash}</div>
            <div>
              Valid Format:{" "}
              {isValidTransactionHash(badge.transactionHash) ? "✅" : "❌"}
            </div>
            <div>Length: {badge.transactionHash.length}/66</div>
            {!isValidTransactionHash(badge.transactionHash) && (
              <div className="text-red-400 text-xs mt-1">
                {validateTransactionHash(badge.transactionHash).error}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
          {badge.transactionHash &&
            isValidTransactionHash(badge.transactionHash) && (
              <div
                className="flex items-center space-x-1 text-sm text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                onClick={handleViewTransaction}
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Transaction</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BadgeCard;
