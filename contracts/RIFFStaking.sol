// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RIFFStaking
 * @author RIFFblock Team
 * @notice This contract handles the staking of $RIFF tokens on Riff NFTs (ERC-721).
 * It allows users to stake, unstake, and claim performance-based rewards,
 * fostering a unique blend of fan engagement and DeFi mechanics.
 *
 * The reward distribution mechanism is based on a standard rewards-per-token-staked
 * accumulator pattern to ensure fair, pro-rata distribution of rewards to all stakers
 * over time.
 */
contract RIFFStaking is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    /* ========== STATE VARIABLES ========== */

    IERC20 public immutable riffToken;
    IERC721 public immutable riffNFT;

    // Staking configuration
    uint256 public constant MIN_STAKE_AMOUNT = 100_000 * 1e18; // 100,000 RIFF
    uint256 public constant LOCK_DURATION = 30 days;

    // Revenue distribution shares
    uint256 public immutable platformFeePercentage;
    uint256 public immutable stakersSharePercentage;
    uint256 public immutable artistSharePercentage;
    address public immutable platformWallet;

    // Staking data structures
    struct StakeInfo {
        uint256 amount;
        uint256 stakeTime;
    }
    mapping(uint256 => mapping(address => StakeInfo)) public stakeDetails;
    mapping(uint256 => uint256) public totalStakedPerRiff;

    // Reward data structures for fair distribution
    mapping(uint256 => uint256) public rewardPerTokenStored;
    mapping(uint256 => mapping(address => uint256)) public userRewardPerTokenPaid;
    mapping(uint256 => mapping(address => uint256)) public rewards;


    /* ========== EVENTS ========== */

    event Staked(uint256 indexed tokenId, address indexed user, uint256 amount);
    event Unstaked(uint256 indexed tokenId, address indexed user, uint256 amount);
    event RewardClaimed(uint256 indexed tokenId, address indexed user, uint256 rewardAmount);
    event RevenueDistributed(uint256 indexed tokenId, address indexed from, uint256 artistShare, uint256 stakersShare, uint256 platformShare);


    /* ========== MODIFIERS ========== */
    
    modifier updateReward(uint256 _tokenId, address _account) {
        rewardPerTokenStored[_tokenId] = rewardPerToken(_tokenId);
        rewards[_account] = earned(_tokenId, _account);
        userRewardPerTokenPaid[_tokenId][_account] = rewardPerTokenStored[_tokenId];
        _;
    }

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _riffTokenAddress,
        address _riffNFTAddress,
        address _platformWallet,
        uint256 _platformFee,
        uint256 _stakersShare
    ) Ownable(msg.sender) {
        require(_riffTokenAddress != address(0), "RIFF token address cannot be zero");
        require(_riffNFTAddress != address(0), "Riff NFT address cannot be zero");
        require(_platformWallet != address(0), "Platform wallet address cannot be zero");
        
        uint256 totalShare = _platformFee + _stakersShare;
        require(totalShare < 100, "Platform and staker share must be less than 100%");

        riffToken = IERC20(_riffTokenAddress);
        riffNFT = IERC721(_riffNFTAddress);
        platformWallet = _platformWallet;

        platformFeePercentage = _platformFee;
        stakersSharePercentage = _stakersShare;
        artistSharePercentage = 100 - totalShare;
    }


    /* ========== CORE STAKING FUNCTIONS ========== */

    /**
     * @notice Stakes a specified amount of RIFF tokens on a given Riff NFT.
     * @dev The staked amount is locked for LOCK_DURATION (30 days).
     * @param _tokenId The ID of the NFT to stake on.
     * @param _amount The amount of RIFF tokens to stake (must meet MIN_STAKE_AMOUNT).
     */
    function stakeOnRiff(uint256 _tokenId, uint256 _amount) external nonReentrant updateReward(_tokenId, msg.sender) {
        require(_amount >= MIN_STAKE_AMOUNT, "Amount is below minimum stake");
        require(riffNFT.ownerOf(_tokenId) != msg.sender, "Cannot stake on your own riff");

        totalStakedPerRiff[_tokenId] = totalStakedPerRiff[_tokenId].add(_amount);
        stakeDetails[_tokenId][msg.sender].amount = stakeDetails[_tokenId][msg.sender].amount.add(_amount);
        stakeDetails[_tokenId][msg.sender].stakeTime = block.timestamp;

        riffToken.transferFrom(msg.sender, address(this), _amount);

        emit Staked(_tokenId, msg.sender, _amount);
    }

    /**
     * @notice Unstakes all RIFF tokens from a given Riff NFT.
     * @dev The stake must be past its lock duration. Rewards must be claimed separately.
     * @param _tokenId The ID of the NFT to unstake from.
     */
    function unstakeFromRiff(uint256 _tokenId) external nonReentrant updateReward(_tokenId, msg.sender) {
        StakeInfo storage stake = stakeDetails[_tokenId][msg.sender];
        uint256 amountToUnstake = stake.amount;
        
        require(amountToUnstake > 0, "No amount staked");
        require(block.timestamp >= stake.stakeTime + LOCK_DURATION, "Stake is still locked");

        totalStakedPerRiff[_tokenId] = totalStakedPerRiff[_tokenId].sub(amountToUnstake);
        delete stakeDetails[_tokenId][msg.sender];

        riffToken.transfer(msg.sender, amountToUnstake);

        emit Unstaked(_tokenId, msg.sender, amountToUnstake);
    }

    
    /* ========== REWARD FUNCTIONS ========== */

    /**
     * @notice Distributes revenue from a sale or tip to the artist, stakers, and platform.
     * @dev Can only be called by the contract owner (e.g., a marketplace contract).
     * The caller must have approved the staking contract to spend the revenue amount.
     * @param _tokenId The ID of the NFT that generated the revenue.
     * @param _totalRevenueAmount The total amount of RIFF revenue to distribute.
     */
    function distributeRevenue(uint256 _tokenId, uint256 _totalRevenueAmount) external onlyOwner {
        require(_totalRevenueAmount > 0, "Revenue must be positive");

        uint256 stakersShare = _totalRevenueAmount.mul(stakersSharePercentage).div(100);
        uint256 platformShare = _totalRevenueAmount.mul(platformFeePercentage).div(100);
        uint256 artistShare = _totalRevenueAmount.sub(stakersShare).sub(platformShare);
        
        address artist = riffNFT.ownerOf(_tokenId);

        // Transfer shares from the source (caller)
        riffToken.transferFrom(msg.sender, artist, artistShare);
        riffToken.transferFrom(msg.sender, platformWallet, platformShare);
        riffToken.transferFrom(msg.sender, address(this), stakersShare);

        // Update rewards for stakers
        if (totalStakedPerRiff[_tokenId] > 0) {
            rewardPerTokenStored[_tokenId] = rewardPerTokenStored[_tokenId].add(
                stakersShare.mul(1e18).div(totalStakedPerRiff[_tokenId])
            );
        }

        emit RevenueDistributed(_tokenId, msg.sender, artistShare, stakersShare, platformShare);
    }

    /**
     * @notice Claims all available rewards for the user on a specific Riff NFT.
     * @param _tokenId The ID of the NFT to claim rewards from.
     */
    function claimRewards(uint256 _tokenId) external nonReentrant updateReward(_tokenId, msg.sender) {
        uint256 reward = rewards[_tokenId][msg.sender];
        if (reward > 0) {
            rewards[_tokenId][msg.sender] = 0;
            riffToken.transfer(msg.sender, reward);
            emit RewardClaimed(_tokenId, msg.sender, reward);
        }
    }


    /* ========== VIEW FUNCTIONS ========== */

    /**
     * @notice Calculates the total rewards earned by a user for a specific riff.
     * @param _tokenId The ID of the NFT.
     * @param _account The address of the user.
     * @return The total rewards earned.
     */
    function earned(uint256 _tokenId, address _account) public view returns (uint256) {
        uint256 currentRewardPerToken = rewardPerToken(_tokenId);
        uint256 userPaidPerToken = userRewardPerTokenPaid[_tokenId][_account];
        uint256 userStake = stakeDetails[_tokenId][_account].amount;
        
        return userStake.mul(currentRewardPerToken.sub(userPaidPerToken)).div(1e18).add(rewards[_tokenId][_account]);
    }

    /**
     * @notice Calculates the current reward-per-token for a given riff.
     * @param _tokenId The ID of the NFT.
     * @return The reward-per-token value.
     */
    function rewardPerToken(uint256 _tokenId) public view returns (uint256) {
        if (totalStakedPerRiff[_tokenId] == 0) {
            return rewardPerTokenStored[_tokenId];
        }
        // This function is simple in this model but can be expanded if rewards
        // were to come from multiple sources or accrue over time without an explicit
        // distributeRevenue call.
        return rewardPerTokenStored[_tokenId];
    }

    /**
     * @notice Retrieves the stake details for a user on a specific Riff NFT.
     * @param _tokenId The ID of the NFT.
     * @param _user The address of the user.
     * @return amount The amount staked.
     * @return stakeTime The timestamp of the last stake action.
     * @return unlockTime The timestamp when the stake becomes available for withdrawal.
     */
    function getStake(uint256 _tokenId, address _user) public view returns (uint256 amount, uint256 stakeTime, uint256 unlockTime) {
        StakeInfo storage stake = stakeDetails[_tokenId][_user];
        amount = stake.amount;
        stakeTime = stake.stakeTime;
        unlockTime = stake.amount > 0 ? stake.stakeTime + LOCK_DURATION : 0;
    }
} 