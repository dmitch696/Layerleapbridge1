// This script is for deploying the SimpleFeeCollector contract
// You would run this with Hardhat

const { ethers } = require("hardhat")
const hre = require("hardhat") // Import hardhat

async function main() {
  // Get the owner address from command line or use default
  const ownerAddress = process.env.OWNER_ADDRESS || "0x3F919B89a03c546BCe66120616F13461578FD8Ff"

  console.log(`Deploying SimpleFeeCollector...`)
  console.log(`Owner address: ${ownerAddress}`)

  // Get the contract factory
  const SimpleFeeCollector = await ethers.getContractFactory("SimpleFeeCollector")

  // Deploy the contract
  const feeCollector = await SimpleFeeCollector.deploy()

  // Wait for deployment to finish
  await feeCollector.deployed()

  console.log(`SimpleFeeCollector deployed to: ${feeCollector.address}`)

  // Verify the contract on Etherscan (if supported)
  try {
    console.log("Verifying contract on block explorer...")
    await hre.run("verify:verify", {
      address: feeCollector.address,
      constructorArguments: [],
    })
    console.log("Contract verified!")
  } catch (error) {
    console.log("Verification failed or not supported on this network:", error.message)
  }

  console.log("\n-----------------------------------")
  console.log("IMPORTANT: Update your feeCollectorAddresses in bridge-interface.jsx with this address:")
  console.log(`${await hre.network.provider.send("eth_chainId")}: "${feeCollector.address}",`)
  console.log("-----------------------------------\n")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
