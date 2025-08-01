# Questlog Backend

**Database Services & API Layer for Questlog Web3 Achievement Tracker**

A comprehensive backend system built with **Supabase** for database management, real-time synchronization, and API services powering the Questlog ecosystem.

> **Part of the Questlog Ecosystem**
>
> * **Frontend**: [questlog-frontend](https://github.com/kashiwagiren/Questlog/blob/main/questlog-frontend/README.md) – React UI application
> * **Smart Contracts**: [questlog-contracts](https://github.com/kashiwagiren/Questlog/blob/main/questlog-contracts/README.md) – Blockchain infrastructure
> * **Backend**: [questlog-backend](https://github.com/kashiwagiren/Questlog/blob/main/questlog-backend/README.md) – This repository

---

## 🌟 Overview

The Questlog backend handles:

* **PostgreSQL Database** with Row Level Security (RLS)
* **Real-time Sync** across devices
* **Discord OAuth & Verification**
* **IPFS Badge Storage**
* **TypeScript Services** for type-safe frontend integration
* **Migration Tools** for schema management

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   Application   │────│   Services      │────│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Real-time UI    │    │ PostgreSQL DB   │    │ Discord OAuth   │
│ Updates         │    │ + RLS Security  │    │ + IPFS Storage  │
│ TypeScript      │    │ Supabase API    │    │ + Smart         │
│ Integration     │    │ Migration Tools │    │   Contracts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📁 Project Structure

```
questlog-backend/
├── services/                  # Core backend services
│   ├── supabase.ts           # Supabase client and database operations
│   ├── discord.ts            # Discord OAuth and server verification
│   ├── crossDeviceStorage.ts # Cross-device sync utilities
│   └── supabaseMigration.ts  # Database migration tools
├── types/                    # TypeScript type definitions
│   ├── quest.ts             # Quest-related types
│   └── badge.ts             # Badge and achievement types
├── supabase/                # Supabase configuration
│   └── config.toml          # Local development settings
├── *.sql                    # Database schema files
│   ├── supabase-schema-simple.sql  # Basic schema
│   ├── supabase-schema.sql         # Full schema
│   ├── supabase-rls-secure.sql     # Row Level Security
│   └── supabase-rls-fix.sql        # RLS patches
├── .env.example             # Environment template
├── package.json             # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

---

## 🚀 Quick Start

### Prerequisites

* **Node.js** 18+ and **npm**
* **Supabase CLI** (`npm install -g supabase`)
* **Docker** (for local Supabase)
* **Supabase Account** (for production)

### Setup

```bash
git clone https://github.com/kashiwagiren/Questlog/questlog-backend.git
cd questlog-backend
npm install
cp .env.example .env  # edit with your Supabase credentials
```

---

## 📊 Database Schema

### Core Tables

#### `quests`

Stores quest data.

```sql
CREATE TABLE public.quests (
    id TEXT PRIMARY KEY,
    creator_address TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    reward TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 100,
    visibility TEXT NOT NULL DEFAULT 'public',
    requirements JSONB NOT NULL DEFAULT '[]',
    badge_image TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    quest_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `user_progress`

Tracks user quest participation.

```sql
CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    completed_requirements INTEGER[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_address, quest_id)
);
```

#### `user_badges`

Holds badges users earned.

```sql
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_image TEXT NOT NULL,
    badge_description TEXT,
    rarity TEXT NOT NULL DEFAULT 'common',
    category TEXT NOT NULL DEFAULT 'achievement',
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    blockchain_token_id TEXT,
    blockchain_tx_hash TEXT
);
```

#### `user_profiles`

Basic profile and stats.

```sql
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    bio TEXT,
    avatar_url TEXT,
    discord_id TEXT,
    twitter_handle TEXT,
    total_xp INTEGER DEFAULT 0,
    badge_count INTEGER DEFAULT 0,
    quest_completed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔒 Security

* **Row Level Security (RLS)**: Users only see their own data.
* **Creator Permissions**: Quest creators manage their quests.
* **Badge Verification**: On-chain confirmation of badge ownership.

```sql
-- Example policy
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = wallet_address);
```

---

## 🔧 Scripts

```bash
npm run dev             # Start local Supabase
npm run stop            # Stop local Supabase
npm run reset           # Reset database
npm run migration:new   # Create new migration
npm run migration:up    # Apply migrations
npm run studio          # Open Supabase Studio
npm run types:generate  # Generate TS types from DB
npm run lint            # Run ESLint
npm run format          # Format code
npm run functions:serve # Serve Edge Functions locally
npm run functions:deploy# Deploy Edge Functions
```
---

## 🔧 Services

### Core Backend Services

#### 1. Supabase Service (`services/supabase.ts`)
Main database interface with type-safe operations:

```typescript
export class SupabaseService {
  // Quest operations
  async saveQuest(quest: Quest): Promise<Quest>
  async getQuest(questId: string): Promise<Quest | null>
  async getUserQuests(userAddress: string): Promise<Quest[]>
  
  // User progress tracking
  async joinQuest(userAddress: string, questId: string): Promise<void>
  async completeQuest(userAddress: string, questId: string): Promise<void>
  
  // Badge management
  async awardBadge(userAddress: string, badge: Badge): Promise<void>
  async getUserBadges(userAddress: string): Promise<Badge[]>
}
```

#### 2. Cross-Device Storage (`services/crossDeviceStorage.ts`)
Hybrid storage system with Supabase + localStorage fallback:

```typescript
export class CrossDeviceStorage {
  async saveQuest(quest: Quest): Promise<void>
  async getQuests(): Promise<Quest[]>
  async syncToCloud(): Promise<void>
  async syncFromCloud(): Promise<void>
}
```

#### 3. Discord Integration (`services/discord.ts`)
OAuth authentication and server verification:

```typescript
export class DiscordService {
  async authenticate(code: string): Promise<DiscordUser>
  async verifyServerMembership(userId: string, serverId: string): Promise<boolean>
  async getUserGuilds(accessToken: string): Promise<DiscordGuild[]>
}
```

---

## 🌐 API Endpoints

### Auto-generated REST API
Supabase automatically generates REST API endpoints:

- **GET** `/rest/v1/quests` - List all public quests
- **POST** `/rest/v1/quests` - Create new quest
- **GET** `/rest/v1/user_progress?user_address=eq.{address}` - Get user progress
- **POST** `/rest/v1/user_badges` - Award new badge

### Real-time Subscriptions
Subscribe to real-time updates:

```typescript
// Listen for new quest completions
supabase
  .channel('quest-completions')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'user_progress' },
    (payload) => {
      console.log('New quest completion:', payload.new);
    }
  )
  .subscribe();
```

## 🧪 Testing

### Database Testing

```bash
# Reset database for testing
npm run reset

# Seed test data
npm run db:seed

# Run integration tests
npm test
```

### Test Data Seeds

Create test data in `supabase/seed.sql`:

```sql
-- Insert test quests
INSERT INTO public.quests (id, creator_address, title, description, category, difficulty, reward, quest_data)
VALUES (
  'test-quest-1',
  '0x1234567890123456789012345678901234567890',
  'Join Discord Server',
  'Join our community Discord server',
  'social',
  'easy',
  'Discord Member Badge',
  '{}'::jsonb
);
```

---

## 🌐 Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Discord
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_DISCORD_CLIENT_SECRET=your_discord_client_secret
VITE_DISCORD_BOT_TOKEN=your_bot_token
VITE_DISCORD_REDIRECT_URI=your_redirect_url

# IPFS
VITE_PINATA_JWT=your_pinata_jwt
```

---

## 🚀 Deployment

### Local Development

```bash
npm run dev        # Starts localhost
npm run studio    # open Supabase Studio
npm run migration:up   # apply migrations
```

### Production Deployment

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Apply schema with migrations
3. Set environment variables on server
4. Link project with `supabase link --project-ref your-project-ref`

---

## 🤝 Contributing

1. Fork repo
2. Create branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin feature/your-feature`
5. Open Pull Request

### Code Standards

* **TypeScript** strict mode
* **ESLint + Prettier** enforced
* **SQL** consistent naming

---

## 📄 License

MIT License

---

## 🔗 Related Projects

* [Questlog Frontend](../questlog-frontend)
* [Questlog Contracts](../questlog-contracts)

**Built with ❤️ for the Web3 community**
