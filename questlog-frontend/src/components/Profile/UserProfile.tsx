import React from "react";
import { useState, useEffect } from "react";
import {
  useAccount,
  useEnsName,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  Copy,
  ExternalLink,
  Trophy,
  Calendar,
  TrendingUp,
  Edit3,
  X,
  Save,
  User,
  Camera,
  Trash2,
  Shield,
  MessageCircle,
  Link,
  Unlink,
} from "lucide-react";
import { QUESTLOG_CONTRACT_ADDRESS, QUESTLOG_ABI } from "../../config/wagmi";
import { DiscordService } from "@backend/services/discord";
import ipfsService from "../../services/ipfs";
import { HybridQuestStorage } from "../../services/hybridQuestStorage";
import { OnlineUserStorage } from "../../services/onlineUserStorage";

interface ProfileData {
  nickname: string;
  profilePicture: string;
}

interface DiscordConnection {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
  };
  connectedAt: string;
}

const UserProfile: React.FC = () => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    nickname: "",
    profilePicture: "",
  });
  const [tempProfileData, setTempProfileData] = useState<ProfileData>({
    nickname: "",
    profilePicture: "",
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [showBadgeManagement, setShowBadgeManagement] = useState(false);
  const [discordConnection, setDiscordConnection] =
    useState<DiscordConnection | null>(null);
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [isBurningBadge, setIsBurningBadge] = useState(false);
  const [burningBadgeInfo, setBurningBadgeInfo] = useState<{
    badgeId: string;
    badgeName: string;
  } | null>(null);

  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });

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

  // Load profile data from localStorage on component mount and when address changes
  useEffect(() => {
    const loadProfileData = async () => {
      if (address) {
        const savedProfile = localStorage.getItem(
          `questlog_profile_${address}`
        );
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfileData(parsed);
        } else {
          // Reset profile data for new address
          setProfileData({ nickname: "", profilePicture: "" });
        }

        // Load user badges from cross-device storage
        try {
          const userBadges = await OnlineUserStorage.getUserBadges(
            address
          );
          setUserBadges(userBadges);
        } catch (error) {
          console.error("Failed to load badges:", error);
          setUserBadges([]);
        }

        // Load Discord connection
        const discordConn = DiscordService.getDiscordConnection(address);
        if (discordConn) {
          setDiscordConnection({
            user: discordConn.user,
            connectedAt: discordConn.connectedAt,
          });
        } else {
          // Reset Discord connection for new address
          setDiscordConnection(null);
        }
      } else {
        // Reset all data when no address
        setProfileData({ nickname: "", profilePicture: "" });
        setUserBadges([]);
        setDiscordConnection(null);
      }

      // Reset UI state when address changes
      setIsEditingProfile(false);
      setShowBadgeManagement(false);
      setTempProfileData({ nickname: "", profilePicture: "" });
    };

    loadProfileData();
  }, [address]);

  // Handle Discord OAuth callback
  useEffect(() => {
    const handleDiscordCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");

      // Handle OAuth error responses
      if (error) {
        console.error("Discord OAuth error:", error);
        // alert(`Discord authorization failed: ${error}`);
        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        return;
      }

      if (code && state === "discord_auth" && address) {
        setIsConnectingDiscord(true);
        console.log("Processing Discord OAuth callback...");

        try {
          console.log("Exchanging code for tokens...");
          const tokens = await DiscordService.exchangeCodeForToken(code);
          console.log("Token exchange successful, fetching user info...");

          const user = await DiscordService.getUser(tokens.access_token);
          console.log("User info fetched:", {
            id: user.id,
            username: user.username,
          });

          DiscordService.storeDiscordConnection(
            address,
            user,
            tokens.access_token,
            tokens.refresh_token
          );

          setDiscordConnection({
            user,
            connectedAt: new Date().toISOString(),
          });

          console.log("Discord connection successful!");

          // Show success message instead of error
          const successMessage = `Successfully connected Discord account: ${user.username}#${user.discriminator}`;
          console.log(successMessage);

          // Create a temporary success notification
          const notification = document.createElement("div");
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
          `;
          notification.textContent = "✅ " + successMessage;
          document.body.appendChild(notification);

          // Animate in
          setTimeout(() => {
            notification.style.transform = "translateX(0)";
          }, 10);

          // Remove notification after 4 seconds
          setTimeout(() => {
            notification.style.transform = "translateX(100%)";
            setTimeout(() => {
              if (notification.parentNode) {
                notification.remove();
              }
            }, 300);
          }, 4000);

          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } catch (error) {
          console.error("Discord connection failed:", error);

          // Check if connection was actually successful despite the error
          const existingConnection =
            DiscordService.getDiscordConnection(address);
          if (existingConnection) {
            console.log(
              "Connection exists despite error - OAuth was successful"
            );
            setDiscordConnection({
              user: existingConnection.user,
              connectedAt: existingConnection.connectedAt,
            });
            // Don't show error if connection actually exists
          } else {
            // Only show error if connection truly failed
            let errorMessage = "Failed to connect Discord. Please try again.";
            if (error instanceof Error) {
              errorMessage += ` Error: ${error.message}`;
            }
            // alert(errorMessage);
          }

          // Clean up URL regardless
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } finally {
          setIsConnectingDiscord(false);
        }
      }
    };

    handleDiscordCallback();
  }, [address]);

  // Listen for badge earned events
  useEffect(() => {
    const handleBadgeEarned = async () => {
      if (address) {
        try {
          const userBadges = await OnlineUserStorage.getUserBadges(
            address
          );
          setUserBadges(userBadges);
        } catch (error) {
          console.error("Failed to load badges after earning:", error);
        }
      }
    };

    const handleBadgeRemoved = async () => {
      if (address) {
        try {
          const userBadges = await OnlineUserStorage.getUserBadges(
            address
          );
          setUserBadges(userBadges);
        } catch (error) {
          console.error("Failed to load badges after removal:", error);
          setUserBadges([]);
        }
      }
    };

    window.addEventListener("badgeEarned", handleBadgeEarned);
    window.addEventListener("badgeRemoved", handleBadgeRemoved);

    return () => {
      window.removeEventListener("badgeEarned", handleBadgeEarned);
      window.removeEventListener("badgeRemoved", handleBadgeRemoved);
    };
  }, [address]);

  // Handle burn transaction completion
  useEffect(() => {
    if (isBurnSuccess && burningBadgeInfo && address) {
      console.log("Badge burn transaction successful!");

      // Remove the badge from localStorage
      try {
        const existingBadges = JSON.parse(
          localStorage.getItem(`questlog_badges_${address}`) || "[]"
        );
        const updatedBadges = existingBadges.filter(
          (badge: any) => badge.id !== burningBadgeInfo.badgeId
        );
        localStorage.setItem(
          `questlog_badges_${address}`,
          JSON.stringify(updatedBadges)
        );

        // Update local state
        setUserBadges(updatedBadges);

        // Dispatch event for other components to update
        window.dispatchEvent(
          new CustomEvent("badgeRemoved", {
            detail: { badgeId: burningBadgeInfo.badgeId },
          })
        );

        alert(
          `🔥 Badge "${burningBadgeInfo.badgeName}" has been permanently burned from the blockchain!`
        );
      } catch (error) {
        console.error("Failed to update local storage after burn:", error);
      }

      // Reset burn state
      setIsBurningBadge(false);
      setBurningBadgeInfo(null);
    } else if (isBurnError && burningBadgeInfo) {
      console.error("Badge burn transaction failed:", burnError);
      alert(`Failed to burn badge: ${burnError?.message || "Unknown error"}`);

      // Reset burn state
      setIsBurningBadge(false);
      setBurningBadgeInfo(null);
    }
  }, [isBurnSuccess, isBurnError, burnError, burningBadgeInfo, address]);

  const saveProfileData = (data: ProfileData) => {
    if (address) {
      localStorage.setItem(`questlog_profile_${address}`, JSON.stringify(data));
      setProfileData(data);
    }
  };

  const handleEditProfile = () => {
    setTempProfileData({ ...profileData });
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setTempProfileData({ nickname: "", profilePicture: "" });
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      saveProfileData(tempProfileData);
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectDiscord = () => {
    if (!address) return;

    const authUrl = DiscordService.getAuthorizationUrl();
    // Add state parameter to verify the callback
    const urlWithState = `${authUrl}&state=discord_auth`;
    window.location.href = urlWithState;
  };

  const handleDisconnectDiscord = () => {
    if (!address) return;

    if (
      window.confirm(
        "Are you sure you want to disconnect your Discord account? This will prevent verification of Discord-based quest requirements."
      )
    ) {
      DiscordService.removeDiscordConnection(address);
      setDiscordConnection(null);
    }
  };

  const handleDeleteBadge = (badgeId: string, badgeName: string) => {
    if (!address) return;

    // Find the badge to get its tokenId
    const badge = userBadges.find((b) => b.id === badgeId);
    if (!badge) {
      alert("Badge not found!");
      return;
    }

    // Show options for badge deletion vs burning
    const options = [
      "Remove from app display only (keeps NFT on blockchain)",
      "Permanently burn NFT from blockchain (irreversible)",
      "Cancel",
    ];

    const choice = window.prompt(
      `Choose how to handle the "${badgeName}" badge:\n\n` +
        `1. ${options[0]}\n` +
        `2. ${options[1]}\n` +
        `3. ${options[2]}\n\n` +
        `Enter 1, 2, or 3:`
    );

    if (choice === "1") {
      // Remove from localStorage only
      removeFromLocalStorage(badgeId, badgeName);
    } else if (choice === "2") {
      // Burn from blockchain
      handleBurnBadge(badge, badgeName);
    }
    // choice === "3" or null/undefined = cancel, do nothing
  };

  const removeFromLocalStorage = (badgeId: string, badgeName: string) => {
    try {
      const existingBadges = JSON.parse(
        localStorage.getItem(`questlog_badges_${address}`) || "[]"
      );
      const updatedBadges = existingBadges.filter(
        (badge: any) => badge.id !== badgeId
      );
      localStorage.setItem(
        `questlog_badges_${address}`,
        JSON.stringify(updatedBadges)
      );

      // Update local state
      setUserBadges(updatedBadges);

      // Dispatch event for other components to update
      window.dispatchEvent(
        new CustomEvent("badgeRemoved", { detail: { badgeId } })
      );

      alert(`Badge "${badgeName}" has been removed from the app display!`);
    } catch (error) {
      console.error("Failed to remove badge from display:", error);
      alert("Failed to remove badge from display. Please try again.");
    }
  };

  const handleBurnBadge = async (badge: any, badgeName: string) => {
    if (!address) {
      alert("Cannot burn badge: no wallet connected");
      return;
    }

    // Check if we have a tokenId for this badge
    if (!badge.tokenId) {
      // Show instructions for manual burning
      const manualBurn = window.confirm(
        `⚠️ Token ID Missing\n\n` +
          `This badge was created before token ID tracking was implemented.\n\n` +
          `To burn this badge:\n` +
          `1. Visit the blockchain explorer\n` +
          `2. Find your NFT token ID\n` +
          `3. Use the contract's burn function\n\n` +
          `Would you like to visit the blockchain explorer now?`
      );

      if (manualBurn) {
        window.open(
          `https://sepolia-blockscout.lisk.com/address/${QUESTLOG_CONTRACT_ADDRESS}`,
          "_blank"
        );
      }
      return;
    }

    const confirmBurn = window.confirm(
      `⚠️ PERMANENT ACTION WARNING ⚠️\n\n` +
        `You are about to permanently burn "${badgeName}" from the blockchain.\n\n` +
        `This action is IRREVERSIBLE and will:\n` +
        `• Permanently destroy the NFT (Token ID: ${badge.tokenId})\n` +
        `• Remove it from your wallet\n` +
        `• Make the quest completable again\n\n` +
        `Are you absolutely sure you want to proceed?`
    );

    if (!confirmBurn) return;

    try {
      setIsBurningBadge(true);

      // Call the burn function on the contract
      await writeContract({
        address: QUESTLOG_CONTRACT_ADDRESS,
        abi: QUESTLOG_ABI,
        functionName: "burn",
        args: [BigInt(badge.tokenId)],
      });

      // The transaction success will be handled by the useEffect watching for transaction completion
      setBurningBadgeInfo({ badgeId: badge.id, badgeName });
    } catch (error) {
      console.error("Failed to burn badge:", error);
      setIsBurningBadge(false);
      alert(
        `Failed to burn badge: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload to IPFS
      const result = await ipfsService.uploadFile(file);

      if (!result.success || !result.url) {
        throw new Error(result.error || "Upload failed");
      }

      setTempProfileData((prev) => ({
        ...prev,
        profilePicture: result.url || "",
      }));
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      alert("Failed to upload image to IPFS. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCopyProfileLink = async () => {
    if (!address) return;

    setIsCopying(true);
    try {
      const profileUrl = `${window.location.origin}/profile/${address}`;
      await navigator.clipboard.writeText(profileUrl);

      // Show success feedback
      const button = document.getElementById("copy-profile-btn");
      if (button) {
        const originalText = button.textContent;
        button.textContent = "✓ Copied!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to copy profile link:", error);
      alert("Failed to copy link. Please try again.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleShareOnTwitter = () => {
    if (!address) return;

    const profileUrl = `${window.location.origin}/profile/${address}`;
    const displayName = getDisplayName();
    const badgeCount = userStats.totalBadges;
    const level = userStats.level;

    const tweetText = encodeURIComponent(
      `🎮 Check out my Web3 achievements on @Questlog!\n\n` +
        `👤 ${displayName}\n` +
        `🏆 ${badgeCount} Badge${badgeCount !== 1 ? "s" : ""} Earned\n` +
        `⭐ Level ${level}\n\n` +
        `Start your Web3 journey: ${profileUrl}\n\n` +
        `#Web3 #Gaming #Achievements #NFT #Blockchain`
    );

    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getDisplayName = () => {
    if (profileData.nickname) return profileData.nickname;
    if (ensName) return ensName;
    return address ? formatAddress(address) : "Unknown";
  };

  const getProfilePicture = () => {
    if (profileData.profilePicture) return profileData.profilePicture;
    return null;
  };

  // Mock user stats - in production, this would come from analyzing on-chain data
  const userStats = {
    totalBadges: userBadges.length,
    questsCompleted: userBadges.length,
    totalXP: userBadges.reduce((total, badge) => {
      const xp =
        badge.rarity === "common"
          ? 100
          : badge.rarity === "rare"
          ? 250
          : badge.rarity === "epic"
          ? 500
          : 1000;
      return total + xp;
    }, 0),
    joinDate: new Date(),
    level:
      Math.floor(
        userBadges.reduce((total, badge) => {
          const xp =
            badge.rarity === "common"
              ? 100
              : badge.rarity === "rare"
              ? 250
              : badge.rarity === "epic"
              ? 500
              : 1000;
          return total + xp;
        }, 0) / 500
      ) + 1,
    nextLevelXP: 500,
    currentXP:
      userBadges.reduce((total, badge) => {
        const xp =
          badge.rarity === "common"
            ? 100
            : badge.rarity === "rare"
            ? 250
            : badge.rarity === "epic"
            ? 500
            : 1000;
        return total + xp;
      }, 0) % 500,
  };

  const achievements = userBadges.slice(0, 3).map((badge) => ({
    name: badge.name,
    description: badge.description,
    rarity: badge.rarity,
    icon: Trophy,
  }));

  const recentActivity = userBadges
    .slice(-5)
    .reverse()
    .map((badge) => ({
      type: "badge_earned",
      description: `Earned ${badge.name} badge`,
      timestamp: new Date(badge.earnedAt).toLocaleDateString(),
    }));

  if (!address) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-400 text-lg">
          Connect your wallet to view your profile
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Your Profile</h1>
        <p className="text-gray-400 text-lg">
          📊 Track your achievements and progress across the Web3 ecosystem
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <div className="quest-card">
            {/* Avatar */}
            <div className="text-center mb-6">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {getProfilePicture() ? (
                  <img
                    src={getProfilePicture()!}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {getDisplayName()[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {getDisplayName()}
              </h2>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <span className="font-mono">
                  {profileData.nickname
                    ? formatAddress(address)
                    : ensName || formatAddress(address)}
                </span>
                <button
                  onClick={copyAddress}
                  className="hover:text-purple-400 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://sepolia-blockscout.lisk.com/address/${address}`,
                      "_blank"
                    )
                  }
                  className="hover:text-purple-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={handleEditProfile}
                  className="hover:text-purple-400 transition-colors"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Level Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">
                  Level {userStats.level}
                </span>
                <span className="text-sm text-gray-400">
                  {userStats.currentXP}/
                  {userStats.nextLevelXP - (userStats.level - 1) * 500} XP
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (userStats.currentXP /
                        (userStats.nextLevelXP - (userStats.level - 1) * 500)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {userStats.totalBadges}
                </div>
                <div className="text-sm text-gray-400">Badges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {userStats.questsCompleted}
                </div>
                <div className="text-sm text-gray-400">Quests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {userStats.totalXP}
                </div>
                <div className="text-sm text-gray-400">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {userStats.level}
                </div>
                <div className="text-sm text-gray-400">Level</div>
              </div>
            </div>

            {/* Join Date */}
            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  Member since {userStats.joinDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Discord Connection */}
          <div className="quest-card mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <span>Discord Connection</span>
              </h3>
            </div>

            {discordConnection ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    {discordConnection.user.avatar ? (
                      <img
                        src={`https://cdn.discordapp.com/avatars/${discordConnection.user.id}/${discordConnection.user.avatar}.png`}
                        alt="Discord Avatar"
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {discordConnection.user.username}#
                      {discordConnection.user.discriminator}
                    </div>
                    <div className="text-sm text-green-400">Connected</div>
                  </div>
                  <button
                    onClick={handleDisconnectDiscord}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Disconnect Discord"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-400">
                  Your Discord account is connected and can be used to verify
                  quest requirements.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h4 className="text-white font-medium mb-2">
                    Connect Discord
                  </h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Connect your Discord account to automatically verify
                    Discord-based quest requirements.
                  </p>
                  <button
                    onClick={handleConnectDiscord}
                    disabled={isConnectingDiscord}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 mx-auto ${
                      isConnectingDiscord
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25"
                    }`}
                  >
                    <Link className="w-4 h-4" />
                    <span>
                      {isConnectingDiscord
                        ? "Connecting..."
                        : "Connect Discord"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Featured Achievements */}
          <div className="quest-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span>Featured Achievements</span>
              </h3>
              {/*userBadges.length > 0 && (
                <button
                  onClick={() => setShowBadgeManagement(!showBadgeManagement)}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1"
                >
                  <Shield className="w-4 h-4" />
                  <span>Manage Badges</span>
                </button>
              )}*/}
            </div>

            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => {
                  const badge = userBadges[index];
                  return (
                    <div
                      key={index}
                      className="bg-gray-800/50 rounded-lg p-4 text-center relative group"
                    >
                      {showBadgeManagement && (
                        <button
                          onClick={() =>
                            handleDeleteBadge(badge.id, badge.name)
                          }
                          disabled={isBurningBadge || isBurnPending}
                          className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                            isBurningBadge || isBurnPending
                              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-500 text-white"
                          }`}
                          title={
                            isBurningBadge || isBurnPending
                              ? "Processing..."
                              : "Delete Badge"
                          }
                        >
                          {isBurningBadge || isBurnPending ? (
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      )}

                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-3">
                        <achievement.icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-medium text-white mb-1">
                        {achievement.name}
                      </h4>
                      <p className="text-xs text-gray-400 mb-2">
                        {achievement.description}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          achievement.rarity === "legendary"
                            ? "text-yellow-400 bg-yellow-400/10"
                            : achievement.rarity === "rare"
                            ? "text-blue-400 bg-blue-400/10"
                            : "text-gray-400 bg-gray-400/10"
                        }`}
                      >
                        {achievement.rarity}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400">No achievements yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Complete quests to earn your first achievements
                </p>
              </div>
            )}
          </div>

          {/* Badge Management Section */}
          {showBadgeManagement && userBadges.length > 0 && (
            <div className="quest-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span>Badge Management</span>
                </h3>
                <span className="text-sm text-gray-400">
                  {userBadges.length} Badge{userBadges.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-400 mt-0.5">⚠️</div>
                  <div>
                    <p className="text-yellow-400 font-medium text-sm">
                      Badge Management Information
                    </p>
                    <p className="text-yellow-300/80 text-sm">
                      • <strong>Remove from app</strong>: Hides badge locally,
                      keeps NFT on blockchain
                      <br />• <strong>Burn from blockchain</strong>: Permanently
                      destroys NFT (allows quest re-completion)
                      <br />• Badges without Token ID require manual burning via
                      blockchain explorer
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm mb-1">
                          {badge.name}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {badge.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteBadge(badge.id, badge.name)}
                        disabled={isBurningBadge || isBurnPending}
                        className={`ml-2 p-1.5 rounded-lg transition-colors ${
                          isBurningBadge || isBurnPending
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-500 text-white"
                        }`}
                        title={
                          isBurningBadge || isBurnPending
                            ? "Processing..."
                            : "Delete Badge"
                        }
                      >
                        {isBurningBadge || isBurnPending ? (
                          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`px-2 py-1 rounded-full font-medium ${
                          badge.rarity === "legendary"
                            ? "text-yellow-400 bg-yellow-400/10"
                            : badge.rarity === "epic"
                            ? "text-purple-400 bg-purple-400/10"
                            : badge.rarity === "rare"
                            ? "text-blue-400 bg-blue-400/10"
                            : "text-gray-400 bg-gray-400/10"
                        }`}
                      >
                        {badge.rarity}
                      </span>
                      <div className="text-right">
                        <div className="text-gray-500">
                          {new Date(badge.earnedAt).toLocaleDateString()}
                        </div>
                        {badge.tokenId && (
                          <div className="text-gray-600 text-xs">
                            Token ID:{" "}
                            {badge.tokenId.length > 10
                              ? `${badge.tokenId.slice(0, 6)}...`
                              : badge.tokenId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="quest-card">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span>Recent Activity</span>
            </h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "badge_earned"
                          ? "bg-purple-400"
                          : activity.type === "quest_completed"
                          ? "bg-green-400"
                          : "bg-blue-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        {activity.description}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400">No recent activity</p>
                <p className="text-gray-500 text-sm mt-2">
                  Start completing quests to see your activity here
                </p>
              </div>
            )}
          </div>

          {/* Share Profile */}
          <div className="quest-card text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Share Your Profile
            </h3>
            <p className="text-gray-400 mb-6">
              Show off your Web3 achievements to the world
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                id="copy-profile-btn"
                onClick={handleCopyProfileLink}
                disabled={isCopying}
                className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isCopying ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                <Copy className="w-4 h-4" />
                <span>{isCopying ? "Copying..." : "Copy Profile Link"}</span>
              </button>
              <button
                onClick={handleShareOnTwitter}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Share on Twitter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ marginTop: 0 }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Edit Profile</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {tempProfileData.profilePicture ? (
                      <img
                        src={tempProfileData.profilePicture}
                        alt="Profile preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-picture-upload"
                      disabled={isUploadingImage}
                    />
                    <label
                      htmlFor="profile-picture-upload"
                      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                        isUploadingImage
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-500 text-white"
                      }`}
                    >
                      {isUploadingImage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          <span>Upload</span>
                        </>
                      )}
                    </label>
                    {tempProfileData.profilePicture && (
                      <button
                        onClick={() =>
                          setTempProfileData((prev) => ({
                            ...prev,
                            profilePicture: "",
                          }))
                        }
                        className="ml-2 text-red-400 hover:text-red-300 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nickname (Optional)
                </label>
                <input
                  type="text"
                  value={tempProfileData.nickname}
                  onChange={(e) =>
                    setTempProfileData((prev) => ({
                      ...prev,
                      nickname: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter your nickname..."
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be displayed instead of your wallet address
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mt-8">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                  isSaving
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
