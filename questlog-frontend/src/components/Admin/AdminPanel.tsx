import React, { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import {
  Shield,
  Trash2,
  RotateCcw,
  Users,
  Target,
  Trophy,
  CheckCircle,
  Copy,
  Settings,
  Flame,
  RefreshCw,
} from "lucide-react";
import ConfirmationDialog from "../UI/ConfirmationDialog";
import {
  useNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from "../UI/NotificationSystem";
import { Quest } from "@backend/types/quest";
import { Badge } from "@backend/types/badge";
import { QUESTLOG_CONTRACT_ADDRESS, QUESTLOG_ABI } from "../../config/wagmi";
import { CONTRACT_INFO } from "../../utils/contractHelpers";
import { HybridQuestStorage } from "../../services/hybridQuestStorage";
import DatabasePanel from "./DatabasePanel";

const AdminPanel: React.FC = () => {
  const { address } = useAccount(); // Get connected wallet address from wagmi
  const { addNotification } = useNotification();

  // Notification helper functions
  const notify = {
    success: showSuccess(addNotification),
    error: showError(addNotification),
    warning: showWarning(addNotification),
    info: showInfo(addNotification),
  };

  // State management for user's quest and badge data
  const [userQuests, setUserQuests] = useState<Quest[]>([]);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    "quests" | "badges" | "stats" | "contract" | "database"
  >("quests");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedQuestId, setCopiedQuestId] = useState<string | null>(null);

  // Personal statistics state
  const [personalStats, setPersonalStats] = useState<{
    joinedQuests: number;
    completedQuests: number;
    badgesEarned: number;
  }>({
    joinedQuests: 0,
    completedQuests: 0,
    badgesEarned: 0,
  });

  // Badge burning state - now per badge instead of global
  const [burningBadges, setBurningBadges] = useState<Set<string>>(new Set());
  const [burningBadgeInfo, setBurningBadgeInfo] = useState<{
    badgeId: string;
    badgeName: string;
    tokenId: string;
  } | null>(null);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(false);
  const [questStats, setQuestStats] = useState<{
    [questId: string]: { participants: number; completions: number };
  }>({});

  // Confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);

  // Wagmi hooks for burning badges
  const {
    writeContract,
    data: burnHash,
    isPending: isBurnPending,
  } = useWriteContract();

  const {
    isSuccess: isBurnSuccess,
    isError: isBurnError,
    error: burnError,
  } = useWaitForTransactionReceipt({ hash: burnHash });

  // Read user's badge balance from contract
  const { data: badgeBalance, refetch: refetchBalance } = useReadContract({
    address: QUESTLOG_CONTRACT_ADDRESS,
    abi: QUESTLOG_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Load user's data when address changes
  useEffect(() => {
    if (address) {
      loadUserData().catch(console.error);
    }
  }, [address]);

  // Listen for quest creation events to refresh data
  useEffect(() => {
    const handleQuestCreated = async () => {
      if (address) {
        console.log("🎯 Quest creation event received in AdminPanel");
        // Add a small delay to ensure the quest is fully saved
        setTimeout(() => {
          loadUserData().catch(console.error);
        }, 1000);
      }
    };

    const handleQuestJoined = () => {
      if (address) {
        loadPersonalStats().catch(console.error); // Refresh personal stats when joining quests
      }
    };

    const handleBadgeEarned = () => {
      if (address) {
        loadUserData().catch(console.error); // Refresh all data when badge is earned
      }
    };

    // Also listen for storage changes (when new quests are created in same tab)
    const handleStorageChange = () => {
      if (address) {
        console.log("📦 Storage change event received in AdminPanel");
        loadUserData().catch(console.error);
      }
    };

    window.addEventListener("questCreated", handleQuestCreated);
    window.addEventListener("questJoined", handleQuestJoined);
    window.addEventListener("badgeEarned", handleBadgeEarned);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("questUpdated", handleStorageChange);
    window.addEventListener("questDeleted", handleStorageChange);

    return () => {
      window.removeEventListener("questCreated", handleQuestCreated);
      window.removeEventListener("questJoined", handleQuestJoined);
      window.removeEventListener("badgeEarned", handleBadgeEarned);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("questUpdated", handleStorageChange);
      window.removeEventListener("questDeleted", handleStorageChange);
    };
  }, [address]);

  // Handle burn transaction completion
  useEffect(() => {
    if (isBurnSuccess && burningBadgeInfo && address) {
      console.log("Badge burn transaction successful!");

      // Remove the badge from both Supabase and localStorage
      const removeBadgeFromStorage = async () => {
        try {
          // Find the badge to get the questId
          const badge = userBadges.find(
            (b) => b.id === burningBadgeInfo.badgeId
          );
          if (!badge) {
            console.error("Could not find badge to remove from storage");
            return;
          }

          // Remove from both Supabase and localStorage
          const result = await CrossDeviceQuestStorage.removeBadge(
            address,
            badge.questId
          );

          if (!result.success) {
            console.warn("Badge removal warning:", result.error);
            notify.warning(
              "Partial Cleanup",
              `Badge burned successfully but storage cleanup had issues:\n${result.error}\n\nThe badge may still appear until next refresh.`,
              8000
            );
          }

          console.log(`✅ Badge removed from storage systems`);
        } catch (error) {
          console.error("Failed to remove badge from storage:", error);
          notify.warning(
            "Storage Cleanup Failed",
            "Badge burned successfully but failed to remove from storage. The badge may still appear until next refresh.",
            6000
          );
        }
      };

      // Execute the badge removal
      removeBadgeFromStorage();

      // Update local state
      loadUserData().catch(console.error);

      // Refresh on-chain data
      refetchBalance();

      // Dispatch event for other components to update
      window.dispatchEvent(
        new CustomEvent("badgeRemoved", {
          detail: { badgeId: burningBadgeInfo.badgeId },
        })
      );

      notify.success(
        "Badge Burned Successfully! 🔥",
        `Badge "${burningBadgeInfo.badgeName}" has been permanently burned from the blockchain!\n\nThe NFT has been destroyed and the quest can now be completed again.`,
        8000
      );

      // Reset burn state
      setBurningBadges((prev) => {
        const newSet = new Set(prev);
        newSet.delete(burningBadgeInfo.badgeId);
        return newSet;
      });
      setBurningBadgeInfo(null);
    } else if (isBurnError && burningBadgeInfo) {
      console.error("Badge burn transaction failed:", burnError);

      // Enhanced error messaging based on error type
      let errorTitle = "Badge Burn Failed";
      let errorMessage =
        "The transaction was rejected or failed. Please try again.";

      const errorString = burnError?.message || "";

      if (
        errorString.includes("invalid token ID") ||
        errorString.includes("ERC721")
      ) {
        errorTitle = "Invalid Token ID";
        errorMessage = `The stored token ID doesn't match the blockchain.\n\n🔍 Stored ID: ${
          burningBadgeInfo.tokenId || "Unknown"
        }\n🏗️ Actual ID: Likely a simple number (e.g., #8, #15, #42)\n\n💡 This happens when:\n• Database stores transaction hash instead of token ID\n• Token IDs were recorded incorrectly\n• The NFT was minted with a different ID than expected\n\n🛠️ To find the correct token ID:\n• Check your wallet's NFT collection\n• Look for this badge image in your wallet\n• The correct ID is usually a simple number\n• Use "Diagnose Badge Data & Open Explorer" to verify`;
      } else if (errorString.includes("execution reverted")) {
        errorTitle = "Transaction Reverted";
        errorMessage = `The blockchain rejected this transaction.\n\n❌ Reason: ${
          errorString.split("execution reverted: ")[1] || "Unknown"
        }\n\n💡 This usually means:\n• You don't own this NFT\n• The token ID doesn't exist\n• The NFT is in a different wallet\n\n🔧 Try:\n• Refreshing your badge data with "Sync Chain"\n• Checking the blockchain explorer\n• Verifying the NFT is in your connected wallet`;
      } else if (
        errorString.includes("rejected") ||
        errorString.includes("denied")
      ) {
        errorTitle = "Transaction Rejected";
        errorMessage =
          "You rejected the transaction in your wallet.\n\nTo burn this badge, you'll need to approve the transaction when prompted.";
      }

      notify.error(errorTitle, errorMessage, 12000);

      // Reset burn state
      setBurningBadges((prev) => {
        const newSet = new Set(prev);
        newSet.delete(burningBadgeInfo.badgeId);
        return newSet;
      });
      setBurningBadgeInfo(null);
    }
  }, [
    isBurnSuccess,
    isBurnError,
    burnError,
    burningBadgeInfo,
    address,
    refetchBalance,
  ]);

  /**
   * Load personal statistics from Supabase (joined quests, completed, badges earned)
   */
  const loadPersonalStats = async () => {
    if (!address) return;

    try {
      const [joinedQuests, userBadges] = await Promise.all([
        CrossDeviceQuestStorage.getJoinedQuests(address),
        CrossDeviceQuestStorage.getUserBadges(address),
      ]);

      setPersonalStats({
        joinedQuests: joinedQuests.length,
        completedQuests: userBadges.length, // Each badge represents a completed quest
        badgesEarned: userBadges.length,
      });
    } catch (error) {
      console.error("Failed to load personal stats:", error);
    }
  };

  /**
   * Load quest statistics from Supabase (participants and completions)
   */
  const loadQuestStats = async (questIds: string[]) => {
    if (!address || questIds.length === 0) return;

    try {
      // Mock implementation - in a real setup this would call the backend API
      console.log("Mock: Loading quest statistics for quests:", questIds);
      
      // For now, return mock data
      setQuestStats({});
      
      console.log("✅ Mock quest statistics loaded");
    } catch (error) {
      console.warn("Failed to load quest statistics:", error);
    }
  };

  /**
   * Loads quests and badges created/owned by the current user
   * This function only shows data belonging to the connected user
   */
  const loadUserData = async (_forceRefresh: boolean = false) => {
    if (!address) return;

    setIsLoading(true);
    try {
      // Load personal statistics
      await loadPersonalStats();

      console.log(`🔍 Loading user quests for creator: ${address}`);

      // Get user's quests using cross-device storage
      const userQuests = await CrossDeviceQuestStorage.getQuestsByCreator(
        address
      );

      console.log(
        `📋 Found ${userQuests.length} quests for creator ${address}`
      );

      // Also get all public quests and filter by creator as a fallback
      // This ensures we don't miss any quests due to storage inconsistencies
      const allQuests = await CrossDeviceQuestStorage.getPublicQuests();
      const publicQuestsByUser = allQuests.filter(
        (quest) =>
          quest.creatorAddress &&
          quest.creatorAddress.toLowerCase() === address.toLowerCase()
      );

      console.log(
        `📋 Found ${publicQuestsByUser.length} public quests by this creator`
      );

      // Combine both results and remove duplicates
      const combinedQuests = [...userQuests, ...publicQuestsByUser];
      const uniqueUserQuests = combinedQuests.filter(
        (quest, index, self) =>
          index === self.findIndex((q) => q.id === quest.id)
      );

      console.log(
        `📋 Total unique quests after deduplication: ${uniqueUserQuests.length}`
      );

      setUserQuests(uniqueUserQuests);

      // Load quest statistics (participants and completions) from Supabase
      if (uniqueUserQuests.length > 0) {
        const questIds = uniqueUserQuests.map((q) => q.id);
        await loadQuestStats(questIds);
      }

      // === LOAD USER'S BADGES ===
      const userBadges = await CrossDeviceQuestStorage.getUserBadges(address);

      setUserBadges(userBadges);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Counts how many users have joined a specific quest using Supabase data
   * Excludes the quest creator from the count
   */
  const getQuestParticipantCount = (questId: string) => {
    // This will be updated to use real-time Supabase data
    // For now, we'll store the counts in state and load them async
    return questStats[questId]?.participants || 0;
  };

  /**
   * Counts how many users have completed a specific quest using Supabase data
   * Excludes the quest creator from the count
   */
  const getQuestCompletionCount = (questId: string) => {
    // This will be updated to use real-time Supabase data
    // For now, we'll store the counts in state and load them async
    return questStats[questId]?.completions || 0;
  };

  /**
   * Permanently deletes a quest and all associated data
   * Removes from: storage, user joined lists, completed lists, and badges
   */
  const handleDeleteQuest = async (quest: Quest) => {
    // Show custom confirmation dialog instead of browser popup
    setQuestToDelete(quest);
    setShowDeleteConfirm(true);
  };

  /**
   * Executes the quest deletion after confirmation
   */
  const executeDeleteQuest = async () => {
    if (!questToDelete) return;

    try {
      // Delete quest using cross-device storage
      console.log("🗑️ Attempting to delete quest:", questToDelete.id);
      const result = await CrossDeviceQuestStorage.deleteQuest(
        questToDelete.id,
        address!
      );

      // Check if deletion was successful
      if (!result.success) {
        console.error("❌ Quest deletion failed:", result.error);
        notify.error(
          "Failed to Delete Quest",
          `Failed to delete quest "${questToDelete.title}".\n\nError: ${result.error}\n\nPlease try again or check your connection.`,
          8000
        );
        return;
      }

      console.log("✅ Quest deleted successfully");

      // Refresh admin panel data
      await loadUserData();

      // Notify other components about the deletion
      window.dispatchEvent(
        new CustomEvent("questDeleted", { detail: questToDelete })
      );
      window.dispatchEvent(
        new CustomEvent("badgeRemoved", {
          detail: { questId: questToDelete.id },
        })
      );

      notify.success(
        "Quest Deleted Successfully! 🗑️",
        `Quest "${questToDelete.title}" has been deleted successfully!\n\nAll associated data has been removed.`,
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

  /**
   * Resets a quest for all users (removes completion status and badges)
   * Quest remains available, but all progress is cleared
   */
  const handleResetQuest = async (quest: Quest) => {
    // Use notification system for confirmation
    const confirmed = await new Promise<boolean>((resolve) => {
      // For now, use the existing confirm until we implement a proper modal
      resolve(
        window.confirm(
          `Are you sure you want to reset "${quest.title}" for all users? This will remove all associated badges.`
        )
      );
    });

    if (!confirmed) return;

    try {
      // Remove quest from all users' completed lists
      const allStorageKeys = Object.keys(localStorage);
      const completedQuestKeys = allStorageKeys.filter((key) =>
        key.startsWith("questlog_completed_")
      );
      completedQuestKeys.forEach((key) => {
        const completedQuests = JSON.parse(localStorage.getItem(key) || "[]");
        const updatedCompletedQuests = completedQuests.filter(
          (id: string) => id !== quest.id
        );
        localStorage.setItem(key, JSON.stringify(updatedCompletedQuests));
      });

      // Remove all individual requirement completions for this quest from all users
      const requirementKeys = allStorageKeys.filter(
        (key) =>
          key.includes(`questlog_requirements_`) && key.endsWith(`_${quest.id}`)
      );
      requirementKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Remove all badges earned from this quest
      const badgeKeys = allStorageKeys.filter((key) =>
        key.startsWith("questlog_badges_")
      );
      badgeKeys.forEach((key) => {
        const badges = JSON.parse(localStorage.getItem(key) || "[]");
        const updatedBadges = badges.filter(
          (badge: any) => badge.questId !== quest.id
        );
        localStorage.setItem(key, JSON.stringify(updatedBadges));
      });

      // Refresh data and notify components
      await loadUserData();
      window.dispatchEvent(new CustomEvent("questReset", { detail: quest }));
      window.dispatchEvent(
        new CustomEvent("badgeRemoved", { detail: { questId: quest.id } })
      );

      notify.success(
        "Quest Reset Successfully! 🔄",
        `Quest "${quest.title}" has been reset for all users!\n\nAll progress and badges have been cleared.`,
        5000
      );
    } catch (error) {
      console.error("Failed to reset quest:", error);
      notify.error(
        "Failed to Reset Quest",
        "Failed to reset quest. Please try again."
      );
    }
  };

  /**
   * Burns a badge from the blockchain permanently
   */
  const handleBurnBadge = async (badge: Badge) => {
    if (!address) {
      notify.warning(
        "Wallet Required",
        "Cannot burn badge: no wallet connected. Please connect your wallet first."
      );
      return;
    }

    // Check if we have a tokenId for this badge
    if (
      !badge.tokenId ||
      badge.tokenId === "undefined" ||
      badge.tokenId === "null"
    ) {
      notify.warning(
        "Token ID Missing",
        "This badge was created before token ID tracking was implemented.\n\nTo burn this badge, you'll need to find the token ID manually using the blockchain explorer.",
        8000
      );
      return;
    }

    // Validate token ID is a valid number
    let tokenIdBigInt: bigint;
    try {
      tokenIdBigInt = BigInt(badge.tokenId);
      if (tokenIdBigInt < 0) {
        throw new Error("Token ID cannot be negative");
      }
    } catch (error) {
      notify.error(
        "Invalid Token ID",
        `The token ID "${badge.tokenId}" is not valid.\n\nToken IDs must be positive integers.\n\nThis badge may have been created with incorrect data. Please use the blockchain explorer to manually burn this NFT.`,
        10000
      );
      return;
    }

    // Confirmation is now handled by the badge management modal
    // No popup confirmation needed here

    try {
      // Add this badge to the burning set
      setBurningBadges((prev) => new Set(prev).add(badge.id));

      console.log(`Attempting to burn badge with token ID: ${badge.tokenId}`);

      // Call the burn function on the contract
      await writeContract({
        address: QUESTLOG_CONTRACT_ADDRESS,
        abi: QUESTLOG_ABI,
        functionName: "burn",
        args: [tokenIdBigInt],
      });

      // The transaction success will be handled by the useEffect watching for transaction completion
      setBurningBadgeInfo({
        badgeId: badge.id,
        badgeName: badge.name,
        tokenId: badge.tokenId,
      });
    } catch (error) {
      console.error("Failed to burn badge:", error);
      // Remove from burning set on error
      setBurningBadges((prev) => {
        const newSet = new Set(prev);
        newSet.delete(badge.id);
        return newSet;
      });

      // Enhanced error messaging for immediate failures
      const errorString = (error as any)?.message || "";
      let errorTitle = "Badge Burn Failed";
      let errorMessage = "Failed to initiate the burning transaction.";

      if (
        errorString.includes("invalid token ID") ||
        errorString.includes("ERC721")
      ) {
        errorTitle = "Invalid Token ID";
        errorMessage = `Token ID validation failed.\n\n🔍 Stored ID: ${badge.tokenId}\n🏗️ Expected: Simple number (e.g., #8, #15, #42)\n\n💡 The stored token ID appears to be a transaction hash or incorrect value.\n\n🛠️ To fix this:\n• Check your wallet for the correct NFT token ID\n• The real token ID is usually a simple number\n• Look for this badge image in your wallet's NFT section\n• Use "Diagnose Badge Data & Open Explorer" for manual verification`;
      } else if (
        errorString.includes("rejected") ||
        errorString.includes("denied")
      ) {
        errorTitle = "Transaction Rejected";
        errorMessage =
          "The transaction was rejected in your wallet.\n\nPlease approve the transaction to burn this badge.";
      }

      notify.error(errorTitle, errorMessage, 10000);
    }
  };

  /**
   * Loads on-chain badge data for comparison
   */
  const loadOnChainBadges = async () => {
    if (!address) return;

    setIsLoadingOnChain(true);
    try {
      // Here we would fetch actual on-chain badge data
      // For now, just show the balance and placeholder info
      await refetchBalance();

      // This is a placeholder - in a full implementation, you'd query
      // the contract for token IDs owned by the user
    } catch (error) {
      console.error("Failed to load on-chain badges:", error);
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  /**
   * Generates and copies a quest code for private quests
   * Public quests don't need invite codes as they're discoverable
   */
  const handleCopyQuestLink = async (quest: Quest) => {
    if (quest.visibility === "public") {
      notify.info(
        "Public Quest",
        "Public quests don't need invite codes - they're visible to everyone!",
        5000
      );
      return;
    }

    try {
      // Use quest ID as the invite code with validation
      const questCode = quest.id;

      // Validate the quest ID format
      if (!questCode || questCode.length < 8) {
        notify.error(
          "Invalid Quest ID",
          "Quest ID appears to be invalid. Please refresh and try again."
        );
        return;
      }

      // Log for debugging
      console.log(
        `📋 Copying quest code: "${questCode}" (length: ${questCode.length})`
      );

      await navigator.clipboard.writeText(questCode);

      // Verify what was actually copied
      const copiedText = await navigator.clipboard.readText();
      if (copiedText !== questCode) {
        console.warn(
          `⚠️ Clipboard mismatch! Expected: "${questCode}", Got: "${copiedText}"`
        );
      }

      // Show temporary "copied" state
      setCopiedQuestId(quest.id);
      setTimeout(() => setCopiedQuestId(null), 2000);

      notify.info(
        "Quest Code Copied! 📋",
        `Quest invite code copied to clipboard!\n\nCode: ${questCode}\n\nShare this code with users to let them join this ${quest.visibility} quest.`,
        8000
      );
    } catch (error) {
      console.error("Failed to copy quest code:", error);
      notify.error("Failed to Copy", "Failed to copy code. Please try again.");
    }
  };

  // Guard clause: Show wallet connection prompt if no wallet connected
  if (!address) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-xl font-medium text-gray-300 mb-4">
          Wallet Required
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Connect your wallet to access your quest management panel and view
          your created quests and badges.
        </p>
      </div>
    );
  }

  // Main quest management UI with three tabs: Quests, Badges, Stats
  return (
    <div className="space-y-8">
      {/* Header with admin branding */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Shield className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Admin Panel
          </h1>
        </div>
        <p className="text-gray-400 text-base sm:text-lg">
          🛡️ Manage your created quests, earned badges, and view statistics
        </p>
      </div>

      {/* Tab navigation for switching between different views */}
      <div className="flex justify-center">
        <div className="bg-gray-800/30 p-1 rounded-lg border border-gray-700/50">
          <div className="flex space-x-1">
            {[
              { id: "quests" as const, label: "My Quests", icon: Target },
              { id: "badges" as const, label: "My Badges", icon: Trophy },
              { id: "stats" as const, label: "Stats", icon: Users },
              { id: "contract" as const, label: "Contract", icon: Settings },
              { id: "database" as const, label: "Database", icon: RefreshCw },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area that changes based on selected tab */}
      <div className="max-w-7xl mx-auto">
        {/* QUESTS TAB: Shows user's created quests with management controls */}
        {selectedTab === "quests" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                My Created Quests ({userQuests.length})
              </h2>
              <button
                onClick={() => loadUserData(true)} // Force refresh when clicking refresh button
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <RotateCcw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>

            {/* Quest grid with cards showing quest details and admin actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {userQuests.map((quest) => (
                <div key={quest.id} className="quest-card">
                  {/* Quest image with visibility badge */}
                  <div className="relative mb-4 overflow-hidden rounded-lg">
                    <img
                      src={quest.badgeImage}
                      alt={quest.reward}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quest.visibility === "public"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {quest.visibility}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Quest basic info */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {quest.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {quest.description}
                      </p>
                    </div>

                    {/* Quest metadata and statistics */}
                    <div className="text-xs text-gray-500">
                      <p>ID: {quest.id}</p>
                      {quest.creatorAddress && (
                        <p>
                          Creator: {quest.creatorAddress.slice(0, 6)}...
                          {quest.creatorAddress.slice(-4)}
                        </p>
                      )}
                      <p>
                        Category: {quest.category} • Difficulty:{" "}
                        {quest.difficulty}
                      </p>
                      <p>
                        Participants: {getQuestParticipantCount(quest.id)} •
                        Completed: {getQuestCompletionCount(quest.id)}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2">
                      {/* Invite link button for non-public quests */}
                      {quest.visibility !== "public" && (
                        <button
                          onClick={() => handleCopyQuestLink(quest)}
                          className="flex items-center justify-center space-x-2 py-2 px-3 bg-blue-800 hover:bg-blue-700 text-blue-300 rounded-lg font-medium transition-colors text-sm"
                        >
                          {copiedQuestId === quest.id ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Invite Code</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Admin action buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResetQuest(quest)}
                          className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-yellow-800 hover:bg-yellow-700 text-yellow-300 rounded-lg font-medium transition-colors text-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reset</span>
                        </button>
                        <button
                          onClick={() => handleDeleteQuest(quest)}
                          className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-red-800 hover:bg-red-700 text-red-300 rounded-lg font-medium transition-colors text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state for quests */}
            {userQuests.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No quests created yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Create your first quest to see it here
                </p>
              </div>
            )}
          </div>
        )}

        {/* BADGES TAB: Shows user's earned badges with advanced management */}
        {selectedTab === "badges" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                My Earned Badges ({userBadges.length})
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={loadOnChainBadges}
                  disabled={isLoadingOnChain}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      isLoadingOnChain ? "animate-spin" : ""
                    }`}
                  />
                  <span>Sync Chain</span>
                </button>
              </div>
            </div>

            {/* On-chain info card */}
            <div className="quest-card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-400" />
                Blockchain Badge Info
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">On-chain</div>
                  <div className="text-white text-xl font-bold">
                    {badgeBalance !== undefined ? badgeBalance.toString() : "0"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {badgeBalance !== undefined
                      ? "NFT Badges owned on blockchain"
                      : "No on-chain badges found"}
                  </div>
                </div>
              </div>
              {/*<div className="mt-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  <strong>Badge Burning:</strong> You can permanently burn NFT
                  badges from the blockchain to enable quest re-completion.
                  Note: Many stored token IDs are transaction hashes and won't
                  match the actual NFT token IDs (which are simple numbers like
                  #8, #15, etc.).
                </p>
                <button
                  onClick={() => {
                    const badgesWithTokenId = userBadges.filter(
                      (b) => b.tokenId
                    );
                    const badgesWithoutTokenId = userBadges.filter(
                      (b) => !b.tokenId
                    );
                    const invalidTokenIds = userBadges.filter(
                      (b) =>
                        b.tokenId &&
                        (isNaN(Number(b.tokenId)) || Number(b.tokenId) < 0)
                    );

                    // Show blockchain comparison info
                    const blockscoutUrl = `https://sepolia-blockscout.lisk.com/address/${QUESTLOG_CONTRACT_ADDRESS}?tab=inventory`;

                    notify.info(
                      "Badge Diagnostic Report",
                      `📊 Badge Data Analysis:\n\n` +
                        `• Total badges: ${userBadges.length}\n` +
                        `• With token ID: ${badgesWithTokenId.length}\n` +
                        `• Without token ID: ${badgesWithoutTokenId.length}\n` +
                        `• Invalid token IDs: ${invalidTokenIds.length}\n\n` +
                        `🔍 Token ID Issues:\n` +
                        `Many stored token IDs are transaction hashes instead of actual NFT token IDs.\n\n` +
                        `💡 Real token IDs are simple numbers:\n` +
                        `• Correct: 8, 15, 42, 123\n` +
                        `• Incorrect: 0xc75b14... (transaction hash)\n\n` +
                        `🛠️ To find correct token IDs:\n` +
                        `• Check your wallet's NFT collection\n` +
                        `• Look for badge images in your wallet\n` +
                        `• Real token IDs are displayed as simple numbers\n` +
                        `• The blockchain explorer will show the correct format`,
                      15000
                    );

                    // Open blockscout in new tab for manual verification
                    setTimeout(() => {
                      window.open(blockscoutUrl, "_blank");
                    }, 1000);
                  }}
                  className="mt-2 text-xs px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded transition-colors"
                >
                  Diagnose Badge Data & Open Explorer
                </button>
              </div>*/}
            </div>

            {/* Badge grid showing all earned badges */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {userBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`quest-card ${
                    burningBadges.has(badge.id)
                      ? "opacity-75 border-2 border-red-500/50"
                      : ""
                  }`}
                >
                  {/* Badge image with rarity indicator */}
                  <div className="relative mb-4 overflow-hidden rounded-lg">
                    <img
                      src={badge.imageUrl}
                      alt={badge.name}
                      className="w-full h-40 object-cover"
                    />

                    {/* Burning overlay indicator */}
                    {burningBadges.has(badge.id) && (
                      <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                        <div className="bg-red-800/90 px-3 py-1 rounded-full flex items-center space-x-2">
                          <div className="w-3 h-3 border border-red-200 border-t-transparent rounded-full animate-spin" />
                          <span className="text-red-200 text-xs font-medium">
                            BURNING
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          badge.rarity === "legendary"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : badge.rarity === "epic"
                            ? "bg-purple-500/20 text-purple-400"
                            : badge.rarity === "rare"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {badge.rarity}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Badge details */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {badge.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {badge.description}
                      </p>
                    </div>

                    {/* Badge metadata */}
                    <div className="text-xs text-gray-500">
                      <p>
                        Owner: {badge.ownerAddress?.slice(0, 6)}...
                        {badge.ownerAddress?.slice(-4)}
                      </p>
                      <p>Earned: {badge.earnedAt.toLocaleDateString()}</p>
                      <p>Quest ID: {badge.questId}</p>
                      {badge.tokenId && (
                        <div className="flex items-center justify-between">
                          <span>
                            Stored Token ID:{" "}
                            {badge.tokenId.length > 10
                              ? `${badge.tokenId.slice(0, 8)}...`
                              : badge.tokenId}
                          </span>
                        </div>
                      )}
                      {!badge.tokenId && (
                        <p className="text-yellow-400">
                          ⚠️ No token ID (old badge)
                        </p>
                      )}
                      {badge.transactionHash && (
                        <div className="flex items-center space-x-1">
                          <span>
                            TX: {badge.transactionHash.slice(0, 12)}...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Burn badge button with enhanced validation */}
                    <div className="space-y-2">
                      {badge.tokenId && (
                        <button
                          onClick={() => handleBurnBadge(badge)}
                          disabled={
                            burningBadges.has(badge.id) || isBurnPending
                          }
                          className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                            burningBadges.has(badge.id) || isBurnPending
                              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                              : "bg-red-800 hover:bg-red-700 text-red-300"
                          }`}
                          title={`Attempt to burn NFT (stored ID: ${badge.tokenId}). Note: This may fail if the stored ID doesn't match the actual blockchain token ID.`}
                        >
                          {burningBadges.has(badge.id) || isBurnPending ? (
                            <>
                              <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                              <span>Burning...</span>
                            </>
                          ) : (
                            <>
                              <Flame className="w-4 h-4" />
                              <span>Burn NFT</span>
                            </>
                          )}
                        </button>
                      )}
                      {!badge.tokenId && (
                        <div className="w-full py-2 px-3 rounded-lg bg-gray-700/50 border border-gray-600/50 text-center">
                          <p className="text-gray-400 text-sm">
                            ⚠️ Cannot burn: No token ID
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Badge created before token tracking
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state for badges */}
            {userBadges.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No badges earned yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Complete quests to earn badges
                </p>
              </div>
            )}
          </div>
        )}

        {/* STATS TAB: Shows user statistics and metrics */}
        {selectedTab === "stats" && (
          <div className="space-y-8">
            {/* Personal Statistics Section */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Users className="w-6 h-6 mr-2 text-blue-400" />
                Personal Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Quests Joined */}
                <div className="quest-card text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {personalStats.joinedQuests}
                  </div>
                  <div className="text-sm text-gray-400">Quests Joined</div>
                  <div className="text-xs text-gray-500 mt-1">
                    (Cross-device total)
                  </div>
                </div>

                {/* Personal Badges Earned */}
                <div className="quest-card text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {personalStats.badgesEarned}
                  </div>
                  <div className="text-sm text-gray-400">Badges Earned</div>
                  <div className="text-xs text-gray-500 mt-1">(On-chain)</div>
                </div>

                {/* Quests Completed */}
                <div className="quest-card text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {personalStats.completedQuests}
                  </div>
                  <div className="text-sm text-gray-400">Quests Completed</div>
                  <div className="text-xs text-gray-500 mt-1">
                    (Cross-device total)
                  </div>
                </div>

                {/* On-chain badges */}
                <div className="quest-card text-center">
                  <div className="text-2xl font-bold text-cyan-400 mb-2">
                    {badgeBalance !== undefined
                      ? badgeBalance.toString()
                      : "Loading..."}
                  </div>
                  <div className="text-sm text-gray-400">On-chain NFTs</div>
                  <div className="text-xs text-gray-500 mt-1">
                    (Blockchain verified)
                  </div>
                </div>
              </div>
            </div>

            {/* Quest Creator Statistics Section */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-2 text-purple-400" />
                Quest Creator Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* User's created quests */}
                <div className="quest-card text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {userQuests.length}
                  </div>
                  <div className="text-sm text-gray-400">Quests Created</div>
                </div>

                {/* User's public/invite/event quests */}
                <div className="quest-card text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {
                      userQuests.filter(
                        (q) =>
                          q.visibility === "public" ||
                          q.visibility === "invite-only" ||
                          q.visibility === "event"
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-400">
                    Public/Invite/Event Quests
                  </div>
                </div>

                {/* Total participants for user's quests */}
                <div className="quest-card text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-2">
                    {userQuests.reduce(
                      (total, quest) =>
                        total + getQuestParticipantCount(quest.id),
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    Total Participants
                  </div>
                </div>

                {/* Total completions for user's quests */}
                <div className="quest-card text-center">
                  <div className="text-2xl font-bold text-pink-400 mb-2">
                    {userQuests.reduce(
                      (total, quest) =>
                        total + getQuestCompletionCount(quest.id),
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-400">Total Completions</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTRACT TAB: Shows contract information and admin tools */}
        {selectedTab === "contract" && (
          <div className="space-y-6">
            <div className="quest-card">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-purple-400" />
                Contract Information
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">
                      Contract Address
                    </div>
                    <div className="text-white font-mono text-sm break-all">
                      {QUESTLOG_CONTRACT_ADDRESS}
                    </div>
                  </div>

                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Network</div>
                    <div className="text-white">{CONTRACT_INFO.network}</div>
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">
                    Block Explorer
                  </div>
                  <a
                    href={CONTRACT_INFO.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm break-all"
                  >
                    {CONTRACT_INFO.explorer}
                  </a>
                </div>
              </div>
            </div>

            <div className="quest-card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                📡 IPFS Badge Storage (Pinata)
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-blue-300 font-medium mb-2">
                    Decentralized Image Storage via Pinata
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Badge images are now stored on IPFS via Pinata Cloud, making
                    them:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-400">
                    <li>• 🌐 Permanently accessible via IPFS network</li>
                    <li>• 🔒 Immutable and tamper-proof</li>
                    <li>
                      • ⚡ Fast delivery through Pinata's optimized gateways
                    </li>
                    <li>• 💰 No ongoing storage costs for the app</li>
                    <li>• 🎯 Professional-grade pinning service</li>
                  </ul>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">IPFS Gateways</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    Badge images can be accessed through multiple IPFS gateways:
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Primary (Pinata):</span>
                      <span className="text-blue-400">
                        https://gateway.pinata.cloud/ipfs/
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Backup:</span>
                      <span className="text-blue-400">
                        https://ipfs.io/ipfs/
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Web3:</span>
                      <span className="text-blue-400">
                        https://dweb.link/ipfs/
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4">
                  <h4 className="text-green-300 font-medium mb-2">
                    ✅ Real IPFS Storage Active
                  </h4>
                  <p className="text-gray-300 text-sm">
                    All new badge uploads are stored on the real IPFS network
                    via Pinata. Your images are pinned and guaranteed to be
                    accessible globally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DATABASE TAB: Database connection testing */}
        {selectedTab === "database" && <DatabasePanel />}
      </div>

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
            ? `Are you sure you want to delete "${questToDelete.title}"?\n\nThis action cannot be undone and will:\n• Remove the quest from storage\n• Delete all user progress\n• Remove associated badges\n• Notify all participants`
            : ""
        }
        confirmText="Delete Quest"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminPanel;
