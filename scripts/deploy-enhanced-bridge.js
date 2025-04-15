// This script is for deploying the EnhancedHyperlaneBridge contract
const { ethers } = require("hardhat")
const hre = require("hardhat")

async function main() {
  console.log(`Deploying EnhancedHyperlaneBridge on Optimism...`)

  // Get the contract factory
  const EnhancedHyperlaneBridge = await ethers.getContractFactory("EnhancedHyperlaneBridge")

  // Deploy the contract
  const bridge = await EnhancedHyperlaneBridge.deploy()

  // Wait for deployment to finish
  await bridge.deployed()

  console.log(`EnhancedHyperlaneBridge deployed to: ${bridge.address}`)

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

  // Try to get the local domain to verify the mailbox is working
  try {
    const localDomain = await bridge.checkLocalDomain()
    console.log(`Successfully connected to Hyperlane Mailbox. Local domain: ${localDomain}`)
  } catch (error) {
    console.log("Failed to get local domain:", error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
