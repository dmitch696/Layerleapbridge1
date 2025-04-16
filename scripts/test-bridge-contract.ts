// This is a test script to directly interact with the bridge contract
// You can run this in the browser console to debug the contract interaction

async function testBridgeContract() {
  try {
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

    // Try a minimal test call (no actual transaction)
    try {
      await bridge.methods.bridgeNative(destinationChainId, recipient).call({
        from: account,
        value: web3.utils.toWei("0.001", "ether"), // Minimal test amount
      })
      console.log("Test call succeeded! The transaction should work.")
    } catch (error) {
      console.error("Test call failed:", error)
      console.log("The transaction would likely fail with this error.")
    }

    console.log("Test completed. Check the logs above for results.")
  } catch (error) {
    console.error("Test failed:", error)
  }
}

// Run the test
testBridgeContract()
