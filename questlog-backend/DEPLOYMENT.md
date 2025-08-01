# Questlog Backend - Deployment Guide

Ready for deployment to cloud platforms with TypeScript support.

## 🚀 Deployment Options

### 1. Supabase Edge Functions (Recommended)

Deploy backend as Supabase Edge Functions for seamless integration:

```bash
# Initialize Supabase project
supabase init
supabase login

# Deploy edge functions
supabase functions deploy questlog-backend
```

### 2. Vercel Functions

Deploy as Vercel serverless functions:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

### 3. Railway

Deploy as a Node.js service:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/questlog/questlog-backend)

### 4. Render

Deploy as a web service:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/questlog/questlog-backend)

## ⚙️ Environment Configuration

### Required Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Discord Integration
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=your_discord_bot_token

# IPFS Storage (Pinata)
PINATA_JWT=your_pinata_jwt_token
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Application Settings
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Development Environment

```bash
# Copy environment template
cp .env.example .env

# Start local development
npm run dev
```

## 🏗️ Build Configuration

### TypeScript Compilation

```bash
# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security Considerations

### API Keys Management
- ✅ Service role keys for server-side operations
- ✅ Environment-specific key rotation
- ✅ No client-side secret exposure

### Database Security
- ✅ Row Level Security (RLS) policies
- ✅ Authenticated user access patterns
- ✅ Data validation and sanitization

### CORS Configuration
```typescript
// Configure CORS for your frontend domain
const allowedOrigins = [
  'https://your-frontend-domain.com',
  'http://localhost:5173' // Development
];
```

## 📊 Performance Optimization

### Caching Strategy
- **Database Queries**: Smart query caching
- **API Responses**: Response-level caching
- **IPFS Content**: Content addressing optimization

### Monitoring
- **Error Tracking**: Sentry integration ready
- **Performance**: APM monitoring compatible
- **Logs**: Structured logging with timestamps

## 🧪 Testing & Validation

### Pre-deployment Checks

```bash
# Run all tests
npm test

# Integration tests
npm run test:integration

# Database migration tests
npm run test:migrations
```

### Health Checks

The backend includes health check endpoints:

- `GET /health` - Basic health status
- `GET /health/db` - Database connectivity
- `GET /health/discord` - Discord API status
- `GET /health/ipfs` - IPFS connectivity

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy Backend
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Deploy to production
        # Your deployment step
```

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection**:
   - Verify project URL and service role key
   - Check database is accessible from deployment platform

2. **Discord Integration**:
   - Ensure bot token has required permissions
   - Verify OAuth redirect URLs are configured

3. **IPFS Upload**:
   - Check Pinata JWT token validity
   - Verify API key permissions

### Support

- **GitHub Issues**: [Report issues](https://github.com/kashiwagiren/Questlog/questlog-backend/issues)
- **Documentation**: [Full README](./README.md)
- **Discord**: Join our community server
