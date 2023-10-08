import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Token, StakingRewards } from "../typechain-types";

describe("StakingRewards", function () {
  async function deploy60daysStakingRewardsFixture() {
    const [owner, staker1, staker2, staker3] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const stakingRewards = await ethers.getContractFactory("StakingRewards");

    const deployedStakingToken = await Token.deploy("stakingToken", "STKN") as Token;
    const deployedRewardToken = await Token.deploy("rewardToken", "RTKN") as Token;
    

    const deployedStakingRewards = await stakingRewards.deploy(await owner.getAddress(), 
                                                             await deployedRewardToken.getAddress(),
                                                             await deployedStakingToken.getAddress()) as StakingRewards;


    await deployedRewardToken.mint(await deployedStakingRewards.getAddress(), 10000000);
    
    await deployedStakingToken.mint(staker1.address, 10000000000); 
    await deployedStakingToken.connect(staker1).approve(await deployedStakingRewards.getAddress(), 1000000000);
    await deployedStakingToken.mint(staker2.address, 10000000000); 
    await deployedStakingToken.connect(staker2).approve(await deployedStakingRewards.getAddress(), 1000000000);

    await deployedStakingToken.mint(staker3.address, 10000000000); 
    await deployedStakingToken.connect(staker3).approve(await deployedStakingRewards.getAddress(), 1000000000);

    return { deployedStakingRewards, deployedStakingToken, deployedRewardToken, owner, staker1, staker2, staker3 };
  }

  async function notifyRewardAmountStakingRewards() {
    const { deployedStakingRewards, deployedRewardToken } = await loadFixture(deploy60daysStakingRewardsFixture);
    const reward = 100;
    await deployedRewardToken.mint(await deployedStakingRewards.getAddress(), reward); // mint reward tokens
    await deployedStakingRewards.notifyRewardAmount(reward);
    return { reward };
  }

  describe("Reward Amount", function () {
    // TODO: Check too high reward
    it("Should set the right reward amount", async function () {
      const { deployedStakingRewards, deployedRewardToken } = await loadFixture(deploy60daysStakingRewardsFixture);
      const { reward } = await loadFixture(notifyRewardAmountStakingRewards);

      expect(await deployedRewardToken.balanceOf(await deployedStakingRewards.getAddress())).to.equal(reward);
    });

    it("Check variables for duration 50 sec", async function () {
      const { deployedStakingRewards } = await loadFixture(deploy60daysStakingRewardsFixture);
      const { } = await loadFixture(notifyRewardAmountStakingRewards);

      const periodFinish = (await time.latest()) + 50;

      expect((await deployedStakingRewards._periodFinish()) - (await deployedStakingRewards._lastUpdateTime())).to.equal(50);
      expect(await deployedStakingRewards._periodFinish()).to.equal(periodFinish);
      expect(await deployedStakingRewards._rewardRate()).to.equal(2);
    })
    
  });

  describe("Staking", function () {
    it("Check staker balance in staking tokens", async function () {
      const { deployedStakingRewards, deployedStakingToken, staker1, staker2, staker3 } = await loadFixture(deploy60daysStakingRewardsFixture);
      const { reward } = await loadFixture(notifyRewardAmountStakingRewards);

      await deployedStakingRewards.connect(staker1).stake(10);
      
      
      expect(await deployedStakingRewards._rewardPerTokenStored()).to.equal(0);
      expect(await deployedStakingRewards._rewards(staker1.address)).to.equal(0);
      expect(await deployedStakingRewards._userRewardPerTokenPaid(staker1.address)).to.equal(0);
      // expect((await deployedStakingRewards._periodFinish()) - (await deployedStakingRewards._lastUpdateTime())).to.equal(49);
      

      await time.increaseTo(await deployedStakingRewards._periodFinish() - 25n);
      
      await deployedStakingRewards.connect(staker2).stake(15);


      // expect(await deployedStakingRewards._time()).to.equal(await deployedStakingRewards._periodFinish());
      //expect((await deployedStakingRewards.lastTimeRewardApplicable()) -  await deployedStakingRewards._lastUpdateTime()).to.equal(1);
      //expect(await deployedStakingRewards._rewardRate()).to.equal(2);
      //expect(await deployedStakingRewards.totalSupply()).to.equal(10);
      
      expect(await deployedStakingRewards._rewardPerTokenStored()).to.equal(5000000000000000000n);

      await deployedStakingRewards.connect(staker3).stake(25);

      expect(await deployedStakingRewards.rewardPerTokenStored()).to.equal(1);
    
    })
  })

  /*
  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
  */
});
