// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract DebugBridge {
    address public owner;
    address public hyperlaneMailbox;
    
    event DebugLog(string message, uint256 value);
    event AttemptedCall(address target, bytes data, uint256 value);
    
    constructor(address _hyperlaneMailbox) {
        owner = msg.sender;
        hyperlaneMailbox = _hyperlaneMailbox;
    }
    
    // Test function that just logs the parameters and returns success
    function testBridgeParams(
        uint32 destinationChainId,
        address recipient,
        uint256 amount
    ) external payable returns (bool) {
        emit DebugLog("Destination Chain ID", destinationChainId);
        emit DebugLog("Amount", amount);
        emit DebugLog("Total ETH Received", msg.value);
        
        return true;
    }
    
    // Test function that attempts to call the Hyperlane Mailbox but with try/catch
    function safeBridgeViaHyperlane(
        uint32 destinationChainId,
        address recipient
    ) external payable returns (bool) {
        // Calculate fees
        uint256 bridgeFee = 0.0003 ether;
        require(msg.value > bridgeFee, "Insufficient ETH sent");
        
        uint256 platformFee = bridgeFee / 2;
        uint256 protocolFee = bridgeFee - platformFee;
        uint256 amount = msg.value - bridgeFee;
        
        // Convert recipient address to bytes32
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        // Create message body
        bytes memory messageBody = abi.encode(amount);
        
        // Log the attempt
        emit DebugLog("Attempting to call Hyperlane Mailbox", protocolFee + amount);
        
        // Create the call data
        bytes memory data = abi.encodeWithSignature(
            "dispatch(uint32,bytes32,bytes)",
            destinationChainId,
            recipientBytes32,
            messageBody
        );
        
        // Log the call data
        emit AttemptedCall(hyperlaneMailbox, data, protocolFee + amount);
        
        // Try to call the Hyperlane Mailbox
        (bool success, bytes memory returnData) = hyperlaneMailbox.call{value: protocolFee + amount}(data);
        
        // Log the result
        emit DebugLog("Call success", success ? 1 : 0);
        
        return success;
    }
    
    // Allow owner to withdraw funds
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
