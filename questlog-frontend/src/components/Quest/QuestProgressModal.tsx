import React, { useState } from "react";
import {
  X,
  CheckCircle,
  Clock,
  Trophy,
  Star,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Quest } from "@backend/types/quest";
import { DiscordService } from "@backend/services/discord";
import { useAccount } from "wagmi";
import IPFSService from "../../services/ipfs";
import {
  useNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from "../UI/NotificationSystem";

interface QuestProgressModalProps {
  quest: Quest;
  isOpen: boolean;
  onClose: () => void;
  progress?: {
    completedRequirements: number;
    completedRequirementIndexes?: number[];
    totalRequirements: number;
    joinedAt: Date;
    notes?: string;
  };
  onMarkRequirementCompleted?: (requirementIndex: number) => void;
}

const QuestProgressModal: React.FC<QuestProgressModalProps> = ({
  quest,
  isOpen,
  onClose,
  progress,
  onMarkRequirementCompleted,
}) => {
  const { address } = useAccount();
  const { addNotification } = useNotification();
  const [verifyingRequirements, setVerifyingRequirements] = useState<
    Set<number>
  >(new Set());

  // Notification helper functions
  const notify = {
    success: showSuccess(addNotification),
    error: showError(addNotification),
    warning: showWarning(addNotification),
    info: showInfo(addNotification),
  };

  if (!isOpen) return null;

  const progressPercentage = progress
    ? (progress.completedRequirements / progress.totalRequirements) * 100
    : 0;

  const handleVerifyAndComplete = async (
    requirementIndex: number,
    requirement: any
  ) => {
    if (!address || !onMarkRequirementCompleted) return;

    // For Discord requirements, verify membership first
    if (requirement.type === "discord_join") {
      setVerifyingRequirements((prev) => new Set(prev).add(requirementIndex));

      try {
        // Check if user has Discord connected
        const discordConnection = DiscordService.getDiscordConnection(address);
        if (!discordConnection) {
          notify.warning(
            "Discord Account Required",
            "Please connect your Discord account in your profile first to verify this requirement.",
            8000
          );
          return;
        }

        // Verify Discord membership
        const verification = await DiscordService.verifyDiscordRequirement(
          discordConnection.user.id,
          requirement.config,
          discordConnection.accessToken // Pass the access token for fallback verification
        );

        if (!verification.verified) {
          // Show detailed error and server info for debugging
          const errorMessage =
            verification.error ||
            "Could not verify Discord membership. Please make sure you have joined the server.";

          // If we have Discord connection, show debug info
          console.log("Debug: Discord Connection Info:", {
            userId: discordConnection.user.id,
            username: discordConnection.user.username,
            requirement: requirement.config,
          });

          // Try to get user's guilds for debugging
          try {
            const userGuilds = await DiscordService.getUserGuilds(
              discordConnection.accessToken
            );
            console.log(
              "Debug: User Guilds:",
              userGuilds.map((g) => ({ id: g.id, name: g.name }))
            );

            const confirmMessage = `${errorMessage}\n\nDebug Info:\nYour Discord ID: ${
              discordConnection.user.id
            }\nRequired Server ID: ${
              requirement.config.serverId || "Not set"
            }\n\nYour Discord Servers:\n${userGuilds
              .map((g) => `${g.name} (ID: ${g.id})`)
              .join(
                "\n"
              )}\n\nPlease check if the Server ID in the quest matches one of your servers.`;
            notify.warning(
              "Discord Verification Failed",
              confirmMessage,
              15000
            );
          } catch (debugError) {
            notify.error("Discord Verification Failed", errorMessage, 10000);
          }
          return;
        }

        // If verification passed, mark as completed
        onMarkRequirementCompleted(requirementIndex);
      } catch (error) {
        console.error("Verification failed:", error);
        notify.error(
          "Verification Failed",
          "Verification failed. Please try again later.",
          8000
        );
      } finally {
        setVerifyingRequirements((prev) => {
          const newSet = new Set(prev);
          newSet.delete(requirementIndex);
          return newSet;
        });
      }
    } else {
      // For other requirement types, just mark as completed
      onMarkRequirementCompleted(requirementIndex);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      style={{ marginTop: "0px" }}
    >
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Quest Progress</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Quest Info */}
        <div className="p-6 space-y-6">
          <div className="flex items-start space-x-4">
            <img
              src={IPFSService.getDisplayUrl(quest.badgeImage)}
              alt={quest.reward}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                {quest.title}
              </h3>
              <p className="text-gray-400 text-sm">{quest.description}</p>
              <div className="flex items-center space-x-4 mt-3">
                <span className="inline-flex items-center space-x-1 text-xs text-purple-400">
                  <Trophy className="w-3 h-3" />
                  <span>{quest.xpReward} XP</span>
                </span>
                <span className="inline-flex items-center space-x-1 text-xs text-blue-400">
                  <Clock className="w-3 h-3" />
                  <span>{quest.timeEstimate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Progress
                </span>
                <span className="text-sm text-gray-400">
                  {progress.completedRequirements} of{" "}
                  {progress.totalRequirements} completed
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                Joined: {progress.joinedAt.toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Reward */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Reward</span>
            </div>
            <p className="text-gray-300">{quest.reward}</p>
          </div>

          {/* Requirements */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Requirements:</h4>
            <ul className="space-y-2">
              {quest.requirements.map((req, index) => {
                // Check if this specific requirement index is completed
                const isCompleted =
                  progress && progress.completedRequirementIndexes
                    ? progress.completedRequirementIndexes.includes(index)
                    : progress
                    ? index < progress.completedRequirements
                    : false;
                return (
                  <li
                    key={index}
                    className={`p-3 rounded-lg ${
                      isCompleted
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-gray-800/50 border border-gray-700"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-500 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <span
                          className={`text-sm ${
                            isCompleted ? "text-green-300" : "text-gray-400"
                          }`}
                        >
                          {req.description}
                        </span>

                        {/* Show type-specific verification options */}
                        {req.type === "discord_join" &&
                          (req.config as any).inviteLink && (
                            <div className="space-y-2">
                              <a
                                href={(req.config as any).inviteLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Join Discord Server</span>
                              </a>
                              {!isCompleted && onMarkRequirementCompleted && (
                                <button
                                  onClick={() =>
                                    handleVerifyAndComplete(index, req)
                                  }
                                  disabled={verifyingRequirements.has(index)}
                                  className={`block text-xs px-3 py-1 rounded transition-colors flex items-center space-x-1 ${
                                    verifyingRequirements.has(index)
                                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                      : "bg-blue-600 hover:bg-blue-500 text-white"
                                  }`}
                                >
                                  {verifyingRequirements.has(index) && (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  )}
                                  <span>
                                    {verifyingRequirements.has(index)
                                      ? "Verifying..."
                                      : "Verify & Complete"}
                                  </span>
                                </button>
                              )}
                            </div>
                          )}

                        {req.type === "manual" && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">
                              This requirement needs manual verification by the
                              quest creator.
                            </div>
                            {!isCompleted && onMarkRequirementCompleted && (
                              <button
                                onClick={() =>
                                  handleVerifyAndComplete(index, req)
                                }
                                className="block text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded transition-colors"
                              >
                                Mark as Completed
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Notes */}
          {progress?.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Notes:</h4>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-400">{progress.notes}</p>
              </div>
            </div>
          )}

          {/* Quest Status */}
          <div className="flex items-center justify-center p-4 border-t border-gray-700">
            {quest.isCompleted ? (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Quest Completed!</span>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Complete all requirements to earn your badge
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestProgressModal;
