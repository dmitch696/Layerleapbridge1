// Chain data for UI
export const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷", lzChainId: 101 },
  { id: 42161, name: "Arbitrum", logo: "🔶", lzChainId: 110 },
  { id: 137, name: "Polygon", logo: "🟣", lzChainId: 109 },
  { id: 8453, name: "Base", logo: "🔵", lzChainId: 184 },
  { id: 43114, name: "Avalanche", logo: "❄️", lzChainId: 106 },
]

// Transaction type
export interface BridgeTransaction {
  hash: string
  from: string
  destinationChainId: number
  amount: string
  fee: string
  timestamp: number
  status: "pending" | "completed" | "failed"
}

// LayerZero Endpoint ABI (minimal version for what we need)
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

// LayerZero Endpoint address on Optimism
const LZ_ENDPOINT_ADDRESS = "0x3c2269811836af69497E5F486A85D7316753cf62"

// Check for any problematic Unicode characters or escape sequences

// For example, check the encodeAddressForLayerZero function
function encodeAddressForLayerZero(address: string): string {
  // Ensure the address is properly formatted
  if (!address.startsWith("0x")) {
    address = "0x" + address
  }

  // Remove the 0x prefix for encoding
  const addressWithoutPrefix = address.substring(2)

  // Pad the address to 32 bytes (64 hex characters)
  // This is what LayerZero expects - the address needs to be left-padded with zeros
  const paddedAddress = addressWithoutPrefix.padStart(64, "0")

  // Return with 0x prefix
  return "0x" + paddedAddress
}

/**
 * Check if the user is connected to Optimism
 */
export async function isConnectedToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
    return Number.parseInt(chainIdHex, 16) === 10
  } catch (error) {
    console.error("Error checking network:", error)
    return false
  }
}

/**
 * Switch to Optimism network
 */
export async function switchToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xA" }], // 10 in hex
    })
    return true
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xA",
              chainName: "Optimism",
              nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://mainnet.optimism.io"],
              blockExplorerUrls: ["https://optimistic.etherscan.io"],
            },
          ],
        })
        return await switchToOptimism()
      } catch (addError) {
        console.error("Error adding Optimism network:", addError)
        return false
      }
    }
    console.error("Error switching to Optimism:", switchError)
    return false
  }
}

/**
 * Create adapter parameters for LayerZero
 * This specifies gas parameters for the destination chain
 */
function createDefaultAdapterParams(gasLimit = 200000): string {
  // Version 1 of adapter params just contains the gas limit
  const Web3 = require("web3")
  const web3 = new Web3()

  // Encode the version (1) and gas limit
  return web3.eth.abi.encodeParameters(["uint16", "uint256"], [1, gasLimit])
}

/**
 * Bridge ETH using LayerZero directly
 */
export async function bridgeETH(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    // Use Web3.js
    const Web3 = require("web3")
    const web3 = new Web3(window.ethereum)

    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" })

    // Get current account
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]

    // Check if on Optimism
    const chainId = await web3.eth.getChainId()
    if (chainId !== 10) {
      throw new Error("Please connect to Optimism network")
    }

    // Find the LayerZero chain ID for the destination
    const destChain = CHAINS.find((chain) => chain.id === destinationChainId)
    if (!destChain) {
      throw new Error(`Destination chain ${destinationChainId} not supported`)
    }
    const lzDestChainId = destChain.lzChainId

    // Use a minimal test amount for safety
    const testAmount = "0.0001" // 0.0001 ETH
    console.log(`Using test amount: ${testAmount} ETH instead of ${amount} ETH for safety`)

    // Convert amount to wei
    const amountWei = web3.utils.toWei(testAmount, "ether")

    // Create LayerZero endpoint contract instance
    const lzEndpoint = new web3.eth.Contract(LZ_ENDPOINT_ABI, LZ_ENDPOINT_ADDRESS)

    // Properly encode the recipient address for LayerZero
    // This is the key fix for the "incorrect remote address size" error
    const encodedRecipient = encodeAddressForLayerZero(recipientAddress)
    console.log("Encoded recipient:", encodedRecipient)

    // Create the payload - for a simple ETH transfer, we just encode the amount
    const payload = web3.eth.abi.encodeParameter("uint256", amountWei)

    // Create adapter parameters with a fixed gas limit
    const adapterParams = createDefaultAdapterParams(300000) // 300k gas limit

    // Zero address for ZRO token payments (we're not using ZRO)
    const zeroAddress = "0x0000000000000000000000000000000000000000"

    // Get current account balance
    const balanceWei = await web3.eth.getBalance(account)
    const balanceEth = web3.utils.fromWei(balanceWei, "ether")
    console.log(`Account balance: ${balanceEth} ETH`)

    // Fixed fee for debugging (0.0003 ETH)
    const feeEth = "0.0003"
    const feeWei = web3.utils.toWei(feeEth, "ether")
    console.log(`Using fixed fee: ${feeEth} ETH (${feeWei} wei)`)

    // Calculate total value to send (amount + fee)
    const amountEth = Number(testAmount)
    const totalEth = amountEth + Number(feeEth)
    const totalWei = web3.utils.toWei(totalEth.toString(), "ether")
    console.log(`Total value: ${totalEth} ETH (${totalWei} wei)`)

    // Check if we have enough balance
    if (Number(balanceEth) < totalEth) {
      throw new Error(`Insufficient balance. You need at least ${totalEth} ETH but have ${balanceEth} ETH.`)
    }

    // Send the transaction
    console.log("Sending transaction...")
    const tx = await lzEndpoint.methods
      .send(
        lzDestChainId,
        encodedRecipient,
        payload,
        account, // refund address (same as sender)
        zeroAddress, // zroPaymentAddress - we're not using ZRO token
        adapterParams,
      )
      .send({
        from: account,
        value: totalWei,
        gas: 500000, // Fixed high gas limit
      })

    console.log("Transaction sent:", tx.transactionHash)

    // Save transaction to history
    saveTransaction({
      hash: tx.transactionHash,
      from: account,
      destinationChainId,
      amount: testAmount,
      fee: web3.utils.fromWei(feeWei, "ether"),
      timestamp: Date.now(),
      status: "pending",
    })

    return {
      success: true,
      txHash: tx.transactionHash,
    }
  } catch (error: any) {
    console.error("Bridge error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Save transaction to local storage
 */
function saveTransaction(tx: BridgeTransaction): void {
  try {
    const TX_HISTORY_KEY = "layerleap_bridge_transactions"

    // Get existing transactions
    let existingTxs: BridgeTransaction[] = []
    const txsJson = localStorage.getItem(TX_HISTORY_KEY)

    if (txsJson) {
      existingTxs = JSON.parse(txsJson)
    }

    // Add new transaction
    const updatedTxs = [tx, ...existingTxs]

    // Save to local storage
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(updatedTxs))
  } catch (error) {
    console.error("Error saving transaction:", error)
  }
}

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum: any
  }
}
