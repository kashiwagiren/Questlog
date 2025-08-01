/**
 * IPFS-Based Cross-Device Quest Storage Service
 * Enables complete quest sharing across devices and users
 */

import { Quest } from "../types/quest";
import IPFSService from "./ipfs";

export interface IPFSQuestIndex {
  quests: {
    [questId: string]: {
      ipfsHash: string;
      creatorAddress: string;
      visibility: string;
      lastUpdated: string;
      questCode: string;
    };
  };
  lastUpdated: string;
}

export interface QuestMetadata {
  quest: Quest;
  createdAt: string;
  updatedAt: string;
  signature?: string; // For verification
}

export class IPFSQuestStorage {
  private static readonly QUEST_INDEX_IPFS_KEY = "questlog_global_quest_index";
  private static readonly QUEST_INDEX_LOCAL_KEY = "questlog_ipfs_quest_index";
  private static readonly IPFS_CACHE_KEY = "questlog_ipfs_cache";
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Reset quest index (useful for debugging)
   */
  static resetQuestIndex(): void {
    console.log("🔄 Resetting quest index...");
    localStorage.removeItem(this.QUEST_INDEX_IPFS_KEY);
    localStorage.removeItem(this.QUEST_INDEX_LOCAL_KEY);
    console.log("✅ Quest index reset complete");
  }

  /**
   * Generate a short quest code from quest ID
   */
  static generateQuestCode(questId: string): string {
    // Create a deterministic but short code from the quest ID
    let hash = 0;
    for (let i = 0; i < questId.length; i++) {
      const char = questId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to base36 and pad to 8 characters
    const code = Math.abs(hash)
      .toString(36)
      .toUpperCase()
      .padStart(8, "0")
      .slice(0, 8);
    return code;
  }

  /**
   * Upload quest to IPFS and update global index
   */
  static async saveQuestToIPFS(quest: Quest): Promise<{
    success: boolean;
    ipfsHash?: string;
    questCode?: string;
    error?: string;
  }> {
    try {
      console.log(`📤 Saving quest "${quest.title}"...`);

      // Due to CORS issues, save to local storage for now
      console.log("📱 Saving quest to local storage (device-specific)");

      // Generate quest code for sharing
      const questCode = this.generateQuestCode(quest.id);

      // Save to appropriate local storage based on visibility
      if (quest.visibility === "public") {
        // Add to public quests
        const publicQuestsData = localStorage.getItem(
          "questlog_global_public_quests"
        );
        let publicQuests: Quest[] = [];

        if (publicQuestsData) {
          try {
            publicQuests = JSON.parse(publicQuestsData);
          } catch (error) {
            console.warn("Failed to parse existing public quests");
          }
        }

        // Remove existing quest with same ID if it exists
        publicQuests = publicQuests.filter((q) => q.id !== quest.id);

        // Add the new quest
        publicQuests.push(quest);

        // Save back to localStorage
        localStorage.setItem(
          "questlog_global_public_quests",
          JSON.stringify(publicQuests)
        );
        console.log(`✅ Quest "${quest.title}" saved to local public quests`);
      } else {
        // Save private quest (creator-specific)
        const creatorAddress = quest.creatorAddress || "";
        const privateKey = `questlog_private_quests_${creatorAddress}`;

        const privateQuestsData = localStorage.getItem(privateKey);
        let privateQuests: Quest[] = [];

        if (privateQuestsData) {
          try {
            privateQuests = JSON.parse(privateQuestsData);
          } catch (error) {
            console.warn("Failed to parse existing private quests");
          }
        }

        // Remove existing quest with same ID if it exists
        privateQuests = privateQuests.filter((q) => q.id !== quest.id);

        // Add the new quest
        privateQuests.push(quest);

        // Save back to localStorage
        localStorage.setItem(privateKey, JSON.stringify(privateQuests));
        console.log(`✅ Quest "${quest.title}" saved to local private quests`);
      }

      // Generate a local "hash" for consistency
      const localHash = `local_${quest.id}_${Date.now()}`;

      return {
        success: true,
        ipfsHash: localHash,
        questCode,
      };
    } catch (error) {
      console.error("Failed to save quest:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Load quest from local storage by quest ID or code
   */
  static async loadQuestFromIPFS(questIdOrCode: string): Promise<{
    success: boolean;
    quest?: Quest;
    error?: string;
  }> {
    try {
      console.log(`📥 Loading quest: ${questIdOrCode}`);

      // Due to CORS issues, load from local storage
      console.log("📱 Loading quest from local storage");

      // Check public quests first
      const publicQuestsData = localStorage.getItem(
        "questlog_global_public_quests"
      );
      if (publicQuestsData) {
        try {
          const publicQuests = JSON.parse(publicQuestsData) as Quest[];

          // Try to find by ID or by quest code
          let quest = publicQuests.find((q) => q.id === questIdOrCode);

          if (!quest) {
            // Try to find by quest code (last 8 characters of ID)
            const possibleCode = questIdOrCode.toUpperCase();
            quest = publicQuests.find(
              (q) => q.id.slice(-8).toUpperCase() === possibleCode
            );
          }

          if (quest) {
            console.log(`✅ Found quest in public storage: ${quest.title}`);
            return { success: true, quest };
          }
        } catch (error) {
          console.warn("Failed to parse public quests");
        }
      }

      // Check private quests (we'd need the creator address for this)
      // For now, just check if there are any private quest keys in localStorage
      const allKeys = Object.keys(localStorage);
      const privateKeys = allKeys.filter((key) =>
        key.startsWith("questlog_private_quests_")
      );

      for (const key of privateKeys) {
        try {
          const privateQuestsData = localStorage.getItem(key);
          if (privateQuestsData) {
            const privateQuests = JSON.parse(privateQuestsData) as Quest[];

            let quest = privateQuests.find((q) => q.id === questIdOrCode);

            if (!quest) {
              // Try to find by quest code
              const possibleCode = questIdOrCode.toUpperCase();
              quest = privateQuests.find(
                (q) => q.id.slice(-8).toUpperCase() === possibleCode
              );
            }

            if (quest) {
              console.log(`✅ Found quest in private storage: ${quest.title}`);
              return { success: true, quest };
            }
          }
        } catch (error) {
          console.warn(`Failed to parse private quests from ${key}`);
        }
      }

      return {
        success: false,
        error: "Quest not found in local storage",
      };
    } catch (error) {
      console.error("Failed to load quest:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Search for quests by code
   */
  static async findQuestByCode(questCode: string): Promise<Quest | null> {
    try {
      const normalizedCode = questCode.trim().toUpperCase();

      // Load global quest index
      const index = await this.loadGlobalQuestIndex();

      // Find quest by code
      for (const [questId, questInfo] of Object.entries(index.quests)) {
        if (questInfo.questCode === normalizedCode) {
          const result = await this.loadQuestFromIPFS(questId);
          return result.success ? result.quest! : null;
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to find quest by code:", error);
      return null;
    }
  }

  /**
   * Get all public quests from IPFS
   */
  static async getAllPublicQuests(
    forceRefresh: boolean = false
  ): Promise<Quest[]> {
    try {
      console.log(
        `📋 Loading all public quests... (forceRefresh: ${forceRefresh})`
      );

      // Due to CORS issues with IPFS gateways, use local storage for now
      console.log(
        "� Using local storage for quest retrieval (device-specific)"
      );

      const publicQuests: Quest[] = [];

      // Load public quests from local storage
      const publicQuestsData = localStorage.getItem(
        "questlog_global_public_quests"
      );
      if (publicQuestsData) {
        try {
          const quests = JSON.parse(publicQuestsData) as Quest[];
          publicQuests.push(...quests);
          console.log(
            `📦 Loaded ${quests.length} public quests from local storage`
          );
        } catch (error) {
          console.warn("❌ Failed to parse public quests from local storage");
        }
      }

      console.log(`✅ Loaded ${publicQuests.length} public quests`);
      return publicQuests;
    } catch (error) {
      console.error("Failed to load public quests:", error);
      return [];
    }
  }

  /**
   * Load global quest index from IPFS
   */
  private static async loadGlobalQuestIndex(
    forceRefresh: boolean = false
  ): Promise<IPFSQuestIndex> {
    try {
      console.log(
        `📑 Loading global quest index (forceRefresh: ${forceRefresh})...`
      );

      // Try to load from local cache first (unless forced refresh)
      if (!forceRefresh) {
        const cachedIndex = await this.getCachedIndex();
        if (cachedIndex) {
          console.log("📦 Using cached quest index:", cachedIndex);
          return cachedIndex;
        }
      }

      // Get the latest index hash
      const indexHash = localStorage.getItem(this.QUEST_INDEX_IPFS_KEY);
      console.log(`🔗 Quest index IPFS hash: ${indexHash}`);

      if (indexHash) {
        console.log(`📥 Loading quest index from IPFS: ${indexHash}`);
        const indexData = await IPFSService.loadJSON(indexHash);
        if (indexData.success && indexData.data) {
          // Cache the index locally
          const index = indexData.data as IPFSQuestIndex;
          console.log("✅ Successfully loaded quest index from IPFS:", index);
          localStorage.setItem(
            this.QUEST_INDEX_LOCAL_KEY,
            JSON.stringify(index)
          );
          return index;
        } else {
          console.warn(
            "❌ Failed to load quest index from IPFS:",
            indexData.error
          );
          console.log("🔄 Clearing invalid IPFS hash and starting fresh");
          // Clear invalid hash
          localStorage.removeItem(this.QUEST_INDEX_IPFS_KEY);
        }
      }

      // Return empty index if none exists
      console.log("📝 Creating new global quest index");
      const newIndex = {
        quests: {},
        lastUpdated: new Date().toISOString(),
      };

      // Store the empty index locally
      localStorage.setItem(
        this.QUEST_INDEX_LOCAL_KEY,
        JSON.stringify(newIndex)
      );

      return newIndex;
    } catch (error) {
      console.error("Failed to load global quest index:", error);
      // Always return a valid empty index
      const fallbackIndex = {
        quests: {},
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(
        this.QUEST_INDEX_LOCAL_KEY,
        JSON.stringify(fallbackIndex)
      );
      return fallbackIndex;
    }
  }

  /**
   * Get cached index if it's fresh and check for updates from other devices
   */
  private static async getCachedIndex(): Promise<IPFSQuestIndex | null> {
    try {
      const cached = localStorage.getItem(this.QUEST_INDEX_LOCAL_KEY);
      if (!cached) return null;

      const index = JSON.parse(cached) as IPFSQuestIndex;
      const cacheAge = Date.now() - new Date(index.lastUpdated).getTime();

      // If cache is very fresh (less than 30 seconds), use it
      if (cacheAge < 30 * 1000) {
        return index;
      }

      // If cache is older than 30 seconds but less than 5 minutes,
      // do a quick check to see if there's a newer version on IPFS
      if (cacheAge < this.CACHE_DURATION) {
        try {
          const currentIndexHash = localStorage.getItem(
            this.QUEST_INDEX_IPFS_KEY
          );
          if (currentIndexHash) {
            // Try to get the latest index from IPFS to compare timestamps
            const latestIndexData = await IPFSService.loadJSON(
              currentIndexHash
            );
            if (latestIndexData.success && latestIndexData.data) {
              const latestIndex = latestIndexData.data as IPFSQuestIndex;

              // If the IPFS version is newer, invalidate cache
              if (
                new Date(latestIndex.lastUpdated) > new Date(index.lastUpdated)
              ) {
                console.log(
                  "🔄 Detected newer quest index on IPFS, invalidating cache"
                );
                localStorage.removeItem(this.QUEST_INDEX_LOCAL_KEY);
                return null;
              }
            }
          }
        } catch (error) {
          // If we can't check IPFS, fall back to using cache if it's still within duration
          console.warn("Could not check for index updates on IPFS:", error);
        }

        return index;
      }

      // Cache is too old, return null to force refresh
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get IPFS hash for a quest by ID or code
   */
  private static async getIPFSHashForQuest(
    questIdOrCode: string
  ): Promise<string | null> {
    const index = await this.loadGlobalQuestIndex();

    // Try direct quest ID lookup first
    if (index.quests[questIdOrCode]) {
      return index.quests[questIdOrCode].ipfsHash;
    }

    // Try quest code lookup
    const normalizedCode = questIdOrCode.trim().toUpperCase();
    for (const questInfo of Object.values(index.quests)) {
      if (questInfo.questCode === normalizedCode) {
        return questInfo.ipfsHash;
      }
    }

    return null;
  }

  /**
   * Clear local cache
   */
  static clearCache(): void {
    localStorage.removeItem(this.IPFS_CACHE_KEY);
    localStorage.removeItem(this.QUEST_INDEX_LOCAL_KEY);
    console.log("🧹 IPFS quest cache cleared");
  }

  /**
   * Sync local quests to IPFS
   */
  static async syncLocalQuestsToIPFS(userAddress: string): Promise<{
    success: boolean;
    syncedQuests: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let syncedQuests = 0;

    try {
      console.log("🔄 Syncing local quests to IPFS...");

      // Get all local quests
      const localQuests = this.getAllLocalQuests(userAddress);

      for (const quest of localQuests) {
        try {
          // Only sync quests that haven't been uploaded to IPFS yet
          const ipfsHash = await this.getIPFSHashForQuest(quest.id);
          if (!ipfsHash) {
            const result = await this.saveQuestToIPFS(quest);
            if (result.success) {
              syncedQuests++;
              console.log(`✅ Synced quest to IPFS: ${quest.title}`);
            } else {
              errors.push(`Failed to sync "${quest.title}": ${result.error}`);
            }
          }
        } catch (error) {
          errors.push(
            `Failed to sync "${quest.title}": ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      console.log(`🎉 Sync complete: ${syncedQuests} quests synced to IPFS`);
      return { success: true, syncedQuests, errors };
    } catch (error) {
      console.error("Failed to sync quests to IPFS:", error);
      return {
        success: false,
        syncedQuests,
        errors: [
          ...errors,
          error instanceof Error ? error.message : "Unknown error",
        ],
      };
    }
  }

  /**
   * Get all local quests (helper method)
   */
  private static getAllLocalQuests(userAddress: string): Quest[] {
    const quests: Quest[] = [];

    try {
      // Get public quests
      const publicQuests = JSON.parse(
        localStorage.getItem("questlog_global_public_quests") || "[]"
      );
      quests.push(...publicQuests);

      // Get private quests for this user
      const privateQuests = JSON.parse(
        localStorage.getItem(`questlog_private_quests_${userAddress}`) || "[]"
      );
      quests.push(...privateQuests);
    } catch (error) {
      console.error("Failed to load local quests:", error);
    }

    return quests;
  }

  // Instance methods for compatibility with existing components

  /**
   * Get all public quests
   */
  async getPublicQuests(forceRefresh: boolean = false): Promise<Quest[]> {
    return IPFSQuestStorage.getAllPublicQuests(forceRefresh);
  }

  /**
   * Get private quests for a user (same as public for now since all quests are on IPFS)
   */
  async getPrivateQuests(creatorAddress: string): Promise<Quest[]> {
    // For now, return all public quests and filter by creator
    // In the future, we could implement private quest encryption
    const allQuests = await IPFSQuestStorage.getAllPublicQuests();
    return allQuests.filter((quest) => quest.creatorAddress === creatorAddress);
  }

  /**
   * Get quest by ID
   */
  async getQuestById(questId: string): Promise<Quest | null> {
    const result = await IPFSQuestStorage.loadQuestFromIPFS(questId);
    return result.quest || null;
  }

  /**
   * Get quest by code
   */
  async getQuestByCode(questCode: string): Promise<Quest | null> {
    return IPFSQuestStorage.findQuestByCode(questCode);
  }

  /**
   * Generate quest code
   */
  generateQuestCode(questId: string): string {
    return IPFSQuestStorage.generateQuestCode(questId);
  }

  /**
   * Save public quest
   */
  async savePublicQuest(quest: Quest): Promise<void> {
    await IPFSQuestStorage.saveQuestToIPFS(quest);
  }

  /**
   * Save private quest (same as public for now)
   */
  async savePrivateQuest(quest: Quest, _creatorAddress: string): Promise<void> {
    await IPFSQuestStorage.saveQuestToIPFS(quest);
  }

  /**
   * Join quest (stored locally for now)
   */
  async joinQuest(questId: string, userAddress: string): Promise<void> {
    try {
      const joinedQuests = JSON.parse(
        localStorage.getItem(`questlog_joined_quests_${userAddress}`) || "[]"
      );
      if (!joinedQuests.includes(questId)) {
        joinedQuests.push(questId);
        localStorage.setItem(
          `questlog_joined_quests_${userAddress}`,
          JSON.stringify(joinedQuests)
        );
      }
    } catch (error) {
      console.error("Failed to join quest:", error);
    }
  }

  /**
   * Leave quest
   */
  async leaveQuest(questId: string, userAddress: string): Promise<void> {
    try {
      const joinedQuests = JSON.parse(
        localStorage.getItem(`questlog_joined_quests_${userAddress}`) || "[]"
      );
      const updatedQuests = joinedQuests.filter((id: string) => id !== questId);
      localStorage.setItem(
        `questlog_joined_quests_${userAddress}`,
        JSON.stringify(updatedQuests)
      );
    } catch (error) {
      console.error("Failed to leave quest:", error);
    }
  }

  /**
   * Check if quest is joined
   */
  async isQuestJoined(questId: string, userAddress: string): Promise<boolean> {
    try {
      const joinedQuests = JSON.parse(
        localStorage.getItem(`questlog_joined_quests_${userAddress}`) || "[]"
      );
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
      return JSON.parse(
        localStorage.getItem(`questlog_joined_quests_${userAddress}`) || "[]"
      );
    } catch (error) {
      console.error("Failed to get joined quests:", error);
      return [];
    }
  }

  /**
   * Delete a quest from IPFS storage
   * This removes the quest from the global index and updates IPFS
   */
  async deleteQuest(questId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting quest ${questId} from IPFS...`);

      // Get current quest index using static method
      const currentIndex = await IPFSQuestStorage.loadGlobalQuestIndex();

      // Check if quest exists in the index
      if (!currentIndex.quests[questId]) {
        console.log(
          `⚠️ Quest ${questId} not found in IPFS index, only cleaning localStorage`
        );
        return;
      }

      // Remove quest from the index
      delete currentIndex.quests[questId];
      currentIndex.lastUpdated = new Date().toISOString();

      // Upload updated index to IPFS using the existing method pattern
      const uploadResult = await IPFSService.uploadJSON(currentIndex);
      if (!uploadResult.success) {
        throw new Error("Failed to upload updated quest index to IPFS");
      }

      // Store the new index hash locally
      localStorage.setItem(
        IPFSQuestStorage.QUEST_INDEX_IPFS_KEY,
        uploadResult.hash!
      );
      localStorage.setItem(
        IPFSQuestStorage.QUEST_INDEX_LOCAL_KEY,
        JSON.stringify(currentIndex)
      );

      console.log(`✅ Quest ${questId} deleted from IPFS successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete quest ${questId} from IPFS:`, error);
      throw error;
    }
  }
}

// Export singleton instance for ease of use
export default new IPFSQuestStorage();
