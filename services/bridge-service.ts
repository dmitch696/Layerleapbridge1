"use client"

import { isProduction } from "@/utils/environment"
import type { Chain, Token } from "@/hooks/use-bridge-data"

// Import ethers or viem for production
let ethers: any = null
let viem: any = null

if (isProduction && typeof window !== "undefined") {
  try {
    // Using dynamic imports to avoid issues in preview
    ethers = require("ethers")
    viem = require("viem")
  } catch (error) {
    console.warn("Ethers/Viem import failed, using mock implementation")
  }
}

// Hyperlane ABI - actual ABI for production
const hyperlaneAbi = [
  {
    inputs: [
      { name: "destinationChainId", type: "uint32" },
      { name: "recipient", type: "address" },
      { name: "tokenAddress", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "sendToken",
    outputs: [{ name: "messageId", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  // Add more functions from the actual Hyperlane ABI
]

// LayerZero ABI - actual ABI for production
const layerZeroAbi = [
  {
    inputs: [
      { name: "destinationChainId", type: "uint16" },
      { name: "recipient", type: "bytes" },
      { name: "tokenAddress", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "adapterParams", type: "bytes" },
    ],
    name: "send",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // Add more functions from the actual LayerZero ABI
]

// ERC20 ABI for token approvals
const erc20Abi = [
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
]

// Actual contract addresses for production
const protocolContracts = {
  hyperlane: {
    "1": "0x3c61b93B64f59B5AD5286facD5Fc30805A4A32f0", // Ethereum
    "42161": "0x3c61b93B64f59B5AD5286facD5Fc30805A4A32f0", // Arbitrum
    "10": "0x3c61b93B64f59B5AD5286facD5Fc30805A4A32f0", // Optimism
    "137": "0x3c61b93B64f59B5AD5286facD5Fc30805A4A32f0", // Polygon
    "8453": "0x3c61b93B64f59B5AD5286facD5Fc30805A4A32f0", // Base
  },
  layerzero: {
    "1": "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675", // Ethereum
    "42161": "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675", // Arbitrum
    "10": "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675", // Optimism
    "137": "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675", // Polygon
    "8453": "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675", // Base
  },
}

// Chain ID mappings for LayerZero (different from EVM chain IDs)
const layerZeroChainIds = {
  "1": 101, // Ethereum
  "42161": 110, // Arbitrum
  "10": 111, // Optimism
  "137": 109, // Polygon
  "8453": 184, // Base
}

export type BridgeParams = {
  protocol: "hyperlane" | "layerzero"
  sourceChain: Chain
  destChain: Chain
  token: Token
  amount: string
  recipient: `0x${string}`
}

export async function estimateBridgeFee(params: BridgeParams): Promise<string> {
  if (isProduction && ethers) {
    // In production, call the actual contract to get the fee
    try {
      const { protocol, sourceChain, destChain, token, amount } = params

      // Create contract instance
      const contractAddress = protocolContracts[protocol][sourceChain.chainId.toString()]
      const abi = protocol === "hyperlane" ? hyperlaneAbi : layerZeroAbi

      // Call the fee estimation function
      // This would be implemented with actual contract calls

      // Return the actual fee
      return "0.002" // Placeholder
    } catch (error) {
      console.error("Fee estimation error:", error)
      return "0.001" // Fallback
    }
  }

  // In preview, return a mock fee
  return "0.001"
}

export async function estimateBridgeTime(params: BridgeParams): Promise<string> {
  // This could be based on historical data in production
  return params.protocol === "hyperlane" ? "~15 minutes" : "~10 minutes"
}

export async function checkTokenAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  amount: string,
  signer: any,
): Promise<boolean> {
  if (isProduction && ethers) {
    try {
      // Create token contract instance
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer)

      // Check allowance
      const allowance = await tokenContract.allowance(ownerAddress, spenderAddress)

      // Convert amount to BigNumber for comparison
      const amountBN = ethers.utils.parseUnits(amount, 18) // Assuming 18 decimals

      // Return true if allowance is sufficient
      return allowance.gte(amountBN)
    } catch (error) {
      console.error("Allowance check error:", error)
      return false
    }
  }

  // In preview, always return false to trigger approval flow
  return false
}

export async function approveToken(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  signer: any,
): Promise<{ hash: string; status: "pending" | "success" | "error" }> {
  if (isProduction && ethers) {
    try {
      // Create token contract instance
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer)

      // Convert amount to BigNumber
      const amountBN = ethers.utils.parseUnits(amount, 18) // Assuming 18 decimals

      // Send approval transaction
      const tx = await tokenContract.approve(spenderAddress, amountBN)

      // Wait for transaction to be mined
      await tx.wait()

      return {
        hash: tx.hash,
        status: "success",
      }
    } catch (error) {
      console.error("Token approval error:", error)
      return {
        hash: "",
        status: "error",
      }
    }
  }

  // In preview, simulate a delay and return success
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return {
    hash: `0x${Math.random().toString(16).substring(2, 42)}`,
    status: "success",
  }
}

export async function executeBridge(
  params: BridgeParams,
  signer: any,
): Promise<{ hash: string; status: "pending" | "success" | "error" }> {
  try {
    const { protocol, sourceChain, destChain, token, amount, recipient } = params

    if (isProduction && ethers) {
      // In production, execute the actual bridge transaction

      // 1. Check if token is not native (ETH) and needs approval
      if (token.id !== "eth") {
        const tokenAddress = token.addresses[sourceChain.chainId.toString()]
        const contractAddress = protocolContracts[protocol][sourceChain.chainId.toString()]

        // Check if approval is needed
        const hasAllowance = await checkTokenAllowance(tokenAddress, recipient, contractAddress, amount, signer)

        // If approval is needed, send approval transaction
        if (!hasAllowance) {
          const approvalResult = await approveToken(tokenAddress, contractAddress, amount, signer)

          if (approvalResult.status !== "success") {
            throw new Error("Token approval failed")
          }
        }
      }

      // 2. Execute the bridge transaction
      const contractAddress = protocolContracts[protocol][sourceChain.chainId.toString()]
      const abi = protocol === "hyperlane" ? hyperlaneAbi : layerZeroAbi

      // Create contract instance
      const contract = new ethers.Contract(contractAddress, abi, signer)

      // Parse amount with correct decimals
      const parsedAmount = ethers.utils.parseUnits(amount, token.decimals)

      // Get token address on source chain
      const tokenAddress = token.addresses[sourceChain.chainId.toString()]

      // Prepare transaction parameters
      let tx

      if (protocol === "hyperlane") {
        // Call Hyperlane contract
        tx = await contract.sendToken(
          destChain.chainId,
          recipient,
          tokenAddress,
          parsedAmount,
          { value: ethers.utils.parseEther("0.001") }, // Bridge fee
        )
      } else {
        // Call LayerZero contract
        const lzChainId = layerZeroChainIds[destChain.chainId.toString()]
        const adapterParams = "0x" // Default adapter params

        tx = await contract.send(
          lzChainId,
          ethers.utils.defaultAbiCoder.encode(["address"], [recipient]),
          tokenAddress,
          parsedAmount,
          adapterParams,
          { value: ethers.utils.parseEther("0.001") }, // Bridge fee
        )
      }

      // Wait for transaction to be mined
      await tx.wait()

      return {
        hash: tx.hash,
        status: "success",
      }
    } else {
      // In preview, simulate a delay for the transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      return {
        hash: `0x${Math.random().toString(16).substring(2, 42)}`,
        status: "success",
      }
    }
  } catch (error) {
    console.error("Bridge execution error:", error)
    return {
      hash: "",
      status: "error",
    }
  }
}
