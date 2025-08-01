/**
 * Supabase Migration Service
 * Handles migration from localStorage to Supabase for cross-device sync
 */

import { SupabaseQuestStorage, SupabaseUserStorage } from "./supabase";
import { Quest } from "../types/quest";
import { Badge } from "../types/badge";

export class SupabaseMigrationService {
  /**
   * Check if Supabase is properly configured for migration
   */
  static isSupabaseAvailable(): boolean {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    return (
      supabaseUrl !== "https://your-project.supabase.co" &&
      supabaseAnonKey !== "your-anon-key" &&
      supabaseUrl?.includes("supabase.co") &&
      supabaseAnonKey?.length > 20
    );
  }

  /**
   * Migrate all localStorage data to Supabase
   */
  static async migrateAllData(userAddress: string): Promise<{
    success: boolean;
    migratedQuests: number;
    migratedProgress: number;
    migratedBadges: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let migratedQuests = 0;
    let migratedProgress = 0;
    let migratedBadges = 0;

    try {
      // Check if Supabase is available
      if (!this.isSupabaseAvailable()) {
        return {
          success: false,
          migratedQuests: 0,
          migratedProgress: 0,
          migratedBadges: 0,
          errors: [
            "Supabase is not configured. Please set up your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables to enable cross-device synchronization.",
          ],
        };
      }

      console.log("🔄 Starting migration from localStorage to Supabase...");

      // 1. Migrate public quests
      const publicQuestsData = localStorage.getItem(
        "questlog_global_public_quests"
      );
      if (publicQuestsData) {
        try {
          const publicQuests = JSON.parse(publicQuestsData) as Quest[];
          console.log(
            `📦 Found ${publicQuests.length} public quests to migrate`
          );

          for (const quest of publicQuests) {
            // Debug logging for problematic quest
            if (quest.title === "Discord Pioneer") {
              console.log("🔍 Debug - Discord Pioneer quest data:", {
                id: quest.id,
                title: quest.title,
                creatorAddress: quest.creatorAddress,
                description: quest.description,
                category: quest.category,
                difficulty: quest.difficulty,
                visibility: quest.visibility,
                requirements: quest.requirements,
                fullQuest: quest,
              });
            }

            const result = await SupabaseQuestStorage.saveQuest(quest);
            if (result.success) {
              migratedQuests++;
            } else {
              errors.push(
                `Failed to migrate quest ${quest.title}: ${result.error}`
              );
              console.error(
                `❌ Migration failed for quest "${quest.title}":`,
                result.error
              );
            }
          }
        } catch (error) {
          errors.push("Failed to parse public quests from localStorage");
        }
      }

      // 2. Migrate private quests created by this user
      const privateKey = `questlog_private_quests_${userAddress.toLowerCase()}`;
      const privateQuestsData = localStorage.getItem(privateKey);
      if (privateQuestsData) {
        try {
          const privateQuests = JSON.parse(privateQuestsData) as Quest[];
          console.log(
            `📦 Found ${privateQuests.length} private quests to migrate`
          );

          for (const quest of privateQuests) {
            const result = await SupabaseQuestStorage.saveQuest(quest);
            if (result.success) {
              migratedQuests++;
            } else {
              errors.push(
                `Failed to migrate private quest ${quest.title}: ${result.error}`
              );
            }
          }
        } catch (error) {
          errors.push("Failed to parse private quests from localStorage");
        }
      }

      // 3. Migrate user progress (joined quests)
      const joinedQuestsKey = `questlog_joined_quests_${userAddress.toLowerCase()}`;
      const joinedQuestsData = localStorage.getItem(joinedQuestsKey);
      if (joinedQuestsData) {
        try {
          const joinedQuestIds = JSON.parse(joinedQuestsData) as string[];
          console.log(
            `📦 Found ${joinedQuestIds.length} joined quests to migrate`
          );

          for (const questId of joinedQuestIds) {
            const result = await SupabaseUserStorage.joinQuest(
              userAddress,
              questId
            );
            if (result.success) {
              migratedProgress++;
            } else {
              errors.push(
                `Failed to migrate joined quest ${questId}: ${result.error}`
              );
            }
          }
        } catch (error) {
          errors.push("Failed to parse joined quests from localStorage");
        }
      }

      // 4. Migrate quest progress
      const progressKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(`questlog_progress_${userAddress.toLowerCase()}_`)
      );

      for (const progressKey of progressKeys) {
        try {
          const questId = progressKey.split("_").pop();
          if (!questId) continue;

          const progressData = localStorage.getItem(progressKey);
          if (progressData) {
            const progress = JSON.parse(progressData);
            const completedRequirements = progress.completedRequirements || [];

            const result = await SupabaseUserStorage.updateQuestProgress(
              userAddress,
              questId,
              completedRequirements,
              progress.notes
            );

            if (!result.success) {
              errors.push(
                `Failed to migrate progress for quest ${questId}: ${result.error}`
              );
            }
          }
        } catch (error) {
          errors.push(`Failed to parse progress from ${progressKey}`);
        }
      }

      // 5. Migrate badges
      const badgesKey = `questlog_badges_${userAddress.toLowerCase()}`;
      const badgesData = localStorage.getItem(badgesKey);
      if (badgesData) {
        try {
          const badges = JSON.parse(badgesData) as Badge[];
          console.log(`🏆 Found ${badges.length} badges to migrate`);

          for (const badge of badges) {
            // For migration, we'll add the badge directly
            // Note: This assumes the quest was already completed
            const result = await SupabaseUserStorage.completeQuest(
              userAddress,
              badge.questId,
              badge,
              badge.tokenId
            );

            if (result.success) {
              migratedBadges++;
            } else {
              errors.push(
                `Failed to migrate badge ${badge.name}: ${result.error}`
              );
            }
          }
        } catch (error) {
          errors.push("Failed to parse badges from localStorage");
        }
      }

      console.log(
        `✅ Migration completed: ${migratedQuests} quests, ${migratedProgress} progress entries, ${migratedBadges} badges`
      );

      return {
        success: errors.length === 0,
        migratedQuests,
        migratedProgress,
        migratedBadges,
        errors,
      };
    } catch (error) {
      console.error("Migration failed:", error);
      return {
        success: false,
        migratedQuests,
        migratedProgress,
        migratedBadges,
        errors: [...errors, `Migration failed: ${error}`],
      };
    }
  }

  /**
   * Clear localStorage after successful migration
   */
  static clearLocalStorageData(userAddress: string): void {
    console.log("🧹 Clearing localStorage data after migration...");

    const keysToRemove = [
      "questlog_global_public_quests",
      `questlog_private_quests_${userAddress.toLowerCase()}`,
      `questlog_joined_quests_${userAddress.toLowerCase()}`,
      `questlog_badges_${userAddress.toLowerCase()}`,
    ];

    // Remove progress keys
    const progressKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith(`questlog_progress_${userAddress.toLowerCase()}_`)
    );
    keysToRemove.push(...progressKeys);

    // Remove IPFS cache keys
    const ipfsKeys = Object.keys(localStorage).filter(
      (key) => key.startsWith("ipfs_") || key.startsWith("questlog_ipfs")
    );
    keysToRemove.push(...ipfsKeys);

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    console.log(`✅ Removed ${keysToRemove.length} localStorage keys`);
  }

  /**
   * Clean up orphaned localStorage data that doesn't exist in Supabase
   */
  static async cleanupOrphanedData(userAddress: string): Promise<{
    success: boolean;
    cleanedQuests: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let cleanedQuests = 0;

    try {
      console.log("🧹 Starting cleanup of orphaned localStorage data...");

      // Get all quests from Supabase
      const supabaseQuests = await SupabaseQuestStorage.getPublicQuests();
      const supabaseQuestIds = new Set(supabaseQuests.map((q) => q.id));

      // Check public quests in localStorage
      const publicQuestsData = localStorage.getItem(
        "questlog_global_public_quests"
      );
      if (publicQuestsData) {
        try {
          const publicQuests = JSON.parse(publicQuestsData) as Quest[];
          const validQuests = publicQuests.filter((quest) => {
            const isValid = supabaseQuestIds.has(quest.id);
            if (!isValid) {
              console.log(
                `🗑️ Removing orphaned quest: ${quest.title} (${quest.id})`
              );
              cleanedQuests++;
            }
            return isValid;
          });

          localStorage.setItem(
            "questlog_global_public_quests",
            JSON.stringify(validQuests)
          );
        } catch (error) {
          errors.push("Failed to clean public quests from localStorage");
        }
      }

      // Check private quests in localStorage
      const privateKey = `questlog_private_quests_${userAddress.toLowerCase()}`;
      const privateQuestsData = localStorage.getItem(privateKey);
      if (privateQuestsData) {
        try {
          const privateQuests = JSON.parse(privateQuestsData) as Quest[];
          const supabasePrivateQuests =
            await SupabaseQuestStorage.getQuestsByCreator(userAddress);
          const supabasePrivateQuestIds = new Set(
            supabasePrivateQuests.map((q) => q.id)
          );

          const validQuests = privateQuests.filter((quest) => {
            const isValid = supabasePrivateQuestIds.has(quest.id);
            if (!isValid) {
              console.log(
                `🗑️ Removing orphaned private quest: ${quest.title} (${quest.id})`
              );
              cleanedQuests++;
            }
            return isValid;
          });

          localStorage.setItem(privateKey, JSON.stringify(validQuests));
        } catch (error) {
          errors.push("Failed to clean private quests from localStorage");
        }
      }

      console.log(
        `✅ Cleanup completed: removed ${cleanedQuests} orphaned quests`
      );
      return {
        success: errors.length === 0,
        cleanedQuests,
        errors,
      };
    } catch (error) {
      console.error("Cleanup failed:", error);
      return {
        success: false,
        cleanedQuests,
        errors: [...errors, `Cleanup failed: ${error}`],
      };
    }
  }

  /**
   * Check if migration is needed
   */
  static needsMigration(userAddress: string): boolean {
    const hasPublicQuests = !!localStorage.getItem(
      "questlog_global_public_quests"
    );
    const hasPrivateQuests = !!localStorage.getItem(
      `questlog_private_quests_${userAddress.toLowerCase()}`
    );
    const hasJoinedQuests = !!localStorage.getItem(
      `questlog_joined_quests_${userAddress.toLowerCase()}`
    );
    const hasBadges = !!localStorage.getItem(
      `questlog_badges_${userAddress.toLowerCase()}`
    );

    return hasPublicQuests || hasPrivateQuests || hasJoinedQuests || hasBadges;
  }

  /**
   * Get migration summary
   */
  static getMigrationSummary(userAddress: string): {
    publicQuests: number;
    privateQuests: number;
    joinedQuests: number;
    badges: number;
    needsMigration: boolean;
  } {
    let publicQuests = 0;
    let privateQuests = 0;
    let joinedQuests = 0;
    let badges = 0;

    try {
      const publicQuestsData = localStorage.getItem(
        "questlog_global_public_quests"
      );
      if (publicQuestsData) {
        publicQuests = JSON.parse(publicQuestsData).length;
      }

      const privateQuestsData = localStorage.getItem(
        `questlog_private_quests_${userAddress.toLowerCase()}`
      );
      if (privateQuestsData) {
        privateQuests = JSON.parse(privateQuestsData).length;
      }

      const joinedQuestsData = localStorage.getItem(
        `questlog_joined_quests_${userAddress.toLowerCase()}`
      );
      if (joinedQuestsData) {
        joinedQuests = JSON.parse(joinedQuestsData).length;
      }

      const badgesData = localStorage.getItem(
        `questlog_badges_${userAddress.toLowerCase()}`
      );
      if (badgesData) {
        badges = JSON.parse(badgesData).length;
      }
    } catch (error) {
      console.warn("Failed to get migration summary:", error);
    }

    return {
      publicQuests,
      privateQuests,
      joinedQuests,
      badges,
      needsMigration: this.needsMigration(userAddress),
    };
  }
}

export default SupabaseMigrationService;
