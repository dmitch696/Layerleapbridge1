// This is a direct test script for debugging LayerZero bridge functionality
// You can run this in the browser console to test the bridge

export async function testLayerZeroBridge() {
  console.log("Starting LayerZero bridge test...")

  try {
    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" })
    const accounts = await window.ethereum.request({ method: "eth_accounts" })
    if (accounts.length === 0) {
      throw new Error("No accounts found")
    }
    const account = accounts[0]
    console.log("Using account:", account)

    // Check if on Optimism
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
    const chainId = Number.parseInt(chainIdHex, 16)
    console.log("Current chain ID:", chainId)
    if (chainId !== 10) {
      throw new Error("Please switch to Optimism network")
    }

    // Load Web3
    const Web3 = (await import("web3")).default
    const web3 = new Web3(window.ethereum)

    // LayerZero Endpoint address on Optimism
    const LZ_ENDPOINT_ADDRESS = "0x3c2269811836af69497E5F486A85D7316753cf62"

    // Minimal ABI for the LayerZero Endpoint
    const LZ_ENDPOINT_ABI = [
      {
        inputs: [
          { internalType: "uint16", name: "_dstChainId", type: "uint16" },
          { internalType: "bytes", name: "_destination", type: "bytes" },
          { internalType: "bytes", name: "_payload", type: "bytes" },
          { internalType: "address payable", name: "_refundAddress", type: "address" },
          { internalType: "address", name: "_zroPaymentAddress", type: "address" },
          { internalType: "bytes", name: "_adapterParams", type: "bytes" },
        ],
        name: "send",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint16", name: "_dstChainId", type: "uint16" },
          { internalType: "bytes", name: "_destination", type: "bytes" },
          { internalType: "bytes", name: "_payload", type: "bytes" },
          { internalType: "address payable", name: "_refundAddress", type: "address" },
          { internalType: "address", name: "_zroPaymentAddress", type: "address" },
          { internalType: "bytes", name: "_adapterParams", type: "bytes" },
        ],
        name: "estimateFees",
        outputs: [
          { internalType: "uint256", name: "nativeFee", type: "uint256" },
          { internalType: "uint256", name: "zroFee", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ]

    // Create contract instance
    console.log("Creating contract instance...")
    const lzEndpoint = new web3.eth.Contract(LZ_ENDPOINT_ABI, LZ_ENDPOINT_ADDRESS)

    // Test parameters
    const destinationChainId = 101 // Ethereum
    const amount = "0.0001" // Very small test amount
    const amountWei = web3.utils.toWei(amount, "ether")

    // Check for any problematic Unicode characters or escape sequences

    // For example, check the encodeAddressForLayerZero function
    function encodeAddressForLayerZero(address) {
      if (!address.startsWith("0x")) {
        address = "0x" + address
      }
      const addressWithoutPrefix = address.substring(2).toLowerCase()
      const paddedAddress = addressWithoutPrefix.padStart(64, "0")
      return "0x" + paddedAddress
    }

    const encodedRecipient = encodeAddressForLayerZero(account)
    console.log("Encoded recipient:", encodedRecipient)

    // Create a simple payload
    const payload = web3.eth.abi.encodeParameter("string", "test")
    console.log("Payload:", payload)

    // Create adapter parameters with a high gas limit
    const adapterParams = web3.eth.abi.encodeParameters(["uint16", "uint256"], [1, 1000000])
    console.log("Adapter params:", adapterParams)

    // Zero address for ZRO token payments
    const zeroAddress = "0x0000000000000000000000000000000000000000"

    // Fixed fee (0.0003 ETH)
    const feeEth = "0.0003"
    const feeWei = web3.utils.toWei(feeEth, "ether")

    // Calculate total value to send
    const totalEth = Number(amount) + Number(feeEth)
    const totalWei = web3.utils.toWei(totalEth.toString(), "ether")
    console.log("Total value:", totalEth, "ETH")

    // Get current balance
    const balanceWei = await web3.eth.getBalance(account)
    const balanceEth = web3.utils.fromWei(balanceWei, "ether")
    console.log("Account balance:", balanceEth, "ETH")

    // Check if we have enough balance
    if (Number(balanceEth) < totalEth) {
      throw new Error(`Insufficient balance. You need at least ${totalEth} ETH but have ${balanceEth} ETH.`)
    }

    // Ask for confirmation before sending
    const confirmSend = confirm(`Are you sure you want to send ${amount} ETH to ${destinationChainId} via LayerZero?`)
    if (!confirmSend) {
      console.log("Transaction cancelled by user")
      return
    }

    // Estimate gas
    console.log("Estimating gas...")
    try {
      const gasEstimate = await lzEndpoint.methods
        .send(destinationChainId, encodedRecipient, payload, account, zeroAddress, adapterParams)
        .estimateGas({
          from: account,
          value: totalWei,
        })
      console.log("Gas estimate:", gasEstimate)
    } catch (gasError) {
      console.error("Gas estimation failed:", gasError)
      console.log("Continuing with fixed gas limit...")
    }

    // Send the transaction
    console.log("Sending transaction...")
    const tx = await lzEndpoint.methods
      .send(destinationChainId, encodedRecipient, payload, account, zeroAddress, adapterParams)
      .send({
        from: account,
        value: totalWei,
        gas: 1000000, // Fixed high gas limit
      })

    console.log("Transaction sent:", tx.transactionHash)
    console.log("View on Optimism Explorer:", `https://optimistic.etherscan.io/tx/${tx.transactionHash}`)
    console.log("View on LayerZero Scan:", `https://layerzeroscan.com/tx/${tx.transactionHash}`)

    return tx.transactionHash
  } catch (error) {
    console.error("Test failed:", error)
    throw error
  }
}

// Export the function so it can be called from the browser console
window.testLayerZeroBridge = testLayerZeroBridge
