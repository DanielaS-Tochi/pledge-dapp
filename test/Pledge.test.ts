// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { parseEther } from "ethers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
// import { Pledge, Pledge__factory } from "../frontend/src/types";

// describe("Pledge", function () {
//   let pledge: Pledge;
//   let owner: any, user1: any, user2: any, donation: any;
//   let user1Addr: string, user2Addr: string, donationAddr: string;

//   beforeEach(async function () {
//     [owner, user1, user2, donation] = await ethers.getSigners();
//     user1Addr = await user1.getAddress();
//     user2Addr = await user2.getAddress();
//     donationAddr = await donation.getAddress();

//     const pledgeFactory = (await ethers.getContractFactory("Pledge", owner)) as unknown as Pledge__factory;
//     pledge = await pledgeFactory.deploy(donationAddr);
//     // For TypeChain v8+:
//     await (pledge as any).waitForDeployment?.();
//     // If your version is older, you can use:
//     // await pledge.deployed();
//   });

//   describe("createCommitment", function () {
//     it("should create a commitment and emit event", async () => {
//       const tx = await pledge.connect(user1).createCommitment("Run 5k", 7, { value: parseEther("1") });
//       await expect(tx)
//         .to.emit(pledge, "CommitmentCreated")
//         .withArgs(0, user1Addr, "Run 5k", anyValue, parseEther("1"));

//       const commitment = await pledge.commitments(0);
//       expect(commitment.user).to.equal(user1Addr);
//       expect(commitment.description).to.equal("Run 5k");
//       expect(commitment.stakeAmount).to.equal(parseEther("1"));
//       expect(commitment.completed).to.be.false;
//       expect(commitment.claimed).to.be.false;
//     });
//   });
// });

import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { Pledge, Pledge__factory } from "../frontend/src/types";

describe("Pledge", function () {
  let pledge: Pledge;
  let owner: any, user1: any, user2: any, donation: any;
  let user1Addr: string, user2Addr: string, donationAddr: string;

  beforeEach(async function () {
    [owner, user1, user2, donation] = await ethers.getSigners();
    user1Addr = await user1.getAddress();
    user2Addr = await user2.getAddress();
    donationAddr = await donation.getAddress();

    const pledgeFactory = (await ethers.getContractFactory("Pledge", owner)) as unknown as Pledge__factory;
    pledge = await pledgeFactory.deploy(donationAddr);
    // For TypeChain v8+:
    await (pledge as any).waitForDeployment?.();
    // If your version is older, you can use:
    // await pledge.deployed();
  });

  describe("createCommitment", function () {
    it("should create a commitment and emit event", async () => {
      const tx = await pledge.connect(user1).createCommitment("Run 5k", 7, { value: parseEther("1") });
      await expect(tx)
        .to.emit(pledge, "CommitmentCreated")
        .withArgs(0, user1Addr, "Run 5k", anyValue, parseEther("1"));

      const commitment = await pledge.commitments(0);
      expect(commitment.user).to.equal(user1Addr);
      expect(commitment.description).to.equal("Run 5k");
      expect(commitment.stakeAmount).to.equal(parseEther("1"));
      expect(commitment.completed).to.be.false;
      expect(commitment.claimed).to.be.false;
    });

    it("should not allow creation with zero stake", async () => {
      await expect(
        pledge.connect(user1).createCommitment("Read book", 3, { value: 0 })
      ).to.be.revertedWith("Stake amount must be greater than 0");
    });

    it("should not allow creation with empty description", async () => {
      await expect(
        pledge.connect(user1).createCommitment("", 3, { value: parseEther("1") })
      ).to.be.revertedWith("Description cannot be empty");
    });
  });

  describe("getUserCommitments", function () {
    it("should return all commitments for a user", async () => {
      await pledge.connect(user1).createCommitment("A", 2, { value: parseEther("1") });
      await pledge.connect(user1).createCommitment("B", 2, { value: parseEther("2") });
      await pledge.connect(user2).createCommitment("C", 2, { value: parseEther("3") });

      const user1Commitments = await pledge.getUserCommitments(user1Addr);
      expect(user1Commitments.map((n: any) => Number(n))).to.deep.equal([0, 1]);

      const user2Commitments = await pledge.getUserCommitments(user2Addr);
      expect(user2Commitments.map((n: any) => Number(n))).to.deep.equal([2]);
    });
  });

  describe("markAsCompleted", function () {
    it("should allow the user to mark their commitment as completed", async () => {
      await pledge.connect(user1).createCommitment("Test", 1, { value: parseEther("1") });
      const tx = await pledge.connect(user1).markAsCompleted(0);
      await expect(tx).to.emit(pledge, "CommitmentCompleted").withArgs(0);

      const commitment = await pledge.commitments(0);
      expect(commitment.completed).to.be.true;
    });

    it("should not allow others to mark as completed", async () => {
      await pledge.connect(user1).createCommitment("Test", 1, { value: parseEther("1") });
      await expect(
        pledge.connect(user2).markAsCompleted(0)
      ).to.be.revertedWith("Not your commitment");
    });

    it("should not allow marking as completed after deadline", async () => {
      await pledge.connect(user1).createCommitment("Test", 0, { value: parseEther("1") });
      // Advance time 2 days
      await ethers.provider.send("evm_increaseTime", [2 * 86400]);
      await ethers.provider.send("evm_mine", []);
      await expect(
        pledge.connect(user1).markAsCompleted(0)
      ).to.be.revertedWith("Deadline passed");
    });

    it("should not allow marking as completed twice", async () => {
      await pledge.connect(user1).createCommitment("Test", 1, { value: parseEther("1") });
      await pledge.connect(user1).markAsCompleted(0);
      await expect(
        pledge.connect(user1).markAsCompleted(0)
      ).to.be.revertedWith("Already completed");
    });
  });

  describe("claimStake", function () {
    it("should return stake to user if completed on time", async () => {
      await pledge.connect(user1).createCommitment("Test", 1, { value: parseEther("1") });
      await pledge.connect(user1).markAsCompleted(0);

      const beforeBalance = await ethers.provider.getBalance(user1Addr);
      const tx = await pledge.connect(user1).claimStake(0);
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Transaction receipt is null");
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      await expect(tx)
        .to.emit(pledge, "StakeClaimed")
        .withArgs(0, user1Addr, true);

      const afterBalance = await ethers.provider.getBalance(user1Addr);
      // Allow for gas cost difference
      expect(afterBalance + gasUsed).to.be.closeTo(
        beforeBalance + parseEther("1"),
        parseEther("0.01")
      );
    });

    it("should send stake to donation address if not completed or late", async () => {
      await pledge.connect(user1).createCommitment("Test", 0, { value: parseEther("1") });
      await ethers.provider.send("evm_increaseTime", [2 * 86400]);
      await ethers.provider.send("evm_mine", []);

      const beforeDonation = await ethers.provider.getBalance(donationAddr);
      const tx = await pledge.connect(user1).claimStake(0);
      await expect(tx)
        .to.emit(pledge, "StakeClaimed")
        .withArgs(0, user1Addr, true);

      const afterDonation = await ethers.provider.getBalance(donationAddr);
      expect(afterDonation - beforeDonation).to.equal(parseEther("1"));
    });

    it("should not allow others to claim", async () => {
      await pledge.connect(user1).createCommitment("Test", 1, { value: parseEther("1") });
      await expect(
        pledge.connect(user2).claimStake(0)
      ).to.be.revertedWith("Not your commitment");
    });

    it("should not allow double claim", async () => {
      await pledge.connect(user1).createCommitment("Test", 1, { value: parseEther("1") });
      await pledge.connect(user1).claimStake(0);
      await expect(
        pledge.connect(user1).claimStake(0)
      ).to.be.revertedWith("Already claimed");
    });
  });
});