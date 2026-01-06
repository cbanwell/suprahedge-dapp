# Vercel Deployment Guide

This project is now ready to deploy on Vercel. Follow these steps:

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your repository pushed to GitHub, GitLab, or Bitbucket

## Deployment Steps

### 1. Connect Your Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect Next.js

### 2. Configure Environment Variables

In the Vercel project settings, add these environment variables:

- `NEXT_PUBLIC_SUPRA_RPC` - Your Supra RPC endpoint (default: `https://rpc.supra.com`)
- `NEXT_PUBLIC_VAULT_ADDRESS` - Your vault contract address
- `NEXT_PUBLIC_USDC_ADDRESS` - Your USDC contract address

**To add environment variables:**
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add each variable for Production, Preview, and Development environments

### 3. Deploy

1. Click "Deploy"
2. Vercel will automatically:
   - Install dependencies (`npm install`)
   - Build the project (`npm run build`)
   - Deploy to production

### 4. Custom Domain (Optional)

If you have a custom domain (e.g., `suprahedge.online`):

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions

## What Was Changed for Vercel

1. ✅ Added missing `viem` dependency
2. ✅ Fixed duplicate scripts in `package.json`
3. ✅ Updated start script to use `next start` (Vercel handles this automatically)
4. ✅ Removed `output: 'standalone'` from `next.config.mjs` (not needed for Vercel)
5. ✅ Created `vercel.json` for framework detection

## Notes

- The `server.js` file is not used on Vercel (Vercel uses serverless functions automatically)
- All `NEXT_PUBLIC_*` environment variables are automatically available at build time
- The app uses client-side rendering, so no special server configuration is needed

## Troubleshooting

If deployment fails:

1. Check that all environment variables are set correctly
2. Verify Node.js version (project requires >= 20.x)
3. Check build logs in Vercel dashboard for specific errors
4. Ensure all dependencies are listed in `package.json`

