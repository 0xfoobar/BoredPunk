const BoredPunk = artifacts.require("BoredPunkYachtClub");
const FeeSplitter = artifacts.require("FeeSplitter");

let dev1Address = "0x616Fc7C9c690E0f5e2198DCD69C3a8b53481C69B";
let dev2Address = "0x4570B05130c4eda522044C161234f299E26B7C0D";
let communityShares = 500;
let dev1Shares = 450;
let dev2Shares = 50;

module.exports = async function(deployer, network, accounts) {
  console.log(accounts);
  await deployer.deploy(BoredPunk);
  let instance = await BoredPunk.deployed();
  console.log(instance);
  await deployer.deploy(
    FeeSplitter,
    instance.address,
    dev1Address,
    dev2Address,
    communityShares,
    dev1Shares,
    dev2Shares
  );
  console.log("Finished deployment");
};