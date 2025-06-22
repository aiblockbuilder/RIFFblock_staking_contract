import { ethers, network } from "hardhat";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";

// Type imports for clarity
type MockRIFF = Contract;
type MockRiffNFT = Contract;
type RIFFStaking = Contract;

describe("RIFFStaking Contract", function () {
    // Shared variables for tests
    let owner: HardhatEthersSigner,
        artist: HardhatEthersSigner,
        staker1: HardhatEthersSigner,
        staker2: HardhatEthersSigner,
        platform: HardhatEthersSigner;

    let riffToken: MockRIFF,
        riffNFT: MockRiffNFT,
        stakingContract: RIFFStaking;
    
    const platformFee = 5;
    const stakersShare = 15;
    const minStakeAmount = ethers.parseEther("100000"); // MIN_STAKE_AMOUNT

    // Deploy contracts and set up accounts before each test
    beforeEach(async function () {
        [owner, artist, staker1, staker2, platform] = await ethers.getSigners();

        // Deploy MockRIFF
        const MockRIFFFactory = await ethers.getContractFactory("MockRIFF");
        riffToken = (await MockRIFFFactory.deploy()) as MockRIFF;

        // Deploy MockRiffNFT
        const MockRiffNFTFactory = await ethers.getContractFactory("MockRiffNFT");
        riffNFT = (await MockRiffNFTFactory.deploy()) as MockRiffNFT;

        // Deploy RIFFStaking
        const RIFFStakingFactory = await ethers.getContractFactory("RIFFStaking");
        stakingContract = (await RIFFStakingFactory.deploy(
            await riffToken.getAddress(),
            await riffNFT.getAddress(),
            platform.address,
            platformFee,
            stakersShare
        )) as RIFFStaking;

        // Prepare for tests: mint tokens and NFTs
        await (riffToken as any).mint(staker1.address, ethers.parseEther("1000000"));
        await (riffToken as any).mint(staker2.address, ethers.parseEther("1000000"));
        await (riffNFT as any).connect(artist).mint(artist.address); // tokenId 0
    });

    describe("Deployment", function () {
        it("Should set the correct token and NFT addresses", async function () {
            expect(await stakingContract.riffToken()).to.equal(await riffToken.getAddress());
            expect(await stakingContract.riffNFT()).to.equal(await riffNFT.getAddress());
        });

        it("Should set the correct fee percentages and platform wallet", async function () {
            expect(await stakingContract.platformFeePercentage()).to.equal(platformFee);
            expect(await stakingContract.stakersSharePercentage()).to.equal(stakersShare);
            expect(await stakingContract.artistSharePercentage()).to.equal(100 - platformFee - stakersShare);
            expect(await stakingContract.platformWallet()).to.equal(platform.address);
        });
    });

    describe("Staking", function () {
        beforeEach(async function () {
            await (riffToken as any).connect(staker1).approve(await stakingContract.getAddress(), minStakeAmount);
        });
        
        it("Should allow a user to stake RIFF on an NFT", async function () {
            await expect((stakingContract as any).connect(staker1).stakeOnRiff(0, minStakeAmount))
                .to.emit(stakingContract, "Staked")
                .withArgs(0, staker1.address, minStakeAmount);
            
            const stake = await (stakingContract as any).getStake(0, staker1.address);
            expect(stake.amount).to.equal(minStakeAmount);
            expect(await (stakingContract as any).totalStakedPerRiff(0)).to.equal(minStakeAmount);
        });

        it("Should fail if stake amount is less than the minimum", async function () {
            const smallAmount = ethers.parseEther("99999");
            await expect((stakingContract as any).connect(staker1).stakeOnRiff(0, smallAmount))
                .to.be.revertedWith("Amount is below minimum stake");
        });

        it("Should fail if an artist tries to stake on their own riff", async function () {
            await (riffToken as any).mint(artist.address, minStakeAmount);
            await (riffToken as any).connect(artist).approve(await stakingContract.getAddress(), minStakeAmount);

            await expect((stakingContract as any).connect(artist).stakeOnRiff(0, minStakeAmount))
                .to.be.revertedWith("Cannot stake on your own riff");
        });
    });

    describe("Unstaking", function () {
        beforeEach(async function () {
            await (riffToken as any).connect(staker1).approve(await stakingContract.getAddress(), minStakeAmount);
            await (stakingContract as any).connect(staker1).stakeOnRiff(0, minStakeAmount);
        });

        it("Should fail if trying to unstake before lock duration ends", async function () {
            await expect((stakingContract as any).connect(staker1).unstakeFromRiff(0))
                .to.be.revertedWith("Stake is still locked");
        });

        it("Should allow unstaking after the lock duration has passed", async function () {
            // Fast forward time
            const lockDuration = await (stakingContract as any).LOCK_DURATION();
            await time.increase(lockDuration);

            await expect((stakingContract as any).connect(staker1).unstakeFromRiff(0))
                .to.emit(stakingContract, "Unstaked")
                .withArgs(0, staker1.address, minStakeAmount);

            const stake = await (stakingContract as any).getStake(0, staker1.address);
            expect(stake.amount).to.equal(0);
            expect(await (riffToken as any).balanceOf(staker1.address)).to.equal(ethers.parseEther("1000000"));
        });
    });

    describe("Reward Distribution and Claiming", function () {
        const revenue = ethers.parseEther("100");

        beforeEach(async function () {
            // Staker 1 stakes 100k, Staker 2 stakes 300k
            const stake1Amount = minStakeAmount;
            const stake2Amount = ethers.parseEther("300000");

            await (riffToken as any).connect(staker1).approve(await stakingContract.getAddress(), stake1Amount);
            await (riffToken as any).connect(staker2).approve(await stakingContract.getAddress(), stake2Amount);

            await (stakingContract as any).connect(staker1).stakeOnRiff(0, stake1Amount);
            await (stakingContract as any).connect(staker2).stakeOnRiff(0, stake2Amount);

            // The owner (simulating marketplace) gets revenue and approves contract to spend it
            await (riffToken as any).mint(owner.address, revenue);
            await (riffToken as any).connect(owner).approve(await stakingContract.getAddress(), revenue);
        });

        it("Should distribute revenue correctly to artist, platform, and stakers pool", async function () {
            const artistInitialBalance = await (riffToken as any).balanceOf(artist.address);
            const platformInitialBalance = await (riffToken as any).balanceOf(platform.address);
            const contractInitialBalance = await (riffToken as any).balanceOf(await stakingContract.getAddress());

            await (stakingContract as any).connect(owner).distributeRevenue(0, revenue);

            // Calculate expected shares
            const expectedStakersShare = revenue * BigInt(stakersShare) / 100n;
            const expectedPlatformShare = revenue * BigInt(platformFee) / 100n;
            const expectedArtistShare = revenue - expectedStakersShare - expectedPlatformShare;
            
            // Check balances
            expect(await (riffToken as any).balanceOf(artist.address)).to.equal(artistInitialBalance + expectedArtistShare);
            expect(await (riffToken as any).balanceOf(platform.address)).to.equal(platformInitialBalance + expectedPlatformShare);
            // Stakers' share is now held by the contract
            expect(await (riffToken as any).balanceOf(await stakingContract.getAddress())).to.equal(contractInitialBalance + expectedStakersShare);
        });

        it("Should allow stakers to claim their pro-rata rewards", async function () {
            await (stakingContract as any).connect(owner).distributeRevenue(0, revenue);

            const expectedStakersShare = revenue * BigInt(stakersShare) / 100n;
            
            // Staker 1 has 1/4 of the total stake (100k / 400k)
            const expectedReward1 = expectedStakersShare / 4n; 
            // Staker 2 has 3/4 of the total stake (300k / 400k)
            const expectedReward2 = expectedStakersShare * 3n / 4n;

            // Check earned amount before claiming
            expect(await (stakingContract as any).earned(0, staker1.address)).to.be.closeTo(expectedReward1, ethers.parseEther("0.00001"));
            expect(await (stakingContract as any).earned(0, staker2.address)).to.be.closeTo(expectedReward2, ethers.parseEther("0.00001"));

            // Stakers claim rewards
            const staker1InitialBalance = await (riffToken as any).balanceOf(staker1.address);
            await (stakingContract as any).connect(staker1).claimRewards(0);
            expect(await (riffToken as any).balanceOf(staker1.address)).to.be.closeTo(staker1InitialBalance + expectedReward1, ethers.parseEther("0.00001"));

            const staker2InitialBalance = await (riffToken as any).balanceOf(staker2.address);
            await (stakingContract as any).connect(staker2).claimRewards(0);
            expect(await (riffToken as any).balanceOf(staker2.address)).to.be.closeTo(staker2InitialBalance + expectedReward2, ethers.parseEther("0.00001"));

            // Rewards should be zero after claiming
            expect(await (stakingContract as any).earned(0, staker1.address)).to.equal(0);
        });
    });
}); 