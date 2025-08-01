/**
 * Cross-Device Quest Storage Service
 *
 * PURPOSE:
 * This service provides a unified interface for storing quest and user data
 * with automatic fallback between cloud (Supabase) and local storage.
 *
 * ARCHITECTURE:
 * - Primary: Supabase cloud database for cross-device synchronization
 * - Fallback: localStorage for offline use and when Supabase unavailable
 * - Automatic fallback detection and mode switching
 * - Data consistency between storage methods
 *
 * FEATURES:
 * - Quest creation, joining, progress tracking, and completion
 * - Badge collection management
 * - Cross-device data synchronization
 * - Offline-first approach with cloud sync
 * - Fallback mode for reliability
 *
 * USED BY:
 * - QuestBoard component for quest operations
 * - BadgeCollection for badge management
 * - AdminPanel for data management
 * - UserProfile for user data
 *
 * STORAGE HIERARCHY:
 * 1. Try Supabase (cloud) - enables cross-device sync
 * 2. Fall back to localStorage - ensures app works offline
 * 3. Graceful error handling between modes
 */

import { SupabaseQuestStorage, SupabaseUserStorage } from "./supabase";
import { Quest } from "../types/quest";
import { Badge } from "../types/badge";

export class CrossDeviceQuestStorage {
  // Key for storing fallback mode preference in localStorage
  private static readonly FALLBACK_MODE_KEY = "questlog_fallback_mode";

  /**
   * Check if Fallback Mode is Active
   *
   * PURPOSE:
   * Determines whether to use localStorage-only mode instead of Supabase.
   * Used when Supabase is unavailable or user prefers offline mode.
   *
   * CALLED BY: All storage operations to determine which backend to use
   *
   * @returns true if should use localStorage only, false if should try Supabase
   */
  private static useFallbackMode(): boolean {
    return localStorage.getItem(this.FALLBACK_MODE_KEY) === "true";
  }

  /**
   * Enable Fallback Mode (localStorage Only)
   *
   * PURPOSE:
   * Forces the app to use localStorage instead of Supabase.
   * Useful when Supabase is down, slow, or user prefers offline mode.
   *
   * CALLED BY:
   * - MigrationPanel when user manually enables fallback
   * - Automatic fallback when Supabase operations fail
   * - Error handlers when cloud storage is unavailable
   */
  static enableFallbackMode(): void {
    localStorage.setItem(this.FALLBACK_MODE_KEY, "true");
    console.log("📱 Enabled fallback mode - using localStorage only");
  }

  /**
   * Disable Fallback Mode (Use Supabase)
   *
   * PURPOSE:
   * Re-enables cloud storage for cross-device synchronization.
   *
   * CALLED BY:
   * - MigrationPanel when user disables fallback mode
   * - Setup process when Supabase connection is restored
   */
  static disableFallbackMode(): void {
    localStorage.removeItem(this.FALLBACK_MODE_KEY);
    console.log("☁️ Disabled fallback mode - using Supabase");
  }

  /**
   * Save Quest with Automatic Fallback
   *
   * PURPOSE:
   * Saves a quest to the best available storage backend.
   * Tries Supabase first for cross-device sync, falls back to localStorage.
   *
   * FLOW:
   * 1. Check if fallback mode is enabled
   * 2. If not, try Supabase cloud storage
   * 3. If Supabase fails, automatically fall back to localStorage
   * 4. Return success/error status with source information
   *
   * CALLED BY:
   * - QuestCreator when user creates new quests
   * - Quest import/sharing functionality
   * - Data migration processes
   *
   * @param quest - Quest object to save
   * @returns Promise with success status and storage source used
   */
  static async saveQuest(quest: Quest): Promise<{
    success: boolean;
    error?: string;
    source?: "supabase" | "localStorage";
  }> {
    // Try Supabase first unless in fallback mode
    if (!this.useFallbackMode()) {
      try {
        console.log(`☁️ Saving quest "${quest.title}" to Supabase...`);
        const result = await SupabaseQuestStorage.saveQuest(quest);

        if (result.success) {
          return { success: true, source: "supabase" };
        } else {
          console.warn(
            "Supabase failed, falling back to localStorage:",
            result.error
          );
        }
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    // Fallback to localStorage
    console.log(
      `📱 Saving quest "${quest.title}" to localStorage (fallback)...`
    );
    return this.saveQuestToLocalStorage(quest);
  }

  /**
   * Get all public quests (Supabase first, localStorage fallback)
   */
  static async getPublicQuests(): Promise<Quest[]> {
    // Try Supabase first unless in fallback mode
    if (!this.useFallbackMode()) {
      try {
        console.log("☁️ Loading public quests from Supabase...");
        const quests = await SupabaseQuestStorage.getPublicQuests();

        if (quests.length > 0 || !this.hasLocalStorageQuests()) {
          console.log(`✅ Loaded ${quests.length} quests from Supabase`);
          return quests;
        }
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    // Fallback to localStorage
    console.log("📱 Loading public quests from localStorage (fallback)...");
    return this.getPublicQuestsFromLocalStorage();
  }

  /**
   * Get quests by creator
   */
  static async getQuestsByCreator(creatorAddress: string): Promise<Quest[]> {
    if (!this.useFallbackMode()) {
      try {
        console.log(
          `☁️ Loading quests by creator ${creatorAddress} from Supabase...`
        );
        const quests = await SupabaseQuestStorage.getQuestsByCreator(
          creatorAddress
        );

        if (quests.length > 0 || !this.hasLocalStorageQuests()) {
          console.log(
            `✅ Loaded ${quests.length} quests by creator from Supabase`
          );
          return quests;
        }

        console.log("No quests found in Supabase, checking localStorage...");
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    console.log(
      `📱 Loading quests by creator ${creatorAddress} from localStorage (fallback)...`
    );
    return this.getQuestsByCreatorFromLocalStorage(creatorAddress);
  }

  /**
   * Get quest by ID
   */
  static async getQuestById(questId: string): Promise<Quest | null> {
    if (!this.useFallbackMode()) {
      try {
        const quest = await SupabaseQuestStorage.getQuestById(questId);
        if (quest) return quest;
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    return this.getQuestByIdFromLocalStorage(questId);
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
    let supabaseSuccess = true;
    let localStorageSuccess = true;
    const errors: string[] = [];

    // Always try to delete from both Supabase AND localStorage to ensure cleanup

    // 1. Try Supabase deletion (unless explicitly in fallback mode)
    if (!this.useFallbackMode()) {
      try {
        console.log(`☁️ Deleting quest ${questId} from Supabase...`);
        const result = await SupabaseQuestStorage.deleteQuest(
          questId,
          creatorAddress
        );
        if (!result.success) {
          supabaseSuccess = false;
          errors.push(`Supabase: ${result.error}`);
          console.error(`❌ Supabase deletion failed: ${result.error}`);
        } else {
          console.log(`✅ Supabase deletion successful`);
        }
      } catch (error: any) {
        supabaseSuccess = false;
        errors.push(`Supabase error: ${error.message}`);
        console.error("❌ Supabase deletion error:", error);
      }
    }

    // 2. Always try localStorage deletion (for cleanup)
    try {
      console.log(`📱 Deleting quest ${questId} from localStorage...`);
      const result = this.deleteQuestFromLocalStorage(questId, creatorAddress);
      if (!result.success) {
        localStorageSuccess = false;
        errors.push(`localStorage: ${result.error}`);
        console.error(`❌ localStorage deletion failed: ${result.error}`);
      } else {
        console.log(`✅ localStorage deletion successful`);
      }
    } catch (error: any) {
      localStorageSuccess = false;
      errors.push(`localStorage error: ${error.message}`);
      console.error("❌ localStorage deletion error:", error);
    }

    // IMPORTANT: For quest deletion, we need BOTH to succeed OR at least Supabase to succeed
    // If Supabase fails but localStorage succeeds, that's still a failure because the quest
    // will remain accessible to other users via Supabase
    let overallSuccess: boolean;
    let primaryError: string | undefined;

    if (!this.useFallbackMode()) {
      // In online mode, Supabase deletion is required for success
      overallSuccess = supabaseSuccess;
      if (!supabaseSuccess) {
        primaryError =
          errors.find((e) => e.startsWith("Supabase:")) || errors[0];
      }
    } else {
      // In fallback mode, only localStorage matters
      overallSuccess = localStorageSuccess;
      if (!localStorageSuccess) {
        primaryError =
          errors.find((e) => e.startsWith("localStorage:")) || errors[0];
      }
    }

    if (overallSuccess) {
      console.log(`✅ Quest ${questId} deleted successfully`);
      return { success: true };
    } else {
      console.error(`❌ Failed to delete quest ${questId}:`, errors);
      return {
        success: false,
        error: primaryError || `Failed to delete quest: ${errors.join("; ")}`,
      };
    }
  }

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
    if (!this.useFallbackMode()) {
      try {
        return await SupabaseUserStorage.joinQuest(userAddress, questId);
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    return this.joinQuestInLocalStorage(userAddress, questId);
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
    if (!this.useFallbackMode()) {
      try {
        return await SupabaseUserStorage.leaveQuest(userAddress, questId);
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    return this.leaveQuestInLocalStorage(userAddress, questId);
  }

  /**
   * Update quest progress
   */
  static async updateQuestProgress(
    userAddress: string,
    questId: string,
    completedRequirements: number[],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.useFallbackMode()) {
      try {
        return await SupabaseUserStorage.updateQuestProgress(
          userAddress,
          questId,
          completedRequirements,
          notes
        );
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    return this.updateQuestProgressInLocalStorage(
      userAddress,
      questId,
      completedRequirements,
      notes
    );
  }

  /**
   * Complete a quest
   */
  static async completeQuest(
    userAddress: string,
    questId: string,
    badge: Badge,
    tokenId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.useFallbackMode()) {
      try {
        return await SupabaseUserStorage.completeQuest(
          userAddress,
          questId,
          badge,
          tokenId
        );
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    return this.completeQuestInLocalStorage(
      userAddress,
      questId,
      badge,
      tokenId
    );
  }

  /**
   * Get joined quests
   */
  static async getJoinedQuests(userAddress: string): Promise<string[]> {
    if (!this.useFallbackMode()) {
      try {
        return await SupabaseUserStorage.getJoinedQuests(userAddress);
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    return this.getJoinedQuestsFromLocalStorage(userAddress);
  }

  /**
   * Get quest progress
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
    if (!this.useFallbackMode()) {
      try {
        return await SupabaseUserStorage.getQuestProgress(userAddress, questId);
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    return this.getQuestProgressFromLocalStorage(userAddress, questId);
  }

  /**
   * Get user badges
   */
  static async getUserBadges(userAddress: string): Promise<Badge[]> {
    if (!this.useFallbackMode()) {
      try {
        console.log(`☁️ Loading badges for ${userAddress} from Supabase...`);
        const badges = await SupabaseUserStorage.getUserBadges(userAddress);

        // Always try to return Supabase results first, fallback only on error
        console.log(`✅ Loaded ${badges.length} badges from Supabase`);
        return badges;
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    console.log(
      `📱 Loading badges for ${userAddress} from localStorage (fallback)...`
    );
    return this.getUserBadgesFromLocalStorage(userAddress);
  }

  /**
   * Remove a badge from storage (both Supabase and localStorage)
   */
  static async removeBadge(
    userAddress: string,
    questId: string
  ): Promise<{ success: boolean; error?: string }> {
    let supabaseSuccess = true;
    let supabaseError = "";

    // Try to remove from Supabase first
    if (!this.useFallbackMode()) {
      try {
        console.log(`☁️ Removing badge for quest ${questId} from Supabase...`);
        const result = await SupabaseUserStorage.removeBadge(
          userAddress,
          questId
        );
        if (!result.success) {
          supabaseSuccess = false;
          supabaseError = result.error || "Unknown Supabase error";
        }
      } catch (error) {
        console.warn(
          "Supabase badge removal failed, continuing with localStorage:",
          error
        );
        supabaseSuccess = false;
        supabaseError =
          error instanceof Error ? error.message : "Supabase connection failed";
      }
    }

    // Remove from localStorage regardless of Supabase result
    try {
      console.log(
        `📱 Removing badge for quest ${questId} from localStorage...`
      );
      const badgesKey = `questlog_badges_${userAddress.toLowerCase()}`;
      const existingBadges = JSON.parse(
        localStorage.getItem(badgesKey) || "[]"
      );
      const updatedBadges = existingBadges.filter(
        (badge: any) => badge.questId !== questId
      );
      localStorage.setItem(badgesKey, JSON.stringify(updatedBadges));
      console.log(`✅ Badge removed from localStorage`);
    } catch (error) {
      console.error("Failed to remove badge from localStorage:", error);
      return {
        success: false,
        error: `localStorage removal failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }

    // Return overall success status
    if (supabaseSuccess || this.useFallbackMode()) {
      return { success: true };
    } else {
      return {
        success: false,
        error: `Supabase removal failed: ${supabaseError}. Badge removed from localStorage only.`,
      };
    }
  }

  /**
   * Check if quest is joined
   */
  static async isQuestJoined(
    userAddress: string,
    questId: string
  ): Promise<boolean> {
    if (!this.useFallbackMode()) {
      try {
        return await SupabaseUserStorage.isQuestJoined(userAddress, questId);
      } catch (error) {
        console.warn("Supabase error, falling back to localStorage:", error);
      }
    }

    return this.isQuestJoinedInLocalStorage(userAddress, questId);
  }

  // LocalStorage fallback methods
  private static saveQuestToLocalStorage(quest: Quest): {
    success: boolean;
    error?: string;
    source: "localStorage";
  } {
    try {
      if (quest.visibility === "public") {
        const publicQuestsData = localStorage.getItem(
          "questlog_global_public_quests"
        );
        let publicQuests: Quest[] = [];

        if (publicQuestsData) {
          publicQuests = JSON.parse(publicQuestsData);
        }

        // Remove existing quest with same ID
        publicQuests = publicQuests.filter((q) => q.id !== quest.id);
        publicQuests.push(quest);

        localStorage.setItem(
          "questlog_global_public_quests",
          JSON.stringify(publicQuests)
        );
      } else {
        const creatorAddress = quest.creatorAddress || "";
        const privateKey = `questlog_private_quests_${creatorAddress.toLowerCase()}`;

        const privateQuestsData = localStorage.getItem(privateKey);
        let privateQuests: Quest[] = [];

        if (privateQuestsData) {
          privateQuests = JSON.parse(privateQuestsData);
        }

        privateQuests = privateQuests.filter((q) => q.id !== quest.id);
        privateQuests.push(quest);

        localStorage.setItem(privateKey, JSON.stringify(privateQuests));
      }

      return { success: true, source: "localStorage" };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to save to localStorage",
        source: "localStorage",
      };
    }
  }

  private static getPublicQuestsFromLocalStorage(): Quest[] {
    try {
      const publicQuestsData = localStorage.getItem(
        "questlog_global_public_quests"
      );
      return publicQuestsData ? JSON.parse(publicQuestsData) : [];
    } catch (error) {
      console.error("Failed to load public quests from localStorage:", error);
      return [];
    }
  }

  private static getQuestsByCreatorFromLocalStorage(
    creatorAddress: string
  ): Quest[] {
    try {
      const privateKey = `questlog_private_quests_${creatorAddress.toLowerCase()}`;
      const privateQuestsData = localStorage.getItem(privateKey);
      const privateQuests = privateQuestsData
        ? JSON.parse(privateQuestsData)
        : [];

      const publicQuests = this.getPublicQuestsFromLocalStorage().filter(
        (q) => q.creatorAddress?.toLowerCase() === creatorAddress.toLowerCase()
      );

      return [...privateQuests, ...publicQuests];
    } catch (error) {
      console.error(
        "Failed to load quests by creator from localStorage:",
        error
      );
      return [];
    }
  }

  private static getQuestByIdFromLocalStorage(questId: string): Quest | null {
    try {
      // Check public quests
      const publicQuests = this.getPublicQuestsFromLocalStorage();
      const publicQuest = publicQuests.find((q) => q.id === questId);
      if (publicQuest) return publicQuest;

      // Check all private quest keys
      const allKeys = Object.keys(localStorage);
      const privateKeys = allKeys.filter((key) =>
        key.startsWith("questlog_private_quests_")
      );

      for (const key of privateKeys) {
        const privateQuestsData = localStorage.getItem(key);
        if (privateQuestsData) {
          const privateQuests = JSON.parse(privateQuestsData) as Quest[];
          const privateQuest = privateQuests.find((q) => q.id === questId);
          if (privateQuest) return privateQuest;
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to load quest by ID from localStorage:", error);
      return null;
    }
  }

  private static deleteQuestFromLocalStorage(
    questId: string,
    creatorAddress: string
  ): {
    success: boolean;
    error?: string;
  } {
    try {
      // Try to delete from public quests
      const publicQuestsData = localStorage.getItem(
        "questlog_global_public_quests"
      );
      if (publicQuestsData) {
        const publicQuests = JSON.parse(publicQuestsData) as Quest[];
        const filteredQuests = publicQuests.filter((q) => q.id !== questId);
        localStorage.setItem(
          "questlog_global_public_quests",
          JSON.stringify(filteredQuests)
        );
      }

      // Try to delete from private quests
      const privateKey = `questlog_private_quests_${creatorAddress.toLowerCase()}`;
      const privateQuestsData = localStorage.getItem(privateKey);
      if (privateQuestsData) {
        const privateQuests = JSON.parse(privateQuestsData) as Quest[];
        const filteredQuests = privateQuests.filter((q) => q.id !== questId);
        localStorage.setItem(privateKey, JSON.stringify(filteredQuests));
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to delete from localStorage",
      };
    }
  }

  private static joinQuestInLocalStorage(
    userAddress: string,
    questId: string
  ): {
    success: boolean;
    error?: string;
  } {
    try {
      const joinedQuestsKey = `questlog_joined_quests_${userAddress.toLowerCase()}`;
      const joinedQuestsData = localStorage.getItem(joinedQuestsKey);
      let joinedQuests: string[] = [];

      if (joinedQuestsData) {
        joinedQuests = JSON.parse(joinedQuestsData);
      }

      if (!joinedQuests.includes(questId)) {
        joinedQuests.push(questId);
        localStorage.setItem(joinedQuestsKey, JSON.stringify(joinedQuests));
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to join quest in localStorage",
      };
    }
  }

  private static leaveQuestInLocalStorage(
    userAddress: string,
    questId: string
  ): {
    success: boolean;
    error?: string;
  } {
    try {
      const joinedQuestsKey = `questlog_joined_quests_${userAddress.toLowerCase()}`;
      const joinedQuestsData = localStorage.getItem(joinedQuestsKey);

      if (joinedQuestsData) {
        const joinedQuests = JSON.parse(joinedQuestsData) as string[];
        const filteredQuests = joinedQuests.filter((id) => id !== questId);
        localStorage.setItem(joinedQuestsKey, JSON.stringify(filteredQuests));
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to leave quest in localStorage",
      };
    }
  }

  private static updateQuestProgressInLocalStorage(
    userAddress: string,
    questId: string,
    completedRequirements: number[],
    notes?: string
  ): { success: boolean; error?: string } {
    try {
      const progressKey = `questlog_progress_${userAddress.toLowerCase()}_${questId}`;
      const progressData = {
        completedRequirements,
        notes,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(progressKey, JSON.stringify(progressData));
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to update progress in localStorage",
      };
    }
  }

  private static completeQuestInLocalStorage(
    userAddress: string,
    questId: string,
    badge: Badge,
    tokenId?: string
  ): { success: boolean; error?: string } {
    try {
      // Add badge to user's collection
      const badgesKey = `questlog_badges_${userAddress.toLowerCase()}`;
      const badgesData = localStorage.getItem(badgesKey);
      let badges: Badge[] = [];

      if (badgesData) {
        badges = JSON.parse(badgesData);
      }

      // Add the new badge with tokenId if provided
      const newBadge = { ...badge, tokenId };
      badges = badges.filter((b) => b.questId !== questId); // Remove existing badge for this quest
      badges.push(newBadge);

      localStorage.setItem(badgesKey, JSON.stringify(badges));

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to complete quest in localStorage",
      };
    }
  }

  private static getJoinedQuestsFromLocalStorage(
    userAddress: string
  ): string[] {
    try {
      const joinedQuestsKey = `questlog_joined_quests_${userAddress.toLowerCase()}`;
      const joinedQuestsData = localStorage.getItem(joinedQuestsKey);
      return joinedQuestsData ? JSON.parse(joinedQuestsData) : [];
    } catch (error) {
      console.error("Failed to load joined quests from localStorage:", error);
      return [];
    }
  }

  private static getQuestProgressFromLocalStorage(
    userAddress: string,
    questId: string
  ): {
    completedRequirements: number[];
    joinedAt: string;
    completedAt?: string;
    notes?: string;
  } | null {
    try {
      const progressKey = `questlog_progress_${userAddress.toLowerCase()}_${questId}`;
      const progressData = localStorage.getItem(progressKey);

      if (progressData) {
        const progress = JSON.parse(progressData);
        return {
          completedRequirements: progress.completedRequirements || [],
          joinedAt: progress.joinedAt || new Date().toISOString(),
          completedAt: progress.completedAt,
          notes: progress.notes,
        };
      }

      return null;
    } catch (error) {
      console.error("Failed to load quest progress from localStorage:", error);
      return null;
    }
  }

  private static getUserBadgesFromLocalStorage(userAddress: string): Badge[] {
    try {
      const badgesKey = `questlog_badges_${userAddress.toLowerCase()}`;
      const badgesData = localStorage.getItem(badgesKey);
      return badgesData ? JSON.parse(badgesData) : [];
    } catch (error) {
      console.error("Failed to load user badges from localStorage:", error);
      return [];
    }
  }

  private static isQuestJoinedInLocalStorage(
    userAddress: string,
    questId: string
  ): boolean {
    try {
      const joinedQuests = this.getJoinedQuestsFromLocalStorage(userAddress);
      return joinedQuests.includes(questId);
    } catch (error) {
      console.error(
        "Failed to check if quest is joined in localStorage:",
        error
      );
      return false;
    }
  }

  private static hasLocalStorageQuests(): boolean {
    return !!localStorage.getItem("questlog_global_public_quests");
  }
}

export default CrossDeviceQuestStorage;
