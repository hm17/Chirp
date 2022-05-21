const fs = require('fs');
const { ethers } = require('hardhat');
async function main() {
  const [deployer, user1] = await ethers.getSigners();
  // We get the contract factory to deploy
  const ChirpFactory = await ethers.getContractFactory("Chirp");
  // Deploy contract
  const chirp = await ChirpFactory.deploy();
  // Save contract address file in project
  const contractsDir = __dirname + "/../src/contractsData";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/chirp-address.json`,
    JSON.stringify({ address: chirp.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync("Chirp");

  fs.writeFileSync(
    contractsDir + `/chirp.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
  console.log("Chirp deployed to:", chirp.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
