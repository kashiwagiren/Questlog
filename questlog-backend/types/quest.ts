export type QuestCategory =
  | "social"
  | "gaming"
  | "creative"
  | "defi"
  | "development"
  | "nft"
  | "community";
export type QuestDifficulty = "easy" | "medium" | "hard";
export type QuestVisibility = "public" | "invite-only" | "event";
export type RewardType = "nft-badge";

export type RequirementType = "manual" | "discord_join";

export interface QuestRequirement {
  type: RequirementType;
  description: string;
  config: Record<string, any>;
}

export interface Quest {
  id: string;
  creatorAddress?: string;
  title: string;
  description: string;
  specificTask: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  reward: string;
  xpReward: number;
  timeEstimate: string;
  requirements: QuestRequirement[];
  tags: string[];
  organizingEntity: string;
  externalGameLink?: string;
  requiredAccountType?: string;
  visibility: QuestVisibility;
  startDate?: Date;
  endDate?: Date;
  rewardTypes: RewardType[];
  tokenRewardAmount?: number;
  participantLimit?: number;
  streakBonus: boolean;
  streakMultiplier?: number;
  isCompleted: boolean;
  badgeImage: string;
}
