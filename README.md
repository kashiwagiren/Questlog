# Questlog - Web3 Achievement Tracker

A modern Web3 platform for creating and completing quests to earn soulbound NFT badges.

## Features

- 🎮 **Quest Creation**: Advanced quest creation with 15+ features
- 🏆 **Soulbound Badges**: Permanent NFT achievements stored on-chain
- 👤 **User Profiles**: Comprehensive profiles with social sharing
- 🌐 **Web3 Integration**: Built with Wagmi and RainbowKit
- 📱 **Responsive Design**: Optimized for all device sizes
- 🎨 **Modern UI**: Beautiful design with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Web3**: Wagmi + RainbowKit
- **Icons**: Lucide React
- **Storage**: Base64 for image storage

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/questlog-web3-tracker.git
cd questlog-web3-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Update the contract address in `src/config/wagmi.ts`:

```typescript
export const QUESTLOG_CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/
│   ├── Layout/          # Header, Hero components
│   ├── Quest/           # Quest-related components
│   ├── Badge/           # Badge collection components
│   └── Profile/         # User profile components
├── config/              # Web3 configuration
├── types/               # TypeScript type definitions
└── App.tsx              # Main application component
```

## Smart Contract Integration

This frontend is designed to work with the QuestlogBadge smart contract. Make sure to:

1. Deploy your QuestlogBadge contract to Lisk Sepolia
2. Update the contract address in `src/config/wagmi.ts`
3. Ensure your contract has the required functions (mintBadge, balanceOf, tokenURI)

## Features Implemented

### Quest Creation

- ✅ One specific task emphasis
- ✅ Multiple categories (Bug Bounty, Creative, Development, etc.)
- ✅ Difficulty levels with XP rewards
- ✅ Multiple reward types (NFT badges, tokens, whitelist, IRL rewards)
- ✅ Visibility settings (Public, Invite-only, DAO-specific, Event)
- ✅ Base64 image upload for badge designs
- ✅ Organizing entity specification
- ✅ External game tracking links
- ✅ Account type requirements
- ✅ Time estimates and participant limits
- ✅ Streak bonuses and multipliers
- ✅ Start/end date scheduling
- ✅ Tags and skill requirements

### User Experience

- ✅ Responsive design for all screen sizes
- ✅ Wallet connection with RainbowKit
- ✅ Profile customization with local storage
- ✅ Social sharing functionality
- ✅ Real-time blockchain integration
- ✅ Comprehensive badge collection display

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
