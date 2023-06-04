import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {ethers} from "hardhat";

const FINDR_SUPPLY = ethers.utils.parseEther("1000000000");
const ORACLE = "0x649a2C205BE7A3d5e99206CEEFF30c794f0E31EC";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(FINDR_SUPPLY + " FINDR_SUPPLY");
  const TokenContract = await deploy("FINDR", {
    from: deployer,
    args: [FINDR_SUPPLY],
    log: true,
    autoMine: true,
  });

  await deploy("RestaurantInfo", {
    from: deployer,
    args: [TokenContract.address],
    log: true,
    autoMine: true,
  });

  await deploy("AIResultConsumer", {
    from: deployer,
    args: [ORACLE],
    log: true,
    autoMine: true,
  });
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
//deployYourContract.tags = ["YourContract"];
