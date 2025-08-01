// React hooks for state management
import { useState } from "react";
// Wagmi hook to check wallet connection status
import { useAccount } from "wagmi";
// RainbowKit's pre-built wallet connection button with styling
import { ConnectButton } from "@rainbow-me/rainbowkit";

// Layout components that structure the application UI
import Header from "./components/Layout/Header";
import Hero from "./components/Layout/Hero";

// Main feature components for different app sections
import QuestBoard from "./components/Quest/QuestBoard"; // Quest discovery and completion
import QuestCreator from "./components/Quest/QuestCreator"; // Quest creation form
import BadgeCollection from "./components/Badge/BadgeCollection"; // User's earned badges
import UserProfile from "./components/Profile/UserProfile"; // User profile management
import AdminPanel from "./components/Admin/AdminPanel"; // Admin/debug panel

// Global notification system for user feedback
import { NotificationProvider } from "./components/UI/NotificationSystem";
// Lucide React icon for visual elements
import { Trophy } from "lucide-react";

// TypeScript type definition for application tabs/pages
type TabType = "home" | "quests" | "badges" | "create" | "profile" | "admin";

/**
 * Main Application Component
 *
 * ARCHITECTURE OVERVIEW:
 * This is the root component that manages the entire application state and routing.
 * It uses a simple tab-based navigation system instead of React Router for simplicity.
 *
 * KEY FEATURES:
 * - Tab-based navigation between different app sections
 * - Wallet connection requirement for most features
 * - Global notification system for user feedback
 * - Responsive design with mobile-first approach
 *
 * USER INTERACTION FLOW:
 * 1. User lands on Hero page (home tab)
 * 2. User connects wallet via RainbowKit ConnectButton
 * 3. User can navigate between tabs: quests, badges, create, profile, admin
 * 4. Each tab renders a different main component with specific functionality
 *
 * STATE MANAGEMENT:
 * - activeTab: Controls which main content component is rendered
 * - isConnected: Wagmi hook that tracks wallet connection status
 *
 * CALLED BY: ReactDOM.render() in main.tsx during app initialization
 */
function App() {
  // State to track which tab/page is currently active
  // Default to "home" which shows the Hero landing page
  const [activeTab, setActiveTab] = useState<TabType>("home");

  // Wagmi hook that automatically tracks wallet connection status
  // This triggers re-renders when user connects/disconnects wallet
  const { isConnected } = useAccount();

  /**
   * Tab change handler function
   *
   * CALLED BY:
   * - Header navigation buttons (when user clicks menu items)
   * - Hero call-to-action buttons (e.g., "Start Your Quest" button)
   * - Internal navigation from other components
   *
   * @param tab - The new tab to activate (e.g., "quests", "badges")
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType); // Type cast to ensure valid tab
  };

  return (
    // Wrap entire app in NotificationProvider to enable toast notifications
    // This context provider allows any component to show success/error/warning messages
    <NotificationProvider>
      <div className="min-h-screen gradient-bg">
        {/* Fixed header with navigation and wallet connection */}
        <Header activeTab={activeTab} setActiveTab={handleTabChange} />

        {/* Conditional rendering based on active tab */}
        {activeTab === "home" ? (
          // Home tab: Show Hero landing page with marketing content
          <Hero setActiveTab={handleTabChange} />
        ) : (
          // All other tabs: Show main app content with tab-specific components
          <div className="pt-20">
            {" "}
            {/* Top padding to account for fixed header */}
            {/* Main content container with responsive padding */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {/* Wallet Connection Gate */}
              {!isConnected ? (
                // Show wallet connection prompt if user hasn't connected wallet
                // This blocks access to all main features until wallet is connected
                <div className="text-center py-12 sm:py-20 quest-card max-w-md mx-auto">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                    Connect Your Wallet
                  </h2>
                  <p className="text-white/70 mb-8 text-sm sm:text-base">
                    Connect your wallet to access quests and earn badges
                  </p>
                  {/* RainbowKit's pre-styled wallet connection button */}
                  {/* This button handles the entire wallet connection flow */}
                  <div className="flex justify-center">
                    <ConnectButton />
                  </div>
                </div>
              ) : (
                // Main app content - only visible when wallet is connected
                <>
                  {/* Tab-based content rendering */}
                  {/* Each tab renders a different main component */}

                  {activeTab === "quests" && (
                    // Quest discovery, joining, and completion interface
                    <QuestBoard setActiveTab={handleTabChange} />
                  )}
                  {activeTab === "badges" && (
                    // User's earned badge collection display
                    <BadgeCollection setActiveTab={handleTabChange} />
                  )}
                  {activeTab === "create" && (
                    // Quest creation form for users to make new quests
                    <QuestCreator />
                  )}
                  {activeTab === "profile" && (
                    // User profile management and settings
                    <UserProfile />
                  )}
                  {activeTab === "admin" && (
                    // Admin panel for advanced users and debugging
                    <AdminPanel />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </NotificationProvider>
  );
}

export default App;
