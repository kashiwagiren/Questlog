import React from "react";
import {
  Calendar,
  Trophy,
  Clock,
  Star,
  CheckCircle,
  Loader2,
  Eye,
  Trash2,
  ExternalLink,
  UserPlus,
  UserMinus,
  Lock,
} from "lucide-react";
import { Quest } from "@backend/types/quest";
import IPFSService from "../../services/ipfs";

interface QuestCardProps {
  quest: Quest;
  onComplete: (quest: Quest) => void;
  onReset: (quest: Quest) => void;
  onDelete: (quest: Quest) => void;
  onJoin: (quest: Quest) => void;
  onLeave: (quest: Quest) => void;
  onViewProgress: (quest: Quest) => void;
  isCompleting: boolean;
  isJoining?: boolean;
  isLeaving?: boolean;
  currentUserAddress?: string;
  isJoined?: boolean;
  requirementsCompleted?: boolean;
  eventStatus?: {
    status: "upcoming" | "active" | "ended";
    timeLeft?: string;
    message?: string;
  };
}

const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onComplete,
  onReset,
  onDelete,
  onJoin,
  onLeave,
  onViewProgress,
  isCompleting,
  isJoining = false,
  isLeaving = false,
  currentUserAddress,
  isJoined = false,
  requirementsCompleted = false,
  eventStatus,
}) => {
  const isCreator =
    currentUserAddress &&
    quest.creatorAddress &&
    currentUserAddress.toLowerCase() === quest.creatorAddress.toLowerCase();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-400 bg-green-400/10";
      case "medium":
        return "text-yellow-400 bg-yellow-400/10";
      case "hard":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "social":
        return "text-blue-400 bg-blue-400/10";
      case "gaming":
        return "text-purple-400 bg-purple-400/10";
      case "defi":
        return "text-green-400 bg-green-400/10";
      case "nft":
        return "text-pink-400 bg-pink-400/10";
      case "community":
        return "text-orange-400 bg-orange-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  return (
    <div className="quest-card group">
      {/* Badge Preview */}
      <div className="relative mb-3 sm:mb-4 overflow-hidden rounded-lg">
        <img
          src={IPFSService.getDisplayUrl(quest.badgeImage)}
          alt={quest.reward}
          className="w-full h-40 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />

        {/* Quest Status */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col items-end space-y-1">
          {quest.isCompleted ? (
            <div className="flex items-center space-x-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              <span>Completed</span>
            </div>
          ) : eventStatus?.status === "ended" ? (
            <div className="flex items-center space-x-1 bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium">
              <Clock className="w-3 h-3" />
              <span>Event Ended</span>
            </div>
          ) : eventStatus?.status === "upcoming" ? (
            <div className="flex items-center space-x-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
              <Clock className="w-3 h-3" />
              <span>Upcoming</span>
            </div>
          ) : eventStatus?.status === "active" && eventStatus?.timeLeft ? (
            <div className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
              <Clock className="w-3 h-3" />
              <span>{eventStatus.timeLeft}</span>
            </div>
          ) : (
            <div className="bg-gray-900/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-gray-300">
              Available
            </div>
          )}

          {/* Visibility Indicator */}
          {quest.visibility === "invite-only" && (
            <div className="flex items-center space-x-1 bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
              <Lock className="w-3 h-3" />
              <span>Invite Only</span>
            </div>
          )}
        </div>

        {/* Difficulty Badge */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(
              quest.difficulty
            )}`}
          >
            {quest.difficulty}
          </span>
        </div>
      </div>

      {/* Quest Info */}
      <div className="space-y-4">
        {/* Title & Category */}
        <div>
          <div className="flex items-start justify-between mb-2 gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-purple-300 transition-colors leading-tight">
              {quest.title}
            </h3>
            <span
              className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${getCategoryColor(
                quest.category
              )} whitespace-nowrap`}
            >
              {quest.category}
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            {quest.description}
          </p>
        </div>

        {/* Quest Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-2 text-gray-300">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span>{quest.xpReward} XP</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-300">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{quest.timeEstimate}</span>
          </div>
        </div>

        {/* Event Quest Status */}
        {eventStatus && quest.visibility === "event" && eventStatus.message && (
          <div
            className={`border rounded-lg p-2.5 sm:p-3 text-center ${
              eventStatus.status === "ended"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : eventStatus.status === "upcoming"
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">
                {eventStatus.message}
              </span>
            </div>
          </div>
        )}

        {/* Reward */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-2.5 sm:p-3">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-xs sm:text-sm font-medium text-white">
              {quest.reward}
            </span>
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-medium text-gray-300">
            Requirements:
          </h4>
          <ul className="space-y-1">
            {quest.requirements.map((req, index) => (
              <li key={index} className="text-xs text-gray-400 space-y-1">
                <div className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-gray-500 rounded-full mt-2" />
                  <span className="leading-tight">{req.description}</span>
                </div>
                {req.type === "discord_join" &&
                  (req.config as any).inviteLink && (
                    <div className="ml-3">
                      <a
                        href={(req.config as any).inviteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-2 h-2" />
                        <span>Join Server</span>
                      </a>
                    </div>
                  )}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            if (isCreator) return; // Quest creator can't interact with their own quest
            if (eventStatus?.status === "ended") return; // Ended event quests can't be interacted with
            if (!isJoined) {
              onJoin(quest);
            } else if (quest.isCompleted) {
              return; // Completed quests can't be interacted with
            } else {
              onViewProgress(quest);
            }
          }}
          disabled={isCreator || isJoining || eventStatus?.status === "ended"}
          className={`w-full py-2.5 sm:py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base ${
            isCreator
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : eventStatus?.status === "ended"
              ? "bg-red-600/50 text-red-300 cursor-not-allowed"
              : quest.isCompleted
              ? "bg-green-600/50 text-green-300 cursor-not-allowed"
              : isJoining
              ? "bg-purple-600/50 text-white cursor-not-allowed"
              : !isJoined
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-blue-500/25 transform hover:scale-[1.02]"
              : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02]"
          }`}
        >
          {isJoining ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Joining Quest...</span>
            </>
          ) : isCreator ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Quest Creator</span>
            </>
          ) : eventStatus?.status === "ended" ? (
            <>
              <Clock className="w-4 h-4" />
              <span>Event Ended</span>
            </>
          ) : quest.isCompleted ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Completed</span>
            </>
          ) : !isJoined ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Join Quest</span>
            </>
          ) : (
            <>
              <Eye
                className={`w-4 h-4 ${
                  requirementsCompleted ? "text-green-400" : ""
                }`}
              />
              <span className={requirementsCompleted ? "text-green-400" : ""}>
                {requirementsCompleted ? "Requirements Done ✓" : "View Quest"}
              </span>
            </>
          )}
        </button>

        {/* Complete Quest Button - Only for joined users who haven't completed */}
        {isJoined &&
          !quest.isCompleted &&
          !isCreator &&
          eventStatus?.status !== "ended" && (
            <button
              onClick={() => onComplete(quest)}
              disabled={isCompleting}
              className={`w-full mt-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm ${
                isCompleting
                  ? "bg-purple-600/50 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/25 transform hover:scale-[1.02]"
              }`}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Minting NFT Badge...</span>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  <span>Complete Quest</span>
                </>
              )}
            </button>
          )}

        {/* Reset Button (for quest creators) */}
        {isCreator && quest.isCompleted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReset?.(quest);
            }}
            className="w-full mt-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600"
          >
            <span>Reset Quest</span>
          </button>
        )}
      </div>

      {/* Delete/Leave Button */}
      {isCreator ? (
        // Quest creator can delete their quest
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(quest);
          }}
          className="w-full mt-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm bg-red-800 hover:bg-red-700 text-red-300 hover:text-white border border-red-600"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Quest</span>
        </button>
      ) : isJoined && !quest.isCompleted ? (
        // Joined users can leave the quest (but not if completed)
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLeave(quest);
          }}
          disabled={isLeaving}
          className={`w-full mt-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm ${
            isLeaving
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-orange-800 hover:bg-orange-700 text-orange-300 hover:text-white border border-orange-600"
          }`}
        >
          {isLeaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Leaving...</span>
            </>
          ) : (
            <>
              <UserMinus className="w-4 h-4" />
              <span>Leave Quest</span>
            </>
          )}
        </button>
      ) : null}
    </div>
  );
};

export default QuestCard;
