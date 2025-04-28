import { ethers } from "hardhat";

async function main() {
  // Usamos una dirección de donación de ejemplo
  const donationAddress = "0x000000000000000000000000000000000000dEaD";
  
  const Pledge = await ethers.getContractFactory("Pledge");
  const pledge = await Pledge.deploy(donationAddress);

  await pledge.waitForDeployment();

  console.log(
    `Pledge contract deployed to ${await pledge.getAddress()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});