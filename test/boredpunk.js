const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const ethers = require('ethers');
const fs = require('fs');
const { default: Web3 } = require("web3");

const { expect } = require('chai');

// const MerkleProofWrapper = artifacts.require('MerkleProofWrapper');
const BoredPunk = artifacts.require("BoredPunkYachtClub");

function getMapping() {
    const mapping = JSON.parse(fs.readFileSync("mapping.json"));
    // console.log(mapping);
    // console.log(mapping.length);
    return mapping;
}

function getKeccak(mapping) {
    return mapping.map(obj => {
        return ethers.utils.solidityKeccak256(["uint256", "uint256"], [obj.openseaTokenId, obj.tokenId]);
    });
}

const openseaAddress = "0x495f947276749Ce646f68AC8c248420045cb7b5e";
const openseaAbi = JSON.parse(fs.readFileSync("./opensea_abi.json"));
const opensea = new web3.eth.Contract(openseaAbi, openseaAddress);

const boredPunkOwner0 = "0xf8e08FA48cAe4C0187d84D5F5Cb061045dd6af82";
const boredPunkOwner1 = "0xFbC61be3798AC4043eAA31F6224B9A46E8C93E20";


contract('BoredPunkYachtClub', function (accounts) {
  beforeEach(async function () {
    // this.boredPunk = await MerkleProofWrapper.new();
    this.boredPunk = await BoredPunk.deployed();
  });

  describe('verify', function () {
    it('returns true for a valid Merkle proof', async function () {
        const mapping = getMapping();
        const elements = getKeccak(mapping);
        const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: false, sortPairs: true });
        const root = merkleTree.getHexRoot();

        const leaf = elements[0];
        const proof = merkleTree.getHexProof(leaf);
        expect(await this.boredPunk.verify(root, leaf, proof)).to.equal(true);
    });

    it('returns false for an invalid Merkle proof', async function () {
        const correctElements = ['a', 'b', 'c'];
        const correctMerkleTree = new MerkleTree(correctElements, keccak256, { hashLeaves: true, sortPairs: true });

        const correctRoot = correctMerkleTree.getHexRoot();

        const correctLeaf = keccak256(correctElements[0]);

        const badElements = ['d', 'e', 'f'];
        const badMerkleTree = new MerkleTree(badElements);

        const badProof = badMerkleTree.getHexProof(badElements[0], keccak256, { hashLeaves: true, sortPairs: true });

        expect(await this.boredPunk.verify(correctRoot, correctLeaf, badProof)).to.equal(false);
    });

    it('enables minting a boredpunk and claiming royalties with a single user', async function () {
        const mapping = getMapping();
        const elements = getKeccak(mapping);
        const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: false, sortPairs: true });
        const root = merkleTree.getHexRoot();

        // Set Merkle root
        console.log("setting merkle root");
        let tx = await this.boredPunk.contract.methods.setMerkleRoot(root).send({
            "from": accounts[0]
        });
        // console.log(tx);

        console.log("approving");

        let item = mapping[0];
        let leaf = elements[0];
        let proof = merkleTree.getHexProof(leaf);
        // console.log(item);
        // expect(await this.boredPunk.verify(root, leaf, proof)).to.equal(true);

        let txApprove = await opensea.methods.setApprovalForAll(
            this.boredPunk.contract._address,
            true
        ).send({
            "from": boredPunkOwner0
        });
        // console.log(txApprove);

        console.log("minting");

        let txBalance = await opensea.methods.balanceOf(boredPunkOwner0, item.openseaTokenId).call();
        console.log(`balanceOf: ${txBalance}`);

        // let txTransfer = await opensea.methods.safeTransferFrom(
        //     boredPunkOwner0,
        //     "0x000000000000000000000000000000000000dEaD",
        //     // boredPunkOwner0,
        //     // boredPunkOwner1,
        //     // this.boredPunk.contract._address,
        //     item.openseaTokenId,
        //     "1",
        //     "0x"
        // ).send({
        //     "from": boredPunkOwner0
        // });
        // console.log(`txTransfer: ${txTransfer}`);
        // return;

        // let txBalance2 = await opensea.methods.balanceOf(boredPunkOwner1, item.openseaTokenId).call();
        // console.log(`balanceOf: ${txBalance2}`);
        // return;

        let tx2 = await this.boredPunk.contract.methods.mintAndBurn(
            item.openseaTokenId,
            item.tokenId,
            leaf,
            proof
        ).send({
            "from": boredPunkOwner0,
            "gasLimit": 1000000
        });
        console.log(tx2);

        let tx3 = await web3.eth.sendTransaction({
            "from": accounts[1],
            "to": this.boredPunk.contract._address,
            "value": ethers.utils.parseEther("1")
        });

        let weiBalance = await web3.eth.getBalance(boredPunkOwner0);

        let tx4 = await this.boredPunk.contract.methods.claimRewards(0).send({
            "from": accounts[1],
        });

        let weiBalance2 = await web3.eth.getBalance(boredPunkOwner0);
        // let ethDiff = ethers.utils.formatUnits(ethers.BigNumber.from(weiBalance2 - weiBalance));
        let ethDiff = weiBalance2 - weiBalance;
        console.log(weiBalance, weiBalance2);
        console.log(`ethDiff: ${ethDiff}`);

        // Now we mint a second to a diff address

        txApprove = await opensea.methods.setApprovalForAll(
            this.boredPunk.contract._address,
            true
        ).send({
            "from": boredPunkOwner1
        });

        item = mapping[1];
        leaf = elements[1];
        proof = merkleTree.getHexProof(leaf);
        let tx5 = await this.boredPunk.contract.methods.mintAndBurn(
            item.openseaTokenId,
            item.tokenId,
            leaf,
            proof
        ).send({
            "from": boredPunkOwner1,
            "gasLimit": 1000000
        });
        // console.log(tx5);

        let tx6 = await web3.eth.sendTransaction({
            "from": accounts[1],
            "to": this.boredPunk.contract._address,
            "value": ethers.utils.parseEther("1")
        });

        weiBalance = await web3.eth.getBalance(boredPunkOwner0);

        let tx7 = await this.boredPunk.contract.methods.claimRewards(0).send({
            "from": accounts[1],
        });

        weiBalance2 = await web3.eth.getBalance(boredPunkOwner0);
        // let ethDiff = ethers.utils.formatUnits(ethers.BigNumber.from(weiBalance2 - weiBalance));
        ethDiff = weiBalance2 - weiBalance;
        console.log(weiBalance, weiBalance2);
        console.log(`ethDiff: ${ethDiff}`);

    });
  });
});