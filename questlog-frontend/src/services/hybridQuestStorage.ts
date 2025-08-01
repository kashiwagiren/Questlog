/**
 * Hybrid Quest Storage Service
 * Combines IPFS for cross-device sharing with localStorage for performance
 */

import { Quest } from "../types/quest";
import { IPFSQuestStorage } from "./ipfsQuestStorage";
import { QuestStorageService } from "./questStorage";

export class HybridQuestStorage implements QuestStorageService {
  private readonly PUBLIC_QUESTS_KEY = "questlog_global_public_quests";
  private readonly PRIVATE_QUESTS_PREFIX = "questlog_private_quests";
  private readonly JOINED_QUESTS_PREFIX = "questlog_joined_quests";
  private readonly QUEST_INDEX_KEY = "questlog_quest_index";

  /**
   * Save public quest - stores both locally and on IPFS
   */
  async savePublicQuest(quest: Quest): Promise<void> {
    try {
      // Save locally first for immediate access
      await this.saveQuestLocally(quest, "public");

      // Save to IPFS for cross-device access
      const ipfsResult = await IPFSQuestStorage.saveQuestToIPFS(quest);
      if (ipfsResult.success) {
        console.log(
          `✅ Quest "${quest.title}" saved to IPFS with code: ${ipfsResult.questCode}`
        );

        // Store IPFS metadata locally
        this.storeIPFSMetadata(quest.id, {
          ipfsHash: ipfsResult.ipfsHash!,
          questCode: ipfsResult.questCode!,
          syncedAt: new Date().toISOString(),
        });
      } else {
        console.warn(`⚠️ Failed to save quest to IPFS: ${ipfsResult.error}`);
      }

      // Emit event for real-time updates
      window.dispatchEvent(new CustomEvent("questUpdated", { detail: quest }));
    } catch (error) {
      throw new Error(`Failed to save public quest: ${error}`);
    }
  }

  /**
   * Get public quests - returns local quests plus any from IPFS
   */
  async getPublicQuests(): Promise<Quest[]> {
    try {
      // Get local quests first
      const localQuests = await this.getLocalPublicQuests();

      // Try to get additional quests from IPFS
      try {
        const ipfsQuests = await IPFSQuestStorage.getAllPublicQuests();

        // Merge local and IPFS quests, avoiding duplicates
        const allQuests = [...localQuests];
        for (const ipfsQuest of ipfsQuests) {
          if (!allQuests.find((q) => q.id === ipfsQuest.id)) {
            allQuests.push(ipfsQuest);
          }
        }

        return allQuests;
      } catch (error) {
        console.warn("Failed to load IPFS quests, using local only:", error);
        return localQuests;
      }
    } catch (error) {
      console.error("Failed to get public quests:", error);
      return [];
    }
  }

  /**
   * Delete public quest - removes from both local and IPFS
   */
  async deletePublicQuest(questId: string): Promise<void> {
    try {
      // Remove locally
      const publicQuests = await this.getLocalPublicQuests();
      const filteredQuests = publicQuests.filter((q) => q.id !== questId);
      localStorage.setItem(
        this.PUBLIC_QUESTS_KEY,
        JSON.stringify(filteredQuests)
      );

      // Remove from quest index
      await this.removeFromQuestIndex(questId);

      // Remove IPFS metadata
      this.removeIPFSMetadata(questId);

      // Note: We can't actually delete from IPFS due to its immutable nature
      // The quest will remain accessible via direct hash/code but won't appear in new indexes

      // Emit event for real-time updates
      window.dispatchEvent(
        new CustomEvent("questDeleted", { detail: { questId } })
      );
    } catch (error) {
      throw new Error(`Failed to delete public quest: ${error}`);
    }
  }

  /**
   * Save private quest - only local storage
   */
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

  /**
   * Get private quests - local storage only
   */
  async getPrivateQuests(creatorAddress: string): Promise<Quest[]> {
    try {
      const key = `${this.PRIVATE_QUESTS_PREFIX}_${creatorAddress}`;
      const quests = JSON.parse(localStorage.getItem(key) || "[]");
      return quests.map((q: any) => ({
        ...q,
        startDate: q.startDate ? new Date(q.startDate) : undefined,
        endDate: q.endDate ? new Date(q.endDate) : undefined,
        visibility: "private" as const,
      }));
    } catch (error) {
      console.error("Failed to get private quests:", error);
      return [];
    }
  }

  /**
   * Delete private quest - local storage only
   */
  async deletePrivateQuest(
    questId: string,
    creatorAddress: string
  ): Promise<void> {
    try {
      const key = `${this.PRIVATE_QUESTS_PREFIX}_${creatorAddress}`;
      const privateQuests = await this.getPrivateQuests(creatorAddress);
      const filteredQuests = privateQuests.filter((q) => q.id !== questId);
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

  /**
   * Get quest by ID - checks local first, then IPFS
   */
  async getQuestById(questId: string): Promise<Quest | null> {
    try {
      // Check local storage first
      const localQuest = await this.getLocalQuestById(questId);
      if (localQuest) {
        return localQuest;
      }

      // Try IPFS if not found locally
      const result = await IPFSQuestStorage.loadQuestFromIPFS(questId);
      return result.success ? result.quest! : null;
    } catch (error) {
      console.error("Failed to get quest by ID:", error);
      return null;
    }
  }

  /**
   * Get quest by code - IPFS lookup
   */
  async getQuestByCode(questCode: string): Promise<Quest | null> {
    try {
      return await IPFSQuestStorage.findQuestByCode(questCode);
    } catch (error) {
      console.error("Failed to get quest by code:", error);
      return null;
    }
  }

  /**
   * Get quests by creator
   */
  async getQuestsByCreator(creatorAddress: string): Promise<Quest[]> {
    try {
      const publicQuests = await this.getPublicQuests();
      const privateQuests = await this.getPrivateQuests(creatorAddress);

      const creatorPublicQuests = publicQuests.filter(
        (q) => q.creatorAddress === creatorAddress
      );

      return [...creatorPublicQuests, ...privateQuests];
    } catch (error) {
      console.error("Failed to get quests by creator:", error);
      return [];
    }
  }

  /**
   * Join quest
   */
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

  /**
   * Leave quest
   */
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

  /**
   * Check if quest is joined
   */
  async isQuestJoined(questId: string, userAddress: string): Promise<boolean> {
    try {
      const joinedQuests = await this.getJoinedQuests(userAddress);
      return joinedQuests.includes(questId);
    } catch (error) {
      console.error("Failed to check if quest is joined:", error);
      return false;
    }
  }

  /**
   * Get joined quests
   */
  async getJoinedQuests(userAddress: string): Promise<string[]> {
    try {
      const key = `${this.JOINED_QUESTS_PREFIX}_${userAddress}`;
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      console.error("Failed to get joined quests:", error);
      return [];
    }
  }

  /**
   * Sync local quests to IPFS
   */
  async syncToIPFS(userAddress: string): Promise<{
    success: boolean;
    syncedQuests: number;
    errors: string[];
  }> {
    return await IPFSQuestStorage.syncLocalQuestsToIPFS(userAddress);
  }

  /**
   * Generate quest code for sharing
   */
  generateQuestCode(questId: string): string {
    return IPFSQuestStorage.generateQuestCode(questId);
  }

  /**
   * Get IPFS metadata for a quest
   */
  getIPFSMetadata(
    questId: string
  ): { ipfsHash?: string; questCode?: string; syncedAt?: string } | null {
    try {
      const metadata = localStorage.getItem(`questlog_ipfs_meta_${questId}`);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      return null;
    }
  }

  // Private helper methods

  private async getLocalPublicQuests(): Promise<Quest[]> {
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
      console.error("Failed to get local public quests:", error);
      return [];
    }
  }

  private async getLocalQuestById(questId: string): Promise<Quest | null> {
    try {
      // Check public quests
      const publicQuests = await this.getLocalPublicQuests();
      const publicQuest = publicQuests.find((q) => q.id === questId);
      if (publicQuest) return publicQuest;

      // Check all private quest stores
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.PRIVATE_QUESTS_PREFIX)) {
          const privateQuests = JSON.parse(localStorage.getItem(key) || "[]");
          const privateQuest = privateQuests.find(
            (q: Quest) => q.id === questId
          );
          if (privateQuest) {
            return {
              ...privateQuest,
              startDate: privateQuest.startDate
                ? new Date(privateQuest.startDate)
                : undefined,
              endDate: privateQuest.endDate
                ? new Date(privateQuest.endDate)
                : undefined,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to get local quest by ID:", error);
      return null;
    }
  }

  private async saveQuestLocally(
    quest: Quest,
    visibility: "public" | "private"
  ): Promise<void> {
    if (visibility === "public") {
      const publicQuests = await this.getLocalPublicQuests();
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
    }
  }

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

  private storeIPFSMetadata(
    questId: string,
    metadata: { ipfsHash: string; questCode: string; syncedAt: string }
  ): void {
    try {
      localStorage.setItem(
        `questlog_ipfs_meta_${questId}`,
        JSON.stringify(metadata)
      );
    } catch (error) {
      console.error("Failed to store IPFS metadata:", error);
    }
  }

  private removeIPFSMetadata(questId: string): void {
    try {
      localStorage.removeItem(`questlog_ipfs_meta_${questId}`);
    } catch (error) {
      console.error("Failed to remove IPFS metadata:", error);
    }
  }
}

// Export singleton instance
export default new HybridQuestStorage();
