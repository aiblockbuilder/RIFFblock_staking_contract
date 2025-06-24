# RIFFStaking Smart Contract

A Solidity smart contract for staking RIFF tokens on Riff NFTs (ERC-721), enabling fan engagement and DeFi mechanics on the Polygon blockchain.

## Overview

The RIFFStaking contract allows users to:
- Stake RIFF tokens on specific Riff NFTs
- Earn performance-based rewards from NFT sales and tips
- Unstake tokens after a 30-day lock period
- Claim accumulated rewards

The contract implements a fair reward distribution mechanism using a rewards-per-token-staked accumulator pattern.

## Contract Architecture

### Core Contracts

1. **RIFFStaking.sol** - Main staking contract
2. **MockRIFF.sol** - Mock ERC20 token for testing
3. **MockRiffNFT.sol** - Mock ERC721 NFT for testing

### Key Features

- **Minimum Stake**: 100,000 RIFF tokens
- **Lock Duration**: 30 days
- **Revenue Distribution**:
  - Platform Fee: 5%
  - Stakers Share: 15%
  - Artist Share: 80%
- **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
- **Ownership Control**: Uses OpenZeppelin's Ownable

## Deployment Status

### Amoy Testnet (Chain ID: 80002)

All contracts have been successfully deployed and verified:

| Contract | Address | Status |
|----------|---------|--------|
| **RIFFStaking** | `0x18a885878fB241819a8f48E7a9C050a40e04F82A` | ✅ Deployed & Verified |
| **MockRiffNFT** | `0x24EE812B083dD6514cf09c51AD8Bad3c9cBCE04c` | ✅ Deployed & Verified |
| **MockRIFF** | `0x963c4c0090831fcadba1fb7163efdde582f8de94` | ✅ Deployed & Verified |
| **Platform Wallet** | `0xef4f590409347fE4341097CEBB18e01B16168789` | ✅ Configured |

### Explorer Links

- **Amoy Testnet Explorer**: https://www.oklink.com/amoy/
- **RIFFStaking Contract**: https://www.oklink.com/amoy/address/0x18a885878fB241819a8f48E7a9C050a40e04F82A
- **MockRiffNFT Contract**: https://www.oklink.com/amoy/address/0x24EE812B083dD6514cf09c51AD8Bad3c9cBCE04c
- **MockRIFF Contract**: https://www.oklink.com/amoy/address/0x963c4c0090831fcadba1fb7163efdde582f8de94

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hardhat
- MATIC tokens for gas fees
- Private key for deployment

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd staking_contract

# Install dependencies
npm install
```

## Environment Setup

Create a `.env` file in the root directory:

```env
# Private key of the deployer account (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs (optional - defaults will be used if not provided)
POLYGON_RPC_URL=https://polygon-rpc.com
AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# PolygonScan API Key for contract verification
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

## Usage

### Compilation

```bash
npx hardhat compile
```

### Testing

```bash
# Run all tests
npx hardhat test

# Test environment setup
npm run test-setup
```

### Deployment

```bash
# Deploy to Amoy testnet
npm run deploy:amoy

# Deploy to Polygon mainnet
npm run deploy:polygon

# Deploy locally
npm run deploy:local
```

### Contract Verification

```bash
# Generate verification commands
npm run verify:amoy

# Verify on Polygon mainnet
npm run verify:polygon
```

## Contract Functions

### Core Staking Functions

- `stakeOnRiff(uint256 _tokenId, uint256 _amount)` - Stake RIFF tokens on an NFT
- `unstakeFromRiff(uint256 _tokenId)` - Unstake tokens after lock period
- `claimRewards(uint256 _tokenId)` - Claim accumulated rewards

### Reward Distribution

- `distributeRevenue(uint256 _tokenId, uint256 _totalRevenueAmount)` - Distribute revenue to artist, stakers, and platform

### View Functions

- `getStake(uint256 _tokenId, address _user)` - Get stake details for a user
- `earned(uint256 _tokenId, address _account)` - Calculate earned rewards
- `rewardPerToken(uint256 _tokenId)` - Get current reward per token

## Testing the Contracts

### 1. Get Test MATIC

Visit the Polygon faucet: https://faucet.polygon.technology/

### 2. Mint Test Tokens

```javascript
// Mint MockRIFF tokens
const riffToken = await ethers.getContractAt("MockRIFF", "0x963c4c0090831fcadba1fb7163efdde582f8de94");
await riffToken.mint(userAddress, ethers.parseEther("1000000"));

// Mint MockRiffNFT
const riffNFT = await ethers.getContractAt("MockRiffNFT", "0x24EE812B083dD6514cf09c51AD8Bad3c9cBCE04c");
await riffNFT.mint(artistAddress);
```

### 3. Stake Tokens

```javascript
const stakingContract = await ethers.getContractAt("RIFFStaking", "0x18a885878fB241819a8f48E7a9C050a40e04F82A");

// Approve tokens
await riffToken.approve(stakingContract.address, ethers.parseEther("100000"));

// Stake on NFT token ID 0
await stakingContract.stakeOnRiff(0, ethers.parseEther("100000"));
```

## Security Features

- **Reentrancy Protection**: Prevents reentrancy attacks
- **Ownership Control**: Only owner can distribute revenue
- **Input Validation**: Comprehensive parameter validation
- **Safe Math**: Built-in overflow protection (Solidity 0.8+)
- **Access Control**: Restricted function access

## Gas Optimization

- Efficient storage patterns
- Minimal external calls
- Optimized data structures
- Batch operations where possible

## Network Information

- **Polygon Mainnet**: Chain ID 137
- **Amoy Testnet**: Chain ID 80002
- **Block Time**: ~2 seconds
- **Gas Token**: MATIC

## Development Commands

```bash
# Clean build artifacts
npm run clean

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to testnet
npm run deploy:amoy

# Generate verification commands
npm run verify:amoy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue in the repository.

## Disclaimer

This software is provided "as is" without warranty. Use at your own risk. Always test thoroughly on testnets before deploying to mainnet. 