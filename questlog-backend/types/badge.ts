export type BadgeRarity = "common" | "rare" | "epic" | "legendary";
export type BadgeCategory = "social" | "gaming" | "defi" | "nft" | "community";

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: BadgeRarity;
  earnedAt: Date;
  category: BadgeCategory;
  questId: string;
  transactionHash?: string;
  ownerAddress?: string;
  tokenId?: string;
}
