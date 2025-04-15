// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Hyperlane interfaces based on their official documentation
interface IMailbox {
    function localDomain() external view returns (uint32);
    
    function dispatch(
        uint32 _destinationDomain,
        bytes32 _recipientAddress,
        bytes calldata _messageBody
    ) external payable returns (bytes32);
    
    function process(bytes calldata _metadata, bytes calldata _message)
        external
        returns (bool success);
        
    function quoteDispatch(
        uint32 _destinationDomain,
        bytes32 _recipientAddress,
        bytes calldata _messageBody
    ) external view returns (uint256);
}

interface IInterchainSecurityModule {
    function moduleType() external view returns (uint8);
}

contract EnhancedHyperlaneBridge {
    // Hyperlane Mailbox on Optimism - verified address
    address public constant MAILBOX = 0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D;
    
    // Owner address
    address public owner;
    
    // Domain mappings for Hyperlane (using the official mappings)
    mapping(uint256 => uint32) public chainToDomain;
    
    // Events
    event BridgeInitiated(uint32 destinationDomain, address recipient, uint256 amount, uint256 fee);
    event MailboxInfo(uint32 localDomain);
    event DebugLog(string message, bytes data);
    
    constructor() {
        owner = msg.sender;
        
        // Initialize Hyperlane domain mappings (official values)
        chainToDomain[1] = 1;        // Ethereum
        chainToDomain[10] = 10;      // Optimism
        chainToDomain[42161] = 42161; // Arbitrum
        chainToDomain[137] = 137;    // Polygon
        chainToDomain[8453] = 8453;  // Base
        chainToDomain[43114] = 43114; // Avalanche
        
        // Log the local domain on deployment
        try IMailbox(MAILBOX).localDomain() returns (uint32 domain) {
            emit MailboxInfo(domain);
        } catch {
            // If this fails, the mailbox might not be properly initialized
        }
    }
    
    // Owner can withdraw collected fees
    function withdrawFees() external {
        require(msg.sender == owner, "Only owner can withdraw fees");
        payable(owner).transfer(address(this).balance);
    }
    
    // Get a quote for the gas needed for a Hyperlane message
    function getQuote(
        uint256 destinationChainId,
        address recipient,
        uint256 amount
    ) external view returns (uint256) {
        // Get the domain ID for the destination chain
        uint32 destinationDomain = chainToDomain[destinationChainId];
        require(destinationDomain != 0, "Unsupported destination chain");
        
        // Convert recipient address to bytes32 format
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        // Create a simple message with the amount
        bytes memory messageBody = abi.encode(amount);
        
        // Get a quote for the gas needed
        return IMailbox(MAILBOX).quoteDispatch(
            destinationDomain,
            recipientBytes32,
            messageBody
        );
    }
    
    // Bridge via Hyperlane with proper error handling
    function bridgeViaHyperlane(
        uint256 destinationChainId,
        address recipient
    ) external payable returns (bytes32) {
        // Validate inputs
        require(msg.value > 0, "Must send ETH to bridge");
        
        // Get the domain ID for the destination chain
        uint32 destinationDomain = chainToDomain[destinationChainId];
        require(destinationDomain != 0, "Unsupported destination chain");
        
        // Calculate fees - fixed fee of 0.0003 ETH
        uint256 bridgeFee = 0.0003 ether;
        require(msg.value > bridgeFee, "Insufficient ETH for fees");
        
        // Calculate platform fee (50%) and amount to bridge
        uint256 platformFee = bridgeFee / 2;
        uint256 amountToBridge = msg.value - bridgeFee;
        
        // Convert recipient address to bytes32 format
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        // Create a simple message with the amount
        bytes memory messageBody = abi.encode(amountToBridge);
        
        // Get a quote for the gas needed
        uint256 gasNeeded;
        try IMailbox(MAILBOX).quoteDispatch(
            destinationDomain,
            recipientBytes32,
            messageBody
        ) returns (uint256 quote) {
            gasNeeded = quote;
        } catch {
            // If quote fails, use a reasonable default
            gasNeeded = 0.0001 ether;
        }
        
        // Make sure we're sending enough for the gas
        require(bridgeFee - platformFee >= gasNeeded, "Insufficient fee for gas");
        
        bytes32 messageId;
        
        // Try to send the message through Hyperlane with proper error handling
        try IMailbox(MAILBOX).dispatch{value: gasNeeded}(
            destinationDomain,
            recipientBytes32,
            messageBody
        ) returns (bytes32 id) {
            messageId = id;
        } catch (bytes memory reason) {
            // Log the error and revert with the reason
            emit DebugLog("Dispatch failed", reason);
            
            // Return the ETH to the sender
            payable(msg.sender).transfer(msg.value - platformFee);
            
            // Revert with a clear message
            revert("Hyperlane dispatch failed");
        }
        
        emit BridgeInitiated(destinationDomain, recipient, amountToBridge, bridgeFee);
        
        return messageId;
    }
    
    // Function to check the local domain of the mailbox
    function checkLocalDomain() external view returns (uint32) {
        return IMailbox(MAILBOX).localDomain();
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
