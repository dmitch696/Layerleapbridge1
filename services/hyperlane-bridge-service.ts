// Chain data for UI
export const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷", hyperlaneId: 1 },
  { id: 42161, name: "Arbitrum", logo: "🔶", hyperlaneId: 42161 },
  { id: 137, name: "Polygon", logo: "🟣", hyperlaneId: 137 },
  { id: 8453, name: "Base", logo: "🔵", hyperlaneId: 8453 },
  { id: 43114, name: "Avalanche", logo: "❄️", hyperlaneId: 43114 },
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

// Hyperlane Mailbox address on Optimism
const HYPERLANE_MAILBOX = "0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D"

// Base fee for Hyperlane bridge (0.0003 ETH)
const BASE_FEE = "0.0003"

// Minimal ABI for the Hyperlane Mailbox
const HYPERLANE_MAILBOX_ABI = [
  {
    inputs: [
      { name: "_destinationDomain", type: "uint32" },
      { name: "_recipientAddress", type: "bytes32" },
      { name: "_messageBody", type: "bytes" },
    ],
    name: "dispatch",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "_destinationDomain", type: "uint32" },
      { name: "_recipientAddress", type: "bytes32" },
      { name: "_messageBody", type: "bytes" },
    ],
    name: "quoteDispatch",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "localDomain",
    outputs: [{ name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
]

/**
 * Check if the destination chain is supported by Hyperlane
 */
export async function isChainSupported(destinationChainId: number): Promise<boolean> {
  // In Hyperlane, the chain IDs generally match the domain IDs for major chains
  return CHAINS.some((chain) => chain.id === destinationChainId)
}

/**
 * Format an Ethereum address into bytes32 format for Hyperlane
 */
function addressToBytes32(address: string): string {
  if (!address.startsWith("0x")) {
    address = "0x" + address
  }

  // Ensure it's a valid address
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error("Invalid Ethereum address")
  }

  // Remove 0x prefix and pad to 32 bytes (64 hex chars) - for bytes32 type
  return "0x" + address.slice(2).padStart(64, "0")
}

/**
 * Get fee estimate for Hyperlane bridging
 */
export async function getHyperlaneBridgeFee(
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

    // Create contract instance
    const mailbox = new web3.eth.Contract(HYPERLANE_MAILBOX_ABI as any, HYPERLANE_MAILBOX)

    // Format recipient address to bytes32
    const recipientBytes32 = addressToBytes32(recipientAddress)

    // Create a message body with the amount
    const amountWei = web3.utils.toWei(amount, "ether")
    const messageBody = web3.eth.abi.encodeParameters(["uint256"], [amountWei])

    // Get fee estimate from Hyperlane
    const destinationDomain = destinationChainId // In Hyperlane, major chain IDs match domain IDs

    // Use a fixed base fee of 0.0003 ETH
    const baseFeeWei = web3.utils.toWei(BASE_FEE, "ether")

    // Add a 10% buffer to the base fee
    const feeWithBuffer = web3.utils.toBN(baseFeeWei).mul(web3.utils.toBN(110)).div(web3.utils.toBN(100))
    const feeEth = web3.utils.fromWei(feeWithBuffer.toString(), "ether")

    return {
      success: true,
      fee: feeEth,
    }
  } catch (error: any) {
    console.error("Hyperlane fee estimation error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Bridge ETH via Hyperlane
 */
export async function bridgeETH(
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

    // Use the user-specified amount
    console.log(`Bridging ${amount} ETH`)

    // Create contract instance
    const mailbox = new web3.eth.Contract(HYPERLANE_MAILBOX_ABI as any, HYPERLANE_MAILBOX)

    // Format recipient address to bytes32
    const recipientBytes32 = addressToBytes32(account)
    console.log("Recipient bytes32:", recipientBytes32)

    // Create a message body with the amount
    const amountWei = web3.utils.toWei(amount, "ether")
    const messageBody = web3.eth.abi.encodeParameters(["uint256"], [amountWei])

    // Use the native chain ID as domain ID (works for major chains in Hyperlane)
    const destinationDomain = destinationChainId

    // Use a fixed base fee of 0.0003 ETH
    const baseFeeWei = web3.utils.toWei(BASE_FEE, "ether")

    // Add a 10% buffer to the base fee
    const feeWithBuffer = web3.utils.toBN(baseFeeWei).mul(web3.utils.toBN(110)).div(web3.utils.toBN(100))

    // Add the amount to the message value (amount + fee)
    const valueToSend = web3.utils.toBN(feeWithBuffer).add(web3.utils.toBN(amountWei))

    console.log("Transaction details:")
    console.log(`- Destination domain: ${destinationDomain}`)
    console.log(`- Amount: ${amount} ETH`)
    console.log(`- Fee with buffer: ${web3.utils.fromWei(feeWithBuffer.toString(), "ether")} ETH`)
    console.log(`- Total value: ${web3.utils.fromWei(valueToSend.toString(), "ether")} ETH`)

    // Send the transaction
    const tx = await mailbox.methods.dispatch(destinationDomain, recipientBytes32, messageBody).send({
      from: account,
      value: valueToSend.toString(),
      gas: 500000, // High gas limit for safety
    })

    console.log("Transaction submitted:", tx.transactionHash)

    // Save transaction to history
    saveTransaction({
      hash: tx.transactionHash,
      from: account,
      destinationChainId,
      amount: amount,
      fee: web3.utils.fromWei(feeWithBuffer.toString(), "ether"),
      timestamp: Date.now(),
      status: "pending",
    })

    return {
      success: true,
      txHash: tx.transactionHash,
    }
  } catch (error: any) {
    console.error("Hyperlane bridge error:", error)
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
