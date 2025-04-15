# LayerLeap Bridge

This repository contains the smart contracts and frontend code for the LayerLeap cross-chain bridge with fee collection.

## How It Works

The bridge uses a custom fee collection system that:

1. Collects bridge fees from users
2. Splits the fees (50% to platform owner, 50% to bridge protocol)
3. Forwards transactions to the actual bridge protocols (Hyperlane/LayerZero)
4. Automatically withdraws fees to the owner wallet when they reach 0.01 ETH

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers @nomiclabs/hardhat-etherscan dotenv
\`\`\`

### 2. Configure Environment

Create a `.env` file with:

\`\`\`
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
OWNER_ADDRESS=0x3F919B89a03c546BCe66120616F13461578FD8Ff
\`\`\`

### 3. Configure Hardhat

Create a `hardhat.config.js` file:

\`\`\`javascript
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

module.exports = {
  solidity: "0.8.17",
  networks: {
    ethereum: {
      url: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
      accounts: [process.env.PRIVATE_KEY]
    },
    optimism: {
      url: "https://mainnet.optimism.io",
      accounts: [process.env.PRIVATE_KEY]
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [process.env.PRIVATE_KEY]
    },
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY]
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      optimisticEthereum: process.env.OPTIMISM_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      base: process.env.BASESCAN_API_KEY,
      avalanche: process.env.SNOWTRACE_API_KEY
    }
  }
};
\`\`\`

### 4. Deploy the Fee Collector Contract

Deploy to each network you want to support:

\`\`\`bash
npx hardhat run scripts/deploy-fee-collector.js --network ethereum
npx hardhat run scripts/deploy-fee-collector.js --network optimism
npx hardhat run scripts/deploy-fee-collector.js --network arbitrum
npx hardhat run scripts/deploy-fee-collector.js --network polygon
npx hardhat run scripts/deploy-fee-collector.js --network base
npx hardhat run scripts/deploy-fee-collector.js --network avalanche
\`\`\`

### 5. Update the Frontend

After deploying the contracts, update the `feeCollectorAddresses` object in `components/bridge-interface.jsx` with the deployed contract addresses:

\`\`\`javascript
// Fee collector contract addresses (deployed on each chain)
const feeCollectorAddresses = {
  1: "0x...", // Deployed contract address on Ethereum
  42161: "0x...", // Deployed contract address on Arbitrum
  10: "0x...", // Deployed contract address on Optimism
  137: "0x...", // Deployed contract address on Polygon
  8453: "0x...", // Deployed contract address on Base
  43114: "0x...", // Deployed contract address on Avalanche
}
\`\`\`

## Fee Collection

Fees are automatically collected and sent to your wallet (0x3F919B89a03c546BCe66120616F13461578FD8Ff) when they reach 0.01 ETH.

### Manual Withdrawal

If needed, you can also manually withdraw fees:

1. Call the `withdrawFees()` function on the contract from the owner address.
2. This will transfer all collected fees to the owner address.

## Fee Structure

- Default fee split: 50% to platform, 50% to bridge protocol
- You can adjust this by calling `setFeePercentage(newPercentage)` on the contract
- You can adjust the auto-withdrawal threshold by calling `setWithdrawalThreshold(newThreshold)`

## Monitoring

To monitor collected fees:
1. Check the contract's ETH balance
2. Look for `FeesCollected` and `BridgeExecuted` events
\`\`\`

Let's also update the BridgeFeeCollector contract to ensure it's using the correct Hyperlane and LayerZero interfaces:

```solidity file="contracts/BridgeFeeCollector.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Hyperlane interface
interface IHyperlaneMailbox {
    function dispatch(
        uint32 destinationDomain,
        bytes32 recipientAddress,
        bytes calldata messageBody
    ) external returns (bytes32);
}

interface IHyperlaneRouter {
    function dispatchWithTokens(
        uint32 destinationDomain,
        bytes32 recipientAddress,
        bytes calldata messageBody,
        address token,
        uint256 amount
    ) external payable returns (bytes32);
}

// LayerZero interface
interface ILayerZeroEndpoint {
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;
}

contract BridgeFeeCollector {
    // Your wallet address as the owner
    address public owner = 0x3F919B89a03c546BCe66120616F13461578FD8Ff;
    
    // Bridge protocol router addresses
    address public hyperlaneRouter;
    address public layerZeroRouter;
    
    // Fee configuration
    uint256 public platformFeePercentage = 50; // 50% of the bridge fee goes to platform
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;
    uint256 public withdrawalThreshold = 0.01 ether; // Auto-withdraw at 0.01 ETH
    
    // Events
    event FeesCollected(uint256 amount);
    event BridgeExecuted(string protocol, uint256 totalFee, uint256 platformFee);
    
    constructor(address _hyperlaneRouter, address _layerZeroRouter) {
        hyperlaneRouter = _hyperlaneRouter;
        layerZeroRouter = _layerZeroRouter;
    }
    
    // Owner can withdraw collected fees
    function withdrawFees() external {
        require(msg.sender == owner, "Only owner can withdraw fees");
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
        emit FeesCollected(balance);
    }
    
    // Owner can update fee percentage
    function setFeePercentage(uint256 _percentage) external {
        require(msg.sender == owner, "Only owner can set fee percentage");
        require(_percentage &lt;= 100, "Percentage cannot exceed 100");
        platformFeePercentage = _percentage;
    }
    
    // Owner can update withdrawal threshold
    function setWithdrawalThreshold(uint256 _threshold) external {
        require(msg.sender == owner, "Only owner can set threshold");
        withdrawalThreshold = _threshold;
    }
    
    // Owner can update bridge routers
    function updateRouters(address _hyperlaneRouter, address _layerZeroRouter) external {
        require(msg.sender == owner, "Only owner can update routers");
        hyperlaneRouter = _hyperlaneRouter;
        layerZeroRouter = _layerZeroRouter;
    }
    
    // Bridge via Hyperlane
    function bridgeViaHyperlane(
        uint32 destinationChainId,
        address recipient,
        address tokenAddress,
        uint256 amount
    ) external payable returns (bytes32) {
        // Calculate fees
        uint256 platformFee = (msg.value * platformFeePercentage) / PERCENTAGE_DENOMINATOR;
        uint256 bridgeFee = msg.value - platformFee;
        
        // Convert recipient address to bytes32
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        // Execute bridge transaction
        bytes32 messageId = IHyperlaneRouter(hyperlaneRouter).dispatchWithTokens{value: bridgeFee}(
            destinationChainId,
            recipientBytes32,
            "", // Empty message body
            tokenAddress,
            amount
        );
        
        emit BridgeExecuted("Hyperlane", msg.value, platformFee);
        
        // Auto-withdraw if threshold reached
        _checkAndWithdraw();
        
        return messageId;
    }
    
    // Bridge via LayerZero
    function bridgeViaLayerZero(
        uint16 destinationChainId,
        bytes memory recipient,
        address tokenAddress,
        uint256 amount,
        bytes memory adapterParams
    ) external payable {
        // Calculate fees
        uint256 platformFee = (msg.value * platformFeePercentage) / PERCENTAGE_DENOMINATOR;
        uint256 bridgeFee = msg.value - platformFee;
        
        // Execute bridge transaction
        ILayerZeroEndpoint(layerZeroRouter).send{value: bridgeFee}(
            destinationChainId,
            recipient,
            abi.encodePacked(tokenAddress, amount),
            payable(address(this)),
            address(0), // No ZRO token payment
            adapterParams
        );
        
        emit BridgeExecuted("LayerZero", msg.value, platformFee);
        
        // Auto-withdraw if threshold reached
        _checkAndWithdraw();
    }
    
    // For native token transfers
    function bridgeNativeViaHyperlane(
        uint32 destinationChainId,
        address recipient
    ) external payable returns (bytes32) {
        // Calculate fees
        uint256 platformFee = (0.0003 ether * platformFeePercentage) / PERCENTAGE_DENOMINATOR;
        uint256 bridgeFee = 0.0003 ether - platformFee;
        uint256 amount = msg.value - 0.0003 ether;
        
        // Convert recipient address to bytes32
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        // Execute bridge transaction
        bytes32 messageId = IHyperlaneRouter(hyperlaneRouter).dispatchWithTokens{value: bridgeFee + amount}(
            destinationChainId,
            recipientBytes32,
            "", // Empty message body
            address(0), // Use address(0) for native token
            amount
        );
        
        emit BridgeExecuted("Hyperlane Native", msg.value, platformFee);
        
        // Auto-withdraw if threshold reached
        _checkAndWithdraw();
        
        return messageId;
    }
    
    // For native token transfers via LayerZero
    function bridgeNativeViaLayerZero(
        uint16 destinationChainId,
        bytes memory recipient,
        bytes memory adapterParams
    ) external payable {
        // Calculate fees
        uint256 platformFee = (0.0003 ether * platformFeePercentage) / PERCENTAGE_DENOMINATOR;
        uint256 bridgeFee = 0.0003 ether - platformFee;
        uint256 amount = msg.value - 0.0003 ether;
        
        // Execute bridge transaction
        ILayerZeroEndpoint(layerZeroRouter).send{value: bridgeFee + amount}(
            destinationChainId,
            recipient,
            abi.encodePacked(address(0), amount), // Use address(0) for native token
            payable(address(this)),
            address(0), // No ZRO token payment
            adapterParams
        );
        
        emit BridgeExecuted("LayerZero Native", msg.value, platformFee);
        
        // Auto-withdraw if threshold reached
        _checkAndWithdraw();
    }
    
    // Internal function to check balance and withdraw if above threshold
    function _checkAndWithdraw() internal {
        if (address(this).balance >= withdrawalThreshold) {
            payable(owner).transfer(address(this).balance);
            emit FeesCollected(address(this).balance);
        }
    }
    
    // Anyone can trigger a withdrawal check
    function checkAndWithdraw() external {
        _checkAndWithdraw();
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
