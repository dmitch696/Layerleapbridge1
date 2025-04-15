// This script is for deploying the SimpleBridge contract
const { ethers } = require("hardhat")
const hre = require("hardhat")

async function main() {
  // Get the network-specific bridge addresses
  const network = await ethers.provider.getNetwork()
  const chainId = network.chainId

  // These are the correct addresses for each network
  const addresses = {
    // Optimism
    10: {
      hyperlaneMailbox: "0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D", // Hyperlane Mailbox on Optimism
      layerZeroEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62", // LayerZero Endpoint on Optimism
    },
  }

  // Get the addresses for the current network
  const hyperlaneMailbox = addresses[chainId]?.hyperlaneMailbox
  const layerZeroEndpoint = addresses[chainId]?.layerZeroEndpoint

  if (!hyperlaneMailbox || !layerZeroEndpoint) {
    console.error(`No addresses configured for chain ID ${chainId}`)
    process.exit(1)
  }

  console.log(`Deploying SimpleBridge on chain ID ${chainId}...`)
  console.log(`Hyperlane mailbox: ${hyperlaneMailbox}`)
  console.log(`LayerZero endpoint: ${layerZeroEndpoint}`)

  // Get the contract factory
  const SimpleBridge = await ethers.getContractFactory("SimpleBridge")

  // Deploy the contract
  const simpleBridge = await SimpleBridge.deploy(hyperlaneMailbox, layerZeroEndpoint)

  // Wait for deployment to finish
  await simpleBridge.deployed()

  console.log(`SimpleBridge deployed to: ${simpleBridge.address}`)

  // Verify the contract on Etherscan (if supported)
  try {
    console.log("Verifying contract on block explorer...")
    await hre.run("verify:verify", {
      address: simpleBridge.address,
      constructorArguments: [hyperlaneMailbox, layerZeroEndpoint],
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
