import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  Trophy,
  Users,
  Zap,
  Target,
  Award,
  ChevronDown,
  Star,
  Crown,
  Gem,
} from "lucide-react";

interface HeroProps {
  setActiveTab?: (tab: string) => void;
}

const Hero: React.FC<HeroProps> = ({ setActiveTab }) => {
  const { isConnected } = useAccount();

  const scrollToHowItWorks = () => {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const featuredBadges = [
    {
      name: "Discord Pioneer",
      rarity: "common",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      description: "First to join our Discord",
    },
    {
      name: "NFT Collector",
      rarity: "rare",
      icon: Gem,
      color: "from-purple-500 to-purple-600",
      description: "Minted 10+ NFTs",
    },
    {
      name: "DeFi Master",
      rarity: "epic",
      icon: Star,
      color: "from-yellow-500 to-orange-500",
      description: "Completed advanced DeFi quests",
    },
    {
      name: "Legendary Founder",
      rarity: "legendary",
      icon: Crown,
      color: "from-pink-500 to-red-500",
      description: "Early platform supporter",
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-400";
      case "rare":
        return "text-blue-400";
      case "epic":
        return "text-purple-400";
      case "legendary":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="pt-20 pb-16 min-h-screen flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center py-12 sm:py-16 lg:py-20 flex-1 flex flex-col justify-center">
          <div className="relative inline-block mb-8">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-retro leading-none mb-4 tracking-wider">
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent animate-pulse-neon">
                Questlog
              </span>
            </h1>
          </div>

          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 mb-6 max-w-4xl mx-auto font-semibold font-retro tracking-wide px-4">
            Track your Web3 Achievements with Soulbound Badges!
          </p>

          <p className="text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed px-4">
            🎮 Complete fun challenges • 🏆 Earn permanent NFT badges • 🔗 Build
            your on-chain reputation
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16 lg:mb-20 px-4">
            {isConnected ? (
              <button
                onClick={() => setActiveTab?.("quests")}
                className="retro-button text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold font-retro text-base sm:text-lg transition-all duration-300 shadow-neon transform hover:scale-105 hover:shadow-neon-pink uppercase tracking-wider relative overflow-hidden group w-full sm:w-auto"
              >
                <span className="flex items-center space-x-3 relative z-10">
                  <Target className="w-5 h-5" />
                  <span>View Quests</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="retro-button text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold font-retro text-base sm:text-lg transition-all duration-300 shadow-neon transform hover:scale-105 hover:shadow-neon-pink uppercase tracking-wider relative overflow-hidden group w-full sm:w-auto"
                  >
                    <span className="flex items-center space-x-3 relative z-10">
                      <Zap className="w-5 h-5" />
                      <span>Get Started</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                )}
              </ConnectButton.Custom>
            )}

            <div className="flex items-center space-x-2 text-gray-400 bg-gray-800/30 px-3 sm:px-4 py-2 rounded-lg border border-gray-700/50 text-sm sm:text-base">
              <Award className="w-4 h-4 text-green-400" />
              <span className="font-mono">Live on Lisk Sepolia</span>
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="text-center pb-6 sm:pb-8">
          <button
            onClick={scrollToHowItWorks}
            className="animate-bounce text-gray-400 hover:text-purple-400 transition-colors group"
          >
            <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 mx-auto group-hover:scale-110 transition-transform" />
            <span className="block text-xs sm:text-sm mt-2 font-medium">
              Learn How It Works
            </span>
          </button>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="bg-gray-900/50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-retro text-white mb-6 tracking-wide">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-purple-300 mb-6 sm:mb-8 font-medium">
              Simple steps to start earning badges
            </p>
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 text-base sm:text-lg text-gray-300 leading-relaxed">
              <p>
                🔗 <strong>Connect your wallet</strong> and explore exciting
                challenges on the Quest Board. Each quest shows clear
                instructions, difficulty levels, and badge previews.
              </p>
              <p>
                ✅ <strong>Complete tasks</strong> (on-chain or off-chain) and
                get automatically verified to earn your soulbound badge -
                permanently stored on-chain as proof of achievement.
              </p>
              <p>
                🏆 <strong>Build your reputation</strong> as badges appear in
                your profile and may unlock special rewards or perks in the
                ecosystem.
              </p>
            </div>
          </div>

          {/* Featured Badges */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <h3 className="text-xl sm:text-2xl font-bold font-retro text-white text-center mb-8 sm:mb-12 tracking-wide">
              Featured Badges
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredBadges.map((badge, index) => (
                <div key={index} className="quest-card group text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <badge.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div
                      className={`absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br ${badge.color} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}
                    ></div>
                  </div>
                  <h4 className="font-semibold font-retro text-white mb-2 tracking-wide text-sm sm:text-base">
                    {badge.name}
                  </h4>
                  <p className="text-sm text-gray-400 mb-3">
                    {badge.description}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${getRarityColor(
                      badge.rarity
                    )} bg-gray-800/50 border border-gray-700`}
                  >
                    {badge.rarity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="quest-card text-center group">
              <div className="relative mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold font-retro text-gray-100 mb-3 tracking-wide">
                1. Browse Quests
              </h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Explore available challenges with clear descriptions, difficulty
                levels, and badge previews
              </p>
            </div>

            <div className="quest-card text-center group">
              <div className="relative mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-green-600 to-blue-600 rounded-xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold font-retro text-gray-100 mb-3 tracking-wide">
                2. Complete Tasks
              </h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Follow instructions to complete on-chain or off-chain activities
                and get verified
              </p>
            </div>

            <div className="quest-card text-center group">
              <div className="relative mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold font-retro text-gray-100 mb-3 tracking-wide">
                3. Earn Badges
              </h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Receive permanent soulbound NFT badges stored on-chain as proof
                of your achievements
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
