// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract HyperlaneTest {
    address public owner;
    address public constant HYPERLANE_MAILBOX = 0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D;
    
    event TestResult(bool success, bytes data);
    
    constructor() {
        owner = msg.sender;
    }
    
    // Test function that directly calls the Hyperlane Mailbox with minimal parameters
    function testHyperlaneCall(
        uint32 destinationDomain,
        address recipient,
        uint256 amount
    ) external payable {
        // Convert recipient address to bytes32
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        // Create a simple message body
        bytes memory messageBody = abi.encode(amount);
        
        // Create the call data for the dispatch function
        bytes memory data = abi.encodeWithSignature(
            "dispatch(uint32,bytes32,bytes)",
            destinationDomain,
            recipientBytes32,
            messageBody
        );
        
        // Call the Hyperlane Mailbox
        (bool success, bytes memory returnData) = HYPERLANE_MAILBOX.call{value: msg.value}(data);
        
        // Emit the result
        emit TestResult(success, returnData);
        
        // Revert if the call failed
        require(success, "Hyperlane call failed");
    }
    
    // Allow owner to withdraw funds
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
