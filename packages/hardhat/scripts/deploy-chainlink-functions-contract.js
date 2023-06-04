async function main() {
  // Sepolia eth network
  const oracleAddress = "0x649a2C205BE7A3d5e99206CEEFF30c794f0E31EC";

  // Set your contract name.
  const contractName = "AIResultConsumer";

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const consumerContract = await ethers.getContractFactory(contractName);

  const deployedContract = await consumerContract.deploy(oracleAddress);

  console.log("Deployed Functions Consumer address:", deployedContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
