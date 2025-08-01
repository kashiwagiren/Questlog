# Questlog Backend

**Database Services & API Layer for Questlog Web3 Achievement Tracker**

A comprehensive backend system built with **Supabase** for database management, real-time synchronization, and API services that powers the Questlog ecosystem.

> **Part of the Questlog Ecosystem**  
> - **Frontend**: [questlog-frontend](https://github.com/kashiwagiren/Questlog/blob/main/questlog-frontend/README.md) - React UI application
> - **Smart Contracts**: [questlog-contracts](https://github.com/kashiwagiren/Questlog/blob/main/questlog-contracts/README.md) - Blockchain infrastructure  
> - **Backend**: [questlog-backend](https://github.com/kashiwagiren/Questlog/blob/main/questlog-backend/README.md) - This repository

## 🌟 Overview

The Questlog backend provides:

- **PostgreSQL Database**: Robust data storage with Row Level Security (RLS)
- **Real-time Synchronization**: Cross-device quest and badge synchronization
- **Discord Integration**: OAuth authentication and server verification services
- **IPFS Integration**: Decentralized storage coordination for badge images
- **TypeScript Services**: Fully typed backend services for frontend integration
- **Cross-Device Storage**: Seamless data sync across multiple devices
- **Migration Tools**: Database schema management and deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   Application   │────│   Services      │────│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Real-time UI    │    │ PostgreSQL DB   │    │ Discord OAuth   │
│ Updates         │    │ + RLS Security  │    │ + IPFS Storage  │
│ TypeScript      │    │ Supabase API    │    │ + Smart         │
│ Integration     │    │ Migration Tools │    │   Contracts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Repository Structure

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

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm**
- **Supabase CLI** (`npm install -g supabase`)
- **Supabase Account** for remote database

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/questlog/questlog-backend.git
   cd questlog-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Initialize Supabase**:
   ```bash
   # Start local Supabase instance
   npm run dev
   
   # Or connect to remote instance
   supabase link --project-ref your-project-ref
   ```

5. **Set up database schema**:
   ```bash
   # Apply database migrations
   npm run migration:up
   
   # Or manually import schema
   # Copy contents of supabase-schema-simple.sql to Supabase SQL Editor
   ```

## 📊 Database Schema

### Core Tables

#### `quests` Table
Stores quest information and metadata:
- `id` (TEXT) - Unique quest identifier
- `creator_address` (TEXT) - Wallet address of quest creator
- `title`, `description` - Quest details
- `category`, `difficulty` - Quest classification
- `reward`, `xp_reward` - Achievement rewards
- `requirements` (JSONB) - Quest completion criteria
- `quest_data` (JSONB) - Full quest object

#### `user_progress` Table  
Tracks user quest completion:
- `user_address` (TEXT) - Wallet address
- `quest_id` (TEXT) - Reference to quest
- `progress_data` (JSONB) - Completion status
- `completed_at` (TIMESTAMP) - Completion time

#### `user_badges` Table
Manages earned achievements:
- `user_address` (TEXT) - Owner wallet address
- `quest_id` (TEXT) - Associated quest
- `badge_data` (JSONB) - Badge metadata
- `earned_at` (TIMESTAMP) - Award timestamp

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start local Supabase instance
npm run stop         # Stop local Supabase
npm run studio       # Open Supabase Studio

# Database Management  
npm run reset        # Reset local database
npm run migration:new       # Create new migration
npm run migration:up        # Apply migrations
npm run migration:status    # Check migration status
npm run db:seed            # Seed database with test data

# Development Tools
npm run types:generate     # Generate TypeScript types from schema
npm run lint              # Run ESLint
npm run format           # Format code with Prettier
```

## 🔗 Integration with Frontend

The backend is designed for direct import by the frontend using TypeScript path mapping:

```typescript
// Frontend imports backend services using @backend/* mapping
import { Quest } from "@backend/types/quest";
import { supabase } from "@backend/services/supabase";
import { DiscordService } from "@backend/services/discord";
```

### Benefits:
- **Type Safety**: Shared TypeScript types across applications
- **Code Reuse**: Services and utilities shared between components
- **Development Speed**: No API layer needed for direct service integration
- **Real-time Updates**: Direct Supabase real-time subscriptions

## 🔒 Security Features

- **Row Level Security (RLS)**: User-specific data access
- **Environment Variables**: Secure credential management
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: Type-safe database operations

## 🌐 Environment Variables

Required environment variables (see `.env.example`):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Discord Integration
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_DISCORD_CLIENT_SECRET=your_discord_client_secret
VITE_DISCORD_BOT_TOKEN=your_bot_token
VITE_DISCORD_REDIRECT_URI=your_redirect_url

# IPFS Storage (Pinata)
VITE_PINATA_JWT=your_pinata_jwt_token
```

## 🚀 Deployment

### Local Development
```bash
npm run dev  # Starts local Supabase instance on localhost:54321
```

### Production Deployment
1. **Set up Supabase project** at [supabase.com](https://supabase.com)
2. **Apply schema** using the provided SQL files
3. **Configure environment variables** in your deployment platform
4. **Link project** with `supabase link`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Web3 community**

## 📊 Database Schema

### Tables

#### 1. `quests` Table
Stores all quest data with comprehensive quest information:

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

#### 2. `user_progress` Table
Tracks user participation and progress in quests:

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

#### 3. `user_badges` Table
Stores earned badges and achievements:

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

#### 4. `user_profiles` Table
User profile information and settings:

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

## 🔒 Security Features

### Row Level Security (RLS)
All tables implement comprehensive RLS policies:

- **User Isolation**: Users can only access their own data
- **Public Quest Access**: All users can read public quests
- **Creator Permissions**: Quest creators can manage their quests
- **Badge Verification**: Badge ownership is verified on-chain

### Policy Examples

```sql
-- Users can only view their own progress
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid()::text = user_address);

-- Users can only update their own profiles
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Everyone can read public quests
CREATE POLICY "Anyone can view public quests" ON quests
    FOR SELECT USING (visibility = 'public');
```

## 🚀 Getting Started

### Prerequisites

1. **Supabase CLI** - Install from [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)
2. **Node.js** (v18 or higher)
3. **Docker** (for local Supabase development)

### Local Development Setup

1. **Clone and setup**:
```bash
git clone <repository-url>
cd questlog-backend
npm install
```

2. **Start local Supabase**:
```bash
npm run dev
# or
supabase start
```

3. **Apply database schema**:
```bash
npm run migration:up
# or
supabase db push
```

4. **Access local services**:
- **Database**: `postgresql://postgres:postgres@localhost:54322/postgres`
- **API**: `http://localhost:54321`
- **Studio**: `http://localhost:54323`
- **Inbucket**: `http://localhost:54324`

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Discord OAuth2
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_DISCORD_CLIENT_SECRET=your_discord_client_secret
VITE_DISCORD_BOT_TOKEN=your_discord_bot_token
VITE_DISCORD_REDIRECT_URI=your_callback_url

# IPFS Storage
VITE_PINATA_JWT=your_pinata_jwt
VITE_PINATA_GATEWAY_URL=https://gateway.pinata.cloud
```

## 📋 Available Scripts

- **`npm run dev`** - Start local Supabase development environment
- **`npm run stop`** - Stop local Supabase services
- **`npm run reset`** - Reset database to initial state
- **`npm run migration:new`** - Create new database migration
- **`npm run migration:up`** - Apply pending migrations
- **`npm run migration:status`** - Check migration status
- **`npm run types:generate`** - Generate TypeScript types from database
- **`npm run studio`** - Open Supabase Studio (database admin UI)
- **`npm run functions:serve`** - Serve Edge Functions locally
- **`npm run functions:deploy`** - Deploy Edge Functions to Supabase

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

## 🗂️ Project Structure

```
questlog-backend/
├── services/
│   ├── supabase.ts              # Main database service
│   ├── crossDeviceStorage.ts    # Hybrid storage system
│   ├── discord.ts               # Discord OAuth integration
│   └── supabaseMigration.ts     # Database migration utilities
├── types/
│   ├── quest.ts                 # Quest type definitions
│   ├── badge.ts                 # Badge type definitions
│   └── supabase.ts              # Auto-generated DB types
├── supabase/
│   ├── config.toml              # Supabase configuration
│   ├── .gitignore               # Supabase gitignore
│   └── migrations/              # Database migrations
├── migrations/                  # SQL migration files
├── supabase-schema.sql          # Complete database schema
├── supabase-schema-simple.sql   # Simplified schema
├── supabase-rls-secure.sql      # RLS security policies
├── .env.example                 # Environment variables template
├── .supabaserc                  # Supabase project configuration
└── package.json                 # Node.js dependencies
```

## 🔄 Database Migrations

### Creating Migrations

```bash
# Create new migration
npm run migration:new add_user_profiles

# Edit the generated SQL file in supabase/migrations/
# Apply migration
npm run migration:up
```

### Migration Best Practices

1. **Incremental Changes**: Small, focused migrations
2. **Rollback Safety**: Always include rollback scripts
3. **Data Preservation**: Never drop data without backup
4. **RLS First**: Add security policies with every table

### Example Migration

```sql
-- Add streak tracking to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN current_streak INTEGER DEFAULT 0,
ADD COLUMN longest_streak INTEGER DEFAULT 0,
ADD COLUMN last_activity_date DATE;

-- Update RLS policy
CREATE POLICY "Users can update own streak data" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = wallet_address);
```

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

## 🚀 Deployment

### Production Deployment

1. **Create Supabase Project**:
   - Visit [supabase.com](https://supabase.com)
   - Create new project
   - Note project URL and API keys

2. **Deploy Schema**:
```bash
# Link to remote project
supabase link --project-ref your-project-ref

# Push schema to production
npm run migration:up
```

3. **Configure Environment**:
   - Add environment variables to your hosting platform
   - Update frontend configuration with production URLs

### Environment Variables for Production

```env
# Production Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Production Discord App
VITE_DISCORD_CLIENT_ID=your-production-discord-client
VITE_DISCORD_CLIENT_SECRET=your-production-discord-secret
VITE_DISCORD_REDIRECT_URI=https://yourdomain.com/auth/discord/callback

# Production IPFS
VITE_PINATA_JWT=your-production-pinata-jwt
```

## 🔧 Advanced Configuration

### Custom Edge Functions
Create serverless functions for complex operations:

```bash
# Create new Edge Function
supabase functions new validate-quest-completion

# Deploy function
npm run functions:deploy validate-quest-completion
```

### Database Optimization

#### Indexes for Performance
```sql
-- Index for quest lookups
CREATE INDEX idx_quests_creator ON quests(creator_address);
CREATE INDEX idx_quests_category ON quests(category, difficulty);

-- Index for user progress
CREATE INDEX idx_user_progress_lookup ON user_progress(user_address, quest_id);
```

#### Connection Pooling
Configure in `supabase/config.toml`:

```toml
[db.pooler]
enabled = true
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-backend-feature`
3. **Make changes and test locally**
4. **Run migrations**: `npm run migration:up`
5. **Generate types**: `npm run types:generate`
6. **Submit pull request**

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **SQL Style**: Consistent naming and formatting

## 📄 License

MIT License - see LICENSE file for details.

---

## 🔗 Related Projects

- **[Questlog Frontend](../questlog-frontend)** - React frontend application
- **[Questlog Contracts](../questlog-contracts)** - Smart contracts for blockchain integration

## 📚 Additional Resources

- **[Supabase Documentation](https://supabase.com/docs)**
- **[PostgreSQL Documentation](https://www.postgresql.org/docs/)**
- **[Discord API Documentation](https://discord.com/developers/docs)**
- **[IPFS Documentation](https://docs.ipfs.tech/)**

For questions or support, please open an issue in the repository.
