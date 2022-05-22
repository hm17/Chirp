const dotenv = require("dotenv");
dotenv.config({path: __dirname + '/.env'});
const { INFURA_URL, ROPSTEN_PRIVATE_KEY } = process.env;
require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: INFURA_URL,
      accounts: [`0x${ROPSTEN_PRIVATE_KEY}`]
    }
  }
};
