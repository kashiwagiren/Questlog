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
│   ├── supabase.ts            # Supabase client and database operations
│   ├── discord.ts             # Discord OAuth and verification
│   ├── crossDeviceStorage.ts  # Cross-device sync utilities
│   └── supabaseMigration.ts   # Database migration tools
├── types/                     # TypeScript type definitions
│   ├── quest.ts               # Quest-related types
│   └── badge.ts               # Badge and achievement types
├── supabase/                  # Supabase configuration & migrations
│   ├── config.toml            # Local development settings
│   └── migrations/            # SQL migration files
├── migrations/                # Legacy or additional migrations
├── *.sql                      # Schema files (full, simplified, RLS)
├── .env.example               # Environment template
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 🚀 Quick Start

### Prerequisites

* **Node.js** 18+
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

### Local Development

```bash
npm run dev       # start local Supabase
npm run studio    # open Supabase Studio
npm run migration:up   # apply migrations
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

### Local

```bash
npm run dev
```

### Production

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
