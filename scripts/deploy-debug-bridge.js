// This script is for deploying the DebugBridge contract
const { ethers } = require("hardhat")
const hre = require("hardhat")

async function main() {
  // Hyperlane Mailbox address on Optimism
  const hyperlaneMailbox = "0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D"

  console.log(`Deploying DebugBridge on Optimism...`)
  console.log(`Hyperlane mailbox: ${hyperlaneMailbox}`)

  // Get the contract factory
  const DebugBridge = await ethers.getContractFactory("DebugBridge")

  // Deploy the contract
  const debugBridge = await DebugBridge.deploy(hyperlaneMailbox)

  // Wait for deployment to finish
  await debugBridge.deployed()

  console.log(`DebugBridge deployed to: ${debugBridge.address}`)

  // Verify the contract on Etherscan (if supported)
  try {
    console.log("Verifying contract on block explorer...")
    await hre.run("verify:verify", {
      address: debugBridge.address,
      constructorArguments: [hyperlaneMailbox],
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
