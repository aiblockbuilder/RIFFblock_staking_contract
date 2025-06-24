import { ethers } from "hardhat";

async function main() {
  const network = await ethers.provider.getNetwork();
  
  console.log("=== Contract Verification ===");
  console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("");

  // Replace these addresses with your actual deployed contract addresses
  const RIFF_TOKEN_ADDRESS = "0x963c4c0090831fcadba1fb7163efdde582f8de94"; // Your deployed MockRIFF address
  const RIFF_NFT_ADDRESS = "0x24EE812B083dD6514cf09c51AD8Bad3c9cBCE04c"; // Replace with your deployed MockRiffNFT address
  const STAKING_CONTRACT_ADDRESS = "0x18a885878fB241819a8f48E7a9C050a40e04F82A"; // Replace with your deployed RIFFStaking address
  const PLATFORM_WALLET = "0xef4f590409347fE4341097CEBB18e01B16168789"; // Replace with your platform wallet address
  const PLATFORM_FEE = 5;
  const STAKERS_SHARE = 15;

  console.log("Contract Addresses:");
  console.log("RIFF Token:", RIFF_TOKEN_ADDRESS);
  console.log("Riff NFT:", RIFF_NFT_ADDRESS);
  console.log("Staking Contract:", STAKING_CONTRACT_ADDRESS);
  console.log("Platform Wallet:", PLATFORM_WALLET);
  console.log("");

  console.log("=== Verification Commands ===");
  console.log("To verify the RIFFStaking contract, run:");
  console.log(`npx hardhat verify --network ${network.name} ${STAKING_CONTRACT_ADDRESS} "${RIFF_TOKEN_ADDRESS}" "${RIFF_NFT_ADDRESS}" "${PLATFORM_WALLET}" ${PLATFORM_FEE} ${STAKERS_SHARE}`);
  console.log("");
  
  console.log("To verify the MockRIFF contract, run:");
  console.log(`npx hardhat verify --network ${network.name} ${RIFF_TOKEN_ADDRESS}`);
  console.log("");
  
  console.log("To verify the MockRiffNFT contract, run:");
  console.log(`npx hardhat verify --network ${network.name} ${RIFF_NFT_ADDRESS}`);
  console.log("");

  // PolygonScan links
  if (network.chainId === 80002n) {
    console.log("=== PolygonScan Links ===");
    console.log("Amoy Testnet Explorer:");
    console.log(`https://www.oklink.com/amoy/address/${STAKING_CONTRACT_ADDRESS}`);
    console.log(`https://www.oklink.com/amoy/address/${RIFF_TOKEN_ADDRESS}`);
    console.log(`https://www.oklink.com/amoy/address/${RIFF_NFT_ADDRESS}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 