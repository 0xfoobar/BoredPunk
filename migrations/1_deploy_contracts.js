const BoredPunk = artifacts.require("BoredPunkYachtClub");

module.exports = function(deployer, network, accounts) {
  console.log(accounts);
  deployer.deploy(BoredPunk);
};