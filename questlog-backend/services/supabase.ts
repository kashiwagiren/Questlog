/**
 * Supabase Service for Cross-Device Quest Synchronization
 * Provides reliable, CORS-friendly storage with real-time updates
 */

import { createClient } from "@supabase/supabase-js";
import { Quest } from "../types/quest";
import { Badge, BadgeRarity, BadgeCategory } from "../types/badge";

// Supabase configuration
// You'll need to set these environment variables in your .env file
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return (
    supabaseUrl !== "https://your-project.supabase.co" &&
    supabaseAnonKey !== "your-anon-key" &&
    supabaseUrl.includes("supabase.co") &&
    supabaseAnonKey.length > 20
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface DBQuest {
  id: string;
  creator_address: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  reward: string;
  xp_reward: number;
  visibility: string;
  requirements: any; // JSON field
  badge_image: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  quest_data: any; // Full quest object as JSON
}

export interface DBUserProgress {
  id: string;
  user_address: string;
  quest_id: string;
  joined_at: string;
  completed_at?: string;
  completed_requirements: number[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DBUserBadge {
  id: string;
  user_address: string;
  quest_id: string;
  badge_name: string;
  badge_image: string;
  token_id?: string;
  minted_at: string;
  created_at: string;
}

/**
 * Supabase Quest Storage Service
 * Handles all quest CRUD operations with cross-device sync
 */
export class SupabaseQuestStorage {
  /**
   * Save a quest to Supabase
   */
  static async saveQuest(quest: Quest): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        console.warn("📡 Supabase not configured, skipping save");
        return {
          success: false,
          error:
            "Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.",
        };
      }

      // Validate required fields
      if (!quest.id || !quest.title || !quest.creatorAddress) {
        return {
          success: false,
          error: `Missing required fields: ${[
            !quest.id && "id",
            !quest.title && "title",
            !quest.creatorAddress && "creatorAddress",
          ]
            .filter(Boolean)
            .join(", ")}`,
        };
      }

      console.log(`📤 Saving quest "${quest.title}" to Supabase...`);

      const questData: Partial<DBQuest> = {
        id: quest.id,
        creator_address: (quest.creatorAddress || "").toLowerCase(),
        title: quest.title || "",
        description: quest.description || "",
        category: quest.category || "general",
        difficulty: quest.difficulty || "beginner",
        reward: quest.reward || "",
        xp_reward: quest.xpReward || 0,
        visibility: quest.visibility || "public",
        requirements: quest.requirements || [],
        badge_image: quest.badgeImage || "",
        is_completed: quest.isCompleted || false,
        quest_data: quest, // Store full quest object
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("quests").upsert(questData);

      if (error) {
        throw error;
      }

      console.log(`✅ Quest "${quest.title}" saved to Supabase`);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to save quest to Supabase:", error);
      return {
        success: false,
        error: error.message || "Failed to save quest",
      };
    }
  }

  /**
   * Get all publicly discoverable quests from Supabase
   * Includes public quests and event quests (but not invite-only)
   */
  static async getPublicQuests(): Promise<Quest[]> {
    try {
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        console.warn("📡 Supabase not configured, returning empty array");
        return [];
      }

      console.log("📥 Loading public and event quests from Supabase...");

      const { data, error } = await supabase
        .from("quests")
        .select("quest_data")
        .in("visibility", ["public", "event"])
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const quests = data?.map((row) => row.quest_data as Quest) || [];
      console.log(
        `✅ Loaded ${quests.length} public and event quests from Supabase`
      );
      return quests;
    } catch (error) {
      console.error("Failed to load public quests from Supabase:", error);
      return [];
    }
  }

  /**
   * Get quests created by a specific user
   */
  static async getQuestsByCreator(creatorAddress: string): Promise<Quest[]> {
    try {
      console.log(`📥 Loading quests by creator ${creatorAddress}...`);

      // Try with original case first (for backward compatibility)
      let { data, error } = await supabase
        .from("quests")
        .select("quest_data")
        .eq("creator_address", creatorAddress)
        .order("created_at", { ascending: false });

      // If no results with original case, try lowercase (new standard format)
      if (!error && (!data || data.length === 0)) {
        console.log(
          `📥 No quests found with original case, trying lowercase...`
        );
        const result = await supabase
          .from("quests")
          .select("quest_data")
          .eq("creator_address", creatorAddress.toLowerCase())
          .order("created_at", { ascending: false });

        data = result.data;
        error = result.error;
      }

      if (error) {
        throw error;
      }

      const quests = data?.map((row) => row.quest_data as Quest) || [];
      console.log(`✅ Loaded ${quests.length} quests by creator`);
      return quests;
    } catch (error) {
      console.error("Failed to load quests by creator:", error);
      return [];
    }
  }

  /**
   * Get a specific quest by ID with enhanced error handling and debugging
   */
  static async getQuestById(questId: string): Promise<Quest | null> {
    try {
      console.log(`📥 Loading quest ${questId}...`);

      // Clean the quest ID - remove any invalid characters that might have been copied incorrectly
      const cleanQuestId = questId.replace(/[^0-9]/g, ""); // Keep only digits

      // Try with the original ID first
      let { data, error } = await supabase
        .from("quests")
        .select("quest_data")
        .eq("id", questId)
        .single();

      // If the original ID failed and we cleaned some characters, try with cleaned ID
      if (error && cleanQuestId !== questId && cleanQuestId.length > 0) {
        console.log(`📥 Retrying with cleaned quest ID: ${cleanQuestId}...`);
        ({ data, error } = await supabase
          .from("quests")
          .select("quest_data")
          .eq("id", cleanQuestId)
          .single());
      }

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned - try to find similar quest IDs for debugging
          console.log(
            `🔍 Quest ${questId} not found. Searching for similar IDs...`
          );
          const similarQuests = await supabase
            .from("quests")
            .select("id, quest_data")
            .ilike("id", `%${questId.slice(-8)}%`) // Search by last 8 characters
            .limit(5);

          if (similarQuests.data && similarQuests.data.length > 0) {
            console.log(
              "🔍 Found similar quest IDs:",
              similarQuests.data.map((q) => q.id)
            );
          }

          return null;
        }
        throw error;
      }

      if (!data) {
        return null;
      }

      console.log(`✅ Loaded quest: ${data.quest_data.title}`);
      return data.quest_data as Quest;
    } catch (error) {
      console.error("Failed to load quest by ID:", error);
      return null;
    }
  }

  /**
   * Delete a quest
   */
  static async deleteQuest(
    questId: string,
    creatorAddress: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🗑️ Attempting to delete quest ${questId} from Supabase...`);
      console.log(`🔍 Quest ID: "${questId}" (length: ${questId.length})`);
      console.log(`🔍 Creator Address (original): "${creatorAddress}"`);
      console.log(
        `🔍 Creator Address (lowercased): "${creatorAddress.toLowerCase()}"`
      );

      // First, let's check if the quest exists with these exact parameters
      console.log(`🔍 Checking if quest exists first...`);

      // Try with original case first
      let { data: existingQuest, error: checkError } = await supabase
        .from("quests")
        .select("id, creator_address, title")
        .eq("id", questId)
        .eq("creator_address", creatorAddress)
        .single();

      // If not found with original case, try lowercase
      if (checkError && checkError.code === "PGRST116") {
        console.log(`🔍 Not found with original case, trying lowercase...`);
        const result = await supabase
          .from("quests")
          .select("id, creator_address, title")
          .eq("id", questId)
          .eq("creator_address", creatorAddress.toLowerCase())
          .single();
        existingQuest = result.data;
        checkError = result.error;
      }

      if (checkError) {
        console.log(`❌ Quest existence check failed:`, checkError);
        if (checkError.code === "PGRST116") {
          console.log(
            `📋 Quest not found with exact parameters. Let's check what quests exist...`
          );

          // Check if quest exists with just the ID
          const { data: questById, error: idError } = await supabase
            .from("quests")
            .select("id, creator_address, title")
            .eq("id", questId);

          if (!idError && questById) {
            console.log(`📋 Found quest(s) with ID "${questId}":`, questById);
            if (questById.length > 0) {
              const quest = questById[0];
              console.log(
                `📋 Expected creator: "${creatorAddress.toLowerCase()}"`
              );
              console.log(`📋 Actual creator: "${quest.creator_address}"`);
              console.log(
                `📋 Match: ${
                  quest.creator_address === creatorAddress.toLowerCase()
                }`
              );
            }
          }

          // Check if there are quests by this creator
          const { data: questsByCreator, error: creatorError } = await supabase
            .from("quests")
            .select("id, creator_address, title")
            .eq("creator_address", creatorAddress.toLowerCase());

          if (!creatorError && questsByCreator) {
            console.log(
              `📋 Quests by creator "${creatorAddress.toLowerCase()}":`,
              questsByCreator
            );
          }
        }
      } else {
        console.log(`✅ Quest exists:`, existingQuest);
      }

      // Proceed with deletion - try both original case and lowercase
      console.log(`🗑️ Attempting deletion with original case first...`);
      let { data, error, count } = await supabase
        .from("quests")
        .delete({ count: "exact" })
        .eq("id", questId)
        .eq("creator_address", creatorAddress);

      // If no rows deleted with original case, try lowercase
      if (!error && count === 0) {
        console.log(
          `🗑️ No rows deleted with original case, trying lowercase...`
        );
        const result = await supabase
          .from("quests")
          .delete({ count: "exact" })
          .eq("id", questId)
          .eq("creator_address", creatorAddress.toLowerCase());

        data = result.data;
        error = result.error;
        count = result.count;
      }

      if (error) {
        console.error(`❌ Supabase deletion error:`, error);
        console.error(`❌ Error code: ${error.code}`);
        console.error(`❌ Error message: ${error.message}`);
        console.error(`❌ Error details:`, error.details);
        console.error(`❌ Error hint:`, error.hint);

        // Enhanced error messages for common issues
        let userFriendlyError = error.message;

        if (error.code === "PGRST116") {
          userFriendlyError =
            "No quest found with that ID and creator address (possibly already deleted or RLS policy blocking access)";
        } else if (error.code === "42501") {
          userFriendlyError =
            "Permission denied: Row Level Security policy is preventing deletion";
        } else if (error.message.includes("RLS")) {
          userFriendlyError =
            "Row Level Security is blocking this deletion. Please check RLS policies.";
        } else if (error.message.includes("policy")) {
          userFriendlyError =
            "Database policy is preventing deletion. This might be an RLS configuration issue.";
        }

        return {
          success: false,
          error: userFriendlyError,
        };
      }

      console.log(`✅ Supabase deletion result - Count: ${count}, Data:`, data);

      // Check if any rows were actually deleted
      if (count === 0) {
        console.warn(
          `⚠️ No rows deleted from Supabase. Quest may not exist or RLS policy is blocking access.`
        );
        return {
          success: false,
          error:
            "No quest found to delete (quest may not exist, already deleted, or RLS policy is blocking access)",
        };
      }

      console.log(
        `✅ Quest ${questId} successfully deleted from Supabase (${count} row(s))`
      );
      return { success: true };
    } catch (error: any) {
      console.error("❌ Unexpected error during Supabase deletion:", error);
      return {
        success: false,
        error: error.message || "Failed to delete quest from Supabase",
      };
    }
  }
}

/**
 * Supabase User Storage Service
 * Handles user progress, badges, and quest participation
 */
export class SupabaseUserStorage {
  /**
   * Join a quest
   */
  static async joinQuest(
    userAddress: string,
    questId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        console.warn("📡 Supabase not configured, skipping join quest");
        return {
          success: false,
          error: "Supabase not configured",
        };
      }

      console.log(`🤝 User ${userAddress} joining quest ${questId}...`);

      const progressData: Partial<DBUserProgress> = {
        user_address: userAddress.toLowerCase(),
        quest_id: questId,
        joined_at: new Date().toISOString(),
        completed_requirements: [],
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_progress")
        .upsert(progressData, {
          onConflict: "user_address,quest_id",
        });

      if (error) {
        throw error;
      }

      console.log(`✅ User joined quest successfully`);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to join quest:", error);
      return {
        success: false,
        error: error.message || "Failed to join quest",
      };
    }
  }

  /**
   * Leave a quest
   */
  static async leaveQuest(
    userAddress: string,
    questId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`👋 User ${userAddress} leaving quest ${questId}...`);

      const { error } = await supabase
        .from("user_progress")
        .delete()
        .eq("user_address", userAddress.toLowerCase())
        .eq("quest_id", questId);

      if (error) {
        throw error;
      }

      console.log(`✅ User left quest successfully`);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to leave quest:", error);
      return {
        success: false,
        error: error.message || "Failed to leave quest",
      };
    }
  }

  /**
   * Update quest progress
   */
  static async updateQuestProgress(
    userAddress: string,
    questId: string,
    completedRequirements: number[],
    notes?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`📈 Updating progress for quest ${questId}...`);

      const { error } = await supabase
        .from("user_progress")
        .update({
          completed_requirements: completedRequirements,
          notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("user_address", userAddress.toLowerCase())
        .eq("quest_id", questId);

      if (error) {
        throw error;
      }

      console.log(`✅ Quest progress updated`);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to update quest progress:", error);
      return {
        success: false,
        error: error.message || "Failed to update progress",
      };
    }
  }

  /**
   * Mark quest as completed and add badge
   */
  static async completeQuest(
    userAddress: string,
    questId: string,
    badge: Badge,
    tokenId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🎉 Completing quest ${questId} for user ${userAddress}...`);

      // Update progress to completed
      const { error: progressError } = await supabase
        .from("user_progress")
        .update({
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_address", userAddress.toLowerCase())
        .eq("quest_id", questId);

      if (progressError) {
        throw progressError;
      }

      // Add badge
      const badgeData: Partial<DBUserBadge> = {
        user_address: userAddress.toLowerCase(),
        quest_id: questId,
        badge_name: badge.name,
        badge_image: badge.imageUrl,
        token_id: tokenId,
        minted_at: new Date().toISOString(),
      };

      const { error: badgeError } = await supabase
        .from("user_badges")
        .upsert(badgeData, {
          onConflict: "user_address,quest_id",
        });

      if (badgeError) {
        throw badgeError;
      }

      console.log(`✅ Quest completed and badge added`);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to complete quest:", error);
      return {
        success: false,
        error: error.message || "Failed to complete quest",
      };
    }
  }

  /**
   * Get user's joined quests
   */
  static async getJoinedQuests(userAddress: string): Promise<string[]> {
    try {
      console.log(`📥 Loading joined quests for ${userAddress}...`);

      const { data, error } = await supabase
        .from("user_progress")
        .select("quest_id")
        .eq("user_address", userAddress.toLowerCase());

      if (error) {
        throw error;
      }

      const questIds = data?.map((row) => row.quest_id) || [];
      console.log(`✅ Loaded ${questIds.length} joined quests`);
      return questIds;
    } catch (error) {
      console.error("Failed to load joined quests:", error);
      return [];
    }
  }

  /**
   * Get user's quest progress
   */
  static async getQuestProgress(
    userAddress: string,
    questId: string
  ): Promise<{
    completedRequirements: number[];
    joinedAt: string;
    completedAt?: string;
    notes?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_address", userAddress.toLowerCase())
        .eq("quest_id", questId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return {
        completedRequirements: data.completed_requirements || [],
        joinedAt: data.joined_at,
        completedAt: data.completed_at,
        notes: data.notes,
      };
    } catch (error) {
      console.error("Failed to load quest progress:", error);
      return null;
    }
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(userAddress: string): Promise<Badge[]> {
    try {
      console.log(`🏆 Loading badges for ${userAddress}...`);

      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_address", userAddress.toLowerCase())
        .order("minted_at", { ascending: false });

      if (error) {
        throw error;
      }

      const badges: Badge[] =
        data?.map((row) => ({
          id: row.id,
          name: row.badge_name,
          description: `Badge earned for completing quest`,
          imageUrl: row.badge_image,
          rarity: "common" as BadgeRarity,
          earnedAt: new Date(row.minted_at),
          category: "community" as BadgeCategory,
          questId: row.quest_id,
          tokenId: row.token_id,
          ownerAddress: row.user_address, // Map the owner address from database
        })) || [];

      console.log(`✅ Loaded ${badges.length} badges`);
      return badges;
    } catch (error) {
      console.error("Failed to load user badges:", error);
      return [];
    }
  }

  /**
   * Remove a badge from the database
   */
  static async removeBadge(
    userAddress: string,
    questId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        `🗑️ Removing badge for quest ${questId} from user ${userAddress}...`
      );

      const { error } = await supabase
        .from("user_badges")
        .delete()
        .eq("user_address", userAddress.toLowerCase())
        .eq("quest_id", questId);

      if (error) {
        throw error;
      }

      console.log(`✅ Badge removed from database`);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to remove badge:", error);
      return {
        success: false,
        error: error.message || "Failed to remove badge",
      };
    }
  }

  /**
   * Check if user has joined a quest
   */
  static async isQuestJoined(
    userAddress: string,
    questId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("user_progress")
        .select("id")
        .eq("user_address", userAddress.toLowerCase())
        .eq("quest_id", questId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error("Failed to check if quest is joined:", error);
      return false;
    }
  }
}

export default {
  SupabaseQuestStorage,
  SupabaseUserStorage,
};
