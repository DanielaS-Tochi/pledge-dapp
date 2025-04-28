import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      chainId: 1337,
    }
  },
  typechain: {
    outDir: "frontend/src/types",
    target: "ethers-v6",
    alwaysGenerateOverloads: true,
  }
};

export default config;