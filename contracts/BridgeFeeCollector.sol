// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Hyperlane Mailbox interface
interface IHyperlaneMailbox {
    function dispatch(
        uint32 destinationDomain,
        bytes32 recipientAddress,
        bytes calldata messageBody
    ) external payable returns (bytes32);
    
    function quoteDispatch(
        uint32 _destinationDomain,
        bytes32 _recipientAddress,
        bytes calldata _messageBody
    ) external view returns (uint256);
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
    
    // Bridge protocol addresses
    address public hyperlaneMailbox;
    address public layerZeroEndpoint;
    
    // Hyperlane domain IDs (different from EVM chain IDs)
    mapping(uint256 => uint32) public chainToDomain;
    
    // Fee configuration
    uint256 public platformFeePercentage = 50; // 50% of the bridge fee goes to platform
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;
    uint256 public withdrawalThreshold = 0.01 ether; // Auto-withdraw at 0.01 ETH
    
    // Events
    event FeesCollected(uint256 amount);
    event BridgeExecuted(string protocol, uint256 totalFee, uint256 platformFee);
    
    constructor(address _hyperlaneMailbox, address _layerZeroEndpoint) {
        hyperlaneMailbox = _hyperlaneMailbox;
        layerZeroEndpoint = _layerZeroEndpoint;
        
        // Initialize Hyperlane domain IDs
        chainToDomain[1] = 1; // Ethereum
        chainToDomain[10] = 10; // Optimism
        chainToDomain[42161] = 42161; // Arbitrum
        chainToDomain[137] = 137; // Polygon
        chainToDomain[8453] = 8453; // Base
        chainToDomain[43114] = 43114; // Avalanche
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
        require(_percentage <= 100, "Percentage cannot exceed 100");
        platformFeePercentage = _percentage;
    }
    
    // Owner can update withdrawal threshold
    function setWithdrawalThreshold(uint256 _threshold) external {
        require(msg.sender == owner, "Only owner can set threshold");
        withdrawalThreshold = _threshold;
    }
    
    // Owner can update bridge addresses
    function updateAddresses(address _hyperlaneMailbox, address _layerZeroEndpoint) external {
        require(msg.sender == owner, "Only owner can update addresses");
        hyperlaneMailbox = _hyperlaneMailbox;
        layerZeroEndpoint = _layerZeroEndpoint;
    }
    
    // Owner can update domain mappings
    function updateDomainMapping(uint256 chainId, uint32 domainId) external {
        require(msg.sender == owner, "Only owner can update mappings");
        chainToDomain[chainId] = domainId;
    }
    
    // For native token transfers via Hyperlane
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
        
        // Get the correct domain ID for the destination chain
        uint32 destinationDomain = chainToDomain[destinationChainId];
        require(destinationDomain != 0, "Destination domain not configured");
        
        // Create message body - for a simple ETH transfer, we can use an empty message
        // In a real implementation, you might encode more data here
        bytes memory messageBody = abi.encode(amount);
        
        // Get the required gas payment for this message
        uint256 gasPayment = IHyperlaneMailbox(hyperlaneMailbox).quoteDispatch(
            destinationDomain,
            recipientBytes32,
            messageBody
        );
        
        // Execute bridge transaction using the Mailbox
        bytes32 messageId = IHyperlaneMailbox(hyperlaneMailbox).dispatch{value: gasPayment}(
            destinationDomain,
            recipientBytes32,
            messageBody
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
        ILayerZeroEndpoint(layerZeroEndpoint).send{value: bridgeFee + amount}(
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
