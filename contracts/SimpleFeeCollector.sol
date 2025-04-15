// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SimpleFeeCollector {
    // Your wallet address as the owner
    address public owner = 0x3F919B89a03c546BCe66120616F13461578FD8Ff;
    
    // Fee configuration
    uint256 public platformFeePercentage = 50; // 50% of the bridge fee goes to platform
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;
    uint256 public withdrawalThreshold = 0.01 ether; // Auto-withdraw at 0.01 ETH
    
    // Events
    event FeesCollected(uint256 amount);
    event BridgeSimulated(string protocol, uint256 totalFee, uint256 platformFee);
    
    constructor() {}
    
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
    
    // For native token transfers - simplified version that just collects fees
    function bridgeNativeViaHyperlane(
        uint32 destinationChainId,
        address recipient
    ) external payable returns (bytes32) {
        // Calculate fees
        uint256 platformFee = (0.0003 ether * platformFeePercentage) / PERCENTAGE_DENOMINATOR;
        uint256 bridgeFee = 0.0003 ether - platformFee;
        uint256 amount = msg.value - 0.0003 ether;
        
        // In this simplified version, we just emit an event and don't actually bridge
        // In a real implementation, we would call the Hyperlane router here
        emit BridgeSimulated("Hyperlane Native", msg.value, platformFee);
        
        // Send the amount back to the sender (simulating a bridge)
        payable(msg.sender).transfer(amount + bridgeFee);
        
        // Auto-withdraw if threshold reached
        _checkAndWithdraw();
        
        // Return a dummy message ID
        return bytes32(uint256(blockhash(block.number - 1)));
    }
    
    // For native token transfers via LayerZero - simplified version
    function bridgeNativeViaLayerZero(
        uint16 destinationChainId,
        bytes memory recipient,
        bytes memory adapterParams
    ) external payable {
        // Calculate fees
        uint256 platformFee = (0.0003 ether * platformFeePercentage) / PERCENTAGE_DENOMINATOR;
        uint256 bridgeFee = 0.0003 ether - platformFee;
        uint256 amount = msg.value - 0.0003 ether;
        
        // In this simplified version, we just emit an event and don't actually bridge
        emit BridgeSimulated("LayerZero Native", msg.value, platformFee);
        
        // Send the amount back to the sender (simulating a bridge)
        payable(msg.sender).transfer(amount + bridgeFee);
        
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
