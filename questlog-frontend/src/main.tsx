// React 18 StrictMode for development debugging and future compatibility
import { StrictMode } from "react";
// React 18 createRoot API for concurrent features
import { createRoot } from "react-dom/client";

// Wagmi provider for blockchain state management
import { WagmiProvider } from "wagmi";
// RainbowKit provider for wallet connection UI with dark theme
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
// TanStack Query for async state management (required by Wagmi v2+)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Application configuration and main component
import { config } from "./config/wagmi"; // Blockchain configuration (chains, contracts, etc.)
import App from "./App.tsx"; // Main application component

// Styling imports
import "./index.css"; // Global CSS with Tailwind
import "@rainbow-me/rainbowkit/styles.css"; // RainbowKit wallet UI styles

/**
 * TanStack Query Client Configuration
 *
 * PURPOSE:
 * TanStack Query manages async state for blockchain data fetching.
 * Wagmi v2+ requires this for caching contract reads and wallet state.
 *
 * FEATURES:
 * - Automatic caching of contract reads
 * - Background refetching for real-time updates
 * - Error handling and retry logic
 * - Optimistic updates for better UX
 */
const queryClient = new QueryClient();

/**
 * Application Root Setup and Provider Hierarchy
 *
 * PROVIDER HIERARCHY (inside to outside):
 * 1. App - Main application component
 * 2. RainbowKitProvider - Wallet connection UI and theming
 * 3. QueryClientProvider - Async state management
 * 4. WagmiProvider - Blockchain state and hooks
 * 5. StrictMode - React development mode with extra checks
 *
 * INITIALIZATION FLOW:
 * 1. StrictMode enables development warnings and future compatibility
 * 2. WagmiProvider initializes blockchain connection with chains and contracts
 * 3. QueryClientProvider enables async state caching for blockchain data
 * 4. RainbowKitProvider provides styled wallet connection interface
 * 5. App component handles application routing and main functionality
 *
 * STYLING:
 * - Dark theme with purple accent color (#8b5cf6) to match app design
 * - Medium border radius for modern look
 * - White text on accent color for accessibility
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Wagmi Provider: Manages blockchain connection and contract state */}
    <WagmiProvider config={config}>
      {/* Query Provider: Manages async state and caching for blockchain data */}
      <QueryClientProvider client={queryClient}>
        {/* RainbowKit Provider: Provides wallet connection UI with custom theming */}
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#8b5cf6", // Purple accent matching app theme
            accentColorForeground: "white", // White text on purple background
            borderRadius: "medium", // Rounded corners for modern look
          })}
        >
          {/* Main Application Component */}
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
