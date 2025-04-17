// This is a direct test script for debugging contract chain support
// You can run this in the browser console to test the contract

export async function testContractSupport() {
  console.log("Testing contract chain support...")

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

    // Contract address
    const CONTRACT_ADDRESS = "0x2e04dD2F88AA6a88259c5006FD4C28312D5867B6"

    // ABI for the contract (minimal version for what we need)
    const CONTRACT_ABI = [
      {
        inputs: [{ internalType: "uint256", name: "chainId", type: "uint256" }],
        name: "isChainSupported",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "getSupportedChains",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
      },
    ]

    // Create contract instance
    console.log("Creating contract instance...")
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS)

    // Test getSupportedChains
    console.log("Calling getSupportedChains...")
    try {
      const supportedChains = await contract.methods.getSupportedChains().call()
      console.log("Supported chains:", supportedChains)
    } catch (error) {
      console.error("Error calling getSupportedChains:", error)
    }

    // Test isChainSupported for major chains
    const chainsToTest = [1, 10, 42161, 137, 8453, 43114, 56, 250, 1284]

    console.log("Testing individual chain support...")
    for (const chainId of chainsToTest) {
      try {
        const isSupported = await contract.methods.isChainSupported(chainId).call()
        console.log(`Chain ${chainId} supported: ${isSupported}`)
      } catch (error) {
        console.error(`Error checking support for chain ${chainId}:`, error)
      }
    }

    console.log("Chain support test completed")
    return true
  } catch (error) {
    console.error("Test failed:", error)
    return false
  }
}

// Export the function so it can be called from the browser console
window.testContractSupport = testContractSupport
