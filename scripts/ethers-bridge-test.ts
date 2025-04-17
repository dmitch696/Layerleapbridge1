// This is an alternative test script using ethers.js instead of web3.js
// Run this in your browser console to test the bridge functionality

async function testEthersBridge() {
  try {
    console.log("Starting ethers.js bridge test...")

    // Load ethers
    const ethers = await import("ethers")

    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    // Create provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", [])
    const signer = provider.getSigner()

    // Get current account
    const account = await signer.getAddress()
    console.log("Account:", account)

    // Bridge contract address
    const bridgeAddress = "0xB84361304A2DBe4707FF7D6E06cE32E0cd05D902"

    // Minimal ABI for testing
    const bridgeABI = [
      {
        inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        name: "chainToLzId",
        outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "destinationChainId", type: "uint256" },
          { internalType: "address", name: "recipient", type: "address" },
        ],
        name: "bridgeNative",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
    ]

    // Create contract instance
    const bridge = new ethers.Contract(bridgeAddress, bridgeABI, signer)

    // Test parameters
    const destinationChainId = 42161 // Arbitrum
    const recipient = account // Use current account as recipient

    // Check if chain is supported
    const lzId = await bridge.chainToLzId(destinationChainId)
    console.log(`LayerZero ID for chain ${destinationChainId}: ${lzId.toString()}`)

    if (lzId.toString() === "0") {
      console.error(`Chain ID ${destinationChainId} is not supported!`)
      return
    }

    // Use a very small amount for the test
    const testAmount = ethers.utils.parseEther("0.0001") // 0.0001 ETH

    // Add a small fee
    const feeAmount = ethers.utils.parseEther("0.0001") // 0.0001 ETH for fee

    // Calculate total
    const totalAmount = testAmount.add(feeAmount)
    console.log(`Total amount: ${ethers.utils.formatEther(totalAmount)} ETH`)

    // Ask for confirmation before sending the actual transaction
    const confirmSend = confirm(
      `Are you sure you want to send ${ethers.utils.formatEther(totalAmount)} ETH to the bridge contract?`,
    )
    if (!confirmSend) {
      console.log("Transaction cancelled by user.")
      return
    }

    // Send the actual transaction
    console.log("Sending transaction...")
    const tx = await bridge.bridgeNative(destinationChainId, recipient, {
      value: totalAmount,
      gasLimit: 500000, // Higher gas limit
    })

    console.log("Transaction sent successfully!")
    console.log("Transaction hash:", tx.hash)
    console.log(`View on Optimism Explorer: https://optimistic.etherscan.io/tx/${tx.hash}`)

    // Wait for transaction to be mined
    console.log("Waiting for transaction to be mined...")
    const receipt = await tx.wait()
    console.log("Transaction mined in block:", receipt.blockNumber)
  } catch (error) {
    console.error("Test failed:", error)
  }
}

// Run the test
testEthersBridge()
