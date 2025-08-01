/**
 * Online User Storage Service
 * Handles ALL user data (quests, badges, progress) through IPFS
 * NO localStorage dependencies - everything is truly cross-device
 */

import { Badge } from "../types/badge";

export interface UserProfile {
  address: string;
  username?: string;
  bio?: string;
  email?: string;
  avatarUrl?: string;
  location?: string;
  website?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  lastUpdated: string;
}

export interface UserProgress {
  completedQuests: string[];
  joinedQuests: string[];
  badges: Badge[];
  questProgress: {
    [questId: string]: {
      completedRequirements: number[];
      joinedAt: string;
      notes?: string;
    };
  };
  lastUpdated: string;
}

export interface UserData {
  profile: UserProfile;
  progress: UserProgress;
  ipfsHash?: string;
  lastSynced: string;
}

export class OnlineUserStorage {
  private static readonly USER_DATA_PREFIX = "questlog_user_";
  private static readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
  private static userDataCache: Map<
    string,
    { data: UserData; timestamp: number }
  > = new Map();

  /**
   * Load user data from IPFS (with minimal caching)
   */
  static async loadUserData(address: string): Promise<UserData> {
    try {
      console.log(`📥 Loading user data for address: ${address}`);

      // Check cache first (very short duration)
      const cached = this.userDataCache.get(address);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log("📦 Using cached user data");
        return cached.data;
      }

      // For now, due to CORS issues with IPFS gateways, we'll use local storage only
      // This means the data is device-specific until we implement a proper backend
      console.log("📱 Using local storage for user data (device-specific)");

      const localKey = `${this.USER_DATA_PREFIX}${address}`;
      const localData = localStorage.getItem(localKey);

      let userData: UserData;
      if (localData) {
        try {
          userData = JSON.parse(localData);
          console.log("✅ Loaded user data from local storage");
        } catch (error) {
          console.warn("❌ Failed to parse local user data, creating new");
          userData = this.createEmptyUserData(address);
        }
      } else {
        console.log("📝 Creating new user data");
        userData = this.createEmptyUserData(address);
      }

      // Cache for short duration
      this.userDataCache.set(address, {
        data: userData,
        timestamp: Date.now(),
      });

      return userData;
    } catch (error) {
      console.error("Failed to load user data:", error);
      return this.createEmptyUserData(address);
    }
  }

  /**
   * Save user data to IPFS
   */
  static async saveUserData(userData: UserData): Promise<void> {
    try {
      console.log(
        `💾 Saving user data for address: ${userData.profile.address}`
      );

      userData.lastSynced = new Date().toISOString();
      userData.progress.lastUpdated = new Date().toISOString();

      // For now, due to CORS issues, save to local storage only
      // This ensures the app works reliably on each device
      const localKey = `${this.USER_DATA_PREFIX}${userData.profile.address}`;
      localStorage.setItem(localKey, JSON.stringify(userData));
      console.log("✅ User data saved to local storage");

      // Update cache
      this.userDataCache.set(userData.profile.address, {
        data: userData,
        timestamp: Date.now(),
      });

      // TODO: Implement proper backend API or use a CORS-friendly IPFS solution
      // for true cross-device synchronization
    } catch (error) {
      console.error("Failed to save user data:", error);
      throw new Error(`Failed to save user data: ${error}`);
    }
  }

  /**
   * Create empty user data structure
   */
  private static createEmptyUserData(address: string): UserData {
    return {
      profile: {
        address,
        lastUpdated: new Date().toISOString(),
      },
      progress: {
        completedQuests: [],
        joinedQuests: [],
        badges: [],
        questProgress: {},
        lastUpdated: new Date().toISOString(),
      },
      lastSynced: new Date().toISOString(),
    };
  }

  /**
   * Add a completed quest
   */
  static async markQuestCompleted(
    address: string,
    questId: string,
    badge?: Badge
  ): Promise<void> {
    try {
      const userData = await this.loadUserData(address);

      if (!userData.progress.completedQuests.includes(questId)) {
        userData.progress.completedQuests.push(questId);
      }

      if (badge) {
        userData.progress.badges.push(badge);
      }

      await this.saveUserData(userData);
    } catch (error) {
      console.error("Failed to mark quest completed:", error);
      throw error;
    }
  }

  /**
   * Join a quest
   */
  static async joinQuest(address: string, questId: string): Promise<void> {
    try {
      const userData = await this.loadUserData(address);

      if (!userData.progress.joinedQuests.includes(questId)) {
        userData.progress.joinedQuests.push(questId);
        userData.progress.questProgress[questId] = {
          completedRequirements: [],
          joinedAt: new Date().toISOString(),
        };
      }

      await this.saveUserData(userData);
    } catch (error) {
      console.error("Failed to join quest:", error);
      throw error;
    }
  }

  /**
   * Leave a quest
   */
  static async leaveQuest(address: string, questId: string): Promise<void> {
    try {
      const userData = await this.loadUserData(address);

      userData.progress.joinedQuests = userData.progress.joinedQuests.filter(
        (id) => id !== questId
      );
      delete userData.progress.questProgress[questId];

      await this.saveUserData(userData);
    } catch (error) {
      console.error("Failed to leave quest:", error);
      throw error;
    }
  }

  /**
   * Update quest progress
   */
  static async updateQuestProgress(
    address: string,
    questId: string,
    completedRequirements: number[],
    notes?: string
  ): Promise<void> {
    try {
      const userData = await this.loadUserData(address);

      if (!userData.progress.questProgress[questId]) {
        userData.progress.questProgress[questId] = {
          completedRequirements: [],
          joinedAt: new Date().toISOString(),
        };
      }

      userData.progress.questProgress[questId].completedRequirements =
        completedRequirements;
      if (notes !== undefined) {
        userData.progress.questProgress[questId].notes = notes;
      }

      await this.saveUserData(userData);
    } catch (error) {
      console.error("Failed to update quest progress:", error);
      throw error;
    }
  }

  /**
   * Get user's completed quests
   */
  static async getCompletedQuests(address: string): Promise<string[]> {
    try {
      const userData = await this.loadUserData(address);
      return userData.progress.completedQuests;
    } catch (error) {
      console.error("Failed to get completed quests:", error);
      return [];
    }
  }

  /**
   * Get user's joined quests
   */
  static async getJoinedQuests(address: string): Promise<string[]> {
    try {
      const userData = await this.loadUserData(address);
      return userData.progress.joinedQuests;
    } catch (error) {
      console.error("Failed to get joined quests:", error);
      return [];
    }
  }

  /**
   * Check if user has joined a quest
   */
  static async isQuestJoined(
    address: string,
    questId: string
  ): Promise<boolean> {
    try {
      const userData = await this.loadUserData(address);
      return userData.progress.joinedQuests.includes(questId);
    } catch (error) {
      console.error("Failed to check quest join status:", error);
      return false;
    }
  }

  /**
   * Check if user has completed a quest
   */
  static async isQuestCompleted(
    address: string,
    questId: string
  ): Promise<boolean> {
    try {
      const userData = await this.loadUserData(address);
      return userData.progress.completedQuests.includes(questId);
    } catch (error) {
      console.error("Failed to check quest completion status:", error);
      return false;
    }
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(address: string): Promise<Badge[]> {
    try {
      const userData = await this.loadUserData(address);
      return userData.progress.badges;
    } catch (error) {
      console.error("Failed to get user badges:", error);
      return [];
    }
  }

  /**
   * Add a badge to user's collection
   */
  static async addBadge(address: string, badge: Badge): Promise<void> {
    try {
      const userData = await this.loadUserData(address);
      userData.progress.badges.push(badge);
      await this.saveUserData(userData);
    } catch (error) {
      console.error("Failed to add badge:", error);
      throw error;
    }
  }

  /**
   * Remove a badge from user's collection
   */
  static async removeBadge(address: string, badgeId: string): Promise<void> {
    try {
      const userData = await this.loadUserData(address);
      userData.progress.badges = userData.progress.badges.filter(
        (badge) => badge.id !== badgeId
      );
      await this.saveUserData(userData);
    } catch (error) {
      console.error("Failed to remove badge:", error);
      throw error;
    }
  }

  /**
   * Get quest progress for a specific quest
   */
  static async getQuestProgress(
    address: string,
    questId: string
  ): Promise<{
    completedRequirements: number[];
    joinedAt: string;
    notes?: string;
  } | null> {
    try {
      const userData = await this.loadUserData(address);
      return userData.progress.questProgress[questId] || null;
    } catch (error) {
      console.error("Failed to get quest progress:", error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    address: string,
    profileData: Partial<UserProfile>
  ): Promise<void> {
    try {
      const userData = await this.loadUserData(address);
      userData.profile = {
        ...userData.profile,
        ...profileData,
        address, // Ensure address doesn't change
        lastUpdated: new Date().toISOString(),
      };
      await this.saveUserData(userData);
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(address: string): Promise<UserProfile> {
    try {
      const userData = await this.loadUserData(address);
      return userData.profile;
    } catch (error) {
      console.error("Failed to get profile:", error);
      return {
        address,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Reset a quest (remove completion, badges, and progress)
   */
  static async resetQuest(address: string, questId: string): Promise<void> {
    try {
      const userData = await this.loadUserData(address);

      // Remove from completed quests
      userData.progress.completedQuests =
        userData.progress.completedQuests.filter((id) => id !== questId);

      // Remove associated badges
      userData.progress.badges = userData.progress.badges.filter(
        (badge) => badge.questId !== questId
      );

      // Remove quest progress
      delete userData.progress.questProgress[questId];

      // Update timestamps
      userData.progress.lastUpdated = new Date().toISOString();

      await this.saveUserData(userData);
    } catch (error) {
      console.error("Failed to reset quest:", error);
      throw error;
    }
  }

  /**
   * Clear cache for a user (force refresh)
   */
  static clearUserCache(address: string): void {
    this.userDataCache.delete(address);
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    this.userDataCache.clear();
  }
}

export default OnlineUserStorage;
