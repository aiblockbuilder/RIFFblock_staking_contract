import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  // Use deployer as platform wallet if no second signer is available
  const platform = deployer;

  console.log("=== RIFFStaking Contract Deployment ===");
  console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("Deployer address:", deployer.address);
  console.log("Platform wallet:", platform.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");
  console.log("");

  // 1. Deploy MockRIFF (ERC20)
  console.log("1. Deploying MockRIFF token...");
  // const MockRIFF = await ethers.getContractFactory("MockRIFF");
  // const riffToken = await MockRIFF.deploy();
  // await riffToken.waitForDeployment();
  // console.log("   MockRIFF deployed to:", await riffToken.getAddress());
  // console.log("   Transaction hash:", riffToken.deploymentTransaction()?.hash);
  // console.log("");

  // 2. Deploy MockRiffNFT (ERC721)
  console.log("2. Deploying MockRiffNFT...");
  const MockRiffNFT = await ethers.getContractFactory("MockRiffNFT");
  const riffNFT = await MockRiffNFT.deploy();
  await riffNFT.waitForDeployment();
  console.log("   MockRiffNFT deployed to:", await riffNFT.getAddress());
  console.log("   Transaction hash:", riffNFT.deploymentTransaction()?.hash);
  console.log("");

  // 3. Deploy RIFFStaking contract
  console.log("3. Deploying RIFFStaking contract...");
  const platformFee = 5; // 5%
  const stakersShare = 15; // 15%
  const platformWallet = platform.address;

  const RIFFStaking = await ethers.getContractFactory("RIFFStaking");
  const riffTokenAddress = "0x963c4c0090831fcadba1fb7163efdde582f8de94"
  
  // Use the deployed MockRIFF token address
  // const riffTokenAddress = await riffToken.getAddress();

  // Estimate gas for deployment
  const deploymentData = RIFFStaking.interface.encodeDeploy([
    riffTokenAddress,
    await riffNFT.getAddress(),
    platformWallet,
    platformFee,
    stakersShare
  ]);
  const estimatedGas = await ethers.provider.estimateGas({
    from: deployer.address,
    data: deploymentData
  });
  console.log("   Estimated gas:", estimatedGas.toString());

  const stakingContract = await RIFFStaking.deploy(
    riffTokenAddress,
    await riffNFT.getAddress(),
    platformWallet,
    platformFee,
    stakersShare
  );
  await stakingContract.waitForDeployment();
  console.log("   RIFFStaking deployed to:", await stakingContract.getAddress());
  console.log("   Transaction hash:", stakingContract.deploymentTransaction()?.hash);
  console.log("");

  // Final deployment summary
  console.log("=== Deployment Summary ===");
  console.log("Network:", network.name);
  console.log("RIFF Token:", riffTokenAddress);
  console.log("Riff NFT:", await riffNFT.getAddress());
  console.log("Staking Contract:", await stakingContract.getAddress());
  console.log("Platform Wallet:", platformWallet);
  console.log("Platform Fee:", platformFee + "%");
  console.log("Stakers Share:", stakersShare + "%");
  console.log("Artist Share:", (100 - platformFee - stakersShare) + "%");
  console.log("");

  // PolygonScan verification links
  if (network.chainId === 137n) {
    console.log("=== PolygonScan Links ===");
    console.log("Mainnet Explorer:");
    console.log(`https://polygonscan.com/address/${await stakingContract.getAddress()}`);
  } else if (network.chainId === 80002n) {
    console.log("=== PolygonScan Links ===");
    console.log("Amoy Testnet Explorer:");
    console.log(`https://www.oklink.com/amoy/address/${await stakingContract.getAddress()}`);
  }

  console.log("");
  console.log("=== Verification Commands ===");
  console.log("To verify on PolygonScan, run:");
  console.log(`npx hardhat verify --network ${network.name} ${await stakingContract.getAddress()} "${riffTokenAddress}" "${await riffNFT.getAddress()}" "${platformWallet}" ${platformFee} ${stakersShare}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 