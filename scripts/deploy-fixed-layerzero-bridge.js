// This script is for deploying the FixedLayerZeroBridge contract
const { ethers } = require("hardhat")
const hre = require("hardhat")

async function main() {
  console.log(`Deploying FixedLayerZeroBridge on Optimism...`)

  // Get the contract factory
  const FixedLayerZeroBridge = await ethers.getContractFactory("FixedLayerZeroBridge")

  // Deploy the contract
  const bridge = await FixedLayerZeroBridge.deploy()

  // Wait for deployment to finish
  await bridge.deployed()

  console.log(`FixedLayerZeroBridge deployed to: ${bridge.address}`)

  // Verify the contract on Etherscan (if supported)
  try {
    console.log("Verifying contract on block explorer...")
    await hre.run("verify:verify", {
      address: bridge.address,
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
