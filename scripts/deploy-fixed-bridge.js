// This script is for deploying the FixedBridge contract
const { ethers } = require("hardhat")
const hre = require("hardhat")

async function main() {
  console.log(`Deploying FixedBridge on Optimism...`)

  // Get the contract factory
  const FixedBridge = await ethers.getContractFactory("FixedBridge")

  // Deploy the contract
  const fixedBridge = await FixedBridge.deploy()

  // Wait for deployment to finish
  await fixedBridge.deployed()

  console.log(`FixedBridge deployed to: ${fixedBridge.address}`)

  // Verify the contract on Etherscan (if supported)
  try {
    console.log("Verifying contract on block explorer...")
    await hre.run("verify:verify", {
      address: fixedBridge.address,
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
