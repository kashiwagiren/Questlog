// React hooks for component state and side effects
import React, { useState } from "react";
// Wagmi hooks for blockchain interaction
import {
  useAccount, // Get connected wallet address
  useWriteContract, // Execute blockchain transactions
  useWaitForTransactionReceipt, // Wait for transaction confirmation
} from "wagmi";

// Component imports
import QuestCard from "./QuestCard"; // Individual quest display card
import QuestProgressModal from "./QuestProgressModal"; // Quest progress tracking modal

// Type definitions
import { Quest, QuestCategory } from "@backend/types/quest";
import { BadgeRarity, BadgeCategory } from "@backend/types/badge";

// Icon components for UI
import { Filter, Search, Target, Hash, Plus, RefreshCw } from "lucide-react";

// Smart contract configuration
import {
  QUEST_MINTER_CONTRACT_ADDRESS, // Contract address for quest completion
  QUEST_MINTER_ABI, // Contract interface definition
} from "../../config/wagmi";

// Services for data management
import { HybridQuestStorage } from "../../services/hybridQuestStorage"; // Quest data storage
import { OnlineUserStorage } from "../../services/onlineUserStorage"; // User progress and badges
import { QuestSharingUtils } from "../../services/questStorage"; // Quest sharing utilities

// Notification system for user feedback
import {
  useNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from "../UI/NotificationSystem";
import ConfirmationDialog from "../UI/ConfirmationDialog";

interface QuestBoardProps {
  setActiveTab?: (tab: string) => void; // Function to change app tabs (e.g., navigate to badges)
}

/**
 * QuestBoard Component - Main Quest Discovery and Completion Interface
 *
 * PURPOSE:
 * This is the central component for quest management. Users can discover, join, track progress,
 * and complete quests here. It handles the entire quest lifecycle and blockchain transactions.
 *
 * KEY FEATURES:
 * - Quest discovery with filtering and search
 * - Quest joining/leaving functionality
 * - Progress tracking for multi-step quests
 * - Quest completion with automatic badge minting
 * - Quest sharing via unique codes
 * - Event quest timing management
 *
 * USER INTERACTION FLOW:
 * 1. User views available quests (filtered by category/search)
 * 2. User joins quest (stores participation locally)
 * 3. User completes quest requirements (tracked in localStorage/Supabase)
 * 4. User clicks "Complete Quest" button
 * 5. Frontend calls QuestMinter smart contract
 * 6. Contract verifies completion and mints badge NFT
 * 7. User receives soulbound badge in wallet
 *
 * BLOCKCHAIN INTERACTIONS:
 * - useWriteContract: Calls QuestMinter.completeQuestWithMetadata()
 * - useWaitForTransactionReceipt: Waits for transaction confirmation
 * - Extracts token ID from transaction logs for badge tracking
 *
 * CALLED BY: App.tsx when user navigates to "quests" tab
 */
const QuestBoard: React.FC<QuestBoardProps> = ({ setActiveTab }) => {
  // Get connected wallet address from Wagmi
  const { address } = useAccount();
  const { addNotification } = useNotification();

  // Notification helper functions for consistent styling
  const notify = {
    success: showSuccess(addNotification), // Green success messages
    error: showError(addNotification), // Red error messages
    warning: showWarning(addNotification), // Yellow warning messages
    info: showInfo(addNotification), // Blue info messages
  };

  // UI STATE MANAGEMENT
  const [selectedCategory, setSelectedCategory] = useState<
    QuestCategory | "all"
  >("all"); // Current quest filter category
  const [searchTerm, setSearchTerm] = useState(""); // Search input value
  const [quests, setQuests] = useState<Quest[]>([]); // All available quests

  // LOADING STATE MANAGEMENT
  // These sets track which quests are currently being processed to show loading spinners
  const [completingQuestIds, setCompletingQuestIds] = useState<Set<string>>(
    new Set()
  ); // Quests being completed (transaction in progress)
  const [joiningQuestIds, setJoiningQuestIds] = useState<Set<string>>(
    new Set()
  ); // Quests being joined
  const [leavingQuestIds, setLeavingQuestIds] = useState<Set<string>>(
    new Set()
  ); // Quests being left

  // MODAL STATE MANAGEMENT
  const [showJoinModal, setShowJoinModal] = useState(false); // Show quest join by code modal
  const [joinLink, setJoinLink] = useState(""); // Join code input value
  const [showProgressModal, setShowProgressModal] = useState(false); // Show quest progress modal
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null); // Currently selected quest for modal

  // CONFIRMATION DIALOG STATE
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [questToLeave, setQuestToLeave] = useState<Quest | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [questToReset, setQuestToReset] = useState<Quest | null>(null);

  // DATA REFRESH STATE
  const [isRefreshing, setIsRefreshing] = useState(false); // Loading state for data refresh

  // STORAGE INSTANCES
  const questStorage = new HybridQuestStorage();

  /**
   * Extract Clean Error Message from Blockchain Errors
   *
   * PURPOSE:
   * Blockchain errors often contain hundreds of lines of raw transaction data.
   * This function extracts only the human-readable error reason.
   *
   * @param error - The error object from blockchain transaction
   * @returns Clean, user-friendly error message
   */
  const getCleanErrorMessage = (error: any): string => {
    if (!error) return "Unknown error occurred";

    const errorMessage = error.message || String(error);

    // Extract revert reason if available
    if (errorMessage.includes("execution reverted with reason:")) {
      const reasonMatch = errorMessage.match(
        /execution reverted with reason: (.+?)(?:\n|$)/
      );
      if (reasonMatch && reasonMatch[1]) {
        return reasonMatch[1].replace(/['"]/g, ""); // Remove quotes
      }
    }

    // Extract revert reason from ContractFunctionExecutionError
    if (errorMessage.includes("ContractFunctionExecutionError")) {
      const reasonMatch = errorMessage.match(
        /reason: (.+?)(?:\n|Raw Call Arguments|$)/
      );
      if (reasonMatch && reasonMatch[1]) {
        return reasonMatch[1].replace(/['"]/g, "").trim();
      }
    }

    // Look for common blockchain error patterns
    if (errorMessage.includes("invalid recipient")) {
      return "Invalid recipient address";
    }

    if (errorMessage.includes("insufficient funds")) {
      return "Insufficient funds for transaction";
    }

    if (
      errorMessage.includes("user rejected") ||
      errorMessage.includes("denied")
    ) {
      return "Transaction cancelled by user";
    }

    if (errorMessage.includes("nonce too low")) {
      return "Transaction nonce error - please try again";
    }

    if (errorMessage.includes("gas")) {
      return "Gas estimation failed - insufficient funds or contract error";
    }

    // If we can't extract a clean reason, return a generic message
    // Don't return the full error to avoid showing raw transaction data
    return "Transaction failed - please check your wallet and try again";
  };

  // USER QUEST DATA
  const [joinedQuests, setJoinedQuests] = useState<string[]>([]); // Quest IDs user has joined
  const [questProgress, setQuestProgress] = useState<{
    [questId: string]: number[]; // Completed requirement indexes per quest
  }>({});

  // BLOCKCHAIN TRANSACTION HOOKS
  // These hooks manage the quest completion transaction flow
  const {
    writeContract, // Function to execute smart contract transactions
    data: hash, // Transaction hash returned after submission
    isPending: isMinting, // True while transaction is being submitted
  } = useWriteContract();

  const {
    isLoading: isConfirming, // True while waiting for blockchain confirmation
    isSuccess, // True when transaction confirmed successfully
    isError, // True if transaction failed
    error, // Error details if transaction failed
    data: receipt, // Transaction receipt with logs/events
  } = useWaitForTransactionReceipt({ hash });

  // TRANSACTION TRACKING STATE
  // These track which specific quest is being processed for UI updates
  const [currentTransactionQuestId, setCurrentTransactionQuestId] = useState<
    string | null
  >(null); // Quest ID currently being completed
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    "addMinter" | "mint" | null
  >(null); // Current step in transaction process

  /**
   * Extract NFT Token ID from Transaction Receipt
   *
   * PURPOSE:
   * When a quest is completed and badge is minted, we need to extract the token ID
   * from the transaction logs to store it with the badge data.
   *
   * CALLED BY: Transaction success handler (useEffect watching isSuccess)
   *
   * HOW IT WORKS:
   * 1. Searches transaction logs for ERC721 Transfer event
   * 2. Transfer event signature identifies NFT mint transactions
   * 3. Token ID is in the 3rd topic (indexed parameter) of the event
   * 4. Converts hex value to decimal string for storage
   *
   * @param receipt - Transaction receipt from blockchain
   * @returns Token ID as string, or null if not found
   */
  const extractTokenIdFromReceipt = (receipt: any): string | null => {
    if (!receipt?.logs) return null;

    try {
      // Look for Transfer event logs (ERC721 token transfer)
      for (const log of receipt.logs) {
        // Transfer event signature: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
        // Topic 0 is the event signature hash
        const transferEventSignature =
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

        if (log.topics && log.topics[0] === transferEventSignature) {
          // Topic 3 is the tokenId (indexed parameter)
          if (log.topics[3]) {
            // Convert hex to decimal string
            const tokenId = BigInt(log.topics[3]).toString();
            console.log("Extracted token ID from receipt:", tokenId);
            return tokenId;
          }
        }
      }
    } catch (error) {
      console.error("Error extracting token ID from receipt:", error);
    }

    return null;
  };

  /**
   * Get event quest status for display
   */
  const getEventQuestStatus = (
    quest: Quest
  ): {
    status: "upcoming" | "active" | "ended";
    timeLeft?: string;
    message?: string;
  } => {
    if (quest.visibility !== "event" || !quest.startDate || !quest.endDate) {
      return { status: "active" };
    }

    const now = new Date();
    const startDate = new Date(quest.startDate);
    const endDate = new Date(quest.endDate);

    if (now < startDate) {
      const timeUntilStart = startDate.getTime() - now.getTime();
      const hours = Math.floor(timeUntilStart / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      let timeLeft = "";
      if (days > 0) {
        timeLeft = `${days} day${days !== 1 ? "s" : ""} ${hours % 24} hour${
          hours % 24 !== 1 ? "s" : ""
        }`;
      } else {
        timeLeft = `${hours} hour${hours !== 1 ? "s" : ""}`;
      }

      return {
        status: "upcoming",
        timeLeft,
        message: `Event starts in ${timeLeft}`,
      };
    } else if (now <= endDate) {
      const timeUntilEnd = endDate.getTime() - now.getTime();
      const hours = Math.floor(timeUntilEnd / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      let timeLeft = "";
      if (days > 0) {
        timeLeft = `${days} day${days !== 1 ? "s" : ""} ${hours % 24} hour${
          hours % 24 !== 1 ? "s" : ""
        }`;
      } else {
        timeLeft = `${hours} hour${hours !== 1 ? "s" : ""}`;
      }

      return {
        status: "active",
        timeLeft,
        message: `${timeLeft} remaining`,
      };
    } else {
      return {
        status: "ended",
        message: "Event has ended",
      };
    }
  };

  // Load quest progress for specific quests
  const loadQuestProgress = React.useCallback(
    async (questIds: string[]) => {
      if (!address || questIds.length === 0) return;

      try {
        const progressData: { [questId: string]: number[] } = {};

        // Load progress for each quest
        await Promise.all(
          questIds.map(async (questId) => {
            try {
              const progress = await OnlineUserStorage.getQuestProgress(
                address,
                questId
              );
              progressData[questId] = progress?.completedRequirements || [];
            } catch (error) {
              console.error(
                `Failed to load progress for quest ${questId}:`,
                error
              );
              progressData[questId] = [];
            }
          })
        );

        setQuestProgress(progressData);
      } catch (error) {
        console.error("Failed to load quest progress:", error);
      }
    },
    [address]
  );

  // Load quests using the new hybridQuestStorage service
  const loadQuests = React.useCallback(
    async (_forceRefresh: boolean = false) => {
      if (!address) return;

      try {
        setIsRefreshing(true);

        // Load user's joined quest IDs first to determine which quests to fetch
        const userJoinedQuestIds =
          await questStorage.getJoinedQuests(address);
        console.log(
          `📋 User has joined ${userJoinedQuestIds.length} quests:`,
          userJoinedQuestIds
        );

        // Load different types of quests
        const [publicQuests, userCreatedQuests, joinedQuests] =
          await Promise.all([
            questStorage.getPublicQuests(),
            questStorage.getQuestsByCreator(address),
            // Load full quest objects for joined quests (including invite-only ones)
            Promise.all(
              userJoinedQuestIds.map(async (questId) => {
                try {
                  return await questStorage.getQuestById(questId);
                } catch (error) {
                  console.error(
                    `Failed to load joined quest ${questId}:`,
                    error
                  );
                  return null;
                }
              })
            ).then((quests) => quests.filter((quest) => quest !== null)),
          ]);

        console.log(`📥 Loaded ${publicQuests.length} public quests`);
        console.log(
          `📥 Loaded ${userCreatedQuests.length} user-created quests`
        );
        console.log(`📥 Loaded ${joinedQuests.length} joined quests`);

        // Combine all quest lists and remove duplicates
        const allQuests = [
          ...publicQuests,
          ...userCreatedQuests,
          ...joinedQuests,
        ];
        const uniqueQuests = allQuests.filter(
          (quest: Quest, index: number, self: Quest[]) =>
            index === self.findIndex((q: Quest) => q.id === quest.id)
        );

        console.log(
          `📋 Total unique quests after deduplication: ${uniqueQuests.length}`
        );

        // Check completion status for each quest
        const userBadges = await OnlineUserStorage.getUserBadges(address);
        const completedQuestIds = userBadges.map((badge) => badge.questId);

        const questsWithStatus = uniqueQuests.map((quest: Quest) => ({
          ...quest,
          isCompleted: completedQuestIds.includes(quest.id),
        }));

        setQuests(questsWithStatus);
        setJoinedQuests(userJoinedQuestIds);

        console.log(`📋 Final quest list (${questsWithStatus.length} quests):`);
        questsWithStatus.forEach((q) => {
          const isJoined = userJoinedQuestIds.includes(q.id);
          const isOwn =
            q.creatorAddress?.toLowerCase() === address?.toLowerCase();
          console.log(
            `  - ${q.title} (${q.visibility}) - Joined: ${isJoined}, Own: ${isOwn}, ID: ${q.id}`
          );
        });

        // Load quest progress for all joined quests
        await loadQuestProgress(userJoinedQuestIds);
      } catch (error) {
        console.error("Failed to load quests:", error);
        setQuests([]);
      } finally {
        setIsRefreshing(false);
      }
    },
    [address]
  );

  // Handle refresh quests manually
  const handleRefreshQuests = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for visual feedback
      await loadQuests(true); // Force refresh from IPFS
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load quests from storage on component mount
  React.useEffect(() => {
    if (address) {
      loadQuests();

      // Listen for storage changes (when new quests are created)
      const handleStorageChange = () => {
        console.log("📦 Storage change event received in QuestBoard");
        loadQuests();
      };

      const handleQuestCreated = () => {
        console.log("🎯 Quest creation event received in QuestBoard");
        // Add a small delay to ensure the quest is fully saved to Supabase
        setTimeout(() => {
          loadQuests(true); // Force refresh to include new quest
        }, 1000);
      };

      window.addEventListener("storage", handleStorageChange);

      // Also listen for custom events from the same tab
      window.addEventListener("questCreated", handleQuestCreated);
      window.addEventListener("questUpdated", handleStorageChange);
      window.addEventListener("questDeleted", handleStorageChange);

      // Set up periodic refresh to check for new quests from other devices
      const periodicRefresh = setInterval(() => {
        loadQuests(true); // Force refresh every 2 minutes to catch updates from other devices
      }, 2 * 60 * 1000);

      // Check for join quest parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const joinQuestId = urlParams.get("join");
      if (joinQuestId) {
        handleJoinQuestById(joinQuestId);
        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("questCreated", handleQuestCreated);
        window.removeEventListener("questUpdated", handleStorageChange);
        window.removeEventListener("questDeleted", handleStorageChange);
        clearInterval(periodicRefresh);
      };
    }
  }, [address, loadQuests]);

  // Watch for transaction confirmation
  React.useEffect(() => {
    const handleQuestCompletion = async () => {
      if (currentTransactionQuestId && hash) {
        // Handle successful transaction
        if (isSuccess && !isConfirming && !isMinting && address) {
          console.log(
            "✅ Quest completed! Badge minted successfully for quest:",
            currentTransactionQuestId
          );

          // Find the completed quest
          const completedQuest = quests.find(
            (q: Quest) => q.id === currentTransactionQuestId
          );
          if (completedQuest) {
            // Extract token ID from transaction receipt
            const tokenId = extractTokenIdFromReceipt(receipt);
            console.log("🔍 Token ID extraction result:", {
              tokenId,
              transactionHash: hash,
              extractedCorrectly: tokenId ? "✅ Yes" : "❌ No",
            });

            // Create a new badge object for online storage
            const newBadge = {
              id: `${currentTransactionQuestId}_${Date.now()}`,
              name: completedQuest.reward,
              description: `Earned by completing: ${completedQuest.title}`,
              imageUrl: completedQuest.badgeImage,
              rarity: (completedQuest.difficulty === "easy"
                ? "common"
                : completedQuest.difficulty === "medium"
                ? "rare"
                : "epic") as BadgeRarity,
              earnedAt: new Date(),
              category: completedQuest.category as BadgeCategory,
              questId: currentTransactionQuestId,
              transactionHash: hash,
              ownerAddress: address,
              // Token ID will be added by the completeQuest function
            };

            console.log(
              "Creating badge with image URL:",
              completedQuest.badgeImage
            );
            console.log("Complete quest data:", completedQuest);
            console.log("New badge data:", newBadge);

            // Save badge and mark quest completed using cross-device storage
            try {
              await OnlineUserStorage.markQuestCompleted(
                address,
                currentTransactionQuestId,
                newBadge
              );
            } catch (error) {
              console.error("Failed to save quest completion:", error);
              notify.error(
                "Save Failed",
                "Failed to save quest completion. Please try again.",
                6000
              );
              return;
            }

            // Update local state
            const updatedQuests = quests.map((q: Quest) =>
              q.id === currentTransactionQuestId
                ? { ...q, isCompleted: true }
                : q
            );
            setQuests(updatedQuests);

            // Remove from completing set
            setCompletingQuestIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(currentTransactionQuestId);
              return newSet;
            });

            // Dispatch custom event for badge collection to update
            window.dispatchEvent(
              new CustomEvent("badgeEarned", { detail: newBadge })
            );

            // Show success message
            notify.success(
              "Quest Completed! 🎉",
              `NFT Badge "${
                newBadge.name
              }" has been minted successfully!\n\nTransaction Hash:\n${hash.slice(
                0,
                20
              )}...${hash.slice(
                -20
              )}\n\nCheck the blockchain explorer to view your NFT!`,
              10000
            );

            console.log("NFT Badge minted and saved:", newBadge);
          }

          // Reset the current quest ID and step
          setCurrentTransactionQuestId(null);
          setCurrentTransactionStep(null);
        }

        // Handle failed transaction
        if (isError && !isConfirming && !isMinting) {
          console.error("Transaction failed:", error);

          // Remove from completing set
          setCompletingQuestIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(currentTransactionQuestId);
            return newSet;
          });

          // Show error message with specific details
          const errorMessage =
            (error as any)?.message || "Unknown error occurred";

          if (errorMessage.includes("caller is not a minter")) {
            notify.error(
              "Permission Error",
              "You need proper minter permissions. Please contact support.",
              8000
            );
          } else if (errorMessage.includes("insufficient funds")) {
            notify.error(
              "Insufficient Funds",
              "Not enough ETH for the transaction. Please add more ETH to your wallet.",
              8000
            );
          } else if (
            errorMessage.includes("user rejected") ||
            errorMessage.includes("denied")
          ) {
            notify.warning(
              "Transaction Cancelled",
              "You cancelled the transaction. The quest completion was not processed.",
              5000
            );
          } else {
            const cleanError = getCleanErrorMessage({ message: errorMessage });
            notify.error(
              "Transaction Failed",
              `Failed to mint badge: ${cleanError}`,
              8000
            );
          }

          // Reset quest ID and step
          setCurrentTransactionQuestId(null);
          setCurrentTransactionStep(null);
        }
      }
    };

    handleQuestCompletion();
  }, [
    isConfirming,
    isMinting,
    isSuccess,
    isError,
    error,
    hash,
    currentTransactionQuestId,
    currentTransactionStep,
    address,
    quests,
    receipt,
  ]);

  // Handle stuck transactions and timeouts
  React.useEffect(() => {
    if (currentTransactionQuestId && !hash) {
      // If we have a quest ID but no hash for more than 30 seconds, something went wrong
      const timeout = setTimeout(() => {
        console.warn("Transaction timeout - resetting quest completion state");

        // Reset states if transaction seems stuck
        setCurrentTransactionQuestId(null);
        setCurrentTransactionStep(null);
        setCompletingQuestIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(currentTransactionQuestId);
          return newSet;
        });

        notify.warning(
          "Transaction Timeout",
          "The transaction is taking longer than expected. Please try again.",
          8000
        );
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [currentTransactionQuestId, hash]);

  const categories: { id: QuestCategory | "all"; label: string }[] = [
    { id: "all", label: "All Quests" },
    { id: "social", label: "Social" },
    { id: "gaming", label: "Gaming" },
    { id: "defi", label: "DeFi" },
    { id: "nft", label: "NFT" },
    { id: "community", label: "Community" },
  ];

  const filteredQuests = quests.filter((quest) => {
    const matchesCategory =
      selectedCategory === "all" || quest.category === selectedCategory;
    const matchesSearch =
      quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quest.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Visibility filtering logic
    const isOwnQuest =
      quest.creatorAddress?.toLowerCase() === address?.toLowerCase();
    const isPublicQuest = quest.visibility === "public";
    const isEventQuest = quest.visibility === "event";
    const isJoinedQuest = joinedQuests.includes(quest.id);

    // Show quest if:
    // 1. It's a public quest (everyone can see)
    // 2. It's the user's own quest (regardless of visibility)
    // 3. It's an event quest (everyone can see, but may be time-limited)
    // 4. It's a quest the user has joined (including invite-only quests)
    const shouldShowQuest =
      isPublicQuest || isOwnQuest || isEventQuest || isJoinedQuest;

    // Debug logging for filtering decisions
    if (quest.visibility === "invite-only" && (isJoinedQuest || isOwnQuest)) {
      console.log(`🔍 Filtering invite-only quest "${quest.title}":`, {
        isJoinedQuest,
        isOwnQuest,
        shouldShowQuest,
        matchesCategory,
        matchesSearch,
        finalResult: matchesCategory && matchesSearch && shouldShowQuest,
      });
    }

    return matchesCategory && matchesSearch && shouldShowQuest;
  });

  const checkRequirementCompletion = (
    quest: Quest
  ): {
    canComplete: boolean;
    completedRequirements: number;
    completedRequirementIndexes: number[];
  } => {
    if (!address)
      return {
        canComplete: false,
        completedRequirements: 0,
        completedRequirementIndexes: [],
      };

    // Get progress from state (loaded from online storage)
    const completedRequirementIndexes = questProgress[quest.id] || [];
    const completedCount = completedRequirementIndexes.length;
    const canComplete = completedCount >= quest.requirements.length;

    return {
      canComplete,
      completedRequirements: completedCount,
      completedRequirementIndexes,
    };
  };

  const markRequirementCompleted = async (
    questId: string,
    requirementIndex: number
  ) => {
    if (!address) return;

    try {
      // Get current progress from cross-device storage
      const currentProgress = await OnlineUserStorage.getQuestProgress(
        address,
        questId
      );
      const completedRequirements =
        currentProgress?.completedRequirements || [];

      if (!completedRequirements.includes(requirementIndex)) {
        completedRequirements.push(requirementIndex);
        await OnlineUserStorage.updateQuestProgress(
          address,
          questId,
          completedRequirements
        );

        // Update local state
        setQuestProgress((prev) => ({
          ...prev,
          [questId]: completedRequirements,
        }));

        // Show success feedback
        const quest = quests.find((q) => q.id === questId);
        const requirementDescription =
          quest?.requirements[requirementIndex]?.description || "Requirement";

        notify.success(
          "Requirement Completed! ✅",
          `${requirementDescription} marked as completed!`,
          5000
        );

        // Check if all requirements are now completed
        if (
          quest &&
          completedRequirements.length >= quest.requirements.length
        ) {
          console.log(
            `🔑 All requirements completed for quest: ${quest.title}`
          );
          console.log(
            `🔧 Completed ${completedRequirements.length}/${quest.requirements.length} requirements`
          );

          notify.success(
            "All Requirements Completed! 🎉",
            `All requirements completed! You can now mint the badge for "${quest.title}"`,
            8000
          );
        }

        // Reload quests to update the UI
        loadQuests();

        // If the modal is open, we need to trigger a re-render by updating the selected quest
        if (
          showProgressModal &&
          selectedQuest &&
          selectedQuest.id === questId
        ) {
          // Force a state update to refresh the modal
          setSelectedQuest({ ...selectedQuest });
        }
      }
    } catch (error) {
      console.error("Failed to mark requirement completed:", error);
      notify.error(
        "Update Failed",
        "Failed to update progress. Please try again.",
        5000
      );
    }
  };

  /**
   * Handle Quest Completion and Badge Minting
   *
   * PURPOSE:
   * This is the main function that executes when user clicks "Complete Quest" button.
   * It validates requirements, creates badge metadata, and calls the smart contract.
   *
   * CALLED BY:
   * - QuestCard component when user clicks "Complete Quest" button
   * - Triggered via onComplete prop passed to QuestCard
   *
   * TRANSACTION FLOW:
   * 1. Validate all quest requirements are completed
   * 2. Create NFT metadata with quest details and badge image
   * 3. Convert quest ID to bytes32 format (required by smart contract)
   * 4. Call QuestMinter.completeQuestWithMetadata() via writeContract
   * 5. Wait for transaction confirmation in useEffect
   * 6. Extract token ID from transaction logs
   * 7. Update local storage with completed quest and badge data
   * 8. Show success notification to user
   *
   * ERROR HANDLING:
   * - Requirements not completed: Warning notification
   * - Quest already completed: Warning with instructions
   * - Transaction failure: Error notification with details
   * - Network issues: Retry suggestion
   *
   * @param quest - The quest object to complete
   */
  const handleCompleteQuest = async (quest: Quest) => {
    if (!address) return; // Must have connected wallet

    // STEP 1: Validate Quest Requirements
    // Check if user has completed all required tasks
    const { canComplete, completedRequirements } =
      checkRequirementCompletion(quest);

    if (!canComplete) {
      notify.warning(
        "Requirements Incomplete",
        `You need to complete all requirements first. You have completed ${completedRequirements} out of ${quest.requirements.length} requirements.`,
        8000
      );
      return;
    }

    try {
      // STEP 2: Prepare Quest ID for Smart Contract
      // Convert quest ID to bytes32 format (64 hex characters)
      // Smart contract expects bytes32, not string
      const questIdBytes32 = `0x${quest.id.padEnd(64, "0")}` as `0x${string}`;

      console.log("🔍 Checking if quest already completed on-chain...");

      // Note: We can't use useReadContract here because hooks can't be called conditionally
      // This is a React limitation - hooks must be called at component level
      // TODO: Consider moving quest completion check to component level

      // STEP 3: Update UI State
      // Add quest to completing set to show loading spinner
      setCompletingQuestIds((prev) => new Set(prev).add(quest.id));

      // Track which quest is being processed for transaction monitoring
      setCurrentTransactionQuestId(quest.id);
      setCurrentTransactionStep("mint");

      console.log(`🎯 Completing quest and minting badge: ${quest.title}`);

      // STEP 4: Create NFT Metadata
      // This metadata will be stored with the badge NFT
      const metadata = {
        name: quest.reward, // Badge name
        description: `Badge earned for completing: ${quest.title}`, // Badge description
        image: quest.badgeImage, // Badge image URL
        attributes: [
          // NFT traits/properties
          {
            trait_type: "Quest",
            value: quest.title,
          },
          {
            trait_type: "Category",
            value: quest.category,
          },
          {
            trait_type: "Difficulty",
            value: quest.difficulty,
          },
          {
            trait_type: "XP Reward",
            value: quest.xpReward,
          },
        ],
      };

      // STEP 5: Convert Metadata to Data URI
      // Store metadata on-chain as base64-encoded JSON
      // Alternative: Upload to IPFS and store hash (more decentralized)
      const metadataURI = `data:application/json;base64,${btoa(
        JSON.stringify(metadata)
      )}`;

      console.log(`🎯 Completing quest via QuestMinter: ${quest.title}`);
      console.log(`Quest ID: ${questIdBytes32}`);
      console.log(`Metadata URI: ${metadataURI}`);

      // STEP 6: Execute Smart Contract Transaction
      // This calls QuestMinter.completeQuestWithMetadata() on the blockchain
      // The function will:
      // 1. Check if quest already completed (prevents duplicates)
      // 2. Mark quest as completed for this user
      // 3. Call QuestlogBadge.mint() to create the NFT badge
      // 4. Return the new token ID
      try {
        writeContract({
          address: QUEST_MINTER_CONTRACT_ADDRESS,
          abi: QUEST_MINTER_ABI,
          functionName: "completeQuestWithMetadata",
          args: [questIdBytes32, metadataURI],
        });

        console.log("Contract transaction initiated for quest:", quest.id);
      } catch (writeError) {
        console.error("Failed to initiate transaction:", writeError);

        // Handle user rejection of transaction
        const errorMessage =
          writeError instanceof Error ? writeError.message : String(writeError);

        if (
          errorMessage.includes("user rejected") ||
          errorMessage.includes("denied") ||
          errorMessage.includes("User denied") ||
          errorMessage.includes("cancelled") ||
          errorMessage.includes("rejected")
        ) {
          notify.warning(
            "Transaction Cancelled",
            "You cancelled the transaction. The quest completion was not processed.",
            5000
          );
        } else {
          const cleanError = getCleanErrorMessage(writeError);
          notify.error(
            "Failed to Start Transaction",
            `Failed to initiate badge minting: ${cleanError}`,
            8000
          );
        }

        // Reset states on write error
        setCurrentTransactionQuestId(null);
        setCurrentTransactionStep(null);
        setCompletingQuestIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(quest.id);
          return newSet;
        });

        return; // Exit early if write failed
      }
    } catch (error) {
      console.error("Failed to mint badge:", error);
      setCurrentTransactionQuestId(null);
      setCurrentTransactionStep(null);

      // Remove from completing set on error
      setCompletingQuestIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(quest.id);
        return newSet;
      });

      // Provide more specific error messages
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("already completed") ||
        errorMessage.includes("Quest already completed")
      ) {
        notify.warning(
          "Quest Already Completed",
          `This quest has already been completed on the blockchain.\n\nIf you don't see the badge in your collection:\n• Try refreshing the page\n• Check your on-chain NFTs\n\nTo complete the quest again, you must first burn the existing badge from your profile.`,
          10000
        );
      } else if (
        errorMessage.includes("revert") ||
        errorMessage.includes("execution reverted")
      ) {
        notify.error(
          "Transaction Failed",
          `The blockchain transaction was rejected.\n\nThis could mean:\n• Quest already completed\n• Insufficient gas\n• Network issues\n\nPlease check your wallet and try again.`,
          10000
        );
      } else {
        const cleanError = getCleanErrorMessage(error);
        notify.error(
          "Badge Minting Failed",
          `Failed to mint badge: ${cleanError}\n\nPlease try again.`,
          8000
        );
      }
    }
  };

  const handleResetQuest = async (quest: Quest) => {
    if (!address) return;

    // Show custom confirmation dialog instead of browser popup
    setQuestToReset(quest);
    setShowResetConfirm(true);
  };

  /**
   * Executes the quest reset after confirmation
   */
  const executeResetQuest = async () => {
    if (!questToReset || !address) return;

    try {
      // Reset quest progress using cross-device storage
      await OnlineUserStorage.updateQuestProgress(
        address,
        questToReset.id,
        []
      );

      // Update local state
      const updatedQuests = quests.map((q) =>
        q.id === questToReset.id ? { ...q, isCompleted: false } : q
      );
      setQuests(updatedQuests);

      // Remove from joined quests if user wants to leave
      setJoinedQuests((prev) => prev.filter((id) => id !== questToReset.id));

      // Dispatch events for other components to update
      window.dispatchEvent(
        new CustomEvent("badgeRemoved", {
          detail: { questId: questToReset.id },
        })
      );
      window.dispatchEvent(
        new CustomEvent("questReset", { detail: questToReset })
      );

      console.log("Quest reset successfully:", questToReset.id);
      notify.success(
        "Quest Reset! 🔄",
        `Quest "${questToReset.title}" has been reset successfully!\n\nYour progress has been cleared and the quest is now available to complete again.`,
        5000
      );
    } catch (error) {
      console.error("Failed to reset quest:", error);
      notify.error(
        "Reset Failed",
        `Failed to reset quest "${questToReset.title}". Please try again.`,
        5000
      );
    } finally {
      // Close the dialog
      setShowResetConfirm(false);
      setQuestToReset(null);

      // Force scroll restoration as safety measure
      setTimeout(() => {
        document.body.style.overflow = "unset";
      }, 100);
    }
  };

  const handleDeleteQuest = async (quest: Quest) => {
    if (!address) return;

    // Show custom confirmation dialog instead of browser popup
    setQuestToDelete(quest);
    setShowDeleteConfirm(true);
  };

  /**
   * Executes the quest deletion after confirmation
   */
  const executeDeleteQuest = async () => {
    if (!questToDelete || !address) return;

    try {
      // Delete quest using quest storage
      console.log("🗑️ Attempting to delete quest:", questToDelete.id);
      
      if (questToDelete.visibility === "public") {
        await questStorage.deletePublicQuest(questToDelete.id);
      } else {
        await questStorage.deletePrivateQuest(questToDelete.id, address);
      }

      // Check if deletion was successful
      console.log("✅ Quest deleted successfully");
      notify.success(
        "Quest Deleted",
        `Quest "${questToDelete.title}" has been deleted successfully.`,
        5000
      );

      // Update local state
      const updatedQuests = quests.filter((q) => q.id !== questToDelete.id);
      setQuests(updatedQuests);

      // Remove from joined quests
      setJoinedQuests((prev) => prev.filter((id) => id !== questToDelete.id));

      // Dispatch events for other components to update
      window.dispatchEvent(
        new CustomEvent("badgeRemoved", {
          detail: { questId: questToDelete.id },
        })
      );
      window.dispatchEvent(
        new CustomEvent("questDeleted", { detail: questToDelete })
      );

      notify.success(
        "Quest Deleted! 🗑️",
        `Quest "${questToDelete.title}" has been deleted successfully!`,
        5000
      );
    } catch (error) {
      console.error("❌ Unexpected error during quest deletion:", error);
      notify.error(
        "Failed to Delete Quest",
        `An unexpected error occurred while deleting "${
          questToDelete.title
        }".\n\nError: ${
          error instanceof Error ? error.message : "Unknown error"
        }\n\nPlease try again.`,
        8000
      );
    } finally {
      // Close the dialog
      setShowDeleteConfirm(false);
      setQuestToDelete(null);

      // Force scroll restoration as safety measure
      setTimeout(() => {
        document.body.style.overflow = "unset";
      }, 100);
    }
  };

  const handleJoinQuestById = async (questId: string) => {
    if (!address) return;

    try {
      setJoiningQuestIds((prev) => new Set(prev).add(questId));

      console.log(`🔍 Attempting to join quest with ID: "${questId}"`);

      // Use the cross-device storage service to find the quest
      const quest = await questStorage.getQuestById(questId);

      if (!quest) {
        // Provide more detailed error message with troubleshooting tips
        const cleanId = questId.replace(/[^0-9]/g, "");
        let errorMessage = `Quest ID: ${questId}\n\nThis quest may:\n• Not exist\n• Be private and you need the correct invite link\n• Have been deleted by the creator\n\nPlease check the quest ID and try again.`;

        if (cleanId !== questId && cleanId.length > 0) {
          errorMessage += `\n\n💡 Tip: Your code contains non-numeric characters. The cleaned version would be: ${cleanId}`;
        }

        if (questId.length < 10) {
          errorMessage += `\n\n💡 Tip: Quest codes are usually 13+ digits long. This code seems too short.`;
        }

        notify.error("Quest Not Found", errorMessage, 12000);
        return;
      }

      // Check if user can join the quest
      const { canJoin, reason } = await QuestSharingUtils.canJoinQuest(
        quest,
        address
      );
      if (!canJoin) {
        notify.warning(
          "Cannot Join Quest",
          `Cannot join quest: ${reason}`,
          8000
        );
        return;
      }

      // Join the quest using cross-device storage
      await questStorage.joinQuest(address, questId);

      // Update local state to immediately show the quest as joined
      setJoinedQuests((prev) => {
        if (!prev.includes(questId)) {
          return [...prev, questId];
        }
        return prev;
      });

      // Dispatch event for admin panel to update personal stats
      window.dispatchEvent(new CustomEvent("questJoined", { detail: quest }));

      // Refresh quests to show the newly joined quest
      loadQuests();

      notify.success(
        "Successfully Joined Quest! 🎉",
        `"${quest.title}"\n\nYou can now work on the requirements and complete the quest to earn your badge.`,
        8000
      );
    } catch (error) {
      console.error("Failed to join quest by ID:", error);
      notify.error(
        "Failed to Join Quest",
        `Failed to join quest: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        8000
      );
    } finally {
      setJoiningQuestIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questId);
        return newSet;
      });
    }
  };

  const handleJoinQuest = async () => {
    if (!joinLink.trim()) {
      notify.warning("Quest Code Required", "Please enter a quest code", 5000);
      return;
    }

    try {
      const input = joinLink.trim();
      console.log(`🔍 Processing quest join input: "${input}"`);

      // Try to find quest by ID first
      let questId = input;

      // If it looks like a link, parse it
      if (input.includes("quest/") || input.includes("questId=")) {
        questId = QuestSharingUtils.parseQuestLink(joinLink) || input;
        console.log(`🔗 Parsed quest ID from link: "${questId}"`);
      }

      // Validate quest ID format
      if (questId.length < 8) {
        notify.warning(
          "Invalid Quest Code",
          `Quest code "${questId}" is too short. Quest codes are usually 13+ digits long.\n\nPlease check the code and try again.`,
          8000
        );
        return;
      }

      // Check for common issues
      if (
        questId.includes("I") ||
        questId.includes("O") ||
        questId.includes("l")
      ) {
        notify.warning(
          "Possible Code Issue",
          `The code contains letters that might be confused with numbers:\n• 'I' should be '1'\n• 'O' should be '0'\n• 'l' should be '1'\n\nPlease double-check the code.`,
          10000
        );
        return;
      }

      // Try to join by quest ID
      if (questId) {
        await handleJoinQuestById(questId);
        setShowJoinModal(false);
        setJoinLink("");
      } else {
        notify.error(
          "Quest Not Found",
          "Please make sure you're using a valid quest invite code or ID.\n\nValid formats:\n• 13+ digit code (e.g., 1753841121218)\n• Full quest link (legacy support)",
          10000
        );
      }
    } catch (error) {
      console.error("Failed to join quest:", error);
      notify.error(
        "Join Failed",
        "Failed to join quest. Please check the code and try again.",
        8000
      );
    }
  };

  const handleJoinQuestCard = async (quest: Quest) => {
    if (!address) return;

    try {
      setJoiningQuestIds((prev) => new Set(prev).add(quest.id));

      // Use cross-device storage for quest joining
      await questStorage.joinQuest(address, quest.id);

      // Update local state
      setJoinedQuests((prev) => [...prev, quest.id]);

      // Dispatch event for admin panel to update personal stats
      window.dispatchEvent(new CustomEvent("questJoined", { detail: quest }));

      // Refresh quests to show the updated state immediately
      loadQuests();
      notify.success(
        "Successfully Joined Quest! 🎉",
        `Successfully joined quest: "${quest.title}"!`,
        5000
      );
    } catch (error) {
      console.error("Failed to join quest:", error);
      notify.error(
        "Join Failed",
        "Failed to join quest. Please try again.",
        5000
      );
    } finally {
      setJoiningQuestIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(quest.id);
        return newSet;
      });
    }
  };

  const handleLeaveQuest = async (quest: Quest) => {
    if (!address) return;

    // Show custom confirmation dialog instead of browser popup
    setQuestToLeave(quest);
    setShowLeaveConfirm(true);
  };

  /**
   * Executes the quest leaving after confirmation
   */
  const executeLeaveQuest = async () => {
    if (!questToLeave || !address) return;

    try {
      setLeavingQuestIds((prev) => new Set(prev).add(questToLeave.id));

      // Use cross-device storage for quest leaving
      await questStorage.leaveQuest(address, questToLeave.id);

      // Update local state
      setJoinedQuests((prev) => prev.filter((id) => id !== questToLeave.id));

      // Refresh quests to show updated state immediately
      loadQuests();

      notify.success(
        "Left Quest Successfully! 👋",
        `You have left "${questToLeave.title}".\n\nYour progress has been removed and you are no longer participating in this quest.`,
        5000
      );
    } catch (error) {
      console.error("Failed to leave quest:", error);
      notify.error(
        "Failed to Leave Quest",
        `Failed to leave quest "${questToLeave.title}". Please try again.`,
        5000
      );
    } finally {
      setLeavingQuestIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questToLeave.id);
        return newSet;
      });

      // Close the dialog
      setShowLeaveConfirm(false);
      setQuestToLeave(null);

      // Force scroll restoration as safety measure
      setTimeout(() => {
        document.body.style.overflow = "unset";
      }, 100);
    }
  };

  const handleViewProgress = (quest: Quest) => {
    setSelectedQuest(quest);
    setShowProgressModal(true);
  };

  const isQuestJoined = (questId: string): boolean => {
    return joinedQuests.includes(questId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Quest Board
        </h1>
        <p className="text-gray-400 text-base sm:text-lg px-4">
          🎯 Choose your adventure and start earning badges!
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/30 p-4 sm:p-6 rounded-xl border border-gray-700/50">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search quests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm sm:text-base"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 w-full lg:w-auto">
            {/* Refresh Button */}
            <button
              onClick={handleRefreshQuests}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Join Quest Button */}
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all duration-200 text-sm sm:text-base"
            >
              <Hash className="w-4 h-4" />
              <span className="hidden sm:inline">Join Quest</span>
            </button>

            {/* Category Filter */}
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400 hidden lg:block">
              Filter:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as QuestCategory | "all")
              }
              className="flex-1 lg:flex-none bg-gray-900 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm sm:text-base"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quest Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredQuests.map((quest) => {
          const { canComplete } = checkRequirementCompletion(quest);
          const eventStatus = getEventQuestStatus(quest);
          return (
            <QuestCard
              key={quest.id}
              quest={quest}
              onComplete={handleCompleteQuest}
              onReset={handleResetQuest}
              onDelete={handleDeleteQuest}
              onJoin={handleJoinQuestCard}
              onLeave={handleLeaveQuest}
              onViewProgress={handleViewProgress}
              isCompleting={completingQuestIds.has(quest.id)}
              isJoining={joiningQuestIds.has(quest.id)}
              isLeaving={leavingQuestIds.has(quest.id)}
              isJoined={isQuestJoined(quest.id)}
              currentUserAddress={address}
              requirementsCompleted={canComplete}
              eventStatus={eventStatus}
            />
          );
        })}
      </div>

      {filteredQuests.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <Target className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-300 mb-4">
            No Quests Available
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto px-4 text-sm sm:text-base">
            Be the first to create a quest for the community! Click "Create
            Quest" to get started.
          </p>
          <button
            onClick={() => setActiveTab?.("create")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base"
          >
            Create First Quest
          </button>
        </div>
      )}

      {/* Join Quest Modal */}
      {showJoinModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          style={{ marginTop: "0px" }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Hash className="w-5 h-5 text-purple-400" />
                <span>Join Quest</span>
              </h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinLink("");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quest Code
                </label>
                <input
                  type="text"
                  value={joinLink}
                  onChange={(e) => setJoinLink(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter quest code (e.g., 1753841121218)"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the quest code shared by the quest creator (usually 13+
                  digits)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleJoinQuest}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200"
              >
                Join Quest
              </button>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinLink("");
                }}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quest Progress Modal */}
      {showProgressModal && selectedQuest && (
        <QuestProgressModal
          quest={selectedQuest}
          isOpen={showProgressModal}
          onClose={() => {
            setShowProgressModal(false);
            setSelectedQuest(null);
          }}
          progress={{
            completedRequirements:
              checkRequirementCompletion(selectedQuest).completedRequirements,
            completedRequirementIndexes:
              checkRequirementCompletion(selectedQuest)
                .completedRequirementIndexes,
            totalRequirements: selectedQuest.requirements.length,
            joinedAt: new Date(), // You might want to track this properly
            notes: selectedQuest.isCompleted
              ? "Quest completed successfully!"
              : `Complete ${
                  selectedQuest.requirements.length -
                  checkRequirementCompletion(selectedQuest)
                    .completedRequirements
                } more requirements to finish this quest.`,
          }}
          onMarkRequirementCompleted={(requirementIndex) => {
            markRequirementCompleted(selectedQuest.id, requirementIndex);
          }}
        />
      )}

      {/* Delete Quest Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setQuestToDelete(null);
        }}
        onConfirm={executeDeleteQuest}
        title="Delete Quest?"
        message={
          questToDelete
            ? `Are you sure you want to delete "${questToDelete.title}"?\n\nThis will permanently delete the quest from online storage.\nAll user progress and badges for this quest will be removed.\n\nThis action cannot be undone.`
            : ""
        }
        confirmText="Delete Quest"
        cancelText="Cancel"
        type="danger"
      />

      {/* Leave Quest Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showLeaveConfirm}
        onClose={() => {
          setShowLeaveConfirm(false);
          setQuestToLeave(null);
        }}
        onConfirm={executeLeaveQuest}
        title="Leave Quest?"
        message={
          questToLeave
            ? `Are you sure you want to leave "${questToLeave.title}"?\n\nThis will:\n• Remove your participation from the quest\n• Delete your progress on requirements\n• Remove you from the quest participants list\n\nYou can rejoin this quest later if it's still available.`
            : ""
        }
        confirmText="Leave Quest"
        cancelText="Stay in Quest"
        type="warning"
      />

      {/* Reset Quest Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showResetConfirm}
        onClose={() => {
          setShowResetConfirm(false);
          setQuestToReset(null);
        }}
        onConfirm={executeResetQuest}
        title="Reset Quest?"
        message={
          questToReset
            ? `⚠️ Reset Quest: "${questToReset.title}"\n\nThis will:\n• Remove the badge from online storage\n• Reset requirement progress\n• Mark quest as incomplete\n\n⚠️ IMPORTANT: If you already minted this badge on-chain, you must BURN it first.\nOtherwise, attempting to complete this quest again will fail.\n\nContinue with reset?`
            : ""
        }
        confirmText="Reset Quest"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default QuestBoard;
