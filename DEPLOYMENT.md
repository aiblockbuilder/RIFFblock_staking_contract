# RIFFStaking Contract Deployment Guide

## Prerequisites

1. **Node.js and npm** installed
2. **Hardhat** project setup (already done)
3. **MATIC tokens** for gas fees on Polygon
4. **Private key** of the deployer account

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Private key of the deployer account (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs (optional - defaults will be used if not provided)
POLYGON_RPC_URL=https://polygon-rpc.com
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com

# PolygonScan API Key for contract verification
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

## Installation

```bash
npm install
```

## Compilation

```bash
npx hardhat compile
```

## Testing

```bash
npx hardhat test
```

## Deployment

### To Amoy Testnet (Recommended for testing)

```bash
npx hardhat run scripts/deploy.ts --network amoy
```

### To Mumbai Testnet (Legacy)

```bash
npx hardhat run scripts/deploy.ts --network mumbai
```

### To Polygon Mainnet

```bash
npx hardhat run scripts/deploy.ts --network polygon
```

## Contract Verification

After deployment, verify your contracts on PolygonScan:

```bash
# For Amoy testnet
npx hardhat verify --network amoy DEPLOYED_CONTRACT_ADDRESS "RIFF_TOKEN_ADDRESS" "RIFF_NFT_ADDRESS" "PLATFORM_WALLET_ADDRESS" 5 15

# For Mumbai testnet
npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS "RIFF_TOKEN_ADDRESS" "RIFF_NFT_ADDRESS" "PLATFORM_WALLET_ADDRESS" 5 15
```

Replace the parameters with your actual deployed addresses and configuration.

## Deployment Output

The deployment script will output:
- MockRIFF token address
- MockRiffNFT address  
- RIFFStaking contract address
- Platform wallet address
- Fee percentages

## Important Notes

1. **Gas Fees**: Ensure your deployer account has sufficient MATIC for gas fees
2. **Real Contracts**: Replace mock contracts with actual RIFF token and NFT addresses for production
3. **Security**: Never commit your `.env` file to version control
4. **Testing**: Always test on Amoy testnet before deploying to mainnet

## Network Information

- **Polygon Mainnet**: Chain ID 137
- **Amoy Testnet**: Chain ID 80002 (new testnet)
- **Mumbai Testnet**: Chain ID 80001 (legacy)
- **Block Time**: ~2 seconds
- **Gas Token**: MATIC

## Quick Commands

```bash
# Deploy to Amoy testnet
npm run deploy:amoy

# Deploy to Mumbai testnet
npm run deploy:mumbai

# Deploy to Polygon mainnet
npm run deploy:polygon

# Verify on Amoy
npm run verify:amoy

# Verify on Mumbai
npm run verify:mumbai

# Verify on Polygon mainnet
npm run verify:polygon
``` 