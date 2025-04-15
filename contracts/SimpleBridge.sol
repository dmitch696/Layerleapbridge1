// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Hyperlane Mailbox interface
interface IHyperlaneMailbox {
    function dispatch(
        uint32 destinationDomain,
        bytes32 recipientAddress,
        bytes calldata messageBody
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

contract SimpleBridge {
    address public owner;
    
    // Bridge protocol addresses
    address public hyperlaneMailbox;
    address public layerZeroEndpoint;
    
    // Fee configuration
    uint256 public platformFeePercentage = 50; // 50% of the bridge fee goes to platform
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;
    
    // Events
    event BridgeExecuted(string protocol, uint256 totalFee, uint256 platformFee, uint256 amount);
    
    constructor(address _hyperlaneMailbox, address _layerZeroEndpoint) {
        owner = msg.sender;
        hyperlaneMailbox = _hyperlaneMailbox;
        layerZeroEndpoint = _layerZeroEndpoint;
    }
    
    // Owner can withdraw collected fees
    function withdrawFees() external {
        require(msg.sender == owner, "Only owner can withdraw fees");
        payable(owner).transfer(address(this).balance);
    }
    
    // For native token transfers via Hyperlane
    function bridgeNativeViaHyperlane(
        uint32 destinationChainId,
        address recipient
    ) external payable returns (bytes32) {
        // Calculate fees - 0.0003 ETH is the bridge fee
        uint256 bridgeFee = 0.0003 ether;
        require(msg.value > bridgeFee, "Insufficient ETH sent");
        
        uint256 platformFee = (bridgeFee * platformFeePercentage) / PERCENTAGE_DENOMINATOR;
        uint256 protocolFee = bridgeFee - platformFee;
        uint256 amount = msg.value - bridgeFee;
        
        // Convert recipient address to bytes32
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        // Create message body - encode the amount being sent
        bytes memory messageBody = abi.encode(amount);
        
        // Execute bridge transaction using the Mailbox
        // IMPORTANT: We forward the protocol fee + amount to Hyperlane
        bytes32 messageId = IHyperlaneMailbox(hyperlaneMailbox).dispatch{value: protocolFee + amount}(
            destinationChainId,
            recipientBytes32,
            messageBody
        );
        
        emit BridgeExecuted("Hyperlane Native", bridgeFee, platformFee, amount);
        
        return messageId;
    }
    
    // For native token transfers via LayerZero
    function bridgeNativeViaLayerZero(
        uint16 destinationChainId,
        bytes memory recipient,
        bytes memory adapterParams
    ) external payable {
        // Calculate fees - 0.0003 ETH is the bridge fee
        uint256 bridgeFee = 0.0003 ether;
        require(msg.value > bridgeFee, "Insufficient ETH sent");
        
        uint256 platformFee = (bridgeFee * platformFeePercentage) / PERCENTAGE_DENOMINATOR;
        uint256 protocolFee = bridgeFee - platformFee;
        uint256 amount = msg.value - bridgeFee;
        
        // Execute bridge transaction
        // IMPORTANT: We forward the protocol fee + amount to LayerZero
        ILayerZeroEndpoint(layerZeroEndpoint).send{value: protocolFee + amount}(
            destinationChainId,
            recipient,
            abi.encodePacked(amount),
            payable(address(this)),
            address(0), // No ZRO token payment
            adapterParams
        );
        
        emit BridgeExecuted("LayerZero Native", bridgeFee, platformFee, amount);
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
