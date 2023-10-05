import { ethers } from "hardhat";
import { Signer } from "ethers";
import hardhat from "hardhat";
import { Token, StakingRewards } from "../typechain-types";
import "dotenv/config";
import { promises as fsPromises } from 'fs';
import { join } from 'path';



async function main() {
  await hardhat.run("compile");

  const filename: string = "../.env";

  let owner: Signer;

  [owner] = await ethers.getSigners();

  // --------------------------START STAKE TOKEN DEPLOYMENT------------------------------ //

  console.log("Deploying contract with the account:", await owner.getAddress());

  const stakingToken = await ethers.getContractFactory("Token");

  const deployedStakingToken = await stakingToken.deploy("stakingToken", "STKN") as Token;

  deployedStakingToken.waitForDeployment();

  console.log(`Deployed deployedStakingToken contract on:`, await deployedStakingToken.getAddress());

  // --------------------------END STAKE TOKEN DEPLOYMENT------------------------------ //

  // --------------------------START REWARD TOKEN DEPLOYMENT------------------------------ //

  const rewardToken = await ethers.getContractFactory("Token");

  const deployedRewardToken = await rewardToken.deploy("rewardToken", "RTKN") as Token;

  deployedRewardToken.waitForDeployment();

  console.log(`Deployed deployedRewardToken contract on:`, await deployedRewardToken.getAddress());

  // --------------------------END REWARD TOKEN DEPLOYMENT------------------------------ //

  // --------------------------START STAKING REWARDS DEPLOYMENT------------------------------ //

  const stakingRewards = await ethers.getContractFactory("StakingRewards");

  const deployedStakingRewards = await stakingRewards.deploy(await owner.getAddress(), 
                                                             await deployedRewardToken.getAddress(),
                                                             await deployedStakingToken.getAddress()) as StakingRewards;


  console.log(`Deployed deployedStakingRewards contract on:`, await deployedStakingRewards.getAddress());

  // --------------------------END STAKING REWARDS DEPLOYMENT------------------------------ //

  try {
    await fsPromises.writeFile(join(__dirname, filename), 
    "STAKE_ADDRESS=" + (await deployedStakingToken.getAddress()) + "\n" +
      "REWARD_ADDRESS=" + (await deployedRewardToken.getAddress()) + "\n" +
      "STAKING_REWARDS_ADDRESS=" + (await deployedStakingRewards.getAddress()) + "\n",
    {
      flag: 'a+',
    });

  } catch (err) {
    console.log(err);
    return 'Something went wrong';
  }
}



main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
