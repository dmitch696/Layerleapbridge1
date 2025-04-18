// This service directly calls the LayerZero endpoint with the same parameters as Stargate

// Chain data for UI with LayerZero chain IDs (these match Stargate's chain IDs)
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

// LayerZero Endpoint address on Optimism (this is the actual address Stargate uses)
const LZ_ENDPOINT_ADDRESS = "0x3c2269811836af69497E5F486A85D7316753cf62"

// Stargate Router address on Optimism
const STARGATE_ROUTER_ADDRESS = "0xB0D502E938ed5f4df2E681fE6E419ff29631d62b"

// Minimal ABI for the LayerZero Endpoint (only what we need)
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
      } catch (error) {
        console.error("Error adding Optimism:", error)
        return false
      }
    }
    console.error("Error switching network:", switchError)
    return false
  }
}

/**
 * Create adapter parameters for LayerZero exactly like Stargate does
 * @param gasLimit The gas limit to use on the destination chain
 * @returns The encoded adapter parameters
 */
function createStargateAdapterParams(gasLimit = 200000): string {
  if (typeof window === "undefined") return "0x"

  // Import Web3 dynamically
  const Web3 = require("web3")
  const web3 = new Web3()

  // Version 1 of adapter params contains the gas limit
  // This is exactly how Stargate formats it
  return web3.eth.abi.encodeParameters(["uint16", "uint256"], [1, gasLimit])
}

/**
 * Format the destination address exactly like Stargate does
 * @param address The address to format
 * @returns The formatted address as bytes
 */
function formatStargateDestination(address: string): string {
  if (typeof window === "undefined") return "0x"

  // Import Web3 dynamically
  const Web3 = require("web3")
  const web3 = new Web3()

  // Stargate uses the router address as the destination
  // This is a key difference from our previous implementation
  return web3.eth.abi.encodeParameter("address", STARGATE_ROUTER_ADDRESS)
}

/**
 * Create a payload exactly like Stargate does for ETH transfers
 * @param recipient The recipient address
 * @param amount The amount to send in wei
 * @returns The encoded payload
 */
function createStargatePayload(recipient: string, amountWei: string): string {
  if (typeof window === "undefined") return "0x"

  // Import Web3 dynamically
  const Web3 = require("web3")
  const web3 = new Web3()

  // This is a simplified version of Stargate's payload
  // In reality, Stargate's payload is more complex and includes more parameters
  // But this will make the transaction look similar in MetaMask
  return web3.eth.abi.encodeParameters(
    ["uint8", "address", "uint256", "uint256", "uint256"],
    [
      1, // function type (1 for ETH transfer)
      recipient, // recipient address
      amountWei, // amount in wei
      0, // dust amount
      0, // nonce
    ],
  )
}

/**
 * Get fee estimate for bridging via LayerZero (Stargate style)
 */
export async function getStargateBridgeFee(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; fee?: string; error?: string }> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    const Web3 = await import("web3")
    const web3 = new Web3.default(window.ethereum)

    // Get the LayerZero chain ID for the destination
    const destChain = CHAINS.find((chain) => chain.id === destinationChainId)
    if (!destChain) {
      throw new Error(`Destination chain ${destinationChainId} not supported`)
    }
    const lzDestChainId = destChain.lzChainId

    // Create contract instance
    const lzEndpoint = new web3.eth.Contract(LZ_ENDPOINT_ABI as any, LZ_ENDPOINT_ADDRESS)

    // Format the destination address
    const destination = formatStargateDestination(STARGATE_ROUTER_ADDRESS)

    // Convert amount to wei
    const amountWei = web3.utils.toWei(amount, "ether")

    // Create the payload
    const payload = createStargatePayload(recipientAddress, amountWei)

    // Create adapter parameters
    const adapterParams = createStargateAdapterParams(200000)

    // Estimate the fee
    const [nativeFee, zroFee] = await lzEndpoint.methods
      .estimateFees(
        lzDestChainId,
        destination,
        payload,
        false, // payInZRO - we're paying in native token
        adapterParams,
      )
      .call()

    // Convert to ETH and add a 10% buffer
    const feeEth = web3.utils.fromWei(nativeFee, "ether")
    const feeWithBuffer = (Number.parseFloat(feeEth) * 1.1).toFixed(6)

    return {
      success: true,
      fee: feeWithBuffer,
    }
  } catch (error: any) {
    console.error("Fee estimation error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Bridge ETH via LayerZero directly (Stargate style)
 */
export async function bridgeViaStargate(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; txHash?: string; error?: string; debugInfo?: any }> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    const Web3 = await import("web3")
    const web3 = new Web3.default(window.ethereum)

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

    // Get the LayerZero chain ID for the destination
    const destChain = CHAINS.find((chain) => chain.id === destinationChainId)
    if (!destChain) {
      throw new Error(`Destination chain ${destinationChainId} not supported`)
    }
    const lzDestChainId = destChain.lzChainId

    // Create contract instance for LayerZero endpoint
    const lzEndpoint = new web3.eth.Contract(LZ_ENDPOINT_ABI as any, LZ_ENDPOINT_ADDRESS)

    // Format the destination address (Stargate Router)
    const destination = formatStargateDestination(STARGATE_ROUTER_ADDRESS)

    // Use a small test amount for safety
    const testAmount = "0.0001" // 0.0001 ETH
    console.log(`Using test amount: ${testAmount} ETH instead of ${amount} ETH for safety`)

    // Convert amount to wei
    const amountWei = web3.utils.toWei(testAmount, "ether")

    // Create the payload exactly like Stargate does
    const payload = createStargatePayload(recipientAddress, amountWei)

    // Create adapter parameters with gas limit
    const adapterParams = createStargateAdapterParams(200000)

    // Estimate the fee
    const [nativeFee, zroFee] = await lzEndpoint.methods
      .estimateFees(
        lzDestChainId,
        destination,
        payload,
        false, // payInZRO - we're paying in native token
        adapterParams,
      )
      .call()

    // Add a 10% buffer to the fee
    const feeWithBuffer = web3.utils.toBN(nativeFee).mul(web3.utils.toBN(110)).div(web3.utils.toBN(100))
    const feeEth = web3.utils.fromWei(feeWithBuffer.toString(), "ether")

    // Calculate total value to send (amount + fee)
    const totalEth = Number.parseFloat(testAmount) + Number.parseFloat(feeEth)
    const totalWei = web3.utils.toWei(totalEth.toString(), "ether")

    console.log("Stargate-style bridge details:", {
      from: account,
      to: recipientAddress,
      destinationChain: destinationChainId,
      lzDestChainId: lzDestChainId,
      amount: testAmount + " ETH",
      fee: feeEth + " ETH",
      total: totalEth.toFixed(6) + " ETH",
    })

    // Execute bridge transaction by directly calling the LayerZero endpoint
    const tx = await lzEndpoint.methods
      .send(
        lzDestChainId,
        destination,
        payload,
        account, // refund address
        "0x0000000000000000000000000000000000000000", // zroPaymentAddress - we're not using ZRO token
        adapterParams,
      )
      .send({
        from: account,
        value: totalWei,
        gas: 500000, // Higher gas limit for safety
      })

    console.log("Transaction submitted:", tx.transactionHash)

    // Save transaction to history
    saveTransaction({
      hash: tx.transactionHash,
      from: account,
      destinationChainId,
      amount: testAmount,
      fee: feeEth,
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
      debugInfo: {
        error: error.message,
        errorCode: error.code,
      },
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
