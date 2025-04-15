// This script is for deploying the BridgeFeeCollector contract
// You would run this with Hardhat

const { ethers } = require("hardhat")
const hre = require("hardhat") // Import hardhat

async function main() {
  // Get the owner address from command line or use default
  const ownerAddress = process.env.OWNER_ADDRESS || "0x3F919B89a03c546BCe66120616F13461578FD8Ff"

  // Get the network-specific bridge addresses
  const network = await ethers.provider.getNetwork()
  const chainId = network.chainId

  // These are the correct addresses for each network
  // Updated with the correct Hyperlane Mailbox addresses
  const addresses = {
    // Ethereum Mainnet
    1: {
      hyperlaneMailbox: "0x856f49152e1ddeA2a7c0b25A2A1d1A769805e3a7", // Hyperlane Mailbox on Ethereum
      layerZeroEndpoint: "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675", // LayerZero Endpoint on Ethereum
    },
    // Optimism
    10: {
      hyperlaneMailbox: "0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D", // Hyperlane Mailbox on Optimism
      layerZeroEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62", // LayerZero Endpoint on Optimism
    },
    // Polygon
    137: {
      hyperlaneMailbox: "0x2971b9Aec44bE4eb673DF1B88cDB57b96eefe8a4", // Hyperlane Mailbox on Polygon
      layerZeroEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62", // LayerZero Endpoint on Polygon
    },
    // Arbitrum
    42161: {
      hyperlaneMailbox: "0xc4d4c4604cE3d8E2aF2DA3C7d167C4B5a7c3e6e7", // Hyperlane Mailbox on Arbitrum
      layerZeroEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62", // LayerZero Endpoint on Arbitrum
    },
    // Base
    8453: {
      hyperlaneMailbox: "0x0Aa19210B1a1c82f8A5D3a4F1f25B363C5458f54", // Hyperlane Mailbox on Base
      layerZeroEndpoint: "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7", // LayerZero Endpoint on Base
    },
    // Avalanche
    43114: {
      hyperlaneMailbox: "0x3b6044acd6767f017e99318AA6Ef93b7B06A5a22", // Hyperlane Mailbox on Avalanche
      layerZeroEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62", // LayerZero Endpoint on Avalanche
    },
  }

  // Get the addresses for the current network
  const hyperlaneMailbox = addresses[chainId]?.hyperlaneMailbox
  const layerZeroEndpoint = addresses[chainId]?.layerZeroEndpoint

  if (!hyperlaneMailbox || !layerZeroEndpoint) {
    console.error(`No addresses configured for chain ID ${chainId}`)
    process.exit(1)
  }

  console.log(`Deploying BridgeFeeCollector on chain ID ${chainId}...`)
  console.log(`Owner address: ${ownerAddress}`)
  console.log(`Hyperlane mailbox: ${hyperlaneMailbox}`)
  console.log(`LayerZero endpoint: ${layerZeroEndpoint}`)

  // Get the contract factory
  const BridgeFeeCollector = await ethers.getContractFactory("BridgeFeeCollector")

  // Deploy the contract
  const feeCollector = await BridgeFeeCollector.deploy(hyperlaneMailbox, layerZeroEndpoint)

  // Wait for deployment to finish
  await feeCollector.deployed()

  console.log(`BridgeFeeCollector deployed to: ${feeCollector.address}`)

  // Verify the contract on Etherscan (if supported)
  try {
    console.log("Verifying contract on block explorer...")
    await hre.run("verify:verify", {
      address: feeCollector.address,
      constructorArguments: [hyperlaneMailbox, layerZeroEndpoint],
    })
    console.log("Contract verified!")
  } catch (error) {
    console.log("Verification failed or not supported on this network:", error.message)
  }

  console.log("\n-----------------------------------")
  console.log("IMPORTANT: Update your feeCollectorAddresses in bridge-interface.jsx with this address:")
  console.log(`${chainId}: "${feeCollector.address}",`)
  console.log("-----------------------------------\n")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
