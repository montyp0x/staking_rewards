// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Inheritance
import "./interfaces/IStakingRewards.sol";
import "./RewardsDistributionRecipient.sol";
import "hardhat/console.sol";

contract AutoCompoundStaking is RewardsDistributionRecipient, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */

    IERC20 public stakingToken;
    uint256 public periodFinish = 0; // finish of staking. Initialized by rewards distributor
    uint256 public rewardRate = 0; // balance / rewardsDuration (kinda reward for whole pool per second)
    uint256 public rewardsDuration = 50; // TODO: 60 days
    uint256 public lastUpdateTime;
    uint256 public lastPoolUpdateTime = 1e18;
    uint256 public multiplierStored = 1e18; // means how much one token cost before last pool change(stake/withdraw)

    mapping(address => uint256) public userMultiplierPaid; // actually, it represents previous reward per token

    uint256 private _totalSupply; // in staking tokens
    mapping(address => uint256) private _balances; // stakers balances in staking tokens

    /* ========== CONSTRUCTOR ========== */

    constructor(address _rewardsDistribution, address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
        rewardsDistribution = _rewardsDistribution;
    }

    /* ========CUSTOM VIEWS======= */

    function _periodFinish() external view returns (uint256) {
        return periodFinish;
    }

    function _lastUpdateTime() external view returns (uint256) {
        return lastUpdateTime;
    }

    function _rewardRate() external view returns (uint256) {
        return rewardRate;
    }

    function _multiplierStored() external view returns (uint256) {
        return multiplierStored;
    }

    function _userMultiplierPaid(
        address _address
    ) external view returns (uint256) {
        return userMultiplierPaid[_address];
    }

    function _time() external view returns (uint256) {
        return block.timestamp;
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function getMultiplier() public view returns (uint256) {
        if (_totalSupply == 0) {
            return multiplierStored;
        }
        console.log("time: ", (lastTimeRewardApplicable() - lastUpdateTime));
        console.log("TS: ", _totalSupply);
        return
            (multiplierStored *
                (
                    (((lastTimeRewardApplicable() - lastUpdateTime) *
                        rewardRate) + _totalSupply)
                )) / (_totalSupply);
    }

    function earned(address account) public view returns (uint256) {
        console.log("balance:", _balances[account]);
        console.log("earned:", (_balances[account] * getMultiplier()) /
            Math.max(userMultiplierPaid[account], 1e18));
        return
            (_balances[account] * getMultiplier()) /
            Math.max(userMultiplierPaid[account], 1e18);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(
        uint256 amount
    ) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        _totalSupply = _totalSupply + amount * 1e4;
        _balances[msg.sender] = _balances[msg.sender] + amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(
        uint256 amount
    ) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        _totalSupply = _totalSupply - amount * 1e4;
        _balances[msg.sender] = _balances[msg.sender] - amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function exit() external {
        withdraw(_balances[msg.sender]);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(
        uint256 reward
    ) external override onlyRewardsDistribution updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint balance = stakingToken.balanceOf(address(this));
        require(
            rewardRate <= balance / rewardsDuration,
            "Provided reward too high"
        );

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward);
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(address account) {
        multiplierStored = getMultiplier();
        lastUpdateTime = lastTimeRewardApplicable();

        if (account != address(0)) {
            _balances[account] += earned(account);
            _totalSupply +=
                (lastTimeRewardApplicable() - Math.min(lastPoolUpdateTime, lastUpdateTime)) *
                rewardRate * 1e4;
            userMultiplierPaid[account] = multiplierStored;
            lastPoolUpdateTime = lastUpdateTime;
        }
        console.log("multiplierStored: ", multiplierStored, "\n");
        // console.log("getMultiplier: ", getMultiplier(), "\n");
        console.log("_balances[account]:", _balances[account], account, "\n");
        console.log(
            "userMultiplierPaid[account]:",
            userMultiplierPaid[account],
            "\n"
        );

        console.log("<----------------------------------->");
        _;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
}

interface IUniswapV2ERC20 {
    function permit(
        address owner,
        address spender,
        uint value,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
