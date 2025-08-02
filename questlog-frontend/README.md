# Questlog Frontend

**Web3 Achievement Tracker - React Frontend Application**

A comprehensive React-based frontend for a Web3 quest and achievement system that allows users to create quests, complete tasks, and earn soulbound NFT badges stored on the blockchain.

> **Part of the Questlog Ecosystem**  
> - **Frontend**: [questlog-frontend](https://github.com/kashiwagiren/Questlog/blob/main/questlog-frontend/README.md) - This repository
> - **Smart Contracts**: [questlog-contracts](https://github.com/kashiwagiren/Questlog/blob/main/questlog-contracts/README.md) - Blockchain infrastructure  
> - **Backend**: [questlog-backend](https://github.com/kashiwagiren/Questlog/blob/main/questlog-backend/README.md) - Database and API services

## 🎮 Live Demo

🌐 **[https://dazzling-parfait-18b675.netlify.app](https://dazzling-parfait-18b675.netlify.app)**

## ✨ Key Features

- 🎮 **Quest Creation**: Create detailed quests with configuration options including categories, difficulties, rewards, and requirements
- 🏆 **Soulbound NFT Badges**: Permanent achievement badges minted as NFTs on Lisk Sepolia blockchain  
- 👤 **User Profiles**: Comprehensive user profiles with badge collections, and social sharing
- 🌐 **Web3 Integration**: Full blockchain integration with wallet connection, transaction handling, and smart contract interaction
- 📱 **Responsive Design**: Mobile-first design optimized for all device sizes
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and Lucide React icons
- 🔗 **Cross-Device Sync**: Quest data synchronized across devices using backend services
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
   git clone https://github.com/kashiwagiren/Questlog/questlog-frontend.git
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
VITE_QUEST_MINTER_CONTRACT_ADDRESS=0xFB4F07C9eDd02b3c1659Cfebc098300517558E9E
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
│   Application   │────│   Services      │────│   (Solidity)    │
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

This project is licensed under the MIT License

---

## 🔗 Related Projects

* [Questlog Contracts](../questlog-contracts)
* [Questlog Backend](../questlog-backend)

**Built with ❤️ for the Web3 community**

---

For questions or support, please open an issue in the repository.
