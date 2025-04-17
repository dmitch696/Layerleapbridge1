// This is a minimal test script that directly interacts with the contract
// Run this in your browser console to test the bridge functionality

async function testDirectBridge() {
  try {
    console.log("Starting direct bridge test...")

    // Load Web3
    const Web3 = (await import("web3")).default
    const web3 = new Web3(window.ethereum)

    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" })

    // Get current account
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]
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
    const bridge = new web3.eth.Contract(bridgeABI, bridgeAddress)

    // Test parameters
    const destinationChainId = 42161 // Arbitrum
    const recipient = account // Use current account as recipient

    // Check if chain is supported
    const lzId = await bridge.methods.chainToLzId(destinationChainId).call()
    console.log(`LayerZero ID for chain ${destinationChainId}: ${lzId}`)

    if (lzId === "0") {
      console.error(`Chain ID ${destinationChainId} is not supported!`)
      return
    }

    // Use a very small amount for the test
    const testAmount = "0.0001" // 0.0001 ETH
    const testAmountWei = web3.utils.toWei(testAmount, "ether")

    // Add a small fee
    const feeAmount = "0.0001" // 0.0001 ETH for fee
    const feeWei = web3.utils.toWei(feeAmount, "ether")

    // Calculate total
    const totalWei = web3.utils.toBN(testAmountWei).add(web3.utils.toBN(feeWei)).toString()
    console.log(`Total amount: ${web3.utils.fromWei(totalWei, "ether")} ETH`)

    // Try a test call first (this doesn't send a transaction)
    try {
      console.log("Testing call (this doesn't send a transaction)...")
      await bridge.methods.bridgeNative(destinationChainId, recipient).call({
        from: account,
        value: totalWei,
      })
      console.log("Test call succeeded! The transaction should work.")
    } catch (error) {
      console.error("Test call failed:", error)
      console.log("The transaction would likely fail with this error.")
      return
    }

    // Ask for confirmation before sending the actual transaction
    const confirmSend = confirm(`Are you sure you want to send ${testAmount} ETH to the bridge contract?`)
    if (!confirmSend) {
      console.log("Transaction cancelled by user.")
      return
    }

    // Send the actual transaction
    console.log("Sending transaction...")
    const tx = await bridge.methods.bridgeNative(destinationChainId, recipient).send({
      from: account,
      value: totalWei,
      gas: 300000, // Higher gas limit
    })

    console.log("Transaction sent successfully!")
    console.log("Transaction hash:", tx.transactionHash)
    console.log(`View on Optimism Explorer: https://optimistic.etherscan.io/tx/${tx.transactionHash}`)
  } catch (error) {
    console.error("Test failed:", error)
  }
}

// Run the test
testDirectBridge()
