import React, { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { QUESTLOG_CONTRACT_ADDRESS, QUESTLOG_ABI } from "../../config/wagmi";
import BadgeCard from "./BadgeCard";
import { Badge } from "@backend/types/badge";
import { Trophy, Award } from "lucide-react";
import { OnlineUserStorage } from "../../services/onlineUserStorage";

interface BadgeCollectionProps {
  setActiveTab?: (tab: string) => void;
}

const BadgeCollection: React.FC<BadgeCollectionProps> = ({ setActiveTab }) => {
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [badges, setBadges] = useState<Badge[]>([]);
  const { address } = useAccount();

  // Read user's badge count
  const { data: badgeCount } = useReadContract({
    address: QUESTLOG_CONTRACT_ADDRESS,
    abi: QUESTLOG_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Load badges from cross-device storage
  React.useEffect(() => {
    if (address) {
      const loadBadges = async () => {
        try {
          const userBadges = await OnlineUserStorage.getUserBadges(
            address
          );
          const parsedBadges = userBadges.map((badge: any) => ({
            ...badge,
            earnedAt: new Date(badge.earnedAt),
          }));
          setBadges(parsedBadges);
        } catch (error) {
          console.error("Failed to load badges:", error);
          setBadges([]);
        }
      };

      loadBadges();

      // Listen for new badges
      const handleBadgeEarned = () => {
        loadBadges();
      };

      const handleBadgeRemoved = () => {
        loadBadges();
      };
      window.addEventListener("badgeEarned", handleBadgeEarned);
      window.addEventListener("badgeRemoved", handleBadgeRemoved);

      return () => {
        window.removeEventListener("badgeEarned", handleBadgeEarned);
        window.removeEventListener("badgeRemoved", handleBadgeRemoved);
      };
    }
  }, [address]);

  const rarities = [
    { id: "all", label: "All Rarities" },
    { id: "common", label: "Common" },
    { id: "rare", label: "Rare" },
    { id: "epic", label: "Epic" },
    { id: "legendary", label: "Legendary" },
  ];

  const filteredBadges =
    selectedRarity === "all"
      ? badges
      : badges.filter((badge) => badge.rarity === selectedRarity);

  const getRarityStats = () => {
    const stats = badges.reduce((acc, badge) => {
      acc[badge.rarity] = (acc[badge.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  const rarityStats = getRarityStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Badge Collection
        </h1>
        <p className="text-gray-400 text-base sm:text-lg mb-6 px-4">
          🏆 Your permanent on-chain achievements and soulbound NFT badges
        </p>

        {/* Collection Stats */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 mb-8 bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 max-w-md mx-auto">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium text-sm sm:text-base">
              {badges.length} Badge{badges.length !== 1 ? "s" : ""} Earned
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-medium text-sm sm:text-base">
              On-Chain: {Number(badgeCount) || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Rarity Filter */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-4">
        {rarities.map((rarity) => (
          <button
            key={rarity.id}
            onClick={() => setSelectedRarity(rarity.id)}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base ${
              selectedRarity === rarity.id
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <span>{rarity.label}</span>
            {rarity.id !== "all" && rarityStats[rarity.id] && (
              <span className="bg-gray-600 text-xs px-2 py-1 rounded-full">
                {rarityStats[rarity.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Rarity Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {Object.entries(rarityStats).map(([rarity, count]) => (
          <div key={rarity} className="quest-card text-center">
            <div className="text-xl sm:text-2xl font-bold text-white mb-1">
              {count}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 capitalize">
              {rarity} Badges
            </div>
          </div>
        ))}
      </div>

      {/* Badge Grid */}
      {badges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-300 mb-4">
            No Badges Yet
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto px-4 text-sm sm:text-base">
            Complete quests to earn your first soulbound NFT badge and start
            building your on-chain achievement collection.
          </p>
          <button
            onClick={() => setActiveTab?.("quests")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base"
          >
            View Available Quests
          </button>
        </div>
      )}

      {filteredBadges.length === 0 && badges.length > 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-base sm:text-lg mb-2">
            No {selectedRarity} badges found
          </div>
          <p className="text-gray-500 text-sm sm:text-base">
            Try selecting a different rarity filter
          </p>
        </div>
      )}
    </div>
  );
};

export default BadgeCollection;
