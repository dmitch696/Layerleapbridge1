// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IHyperlaneMailbox {
    function dispatch(
        uint32 destinationDomain,
        bytes32 recipientAddress,
        bytes calldata messageBody
    ) external payable returns (bytes32);
}

contract MinimalHyperlaneTest {
    address public constant HYPERLANE_MAILBOX = 0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D;
    
    event DispatchAttempted(bool success, bytes returnData);
    
    // Simple function that just tries to send a message with minimal parameters
    function testDispatch(uint32 destinationDomain) external payable {
        // Use the caller's address as the recipient
        bytes32 recipientBytes32 = bytes32(uint256(uint160(msg.sender)));
        
        // Empty message body
        bytes memory messageBody = "";
        
        // Call the Hyperlane Mailbox directly
        (bool success, bytes memory returnData) = HYPERLANE_MAILBOX.call{value: msg.value}(
            abi.encodeWithSignature(
                "dispatch(uint32,bytes32,bytes)",
                destinationDomain,
                recipientBytes32,
                messageBody
            )
        );
        
        // Log the result
        emit DispatchAttempted(success, returnData);
        
        // Return the result to the caller
        require(success, "Hyperlane dispatch failed");
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
