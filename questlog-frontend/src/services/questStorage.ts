/**
 * Centralized Quest Storage Service
 * Handles quest storage and synchronization across devices
 */

import { Quest } from "../types/quest";

export interface QuestStorageService {
  // Public quest methods
  savePublicQuest(quest: Quest): Promise<void>;
  getPublicQuests(): Promise<Quest[]>;
  deletePublicQuest(questId: string): Promise<void>;

  // Private quest methods
  savePrivateQuest(quest: Quest, creatorAddress: string): Promise<void>;
  getPrivateQuests(creatorAddress: string): Promise<Quest[]>;
  deletePrivateQuest(questId: string, creatorAddress: string): Promise<void>;

  // Quest access methods
  getQuestById(questId: string): Promise<Quest | null>;
  getQuestsByCreator(creatorAddress: string): Promise<Quest[]>;

  // User quest interaction methods
  joinQuest(questId: string, userAddress: string): Promise<void>;
  leaveQuest(questId: string, userAddress: string): Promise<void>;
  isQuestJoined(questId: string, userAddress: string): Promise<boolean>;
  getJoinedQuests(userAddress: string): Promise<string[]>;
}

/**
 * Enhanced localStorage implementation with better quest sharing
 */
class EnhancedLocalStorageQuests implements QuestStorageService {
  private readonly PUBLIC_QUESTS_KEY = "questlog_global_public_quests";
  private readonly PRIVATE_QUESTS_PREFIX = "questlog_private_quests";
  private readonly JOINED_QUESTS_PREFIX = "questlog_joined_quests";
  private readonly QUEST_INDEX_KEY = "questlog_quest_index";

  // Quest index for better search and discovery
  private async updateQuestIndex(quest: Quest): Promise<void> {
    try {
      const index = JSON.parse(
        localStorage.getItem(this.QUEST_INDEX_KEY) || "{}"
      );
      index[quest.id] = {
        id: quest.id,
        title: quest.title,
        creatorAddress: quest.creatorAddress,
        visibility: quest.visibility,
        category: quest.category,
        isCompleted: quest.isCompleted,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(this.QUEST_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error("Failed to update quest index:", error);
    }
  }

  private async removeFromQuestIndex(questId: string): Promise<void> {
    try {
      const index = JSON.parse(
        localStorage.getItem(this.QUEST_INDEX_KEY) || "{}"
      );
      delete index[questId];
      localStorage.setItem(this.QUEST_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error("Failed to remove from quest index:", error);
    }
  }

  async savePublicQuest(quest: Quest): Promise<void> {
    try {
      const publicQuests = await this.getPublicQuests();
      const existingIndex = publicQuests.findIndex((q) => q.id === quest.id);

      if (existingIndex >= 0) {
        publicQuests[existingIndex] = quest;
      } else {
        publicQuests.push(quest);
      }

      localStorage.setItem(
        this.PUBLIC_QUESTS_KEY,
        JSON.stringify(publicQuests)
      );
      await this.updateQuestIndex(quest);

      // Emit event for real-time updates
      window.dispatchEvent(new CustomEvent("questUpdated", { detail: quest }));
    } catch (error) {
      throw new Error(`Failed to save public quest: ${error}`);
    }
  }

  async getPublicQuests(): Promise<Quest[]> {
    try {
      const quests = JSON.parse(
        localStorage.getItem(this.PUBLIC_QUESTS_KEY) || "[]"
      );
      return quests.map((q: any) => ({
        ...q,
        startDate: q.startDate ? new Date(q.startDate) : undefined,
        endDate: q.endDate ? new Date(q.endDate) : undefined,
        visibility: "public" as const,
      }));
    } catch (error) {
      console.error("Failed to get public quests:", error);
      return [];
    }
  }

  async deletePublicQuest(questId: string): Promise<void> {
    try {
      const publicQuests = await this.getPublicQuests();
      const filteredQuests = publicQuests.filter((q) => q.id !== questId);
      localStorage.setItem(
        this.PUBLIC_QUESTS_KEY,
        JSON.stringify(filteredQuests)
      );
      await this.removeFromQuestIndex(questId);

      // Emit event for real-time updates
      window.dispatchEvent(
        new CustomEvent("questDeleted", { detail: { questId } })
      );
    } catch (error) {
      throw new Error(`Failed to delete public quest: ${error}`);
    }
  }

  async savePrivateQuest(quest: Quest, creatorAddress: string): Promise<void> {
    try {
      const key = `${this.PRIVATE_QUESTS_PREFIX}_${creatorAddress}`;
      const privateQuests = await this.getPrivateQuests(creatorAddress);
      const existingIndex = privateQuests.findIndex((q) => q.id === quest.id);

      if (existingIndex >= 0) {
        privateQuests[existingIndex] = quest;
      } else {
        privateQuests.push(quest);
      }

      localStorage.setItem(key, JSON.stringify(privateQuests));
      await this.updateQuestIndex(quest);

      // Emit event for real-time updates
      window.dispatchEvent(new CustomEvent("questUpdated", { detail: quest }));
    } catch (error) {
      throw new Error(`Failed to save private quest: ${error}`);
    }
  }

  async getPrivateQuests(creatorAddress: string): Promise<Quest[]> {
    try {
      const key = `${this.PRIVATE_QUESTS_PREFIX}_${creatorAddress}`;
      const quests = JSON.parse(localStorage.getItem(key) || "[]");
      return quests.map((q: any) => ({
        ...q,
        startDate: q.startDate ? new Date(q.startDate) : undefined,
        endDate: q.endDate ? new Date(q.endDate) : undefined,
        creatorAddress,
        visibility: q.visibility || ("invite-only" as const),
      }));
    } catch (error) {
      console.error("Failed to get private quests:", error);
      return [];
    }
  }

  async deletePrivateQuest(
    questId: string,
    creatorAddress: string
  ): Promise<void> {
    try {
      const privateQuests = await this.getPrivateQuests(creatorAddress);
      const filteredQuests = privateQuests.filter((q) => q.id !== questId);
      const key = `${this.PRIVATE_QUESTS_PREFIX}_${creatorAddress}`;
      localStorage.setItem(key, JSON.stringify(filteredQuests));
      await this.removeFromQuestIndex(questId);

      // Emit event for real-time updates
      window.dispatchEvent(
        new CustomEvent("questDeleted", { detail: { questId } })
      );
    } catch (error) {
      throw new Error(`Failed to delete private quest: ${error}`);
    }
  }

  async getQuestById(questId: string): Promise<Quest | null> {
    try {
      // First check quest index for faster lookup
      const index = JSON.parse(
        localStorage.getItem(this.QUEST_INDEX_KEY) || "{}"
      );
      const questInfo = index[questId];

      if (!questInfo) {
        return null;
      }

      // Load quest based on visibility
      if (questInfo.visibility === "public") {
        const publicQuests = await this.getPublicQuests();
        return publicQuests.find((q) => q.id === questId) || null;
      } else {
        // For private quests, we need to check the creator's storage
        if (questInfo.creatorAddress) {
          const privateQuests = await this.getPrivateQuests(
            questInfo.creatorAddress
          );
          return privateQuests.find((q) => q.id === questId) || null;
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to get quest by ID:", error);
      return null;
    }
  }

  async getQuestsByCreator(creatorAddress: string): Promise<Quest[]> {
    try {
      const publicQuests = await this.getPublicQuests();
      const privateQuests = await this.getPrivateQuests(creatorAddress);

      const userPublicQuests = publicQuests.filter(
        (q) => q.creatorAddress?.toLowerCase() === creatorAddress.toLowerCase()
      );

      return [...userPublicQuests, ...privateQuests];
    } catch (error) {
      console.error("Failed to get quests by creator:", error);
      return [];
    }
  }

  async joinQuest(questId: string, userAddress: string): Promise<void> {
    try {
      const key = `${this.JOINED_QUESTS_PREFIX}_${userAddress}`;
      const joinedQuests = await this.getJoinedQuests(userAddress);

      if (!joinedQuests.includes(questId)) {
        joinedQuests.push(questId);
        localStorage.setItem(key, JSON.stringify(joinedQuests));

        // Emit event for real-time updates
        window.dispatchEvent(
          new CustomEvent("questJoined", {
            detail: { questId, userAddress },
          })
        );
      }
    } catch (error) {
      throw new Error(`Failed to join quest: ${error}`);
    }
  }

  getAllQuests(userAddress: string): Quest[] {
    try {
      let allQuests: Quest[] = [];

      // Load public quests
      const publicQuests = JSON.parse(
        localStorage.getItem(this.PUBLIC_QUESTS_KEY) || "[]"
      );
      const publicQuestsWithCreator = publicQuests.map((q: any) => ({
        ...q,
        creatorAddress: q.creatorAddress || "unknown",
        startDate: q.startDate ? new Date(q.startDate) : undefined,
        endDate: q.endDate ? new Date(q.endDate) : undefined,
      }));
      allQuests = [...allQuests, ...publicQuestsWithCreator];

      // Load user's private quests
      const privateQuests = JSON.parse(
        localStorage.getItem(`${this.PRIVATE_QUESTS_PREFIX}_${userAddress}`) ||
          "[]"
      );
      const privateQuestsWithCreator = privateQuests.map((q: any) => ({
        ...q,
        creatorAddress: userAddress,
        startDate: q.startDate ? new Date(q.startDate) : undefined,
        endDate: q.endDate ? new Date(q.endDate) : undefined,
      }));
      allQuests = [...allQuests, ...privateQuestsWithCreator];

      // Load quests user has joined
      const joinedQuestIds = JSON.parse(
        localStorage.getItem(`${this.JOINED_QUESTS_PREFIX}_${userAddress}`) ||
          "[]"
      );

      // Find joined quests from other users' private quests
      const allStorageKeys = Object.keys(localStorage);
      const privateQuestKeys = allStorageKeys.filter(
        (key) =>
          key.startsWith(this.PRIVATE_QUESTS_PREFIX) &&
          key !== `${this.PRIVATE_QUESTS_PREFIX}_${userAddress}`
      );

      for (const key of privateQuestKeys) {
        const creatorAddress = key.replace(
          `${this.PRIVATE_QUESTS_PREFIX}_`,
          ""
        );
        const otherUserQuests = JSON.parse(localStorage.getItem(key) || "[]");
        const joinedFromThisUser = otherUserQuests
          .filter((q: any) => joinedQuestIds.includes(q.id))
          .map((q: any) => ({
            ...q,
            creatorAddress,
            startDate: q.startDate ? new Date(q.startDate) : undefined,
            endDate: q.endDate ? new Date(q.endDate) : undefined,
          }));
        allQuests = [...allQuests, ...joinedFromThisUser];
      }

      return allQuests;
    } catch (error) {
      console.error("Failed to get all quests:", error);
      return [];
    }
  }

  async leaveQuest(questId: string, userAddress: string): Promise<void> {
    try {
      const key = `${this.JOINED_QUESTS_PREFIX}_${userAddress}`;
      const joinedQuests = await this.getJoinedQuests(userAddress);
      const filteredQuests = joinedQuests.filter((id) => id !== questId);

      localStorage.setItem(key, JSON.stringify(filteredQuests));

      // Emit event for real-time updates
      window.dispatchEvent(
        new CustomEvent("questLeft", {
          detail: { questId, userAddress },
        })
      );
    } catch (error) {
      throw new Error(`Failed to leave quest: ${error}`);
    }
  }

  async isQuestJoined(questId: string, userAddress: string): Promise<boolean> {
    try {
      const joinedQuests = await this.getJoinedQuests(userAddress);
      return joinedQuests.includes(questId);
    } catch (error) {
      console.error("Failed to check if quest is joined:", error);
      return false;
    }
  }

  async getJoinedQuests(userAddress: string): Promise<string[]> {
    try {
      const key = `${this.JOINED_QUESTS_PREFIX}_${userAddress}`;
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      console.error("Failed to get joined quests:", error);
      return [];
    }
  }
}

// Export the service instance
export const questStorage: QuestStorageService =
  new EnhancedLocalStorageQuests();

// Export utility functions for quest sharing
export class QuestSharingUtils {
  /**
   * Generates a short invite code for quests instead of full links
   * Uses the last 8 characters of the quest ID for simplicity
   */
  static generateQuestCode(questId: string): string {
    // Use the last 8 characters of the quest ID as the share code
    return questId.slice(-8).toUpperCase();
  }

  /**
   * Finds a quest by its share code across all storage
   */
  static findQuestByCode(code: string): string | null {
    try {
      const normalizedCode = code.toUpperCase();

      // Search through all stored quests to find one with matching code
      const allStorageKeys = Object.keys(localStorage);

      // Check public quests
      const publicQuests = JSON.parse(
        localStorage.getItem("questlog_global_public_quests") || "[]"
      );
      for (const quest of publicQuests) {
        if (quest.id && this.generateQuestCode(quest.id) === normalizedCode) {
          return quest.id;
        }
      }

      // Check private quests from all users
      const privateQuestKeys = allStorageKeys.filter((key) =>
        key.startsWith("questlog_private_quests_")
      );

      for (const key of privateQuestKeys) {
        const quests = JSON.parse(localStorage.getItem(key) || "[]");
        for (const quest of quests) {
          if (quest.id && this.generateQuestCode(quest.id) === normalizedCode) {
            return quest.id;
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to find quest by code:", error);
      return null;
    }
  }

  /**
   * Legacy link parsing support and new code-based system
   */
  static parseQuestLink(input: string): string | null {
    try {
      // If it's a short code (8 characters or less), treat as quest code
      if (input.length <= 8 && /^[A-Za-z0-9]+$/.test(input)) {
        return this.findQuestByCode(input);
      }

      // Otherwise, try to parse as URL for backwards compatibility
      const url = new URL(input);
      const pathSegments = url.pathname.split("/");

      // Check for /quest/join/[questId] format
      if (
        pathSegments.length >= 4 &&
        pathSegments[1] === "quest" &&
        pathSegments[2] === "join"
      ) {
        return pathSegments[3];
      }

      // Check for quest ID in query params
      const questId = url.searchParams.get("questId");
      if (questId) {
        return questId;
      }

      return null;
    } catch (error) {
      // If URL parsing fails, try as quest code
      if (input.length <= 8 && /^[A-Za-z0-9]+$/.test(input)) {
        return this.findQuestByCode(input);
      }
      console.error("Failed to parse quest link:", error);
      return null;
    }
  }

  /**
   * Validates if a quest can be joined by checking permissions and requirements
   */
  static async canJoinQuest(
    quest: Quest,
    userAddress: string
  ): Promise<{
    canJoin: boolean;
    reason?: string;
  }> {
    try {
      // Check if user is the creator
      if (quest.creatorAddress?.toLowerCase() === userAddress.toLowerCase()) {
        return { canJoin: false, reason: "You cannot join your own quest" };
      }

      // Check if already joined
      const isJoined = await questStorage.isQuestJoined(quest.id, userAddress);
      if (isJoined) {
        return { canJoin: false, reason: "You have already joined this quest" };
      }

      // Check if quest is completed
      if (quest.isCompleted) {
        return { canJoin: false, reason: "This quest has been completed" };
      }

      // Check participant limit
      if (quest.participantLimit && quest.participantLimit > 0) {
        // TODO: Implement participant count check
        // For now, assume quest is available
      }

      return { canJoin: true };
    } catch (error) {
      console.error("Failed to validate quest join permissions:", error);
      return { canJoin: false, reason: "Failed to validate permissions" };
    }
  }
}

export default questStorage;
