# Vercel Environment Variables Setup for deltahedge.it.com

## Required Environment Variables

Add these **3 environment variables** in your Vercel project settings:

### 1. `NEXT_PUBLIC_SUPRA_RPC`
**Purpose:** RPC endpoint for connecting to Supra blockchain

**Value:**
```
https://rpc.supra.com
```
*(Or your custom Supra RPC endpoint if you have one)*

---

### 2. `NEXT_PUBLIC_VAULT_ADDRESS`
**Purpose:** Your ERC4626 vault contract address on Supra network

**Value:**
```
0xYourActualVaultContractAddress
```
**Example format:**
```
0x1234567890123456789012345678901234567890
```

**How to get this:**
- This is the address of your deployed vault smart contract
- Should be a valid Ethereum address (0x followed by 40 hex characters)

---

### 3. `NEXT_PUBLIC_USDC_ADDRESS`
**Purpose:** USDC token contract address on Supra network

**Value:**
```
0xYourActualUSDCContractAddress
```
**Example format:**
```
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
```

**How to get this:**
- This is the official USDC contract address on Supra network
- Check Supra network documentation or block explorer for the correct address

---

## How to Add in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. For each variable:
   - **Key:** Enter the variable name (e.g., `NEXT_PUBLIC_SUPRA_RPC`)
   - **Value:** Enter the actual value
   - **Environment:** Select all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
4. Click **Save**
5. **Redeploy** your application for changes to take effect

## Important Notes

⚠️ **All variables must start with `NEXT_PUBLIC_`** - This prefix makes them available in the browser

⚠️ **After adding variables, you MUST redeploy** - Environment variables are baked in at build time

⚠️ **No quotes needed** - Don't wrap values in quotes when adding in Vercel

⚠️ **Case sensitive** - Variable names are case-sensitive, use exact names shown above

## Verification

After deployment, check:
1. Visit `https://deltahedge.it.com`
2. The app should load without errors
3. If vault/USDC addresses are missing, you'll see a hint message on the page
4. Wallet connection and contract interactions should work once addresses are set

## Troubleshooting

**App shows "Set NEXT_PUBLIC_VAULT_ADDRESS..." message:**
- Environment variables not set or not redeployed
- Check Vercel deployment logs for build errors

**Contract calls failing:**
- Verify contract addresses are correct for Supra network
- Check that addresses are valid (0x followed by 40 hex characters)
- Ensure contracts are deployed on Supra network

**RPC connection issues:**
- Verify `NEXT_PUBLIC_SUPRA_RPC` is correct
- Check if RPC endpoint is accessible
- Try alternative Supra RPC endpoints if available


