import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Testing Environment Setup ===");
  
  try {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    
    console.log("✅ Signer loaded successfully");
    console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");
    
    if (await ethers.provider.getBalance(deployer.address) === 0n) {
      console.log("⚠️  Warning: Deployer has 0 MATIC balance");
      console.log("   Get test MATIC from: https://faucet.polygon.technology/");
    } else {
      console.log("✅ Sufficient balance for deployment");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
    console.log("");
    console.log("Troubleshooting:");
    console.log("1. Make sure you have a .env file with PRIVATE_KEY");
    console.log("2. Make sure your private key is correct (without 0x prefix)");
    console.log("3. Make sure you have test MATIC for gas fees");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 