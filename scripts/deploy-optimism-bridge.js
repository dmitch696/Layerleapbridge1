// This script is for deploying the OptimismLayerZeroBridge contract
const { ethers } = require("hardhat")
const hre = require("hardhat")

async function main() {
  console.log(`Deploying OptimismLayerZeroBridge on Optimism...`)

  // Get the contract factory
  const OptimismLayerZeroBridge = await ethers.getContractFactory("OptimismLayerZeroBridge")

  // Deploy the contract
  const bridge = await OptimismLayerZeroBridge.deploy()

  // Wait for deployment to finish
  await bridge.deployed()

  console.log(`OptimismLayerZeroBridge deployed to: ${bridge.address}`)

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

  // Log the supported chains
  const supportedChains = await bridge.getSupportedChains()
  console.log(
    "Supported chains:",
    supportedChains.map((c) => c.toString()),
  )

  console.log("\n-----------------------------------")
  console.log("IMPORTANT: Update your bridge address in your frontend code:")
  console.log(`const BRIDGE_CONTRACT = "${bridge.address}";`)
  console.log("-----------------------------------\n")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
