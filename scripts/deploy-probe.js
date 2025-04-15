// This script is for deploying the HyperlaneProbe contract
const { ethers } = require("hardhat")
const hre = require("hardhat")

async function main() {
  console.log(`Deploying HyperlaneProbe on Optimism...`)

  // Get the contract factory
  const HyperlaneProbe = await ethers.getContractFactory("HyperlaneProbe")

  // Deploy the contract
  const probe = await HyperlaneProbe.deploy()

  // Wait for deployment to finish
  await probe.deployed()

  console.log(`HyperlaneProbe deployed to: ${probe.address}`)

  // Verify the contract on Etherscan (if supported)
  try {
    console.log("Verifying contract on block explorer...")
    await hre.run("verify:verify", {
      address: probe.address,
      constructorArguments: [],
    })
    console.log("Contract verified!")
  } catch (error) {
    console.log("Verification failed or not supported on this network:", error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
