# Deployment Configuration for Questlog Frontend

## Netlify Deployment

For Netlify deployment, add these settings:

### Build Settings
```
Build command: npm run build
Publish directory: dist
```

### Build Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Discord Integration
VITE_DISCORD_CLIENT_ID=your_discord_client_id

# IPFS Storage
VITE_PINATA_JWT=your_pinata_jwt

# Smart Contract Addresses (Lisk Sepolia)
VITE_QUESTLOG_CONTRACT_ADDRESS=0xb4268cbf5e95a326646703a7435257899c151132
VITE_QUEST_MINTER_CONTRACT_ADDRESS=0x09f3dd43ba9f9efcffeea8e5632b0c9b71bed90c
```

### Custom Build Script
The pre-build script will automatically:
1. Validate backend directory exists
2. Install backend dependencies if needed
3. Verify all critical files are present

## Vercel Deployment

For Vercel, use these settings:

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install && cd ../questlog-backend && npm install"
}
```

## Docker Deployment

For containerized deployment:

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy both frontend and backend
COPY questlog-frontend/ ./questlog-frontend/
COPY questlog-backend/ ./questlog-backend/

# Install dependencies
WORKDIR /app/questlog-backend
RUN npm install

WORKDIR /app/questlog-frontend  
RUN npm install
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Important Notes

1. **Backend Dependency**: The frontend requires the backend directory to be present during build
2. **Environment Variables**: All VITE_ prefixed variables must be set before build
3. **Path Mapping**: The relative path `../questlog-backend` must be maintained
4. **Dependencies**: Backend dependencies must be installed before frontend build
