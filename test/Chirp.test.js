const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Chirp", function () {
    let chirp;
    let deployer, user1, user2, users;
    let URI = "TestURI";
    let postHash = "Six seasons and a movie";
    beforeEach(async () => {
        // Get signers
        [deployer, user1, user2, ...users] = await ethers.getSigners();
        // Get contract factory to deploy contract
        const ChirpFactory = await ethers.getContractFactory("Chirp");
        // Deploy
        chirp = await ChirpFactory.deploy();
        // user1 mints an NFT
        await chirp.connect(user1).mint(URI);
    })
    describe("Deployment", async () => {
        it("Should track name and symbol", async function () {
            const nftName = "Chirp";
            const nftSymbol = "CHIRP";
            expect(await chirp.name()).to.equal(nftName);
            expect(await chirp.symbol()).to.equal(nftSymbol);
        });
    })
    describe("Minting NFTs", async () => {
        it("Should track each minted NFT", async function () {
            expect(await chirp.tokenCount()).to.equal(1);
            expect(await chirp.balanceOf(user1.address)).to.equal(1);
            expect(await chirp.tokenURI(1)).to.equal(URI);

            //user2 mints an NFT
            await chirp.connect(user2).mint(URI);
            expect(await chirp.tokenCount()).to.equal(2);
            expect(await chirp.balanceOf(user2.address)).to.equal(1);
            expect(await chirp.tokenURI(2)).to.equal(URI);
        });
    })
    describe("Setting profiles", async () => {
        it("Should allow users to select which NFT they own to represent their profile", async function () {
            // user1 mints another NFT
            await chirp.connect(user1).mint(URI);
            expect(await chirp.profiles(user1.address)).to.equal(2);

            // user 1 sets profile to the first NFT
            await chirp.connect(user1).setProfile(1);
            expect(await chirp.profiles(user1.address)).to.equal(1);

            // Fail
            // user2 tries to set their profiles to NFT 2 (owned by user1)
            await expect(chirp.connect(user2).setProfile(2)).to.be.revertedWith("Must own the NFT you want to select as your profile");
        });
    })
    describe("Upload posts", async () => {
        it("Should allow users to upload posts", async function () {
            // user1 posts
            await expect(chirp.connect(user1).uploadPost(postHash)).to.emit(chirp, "PostCreated").withArgs(1, postHash, 0, user1.address);
            const postCount = await chirp.postCount();
            expect(postCount).to.equal(1);
            
            // check from struct
            const post = await chirp.posts(postCount);
            expect(post.id).to.equal(postCount);
            expect(post.hash).to.equal(postHash);
            expect(post.tip).to.equal(0);
            expect(post.author).to.equal(user1.address);

            // FAIL
            // user1 cannot send empty hash
            await expect(chirp.connect(user1).uploadPost("")).to.be.revertedWith("Cannot pass empty hash");

            // FAIL
            // user2 has not minted an NFT and cannot post
            await expect(chirp.connect(user2).uploadPost(postHash)).to.be.revertedWith("Must own a Chirp NFT to post");
        });
    })
    describe("Tipping posts", async () => {
        it("Should allow users to tip posts and track each posts tip amount", async function () {
            // user1 uploads a post
            await chirp.connect(user1).uploadPost(postHash);

            // user1 balance before tip
            const initTipBalance = await ethers.provider.getBalance(user1.address);
            const tip = ethers.utils.parseEther("1"); // convert to wei

            // user2 tips post
            await expect(chirp.connect(user2).tipPostOwner(1, {value: tip})).to.emit(chirp, "PostTipped").withArgs(1, postHash, tip, user1.address);

            // check tip amount
            const post = await chirp.posts(1);
            expect(post.tip).to.equal(tip);

            // check user balance
            const finalTipBalance = await ethers.provider.getBalance(user1.address);
            expect(finalTipBalance).to.equal(initTipBalance.add(tip));

            // FAIL
            // user1 tries to tip own post
            await expect(chirp.connect(user1).tipPostOwner(1, {value: tip})).to.be.revertedWith("Cannot tip your own post");

            // FAIL
            // post id is invalid
            await expect(chirp.connect(user2).tipPostOwner(2, {value: tip})).to.be.revertedWith("Invalid post ID");
        });
    })
    describe("Return all posts", async () => {
        it("Should return all the posts", async function () {
            const initialPostCount = await chirp.postCount();

            // user1 creates post
            await chirp.connect(user1).uploadPost(postHash);

            // user2 mints token and creates post
            await chirp.connect(user2).mint(URI);
            await chirp.connect(user2).uploadPost(postHash);

            const finalPostCount = await chirp.postCount();
            expect(finalPostCount).to.equal(initialPostCount + 2);

            // return all the available posts
            const allPosts = await chirp.getAllPosts();
            expect(allPosts.length).to.equal(2);
        });
    })
    describe("Return NFTs", async () => {
        it("Should return all the NFTs", async function () {
            // user1 mint another NFT
            await chirp.connect(user1).mint(URI);

            // return all of user1 NFTs
            const nfts = await chirp.connect(user1).getMyNfts();
            expect(nfts.length).to.equal(2);
        });
    })
});
