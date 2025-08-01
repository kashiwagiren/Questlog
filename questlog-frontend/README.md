# Questlog Frontend

**Web3 Achievement Tracker - React Frontend Application**

A comprehensive React-based frontend for a Web3 quest and achievement system that allows users to create quests, complete tasks, and earn soulbound NFT badges stored on the blockchain.

> **Part of the Questlog Ecosystem**  
> - **Frontend**: [questlog-frontend](https://github.com/questlog/questlog-frontend) - This repository
> - **Backend**: [questlog-backend](https://github.com/questlog/questlog-backend) - Database services and API
> - **Smart Contracts**: [questlog-contracts](https://github.com/questlog/questlog-contracts) - Blockchain infrastructure

## 🎮 Live Demo

🌐 **[https://questlog.netlify.app](https://questlog.netlify.app)**

## ✨ Key Features

- 🎮 **Advanced Quest Creation**: Create detailed quests with 15+ configuration options including categories, difficulties, rewards, and requirements
- 🏆 **Soulbound NFT Badges**: Permanent achievement badges minted as NFTs on Lisk Sepolia blockchain  
- 👤 **User Profiles**: Comprehensive user profiles with badge collections, streak tracking, and social sharing
- 🌐 **Web3 Integration**: Full blockchain integration with wallet connection, transaction handling, and smart contract interaction
- 📱 **Responsive Design**: Mobile-first design optimized for all device sizes
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and Lucide React icons
- 🔗 **Cross-Device Sync**: Quest data synchronized across devices using backend services with localStorage fallback
- 🎯 **Discord Integration**: OAuth authentication and server-based quest requirements
- 📁 **IPFS Storage**: Decentralized image storage through Pinata for badge designs
- 🔔 **Real-time Notifications**: Comprehensive notification system for user feedback

## 🏗️ Tech Stack

### Frontend Framework
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Full type safety with comprehensive type definitions
- **Vite** - Fast build tool with HMR and optimized bundling

### Web3 Integration
- **Wagmi** - React hooks for Ethereum blockchain interaction
- **RainbowKit** - Beautiful wallet connection UI with multi-wallet support
- **Viem** - TypeScript-first Ethereum library for contract interaction

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework with custom configuration
- **Lucide React** - Beautiful, consistent icon library
- **Custom Components** - Modular, reusable UI components

### Backend Integration
- **Backend Services** - Direct imports from questlog-backend using TypeScript path mapping
- **Type Safety** - Shared TypeScript types for seamless integration
- **Real-time Updates** - Direct Supabase subscriptions for live data

## 📁 Project Structure

```
questlog-frontend/
├── src/
│   ├── components/           # React components
│   │   ├── Admin/           # Admin panel and database management
│   │   ├── Badge/           # Badge collection and display
│   │   ├── Layout/          # App layout and navigation
│   │   ├── Profile/         # User profiles and statistics
│   │   ├── Quest/           # Quest creation and management
│   │   └── UI/              # Reusable UI components
│   ├── config/              # Configuration files
│   │   └── wagmi.ts         # Web3 wallet configuration
│   ├── services/            # Frontend-specific services
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions and validation
│   └── App.tsx              # Main application component
├── scripts/                 # Build and validation scripts
│   └── validate-backend.cjs # Pre-build backend validation
├── public/                  # Static assets
├── dist/                    # Build output
├── .env.example            # Environment variables template
├── DEPLOYMENT.md           # Deployment instructions
├── vite.config.ts          # Vite configuration
├── tsconfig.app.json       # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json            # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** 18+ and **npm**
2. **Wallet** (MetaMask or other Web3 wallet) 
3. **Backend Setup** - The questlog-backend must be available
4. **Environment Variables** (see `.env.example`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/questlog/questlog-frontend.git
   cd questlog-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Ensure backend is available**:
   ```bash
   # The build process automatically validates backend presence
   # Make sure questlog-backend is cloned at ../questlog-backend
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Open in browser**: Navigate to `http://localhost:5173`

## ⚙️ Configuration

### Environment Variables

Required environment variables (see `.env.example`):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Discord Integration  
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_DISCORD_REDIRECT_URI=your_redirect_url

# IPFS Storage (Pinata)
VITE_PINATA_JWT=your_pinata_jwt_token

# Smart Contract Addresses (Lisk Sepolia)
VITE_QUESTLOG_CONTRACT_ADDRESS=0xb4268cbf5e95a326646703a7435257899c151132
VITE_QUEST_MINTER_CONTRACT_ADDRESS=0x09f3dd43ba9f9efcffeea8e5632b0c9b71bed90c
```

### Backend Integration

The frontend imports backend services using TypeScript path mapping:

```typescript
// Import shared types
import { Quest, QuestCategory } from "@backend/types/quest";
import { Badge } from "@backend/types/badge";

// Import services
import { supabase } from "@backend/services/supabase";
import { DiscordService } from "@backend/services/discord";
```

This setup provides:
- **Type Safety**: Shared types prevent integration errors
- **Hot Reloading**: Changes in backend types immediately reflect in frontend
- **Code Reuse**: Direct access to backend utilities and services

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run preview      # Preview production build locally

# Building
npm run build        # Build for production (includes backend validation)
npm run prebuild     # Validate backend setup before building

# Code Quality
npm run lint         # Run ESLint for code quality checks
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │ Smart Contracts │
│   (React/TS)    │────│   Services      │────│   (Solidity)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ UI Components   │    │ Database/API    │    │ NFT Badges      │
│ Quest Creation  │    │ Cross-Device    │    │ Blockchain      │
│ User Profiles   │    │ Storage & Sync  │    │ Storage         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Deployment

### Netlify (Recommended)

The project is configured for automatic Netlify deployment:

1. **Connect repository** to Netlify
2. **Set build command**: `npm run build`
3. **Set publish directory**: `dist`
4. **Configure environment variables** in Netlify dashboard
5. **Deploy**: Automatic deployment on git push

### Vercel

For Vercel deployment:

1. **Import project** from GitHub
2. **Configure build settings**:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Set environment variables**
4. **Deploy**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🔒 Security Features

- **Wallet Integration**: Secure Web3 wallet connections
- **Environment Variables**: Sensitive data stored securely
- **Type Safety**: Comprehensive TypeScript coverage
- **Input Validation**: Client-side validation for all forms
- **Cross-Device Sync**: Secure data synchronization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Web3 community**

## Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn** package manager
3. **Wallet** (MetaMask or other Web3 wallet)
4. **Environment Variables** (see `.env.example`)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd questlog-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Configure your environment variables:

```env
# Discord OAuth (required for Discord integration)
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_DISCORD_REDIRECT_URI=http://localhost:5173/auth/discord/callback

# IPFS Storage (required for image uploads)
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_PINATA_GATEWAY_URL=your_pinata_gateway_url

# Backend API (if using remote backend)
VITE_BACKEND_URL=http://localhost:3000
```

**Note**: Some backend-specific configuration has been moved to the separate questlog-backend service.

5. Start the development server:

```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Build production-ready application
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Run ESLint for code quality checks
- **`npm run type-check`** - Run TypeScript compiler checks

## Project Structure

```
src/
├── components/
│   ├── Admin/              # Admin panel components
│   │   ├── AdminBadgeManager.tsx
│   │   ├── AdminPanel.tsx
│   │   └── QuestApproval.tsx
│   ├── Badge/              # Badge-related components
│   │   ├── BadgeCard.tsx
│   │   └── BadgeCollection.tsx
│   ├── Layout/             # Layout and navigation
│   │   ├── Header.tsx
│   │   └── Hero.tsx
│   ├── Profile/            # User profile components
│   │   ├── AchievementCard.tsx
│   │   ├── ProfileCard.tsx
│   │   └── ProfileCustomization.tsx
│   ├── Quest/              # Quest-related components
│   │   ├── QuestBoard.tsx
│   │   ├── QuestCard.tsx
│   │   ├── QuestCreator.tsx
│   │   └── QuestProgressModal.tsx
│   └── UI/                 # Reusable UI components
│       ├── Button.tsx
│       ├── Dialog.tsx
│       ├── LoadingSpinner.tsx
│       └── NotificationSystem.tsx
├── config/
│   └── wagmi.ts            # Web3 configuration
├── services/
│   ├── hybridQuestStorage.ts  # Local quest storage
│   ├── ipfs.ts                # IPFS storage service
│   ├── ipfsQuestStorage.ts    # IPFS quest storage
│   ├── onlineUserStorage.ts   # Online user storage
│   └── questStorage.ts        # Quest storage abstraction
├── types/
│   ├── badge.ts           # Badge type definitions
│   ├── profile.ts         # Profile type definitions
│   └── quest.ts           # Quest type definitions
├── utils/
│   ├── contractHelpers.ts # Smart contract utilities
│   ├── formatters.ts      # Data formatting functions
│   └── validation.ts      # Form validation helpers
├── App.tsx                # Main application component
├── index.css             # Global styles and Tailwind imports
└── main.tsx              # Application entry point
```

## Smart Contract Integration

This frontend integrates with smart contracts deployed on **Lisk Sepolia** testnet:

### QuestlogBadge Contract

- **Purpose**: Manages soulbound NFT badges for quest completion
- **Key Functions**:
  - `mintBadge(address to, string memory questId, string memory badgeURI)` - Mint achievement badges
  - `balanceOf(address owner)` - Get user's badge count
  - `tokenURI(uint256 tokenId)` - Get badge metadata

### QuestMinter Contract

- **Purpose**: Handles quest creation and badge minting logic
- **Integration**: Called through the quest completion flow

### Configuration

Update contract addresses in `src/config/wagmi.ts`:

```typescript
export const QUESTLOG_BADGE_ADDRESS = "0x..." as const;
export const QUEST_MINTER_ADDRESS = "0x..." as const;
```

## Backend Integration

This frontend integrates with the separate **questlog-backend** service for data persistence and real-time synchronization:

### Backend Services
- **Database Operations**: Quest creation, user progress tracking, badge management
- **Real-time Sync**: Cross-device synchronization via Supabase
- **Discord Integration**: OAuth authentication and server verification
- **Data Validation**: Server-side validation and security policies

### API Integration
The frontend communicates with the backend through:
- **Supabase Client**: Direct database operations with RLS security
- **Real-time Subscriptions**: Live updates for quest completions and badge awards
- **Service Layer**: Abstracted backend operations through service classes

### Setup Backend
1. Navigate to the backend directory: `cd ../questlog-backend`
2. Follow the backend setup instructions in its README.md
3. Ensure backend services are running before starting the frontend

For detailed backend setup and API documentation, see [questlog-backend README](../questlog-backend/README.md).

## Features Implemented

### Quest Creation System

- ✅ **Multiple Categories**: Bug Bounty, Creative, Development, Social, Gaming, etc.
- ✅ **Difficulty Levels**: Easy (100 XP), Medium (300 XP), Hard (500 XP)
- ✅ **Reward Types**: NFT badges, tokens, whitelist access, IRL rewards
- ✅ **Visibility Settings**: Public, Invite-only, DAO-specific, Event-based
- ✅ **Badge Design**: Base64 image upload with IPFS storage
- ✅ **Requirements**: Manual verification, Discord join, social tasks
- ✅ **Time Management**: Start/end dates, time estimates
- ✅ **Participation Limits**: Max participant settings
- ✅ **Streak Bonuses**: XP multipliers for consecutive completions
- ✅ **Tags & Skills**: Categorization and skill requirements

### User Experience

- ✅ **Wallet Integration**: RainbowKit with multiple wallet support
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Profile System**: Customizable profiles with badge collections
- ✅ **Social Features**: Profile sharing and achievement display
- ✅ **Cross-Device Sync**: Supabase-powered data synchronization
- ✅ **Offline Support**: localStorage fallback for core functionality

### Admin Features

- ✅ **Quest Approval**: Admin panel for quest moderation
- ✅ **Badge Management**: Bulk badge operations
- ✅ **User Management**: Profile moderation tools

### Technical Features

- ✅ **Type Safety**: Comprehensive TypeScript coverage
- ✅ **Error Handling**: Robust error boundaries and user feedback
- ✅ **Performance**: Optimized rendering and state management
- ✅ **Security**: Input validation and sanitization

## Deployment

### Netlify Deployment

The project is configured for Netlify deployment with:

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**: Configure in Netlify dashboard
- **Redirects**: SPA routing support configured

### Manual Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Configure environment variables on your hosting platform
4. Ensure proper redirects for client-side routing

## Environment Configuration

### Required Environment Variables

```env
# Discord Integration
VITE_DISCORD_CLIENT_ID=your_discord_app_id
VITE_DISCORD_REDIRECT_URI=your_callback_url

# IPFS Storage
VITE_PINATA_JWT=your_pinata_jwt
VITE_PINATA_GATEWAY_URL=https://gateway.pinata.cloud

# Backend API (optional, for remote backend)
VITE_BACKEND_URL=https://your-backend-api.com
```

**Note**: Backend-specific environment variables (Supabase, Discord secrets) are configured in the separate questlog-backend service.

### Development vs Production

- **Development**: Uses localhost URLs and local backend services
- **Production**: Uses production backend API and IPFS gateway

## Contributing

### Code Style

- **ESLint**: Configured with React and TypeScript rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict mode enabled for type safety

### Development Guidelines

1. **Components**: Use functional components with hooks
2. **State Management**: React hooks with proper dependency arrays
3. **Types**: Define comprehensive TypeScript interfaces
4. **Error Handling**: Implement proper error boundaries
5. **Testing**: Write tests for critical functionality
6. **Documentation**: Comment complex logic and business rules

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with proper tests
4. Run linting and type checks: `npm run lint && npm run type-check`
5. Submit a pull request with detailed description

## License

MIT License - see LICENSE file for details.

---

## Additional Resources

- **[Questlog Backend](../questlog-backend/README.md)** - Backend services and database setup
- **Wagmi Documentation**: https://wagmi.sh/
- **RainbowKit Documentation**: https://rainbowkit.com/
- **Supabase Documentation**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vite Documentation**: https://vitejs.dev/

For questions or support, please open an issue in the repository.
