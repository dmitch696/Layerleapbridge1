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

contract DirectMailboxTest {
    address public owner;
    IHyperlaneMailbox public mailbox;
    
    event QuoteResult(uint256 quotedFee);
    event DispatchResult(bytes32 messageId);
    
    constructor(address _mailbox) {
        owner = msg.sender;
        mailbox = IHyperlaneMailbox(_mailbox);
    }
    
    // First get a quote for how much the dispatch will cost
    function getQuote(
        uint32 destinationDomain,
        address recipient,
        uint256 amount
    ) external returns (uint256) {
        // Convert recipient address to bytes32
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        // Create a simple message body
        bytes memory messageBody = abi.encode(amount);
        
        // Get a quote
        uint256 fee = mailbox.quoteDispatch(
            destinationDomain,
            recipientBytes32,
            messageBody
        );
        
        emit QuoteResult(fee);
        return fee;
    }
    
    // Then try to dispatch with the quoted fee
    function testDispatch(
        uint32 destinationDomain,
        address recipient,
        uint256 amount
    ) external payable returns (bytes32) {
        // Convert recipient address to bytes32
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        // Create a simple message body
        bytes memory messageBody = abi.encode(amount);
        
        // Dispatch the message
        bytes32 messageId = mailbox.dispatch{value: msg.value}(
            destinationDomain,
            recipientBytes32,
            messageBody
        );
        
        emit DispatchResult(messageId);
        return messageId;
    }
    
    // Allow owner to withdraw funds
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
