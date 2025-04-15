// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract TestBridge {
    address public owner;
    
    event BridgeAttempted(
        string protocol,
        uint256 chainId,
        address recipient,
        uint256 amount
    );
    
    constructor() {
        owner = msg.sender;
    }
    
    // Test function for Hyperlane
    function bridgeNativeViaHyperlane(
        uint32 destinationChainId,
        address recipient
    ) external payable returns (bytes32) {
        // Log the attempt
        emit BridgeAttempted(
            "Hyperlane",
            destinationChainId,
            recipient,
            msg.value
        );
        
        // Return a dummy message ID
        return bytes32(uint256(blockhash(block.number - 1)));
    }
    
    // Test function for LayerZero
    function bridgeNativeViaLayerZero(
        uint16 destinationChainId,
        bytes memory recipient,
        bytes memory adapterParams
    ) external payable {
        // Log the attempt
        address recipientAddr;
        if (recipient.length >= 20) {
            assembly {
                recipientAddr := mload(add(recipient, 20))
            }
        }
        
        emit BridgeAttempted(
            "LayerZero",
            destinationChainId,
            recipientAddr,
            msg.value
        );
    }
    
    // Allow owner to withdraw funds
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
