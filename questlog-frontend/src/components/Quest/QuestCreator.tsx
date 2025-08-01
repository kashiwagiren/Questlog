// React imports for component state management
import React, { useState } from "react";
// Wagmi hooks for blockchain wallet integration and transaction handling
import {
  useAccount, // Gets connected wallet address
  useSendTransaction, // Sends blockchain transactions (for creation fees)
  useWaitForTransactionReceipt, // Waits for transaction confirmation
} from "wagmi";
// Viem utility for converting ETH amounts to wei (blockchain format)
import { parseEther } from "viem";
// Lucide React icons for UI visual elements
import { Upload, X, Trophy, Star, Save, Zap } from "lucide-react";
// TypeScript type definitions for quest data structures
import {
  Quest, // Main quest object type
  QuestCategory, // Categories like "social", "gaming", etc.
  QuestDifficulty, // Difficulty levels: easy, medium, hard
  QuestVisibility, // Public, invite-only, or event quests
  RequirementType, // Types of requirements (manual, discord, etc.)
  QuestRequirement, // Individual requirement structure
} from "@backend/types/quest";
// IPFS service for decentralized image storage
import IPFSService from "../../services/ipfs";
// Quest storage service for quest data persistence
import { HybridQuestStorage } from "../../services/hybridQuestStorage";
// Notification system for user feedback (success, error, warning messages)
import {
  useNotification, // Hook to access notification context
  showSuccess, // Helper for success notifications
  showError, // Helper for error notifications
  showWarning, // Helper for warning notifications
  showInfo, // Helper for info notifications
} from "../UI/NotificationSystem";

/**
 * QuestCreator Component
 *
 * MAIN PURPOSE:
 * This component provides a comprehensive quest creation interface where users can:
 * 1. Design custom quests with requirements and rewards
 * 2. Upload badge images to IPFS for decentralized storage
 * 3. Configure various quest types (public, invite-only, event-based)
 * 4. Pay creation fees via blockchain transactions
 * 5. Save quests using cross-device storage (Supabase + localStorage fallback)
 *
 * USER INTERACTION FLOW:
 * 1. User fills out quest details (title, description, category, difficulty)
 * 2. User configures rewards (NFT badge + optional additional rewards)
 * 3. User uploads badge image → automatically stored on IPFS
 * 4. User sets quest requirements (manual, Discord join, etc.)
 * 5. User configures advanced settings (visibility, time limits, etc.)
 * 6. User clicks "Create Quest" → triggers blockchain fee payment
 * 7. After fee payment confirmation → quest is saved to storage
 * 8. Quest becomes available on QuestBoard for other users
 *
 * BLOCKCHAIN INTEGRATION:
 * - Uses useSendTransaction to pay 0.0005 ETH creation fee
 * - Waits for transaction confirmation before creating quest
 * - Fee payment prevents spam and ensures quality content
 *
 * CALLED BY:
 * - App.tsx when activeTab === "create" and wallet is connected
 * - Users navigate here via Header navigation or Hero call-to-action buttons
 */
const QuestCreator: React.FC = () => {
  // Get connected wallet address from wagmi
  const { address } = useAccount();

  // Access notification system for user feedback messages
  const { addNotification } = useNotification();

  // Component state for various loading states
  const [isCreating, setIsCreating] = useState(false); // True during quest creation process
  const [isPayingFee, setIsPayingFee] = useState(false); // True during blockchain fee payment
  const [isUploadingImage, setIsUploadingImage] = useState(false); // True during IPFS upload

  // Create convenient notification helper functions
  // These wrap the notification functions with the addNotification context
  // USED BY: All error handling, success messages, and user feedback throughout component
  const notify = {
    success: showSuccess(addNotification), // Green success toasts
    error: showError(addNotification), // Red error toasts
    warning: showWarning(addNotification), // Yellow warning toasts
    info: showInfo(addNotification), // Blue info toasts
  };

  // Wagmi hooks for blockchain transaction handling
  const {
    sendTransaction, // Function to initiate blockchain transactions
    data: hash, // Transaction hash after sending (used to track transaction)
    isPending: isTransactionPending, // True while transaction is being processed
  } = useSendTransaction();

  // Hook to wait for transaction confirmation on blockchain
  // TRIGGERS: After sendTransaction is called, this monitors the transaction status
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Main quest form data state
  // This object contains all the basic quest information that users fill out
  // UPDATED BY: Input field onChange handlers throughout the form
  // USED BY: Form submission, validation, and quest creation process
  const [formData, setFormData] = useState({
    title: "", // Quest title (required)
    description: "", // Quest description (required)
    category: "social" as QuestCategory, // Default to social category
    difficulty: "easy" as QuestDifficulty, // Default to easy difficulty
    reward: "", // Auto-generated based on rewardConfig
    xpReward: 100, // XP points earned (auto-set based on difficulty)
    requirements: [
      // Array of quest requirements (at least one required)
      { type: "manual" as RequirementType, description: "", config: {} },
    ],
    visibility: "public" as QuestVisibility, // Default to public quest
    participantLimit: 0, // 0 = unlimited participants
    timeEstimate: "5-10 minutes", // Estimated completion time
    organizingEntity: "", // Optional: who is organizing this quest
    startDate: "", // Required for event quests
    endDate: "", // Required for event quests
  });

  // Reward configuration state - separate from main form data
  // This manages the NFT badge and additional rewards configuration
  // UPDATED BY: Reward section UI interactions, image uploads, reward type selection
  // USED BY: Reward preview generation, form validation, quest creation
  const [rewardConfig, setRewardConfig] = useState({
    additionalRewardType: "none" as  // Type of additional reward beyond NFT badge
      | "none" // Just NFT badge + base XP
      | "xp-bonus", // NFT badge + bonus XP
    badgeName: "", // Custom name for the NFT badge
    badgeImage: "", // IPFS URL of the badge image (required)
  });

  // Static configuration data for form dropdowns
  // These arrays define the available options for various quest settings

  // Quest categories available for selection
  // USED BY: Category dropdown in Basic Information section
  const categories: {
    id: QuestCategory;
    label: string;
    description: string;
  }[] = [
    {
      id: "social",
      label: "Social",
      description: "Community engagement and social media tasks",
    },
    {
      id: "gaming",
      label: "Gaming",
      description: "Game-related challenges and achievements",
    },
    {
      id: "creative",
      label: "Creative",
      description: "Art, writing, and creative challenges",
    },
    {
      id: "defi",
      label: "DeFi",
      description: "Decentralized finance protocols and activities",
    },
    {
      id: "development",
      label: "Development",
      description: "Coding, smart contracts, and technical tasks",
    },
  ];

  // Difficulty levels with associated XP rewards and display colors
  // USED BY: Difficulty dropdown and automatic XP calculation
  // TRIGGERS: handleDifficultyChange when user selects different difficulty
  const difficulties: {
    id: QuestDifficulty;
    label: string;
    xp: number; // XP automatically assigned based on difficulty
    color: string; // Tailwind color class for visual indication
  }[] = [
    { id: "easy", label: "Easy", xp: 100, color: "text-green-400" },
    { id: "medium", label: "Medium", xp: 250, color: "text-yellow-400" },
    { id: "hard", label: "Hard", xp: 500, color: "text-red-400" },
  ];

  // Quest visibility options that control who can see and join the quest
  // USED BY: Visibility dropdown in Advanced Settings section
  // AFFECTS: Quest accessibility, event date requirements, invite codes
  const visibilityOptions: {
    id: QuestVisibility;
    label: string;
    description: string;
  }[] = [
    {
      id: "public",
      label: "Public",
      description: "Anyone can see and participate", // Shows on public QuestBoard
    },
    {
      id: "invite-only",
      label: "Invite Only",
      description: "Only invited users can participate", // Requires quest code to join
    },
    {
      id: "event",
      label: "Event Quest",
      description: "Time-limited quest for special events", // Has start/end dates
    },
  ];

  // Additional reward types beyond the base NFT badge
  // USED BY: Reward type selection buttons in Reward Configuration section
  // TRIGGERS: Additional form fields based on selected type
  const rewardTypes = [
    {
      id: "none" as const,
      label: "NFT Badge Only",
      description: "Custom badge that participants earn upon completion",
      icon: "🏆", // All quests include NFT badge by default
    },
    {
      id: "xp-bonus" as const,
      label: "NFT Badge + XP Bonus",
      description: "Custom badge plus extra experience points",
      icon: "⭐", // Doubles the base XP reward
    },
  ];

  /**
   * Handle badge image upload to IPFS
   *
   * PURPOSE: Upload user-selected image to IPFS for decentralized storage
   * CALLED BY: File input onChange event in badge image upload section
   * PROCESS:
   * 1. User selects image file → this function is triggered
   * 2. File is uploaded to IPFS via IPFSService
   * 3. IPFS URL is stored in rewardConfig.badgeImage
   * 4. Success/error notifications shown to user
   *
   * IPFS INTEGRATION:
   * - Images are permanently stored on decentralized network
   * - Returns IPFS hash and gateway URL for accessing image
   * - Ensures quest badges are censorship-resistant and permanent
   *
   * @param event - File input change event containing selected image
   */
  const handleRewardImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return; // No file selected

    setIsUploadingImage(true); // Show loading state in UI

    try {
      console.log(`📤 Uploading ${file.name} to IPFS...`);

      // Upload file to IPFS using dedicated service
      const result = await IPFSService.uploadFile(file);

      if (result.success && result.url) {
        console.log(`✅ IPFS upload successful: ${result.hash}`);
        console.log(`🔗 IPFS URL: ${result.url}`);

        // Store the IPFS URL in reward configuration
        setRewardConfig((prev) => ({
          ...prev,
          badgeImage: result.url!, // Gateway URL for displaying image
          badgeImageHash: result.hash, // IPFS hash for reference
        }));

        // Show success notification with IPFS details
        notify.success(
          "Image Uploaded! 📤",
          `✅ Image uploaded to IPFS!\nHash: ${result.hash}\n\nYour badge image is now decentralized and permanently stored.`,
          8000
        );
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("IPFS upload error:", error);
      notify.error(
        "Upload Failed",
        `❌ Failed to upload to IPFS: ${
          error instanceof Error ? error.message : "Unknown error"
        }\n\nPlease try again or use a smaller image.`,
        8000
      );
    } finally {
      setIsUploadingImage(false); // Hide loading state
    }
  };

  /**
   * Remove a requirement from the quest
   *
   * PURPOSE: Allow users to delete requirement entries they don't need
   * CALLED BY: X button click in requirement cards
   * CONSTRAINT: Prevents deletion if only one requirement exists (minimum required)
   *
   * @param index - Index of requirement to remove from formData.requirements array
   */
  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  /**
   * Update a specific field in a quest requirement
   *
   * PURPOSE: Handle changes to requirement type, description, or configuration
   * CALLED BY: Input field onChange events in requirement cards
   * EXAMPLES:
   * - User changes requirement type from "manual" to "discord_join"
   * - User types requirement description
   * - User enters Discord server ID in requirement config
   *
   * @param index - Index of requirement to update
   * @param field - Field name to update (type, description, config)
   * @param value - New value for the field
   */
  const updateRequirement = (
    index: number,
    field: keyof QuestRequirement,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? { ...req, [field]: value } : req
      ),
    }));
  };

  /**
   * Handle difficulty selection and auto-update XP reward
   *
   * PURPOSE: When user selects difficulty, automatically set appropriate XP reward
   * CALLED BY: Difficulty dropdown onChange event
   * EFFECT: Updates both difficulty and xpReward in formData
   *
   * @param difficulty - Selected difficulty level (easy/medium/hard)
   */
  const handleDifficultyChange = (difficulty: QuestDifficulty) => {
    const difficultyData = difficulties.find((d) => d.id === difficulty);
    setFormData((prev) => ({
      ...prev,
      difficulty,
      xpReward: difficultyData?.xp || 100, // Auto-set XP based on difficulty
    }));
  };

  /**
   * Main form submission handler
   *
   * PURPOSE: Validate form data and initiate quest creation process
   * CALLED BY: Form onSubmit event when user clicks "Create Quest" button
   *
   * PROCESS FLOW:
   * 1. Validate all required fields and configurations
   * 2. Validate event quest date requirements (if applicable)
   * 3. Initiate blockchain fee payment (0.0005 ETH)
   * 4. After fee confirmation → create and save quest (handled in useEffect)
   *
   * VALIDATION CHECKS:
   * - Required fields: title, description, at least one requirement
   * - Badge image uploaded to IPFS
   * - Event quest dates (if event quest)
   * - Additional reward configuration (if selected)
   *
   * BLOCKCHAIN INTEGRATION:
   * - Sends 0.0005 ETH fee payment to prevent spam
   * - Fee payment triggers quest creation process
   *
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return; // Require wallet connection

    // Validate required fields first
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.requirements.some((req) => req.description.trim())
    ) {
      notify.warning(
        "Required Fields Missing",
        "Please fill in all required fields: title, description, and at least one requirement.",
        6000
      );
      return;
    }

    // Validate reward configuration - badge image is required for all quests
    if (!rewardConfig.badgeImage) {
      notify.warning(
        "Badge Image Required",
        "Please upload a badge image (NFT badges are required for all quests)",
        6000
      );
      return;
    }

    // Validate event quest dates
    if (formData.visibility === "event") {
      if (!formData.startDate || !formData.endDate) {
        notify.warning(
          "Event Dates Required",
          "Please set both start and end dates for event quests",
          6000
        );
        return;
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const now = new Date();

      // Start date must be in the future
      if (startDate < now) {
        notify.warning(
          "Invalid Start Date",
          "Event start date must be in the future",
          6000
        );
        return;
      }

      // End date must be after start date
      if (endDate <= startDate) {
        notify.warning(
          "Invalid End Date",
          "Event end date must be after the start date",
          6000
        );
        return;
      }

      // Minimum event duration of 1 hour
      const minDuration = 60 * 60 * 1000; // 1 hour in milliseconds
      if (endDate.getTime() - startDate.getTime() < minDuration) {
        notify.warning(
          "Duration Too Short",
          "Event duration must be at least 1 hour",
          6000
        );
        return;
      }
    }

    // Start fee payment process
    setIsPayingFee(true);

    try {
      // Send blockchain transaction for creation fee
      // NOTE: Currently fee goes to creator address, could be changed to treasury
      sendTransaction({
        to: address, // Fee destination
        value: parseEther("0.0005"), // 0.0005 ETH creation fee
      });
    } catch (error) {
      console.error("Failed to send fee payment:", error);
      notify.error(
        "Payment Failed",
        "Failed to process fee payment. Please try again.",
        6000
      );
      setIsPayingFee(false);
    }
  };

  /**
   * Effect hook to create quest after fee payment confirmation
   *
   * PURPOSE: Monitor blockchain transaction status and create quest when payment is confirmed
   * TRIGGERS: When transaction state changes (confirmation, pending status, etc.)
   *
   * PROCESS:
   * 1. Wait for fee payment transaction to be confirmed on blockchain
   * 2. Build complete quest object from form data and reward configuration
   * 3. Save quest using HybridQuestStorage (IPFS + localStorage)
   * 4. Dispatch custom event to notify other components of new quest
   * 5. Show success notification with quest code
   * 6. Reset form for next quest creation
   *
   * QUEST OBJECT CREATION:
   * - Combines formData and rewardConfig into complete Quest object
   * - Adds creator address, timestamp-based ID, and current date
   * - Includes event dates for event quests
   * - Filters out empty requirements
   *
   * CROSS-DEVICE SYNC:
   * - Quest is saved to both Supabase (cloud) and localStorage (offline)
   * - Enables quest access across different devices and browsers
   * - Falls back to localStorage if Supabase is unavailable
   *
   * DEPENDENCIES: [isConfirming, isTransactionPending, hash, isPayingFee, address, formData, rewardConfig]
   */
  // Watch for transaction confirmation to create the quest
  React.useEffect(() => {
    const createQuestAfterPayment = async () => {
      // Only proceed when:
      // - Transaction is not confirming anymore (completed)
      // - Transaction is not pending (completed)
      // - We have a transaction hash (transaction was sent)
      // - We're in the fee payment state
      // - Wallet is connected
      if (
        !isConfirming &&
        !isTransactionPending &&
        hash &&
        isPayingFee &&
        address
      ) {
        console.log("Fee payment confirmed! Creating quest...");

        setIsPayingFee(false); // Exit fee payment state
        setIsCreating(true); // Enter quest creation state

        try {
          // Build reward types array
          const rewardTypes = ["nft-badge"]; // Always include NFT badge
          if (rewardConfig.additionalRewardType !== "none") {
            rewardTypes.push(rewardConfig.additionalRewardType);
          }

          // Create complete quest object
          const newQuest: Quest = {
            id: Date.now().toString(), // Unique ID based on timestamp
            title: formData.title,
            description: formData.description,
            specificTask: formData.description, // Use description as specific task
            category: formData.category,
            difficulty: formData.difficulty,
            reward: rewardConfig.badgeName || "Custom Badge", // Simplified reward description
            xpReward:
              rewardConfig.additionalRewardType === "xp-bonus"
                ? formData.xpReward * 2 // Double XP for bonus rewards
                : formData.xpReward,
            requirements: formData.requirements.filter(
              (req) => req.description.trim() // Only include requirements with descriptions
            ),
            tags: [], // TODO: Could be added in future versions
            visibility: formData.visibility,
            participantLimit: formData.participantLimit,
            timeEstimate: formData.timeEstimate,
            organizingEntity: formData.organizingEntity,
            creatorAddress: address, // Wallet address of quest creator
            rewardTypes: rewardTypes as any,
            streakBonus: false, // TODO: Could be configurable in future
            isCompleted: false, // New quests start as incomplete
            badgeImage: rewardConfig.badgeImage, // IPFS URL of badge image
            // Add event dates if this is an event quest
            ...(formData.visibility === "event" && {
              startDate: new Date(formData.startDate),
              endDate: new Date(formData.endDate),
            }),
          };

          // Create storage instance
          const questStorage = new HybridQuestStorage();

          // Save quest using hybrid storage service
          console.log("🚀 Saving quest to hybrid storage...");
          
          if (newQuest.visibility === "public") {
            await questStorage.savePublicQuest(newQuest);
          } else {
            await questStorage.savePrivateQuest(newQuest, address);
          }

          console.log(
            `✅ Quest "${newQuest.title}" saved successfully!`
          );

          // Notify other components that a new quest was created
          // This allows QuestBoard to refresh and show the new quest
          window.dispatchEvent(
            new CustomEvent("questCreated", { detail: newQuest })
          );

          // Prepare success message with quest details
          const questCode = newQuest.id; // Use quest ID as the sharing code

          // Show appropriate success message based on quest visibility
          if (newQuest.visibility === "invite-only") {
            notify.success(
              "Quest Created Successfully! 🎉",
              `✅ "${newQuest.title}" is now live!\n\n🔑 Quest Code: ${questCode}\n(Copied to clipboard)\n\n💡 Share this code to invite participants.\n\n📱 Quest is synced across all your devices!`,
              8000
            );
          } else {
            notify.success(
              "Quest Created Successfully! 🎉",
              `✅ "${newQuest.title}" is now live!\n\n🌍 Your quest is public and discoverable!\n🔑 Quest Code: ${questCode}\n(Copied to clipboard)\n\n📱 Quest is synced across all your devices!`,
              8000
            );
          }

          // Copy quest code to clipboard for easy sharing
          try {
            await navigator.clipboard.writeText(questCode);
          } catch (clipboardError) {
            console.warn("Failed to copy to clipboard:", clipboardError);
          }

          // Reset form after successful creation for next quest
          setFormData({
            title: "",
            description: "",
            category: "social" as QuestCategory,
            difficulty: "easy" as QuestDifficulty,
            reward: "",
            xpReward: 100,
            requirements: [
              {
                type: "manual" as RequirementType,
                description: "",
                config: {},
              },
            ],
            visibility: "public" as QuestVisibility,
            participantLimit: 0,
            timeEstimate: "5-10 minutes",
            organizingEntity: "",
            startDate: "",
            endDate: "",
          });

          // Reset reward configuration
          setRewardConfig({
            additionalRewardType: "none",
            badgeName: "",
            badgeImage: "",
          });
        } catch (error) {
          console.error("Failed to create quest:", error);
          notify.error(
            "Quest Creation Failed",
            `❌ Failed to create quest: ${
              error instanceof Error ? error.message : "Unknown error"
            }\n\nPlease try again.`,
            8000
          );
        } finally {
          setIsCreating(false); // Exit quest creation state
        }
      }
    };

    createQuestAfterPayment();
  }, [
    isConfirming, // Transaction confirmation status
    isTransactionPending, // Transaction pending status
    hash, // Transaction hash
    isPayingFee, // Fee payment state
    address, // Wallet address
    formData, // Quest form data
    rewardConfig, // Reward configuration
  ]);

  // COMPONENT RENDER - JSX STRUCTURE
  // The return statement renders the complete quest creation form interface
  return (
    <div className="space-y-8">
      {/* Page Header Section */}
      {/* Shows quest creation title and description to orient users */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Create Quest
        </h1>
        <p className="text-gray-400 text-base sm:text-lg px-4">
          🎯 Design engaging challenges for the community to complete and earn
          badges
        </p>
      </div>

      {/* Main Quest Creation Form */}
      {/* onSubmit triggers handleSubmit function for validation and fee payment */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        {/* Basic Information Section */}
        {/* Collects core quest details: title, description, category, difficulty */}
        <div className="quest-card">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>Basic Information</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quest Title Input */}
            {/* Required field - used as main quest identifier */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quest Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Enter an engaging quest title..."
                required
              />
            </div>

            {/* Quest Description Input */}
            {/* Required field - explains what the quest is about */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder="Describe what this quest is about..."
                required
              />
            </div>

            {/* Category Selection Dropdown */}
            {/* Helps users find relevant quests by type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as QuestCategory,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Selection Dropdown */}
            {/* Automatically sets appropriate XP reward via handleDifficultyChange */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  handleDifficultyChange(e.target.value as QuestDifficulty)
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id}>
                    {difficulty.label} ({difficulty.xp} XP)
                  </option>
                ))}
              </select>
            </div>

            {/* Reward Preview Section - COMMENTED OUT */}
            {/* This section was disabled but shows how reward preview could work */}
            {/* Would display the auto-generated reward text from getRewardText() */}
            {/*
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reward Preview
              </label>
              <div className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300">
                {getRewardText()}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Configure reward details in the Reward Configuration section
                below
              </p>
            </div>
            */}
          </div>
        </div>

        {/* Reward Configuration Section */}
        {/* Handles NFT badge setup and additional reward configuration */}
        <div className="quest-card">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>Reward Configuration</span>
          </h2>

          <div className="space-y-6">
            {/* NFT Badge Configuration - Required for all quests */}
            {/* Every quest participant earns a custom NFT badge upon completion */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Trophy className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-semibold">NFT Badge</span>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Every quest participant will earn a custom NFT badge upon
                completion.
              </p>

              {/* Badge Name Input */}
              {/* Optional: Custom name for the NFT badge */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Badge Name
                </label>
                <input
                  type="text"
                  value={rewardConfig.badgeName}
                  onChange={(e) =>
                    setRewardConfig((prev) => ({
                      ...prev,
                      badgeName: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter badge name..."
                />
              </div>

              {/* Badge Image Upload - IPFS Integration */}
              {/* Required: Badge image uploaded to IPFS for decentralized storage */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Badge Image *
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
                    {rewardConfig.badgeImage ? (
                      // Show uploaded image preview with IPFS indicator
                      <div className="relative w-full h-full">
                        <img
                          src={IPFSService.getDisplayUrl(
                            rewardConfig.badgeImage
                          )}
                          alt="Badge preview"
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            console.error(
                              "Failed to load IPFS image:",
                              rewardConfig.badgeImage
                            );
                            // If IPFS image fails to load, hide the image element
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        {/* IPFS storage indicator */}
                        <div className="absolute top-2 left-2 bg-green-600/80 text-white px-2 py-1 rounded text-xs font-medium">
                          📡 IPFS
                        </div>
                        {/* Remove image button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setRewardConfig((prev) => ({
                              ...prev,
                              badgeImage: "",
                            }));
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      // Show upload prompt or loading state
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploadingImage ? (
                          // Show loading spinner during IPFS upload
                          <>
                            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-sm text-gray-400">
                              📡 Uploading to IPFS...
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Making your badge decentralized
                            </p>
                          </>
                        ) : (
                          // Show upload instruction
                          <>
                            <Upload className="w-8 h-8 mb-4 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-400">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              badge image to IPFS
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 10MB • Stored permanently on
                              IPFS
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    {/* Hidden file input - triggers handleRewardImageUpload on change */}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleRewardImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Additional Reward Type Selection */}
            {/* User can choose extra rewards beyond the base NFT badge */}
            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-purple-300">
                    Choose Your Reward Type
                  </h3>
                  <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm text-gray-300">
                  Select what participants will earn for completing your quest
                </p>
              </div>
              <div className="flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  {rewardTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setRewardConfig((prev) => ({
                          ...prev,
                          additionalRewardType: type.id, // Updates reward type selection
                        }))
                      }
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-center transform hover:scale-105 ${
                        rewardConfig.additionalRewardType === type.id
                          ? "border-purple-400 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-200 shadow-lg shadow-purple-500/25" // Selected state with gradient and glow
                          : "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-purple-400/50 hover:bg-gray-700/50" // Default state with hover effects
                      }`}
                    >
                      <div className="text-4xl mb-3">{type.icon}</div>
                      <div className="font-semibold text-base mb-2">
                        {type.label}
                      </div>
                      <div className="text-sm text-gray-400 leading-relaxed">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* XP Bonus Reward Information Display */}
            {/* Shows calculation for XP bonus rewards */}
            {rewardConfig.additionalRewardType === "xp-bonus" && (
              <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-lg p-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Star className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-semibold text-blue-300">
                    XP Bonus Reward Active
                  </h3>
                  <Star className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-200/80 leading-relaxed mb-3">
                    Participants will receive an additional{" "}
                    <span className="font-bold text-blue-300">
                      {formData.xpReward} XP
                    </span>{" "}
                    bonus points along with their NFT badge.
                  </p>
                  <div className="inline-flex items-center space-x-2 bg-blue-500/10 px-4 py-2 rounded-lg">
                    <span className="text-sm text-blue-300 font-medium">
                      Total XP Reward: {formData.xpReward * 2} XP
                    </span>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            {/* NFT Badge Only Information Display */}
            {/* Shows when no additional rewards are selected */}
            {rewardConfig.additionalRewardType === "none" && (
              <div className="bg-gradient-to-r from-gray-800/20 to-slate-800/20 border border-gray-500/30 rounded-lg p-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Trophy className="w-6 h-6 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-300">
                    Standard NFT Badge Reward
                  </h3>
                  <Trophy className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">
                    Participants will receive a custom NFT badge and{" "}
                    <span className="font-bold text-gray-200">
                      {formData.xpReward} XP
                    </span>{" "}
                    points upon quest completion.
                  </p>
                  <div className="inline-flex items-center space-x-2 bg-gray-500/10 px-4 py-2 rounded-lg">
                    <span className="text-sm text-gray-300 font-medium">
                      Base XP Reward: {formData.xpReward} XP
                    </span>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Requirements Section */}
        {/* Defines what users must do to complete the quest */}
        <div className="quest-card">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-green-400" />
            <span>Requirements</span>
          </h2>

          <div className="space-y-4">
            {/* Dynamic Requirement Cards */}
            {/* Renders one card for each requirement in formData.requirements */}
            {formData.requirements.map((requirement, index) => (
              <div
                key={index}
                className="border border-gray-700 rounded-lg p-4 space-y-3"
              >
                {/* Requirement Type and Remove Button */}
                <div className="flex items-center space-x-2">
                  {/* Requirement Type Dropdown */}
                  {/* Changes available configuration options based on type */}
                  <select
                    value={requirement.type}
                    onChange={(e) =>
                      updateRequirement(
                        index,
                        "type",
                        e.target.value as RequirementType
                      )
                    }
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="manual">Regular</option>{" "}
                    {/* Manual verification */}
                    <option value="discord_join">Discord</option>{" "}
                    {/* Discord server join */}
                    {/* COMMENTED OUT - Future requirement types that could be implemented */}
                    {/*<option value="twitter_follow">Twitter</option>
                    <option value="github_star">GitHub</option>
                    <option value="wallet_connect">Wallet Connect</option>
                    <option value="token_hold">Token Hold</option>
                    <option value="nft_hold">NFT Hold</option>
                    <option value="custom_api">Custom API</option>*/}
                  </select>
                  {/* Remove Requirement Button */}
                  {/* Only shown if more than one requirement exists (minimum of 1 required) */}
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Requirement Description Input */}
                {/* Required field describing what the user must do */}
                <input
                  type="text"
                  value={requirement.description}
                  onChange={(e) =>
                    updateRequirement(index, "description", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter requirement description..."
                />

                {/* Type-specific configuration fields */}
                {/* Different inputs shown based on selected requirement type */}

                {/* Discord Join Requirement Configuration */}
                {requirement.type === "discord_join" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={(requirement.config as any).serverId || ""}
                      onChange={(e) =>
                        updateRequirement(index, "config", {
                          ...requirement.config,
                          serverId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Discord Server ID"
                    />
                    <input
                      type="text"
                      value={(requirement.config as any).inviteLink || ""}
                      onChange={(e) =>
                        updateRequirement(index, "config", {
                          ...requirement.config,
                          inviteLink: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Discord Invite Link (optional)"
                    />
                  </div>
                )}
              </div>
            ))}
            {/* Add Requirement Button - COMMENTED OUT */}
            {/* This functionality is disabled but could allow adding multiple requirements */}
            {/*<button
              type="button"
              onClick={addRequirement}
              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Requirement</span>
            </button>*/}
          </div>
        </div>

        {/* Advanced Settings Section */}
        {/* Optional configuration for quest behavior and accessibility */}
        <div className="quest-card">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span>Advanced Settings</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Estimate Dropdown */}
            {/* Helps users understand expected quest completion time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Estimate
              </label>
              <select
                value={formData.timeEstimate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeEstimate: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="1-5 minutes">1-5 minutes</option>
                <option value="5-10 minutes">5-10 minutes</option>
                <option value="10-30 minutes">10-30 minutes</option>
                <option value="30-60 minutes">30-60 minutes</option>
                <option value="1-2 hours">1-2 hours</option>
                <option value="2+ hours">2+ hours</option>
              </select>
            </div>

            {/* Organizing Entity Input */}
            {/* Optional field to specify who is organizing the quest */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organizing Entity
              </label>
              <input
                type="text"
                value={formData.organizingEntity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    organizingEntity: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Who is organizing this quest?"
              />
            </div>

            {/* Visibility Dropdown */}
            {/* Controls who can see and participate in the quest */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    visibility: e.target.value as QuestVisibility,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                {visibilityOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {/* Dynamic description based on selected visibility */}
              <p className="text-xs text-gray-400 mt-1">
                {
                  visibilityOptions.find(
                    (opt) => opt.id === formData.visibility
                  )?.description
                }
              </p>
            </div>

            {/* Participant Limit Input */}
            {/* Controls maximum number of quest participants (0 = unlimited) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Participant Limit (0 = unlimited)
              </label>
              <input
                type="number"
                min="0"
                value={formData.participantLimit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    participantLimit: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Maximum participants"
              />
            </div>
          </div>

          {/* Event Date Range Configuration - Full Width Section */}
          {/* Only visible when quest visibility is set to "event" */}
          {/* Allows setting time-limited quests with automatic expiration */}
          {formData.visibility === "event" && (
            <div className="mt-6 p-6 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-purple-300">
                  Event Quest Configuration
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Event Start Date & Time ⏰
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    required={formData.visibility === "event"} // Required for event quests
                  />
                  <p className="text-xs text-purple-200/70 mt-1">
                    When the event quest becomes available
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Event End Date & Time ⏰
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    required={formData.visibility === "event"} // Required for event quests
                  />
                  <p className="text-xs text-purple-200/70 mt-1">
                    When the event quest automatically closes
                  </p>
                </div>
              </div>

              {/* Event Quest Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-yellow-500 rounded-full animate-pulse flex-shrink-0 mt-0.5"></div>
                  <div>
                    <h4 className="text-yellow-400 font-medium mb-1">
                      Important: Automatic Quest Closure
                    </h4>
                    <p className="text-sm text-yellow-200/80 leading-relaxed">
                      Event quests will automatically close when the end time is
                      reached. Participants who haven't completed the quest by
                      then will fail the quest. Make sure to allow enough time
                      for completion!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Creation Fee Notice Section */}
        {/* Informs users about the required fee to create a quest */}
        <div className="flex justify-center">
          <div className="text-center mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 max-w-md">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">
                Creation Fee Required
              </span>
            </div>
            <p className="text-sm text-gray-300">
              Creating a quest requires a fee to prevent spam and ensure quality
              content.
            </p>
          </div>
        </div>

        {/* Submit Button Section */}
        {/* Main quest creation button with dynamic states */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isCreating || isPayingFee || !rewardConfig.badgeImage}
            className={`flex items-center space-x-2 px-8 py-4 rounded-lg font-medium transition-all duration-200 ${
              isCreating || isPayingFee || !rewardConfig.badgeImage
                ? "bg-gray-700 text-gray-400 cursor-not-allowed" // Disabled state
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/25 transform hover:scale-105" // Enabled state with hover effects
            }`}
          >
            {/* Dynamic button content based on current state */}
            {isPayingFee ? (
              // Blockchain fee payment in progress
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Paying Creation Fee...</span>
              </>
            ) : isCreating ? (
              // Quest creation in progress (after fee payment)
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Creating Quest...</span>
              </>
            ) : (
              // Default state - ready to create quest
              <>
                <Save className="w-5 h-5" />
                <span>Create Quest</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * COMPONENT EXPORT
 *
 * The QuestCreator component is exported as the default export and used by:
 * - App.tsx when activeTab === "create" and wallet is connected
 * - Users can navigate here via Header navigation or Hero call-to-action
 *
 * INTEGRATION POINTS:
 * - Sends blockchain transactions via wagmi hooks
 * - Uploads images to IPFS via IPFSService
 * - Saves quests via HybridQuestStorage (IPFS + localStorage)
 * - Shows notifications via NotificationSystem
 * - Dispatches "questCreated" events for other components to listen
 *
 * KEY FEATURES:
 * - Complete quest creation workflow with fee payment
 * - IPFS integration for decentralized badge storage
 * - Cross-device quest synchronization
 * - Comprehensive form validation
 * - Dynamic UI based on user selections
 * - Multiple quest types (public, invite-only, event-based)
 * - Multiple reward types (NFT badge + optional extras)
 * - Flexible requirement system
 */
export default QuestCreator;
