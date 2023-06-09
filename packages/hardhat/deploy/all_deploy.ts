import { deployments, ethers } from "hardhat";
import { DeployResult } from "hardhat-deploy/dist/types";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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

  const restaurantInfoContract: DeployResult = await deploy("RestaurantInfo", {
    from: deployer,
    args: [ORACLE, "0x6f1341ba96ca58f5c667cafb5e0d6ddf1c33f149ae50c5ec47205b2d0386e325"],
    log: true,
    autoMine: true,
  });

  console.log(FINDR_SUPPLY + " FINDR_SUPPLY");
  const TokenContract = await deploy("FINDR", {
    from: deployer,
    args: [FINDR_SUPPLY, restaurantInfoContract.address],
    log: true,
    autoMine: true,
  });

  // const AIFunctionsClient = await deploy("AIFunctionsClient", {
  //   from: deployer,
  //   args: [ORACLE, restaurantInfoContract.address],
  //   log: true,
  //   autoMine: true,
  // });

  //Init the restaurant info contract with the FINDR token and the AIResultConsumer contract
  await deployments.get("RestaurantInfo");
  const restaurantInfo = await ethers.getContractAt("RestaurantInfo", restaurantInfoContract.address);
  await restaurantInfo.initialize(TokenContract.address);
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
//deployYourContract.tags = ["YourContract"];
