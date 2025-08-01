# Questlog Frontend - Vercel Deployment

Ready for deployment to Vercel with optimized configuration.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/questlog/questlog-frontend)

## ⚙️ Deployment Configuration

### Vercel Settings

1. **Import Project**: Import from GitHub repository
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Root Directory**: `./` (default)

### Environment Variables

Set these in your Vercel dashboard:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Discord Integration
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_DISCORD_REDIRECT_URI=https://your-app.vercel.app

# IPFS Storage (Pinata)
VITE_PINATA_JWT=your_pinata_jwt_token

# Smart Contract Addresses (Lisk Sepolia)
VITE_QUESTLOG_CONTRACT_ADDRESS=0xb4268cbf5e95a326646703a7435257899c151132
VITE_QUEST_MINTER_CONTRACT_ADDRESS=0x09f3dd43ba9f9efcffeea8e5632b0c9b71bed90c
```

### Custom Build Configuration

The project includes automatic backend validation in the prebuild step. Vercel will:

1. ✅ Validate backend repository presence
2. ✅ Install backend dependencies automatically  
3. ✅ Check TypeScript path mapping
4. ✅ Build optimized production bundle

## 🔧 Manual Deployment

### Prerequisites

1. **Vercel CLI**: `npm i -g vercel`
2. **Backend Setup**: Ensure questlog-backend is accessible
3. **Environment Variables**: Set up all required variables

### Steps

```bash
# Clone both repositories
git clone https://github.com/questlog/questlog-frontend.git
git clone https://github.com/questlog/questlog-backend.git

# Setup frontend
cd questlog-frontend
npm install

# Deploy to Vercel
vercel --prod
```

## 🌐 Domain Configuration

### Custom Domain

1. **Add Domain**: In Vercel dashboard → Domains
2. **DNS Setup**: Point your domain to Vercel
3. **HTTPS**: Automatic SSL certificate provisioning
4. **Redirects**: Configure www → non-www redirects

### Environment-Specific URLs

- **Production**: `https://your-domain.com`
- **Preview**: `https://your-app-git-branch.vercel.app`
- **Development**: `http://localhost:5173`

## 🔒 Security Considerations

### Environment Variables
- ✅ All secrets prefixed with `VITE_` for Vite compatibility
- ✅ Client-side safe variables only
- ✅ No private keys or sensitive backend credentials

### CORS Configuration
- ✅ Supabase CORS configured for your domain
- ✅ Discord OAuth redirect URLs updated
- ✅ IPFS API calls from authorized domains

## 📊 Performance Optimization

The build includes:

- **Code Splitting**: Automatic chunk optimization
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Images and fonts optimized
- **Caching**: Optimal cache headers for static assets

### Build Statistics

- **Bundle Size**: ~1.1MB (gzipped: ~330KB)
- **Build Time**: ~12-15 seconds
- **First Load**: ~2-3 seconds
- **Subsequent Loads**: ~500ms (cached)

## 🐛 Troubleshooting

### Common Issues

1. **Backend Not Found**:
   - Ensure questlog-backend is in sibling directory
   - Check TypeScript path mapping in `tsconfig.app.json`

2. **Environment Variables**:
   - Verify all `VITE_` prefixed variables are set
   - Check Discord redirect URI matches deployment URL

3. **Build Failures**:
   - Run `npm run build` locally first
   - Check prebuild validation passes

### Support

- **GitHub Issues**: [Report issues](https://github.com/questlog/questlog-frontend/issues)
- **Documentation**: [Full README](./README.md)
- **Discord**: Join our community server
