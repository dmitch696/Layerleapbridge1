// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // LayerZero Bridge contract on Optimism
  LAYER_ZERO_BRIDGE: "0xB84361304A2DBe4707FF7D6E06cE32E0cd05D902",
}

// Complete ABI for the FixedLayerZeroBridge contract
export const BRIDGE_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint16",
        name: "destinationChainId",
        type: "uint16"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "recipient",
        type: "bytes"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256"
      }
    ],
    name: "BridgeInitiated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "FeesCollected",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "destinationChainId",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address"
      }
    ],
    name: "bridgeNative",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "checkAndWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",\
        name": "",
        type: "uint256"
      }
    ],
    name: "chainToLzId",
    outputs: [
      {
        internalType: "uint16",
        name": "",
        type: "uint16"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "destinationChainId",
        type: "uint256"
      },
      {
        internalType": "address",
        name": "",
        type": "address"
      },
      {
        internalType": "uint256",
        name": "amount",
        type": "uint256"
      }
    ],
    name": "estimateFee",
    outputs: [
      {
        internalType": "uint256",
        name": "fee",
        type": "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs": [],
    name": "owner",
    outputs: [
      {
        internalType": "address",
        name": "",
        type": "address"
      }
    ],
    stateMutability": "view",
    type": "function"
  },
  {
    inputs": [],
    name": "platformFeePercentage",
    outputs: [
      {
        internalType": "uint256",
        name": "",
        type": "uint256"
      }
    ],
    stateMutability: "view",
    type": "function"
  },
  {
    inputs": [
      {
        internalType": "uint256",
        name": "chainId",
        type": "uint256"
      },
      {
        internalType": "uint16",
        name": "lzId",
        type": "uint16"
      }
    ],
    name
;
;(": ")
setChainIdMapping
",
    outputs: [],
    stateMutability": "nonpayable",
type
;(": ")
function
"
  },
{
  inputs: [
      {
        internalType": "uint256",
        name": "_percentage",
        type": "uint256"
      }
    ],
    name
  ;
  ;(": ")
  setFeePercentage
  ",
    outputs: [],
    stateMutability": "nonpayable",
  type
  ;(": ")
  function
  "
}
,
{
  inputs: [
      {
        internalType": "uint256",
        name": "_threshold",
        type": "uint256"
      }
    ],
    name
  ;
  ;(": ")
  setWithdrawalThreshold
  ",
    outputs: [],
    stateMutability": "nonpayable",
  type
  ;(": ")
  function
  "
}
,
{
  inputs
  ": [],
    name": "withdrawFees",
    outputs: [],
    stateMutability": "nonpayable",
  type
  ;(": ")
  function
  "
}
,
{
  inputs
  ": [],
    name": "withdrawalThreshold",
    outputs: [
  internalType
  ;(": ")
  uint256
  ",
        name": "",
  type
  ;(": ")
  uint256
  "
  ],
    stateMutability": "view",
  type
  ;(": ")
  function
  "
}
,
{
  stateMutability
  ;(": ")
  payable
  ",
  type
  ;(": ")
  receive
  "
}
]

// Network configuration
export const NETWORKS = {
  OPTIMISM: {
    chainId: 10,
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    blockExplorer: "https://optimistic.etherscan.io",
    logo: "🔴",
  },
  ETHEREUM: {
    chainId: 1,
    name: "Ethereum",
    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorer: "https://etherscan.io",
    logo: "🔷",
  },
  ARBITRUM: {
    chainId: 42161,
    name: "Arbitrum",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    logo: "🔶",
  },
  POLYGON: {
    chainId: 137,
    name: "Polygon",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    logo: "🟣",
  },
  BASE: {
    chainId: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    logo: "🔵",
  },
  AVALANCHE: {
    chainId: 43114,
    name: "Avalanche",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    blockExplorer: "https://snowtrace.io",
    logo: "❄️",
  },
}

// Chain data for UI
export const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷" },
  { id: 42161, name: "Arbitrum", logo: "🔶" },
  { id: 137, name: "Polygon", logo: "🟣" },
  { id: 8453, name: "Base", logo: "🔵" },
  { id: 43114, name: "Avalanche", logo: "❄️" },
]

export interface BridgeTransaction {
  hash: string
  from: string
  destinationChainId: number
  amount: string
  fee: string
  timestamp: number
  status: "pending" | "completed" | "failed"
}
