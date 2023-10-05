import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

//-------------------------------TESTNETS-----------------------------------------//

export const ARBITRUM_GOERLI_ENDPOINT = "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab";
export const ARBITRUM_GOERLI_CHAINID = 10143;
export const SEPOLIA_ENDPOINT = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";
export const SEPOLIA_CHAINID = 10161;
export const POLYGON_MUMBAI_ENDPOINT = "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8";
export const POLYGON_MUMBAI_CHAINID = 10109;

//-------------------------------MAINNETS-----------------------------------------//

export const ARBITRUM_ENDPOINT = "0x3c2269811836af69497E5F486A85D7316753cf62";
export const ARBITRUM_CHAINID = 110;
export const MOONBEAM_ENDPOINT = "0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4";
export const MOONBEAM_CHAINID = 126;


const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_API_KEY as string}`,
      accounts: [process.env.METAMASK_PRIVATE_KEY as string],
    },
    arbitrum_goerli: {
      url: `https://arb-goerli.g.alchemy.com/v2/${process.env.ARBITRUM_GOERLI_API_KEY as string}`,
      accounts: [process.env.METAMASK_PRIVATE_KEY as string]
    },
    polygon_mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.POLYGON_MUMBAI_API_KEY as string}`,
      accounts: [process.env.METAMASK_PRIVATE_KEY as string]
    },
    moonbeam: {
      url: process.env.MOONBEAM_URL as string,
      accounts: [process.env.METAMASK_PRIVATE_KEY as string]
    },
    arbitrum_one: {
      url: process.env.ARBITRUM_URL as string,
      accounts: [process.env.METAMASK_PRIVATE_KEY as string]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY as string,
      arbitrumGoerli: process.env.ARBISCAN_API_KEY as string,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY as string,
      moonbeam: process.env.MOONSCAN_API_KEY as string,
      arbitrum: process.env.ARBISCAN_API_KEY as string,
    }
  }                                            
};

export default config;










