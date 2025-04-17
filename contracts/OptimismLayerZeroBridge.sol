// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title OptimismLayerZeroBridge
 * @dev A bridge contract for sending ETH from Optimism to other chains via LayerZero
 */
interface ILayerZeroEndpoint {
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;

    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParam
    ) external view returns (uint256 nativeFee, uint256 zroFee);
}

contract OptimismLayerZeroBridge {
    // Owner address
    address public owner;
    
    // LayerZero endpoint address on Optimism
    address public constant LAYERZERO_ENDPOINT = 0x3c2269811836af69497E5F486A85D7316753cf62;
    
    // LayerZero chain IDs mapping (EVM chain ID => LayerZero chain ID)
    mapping(uint256 => uint16) public chainToLzId;
    
    // Fee configuration
    uint256 public platformFeePercentage = 50; // 50% of the bridge fee goes to platform
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;
    uint256 public withdrawalThreshold = 0.01 ether; // Auto-withdraw at 0.01 ETH
    
    // Events
    event BridgeInitiated(uint16 dstChainId, bytes recipient, uint256 amount, uint256 fee);
    event FeesCollected(uint256 amount);
    event ChainMappingUpdated(uint256 evmChainId, uint16 lzChainId);
    event DebugLog(string message, bytes data);
    
    constructor() {
        owner = msg.sender;
        
        // Initialize LayerZero chain ID mappings
        // These are the correct mappings for LayerZero
        chainToLzId[1] = 101;      // Ethereum
        chainToLzId[10] = 111;     // Optimism
        chainToLzId[42161] = 110;  // Arbitrum
        chainToLzId[137] = 109;    // Polygon
        chainToLzId[8453] = 184;   // Base
        chainToLzId[43114] = 106;  // Avalanche
        chainToLzId[56] = 102;     // BSC
        chainToLzId[250] = 112;    // Fantom
        chainToLzId[1284] = 126;   // Moonbeam
    }
    
    /**
     * @dev Only owner modifier
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Owner can withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
        emit FeesCollected(balance);
    }
    
    /**
     * @dev Owner can update fee percentage
     */
    function setFeePercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 100, "Percentage cannot exceed 100");
        platformFeePercentage = _percentage;
    }
    
    /**
     * @dev Owner can update withdrawal threshold
     */
    function setWithdrawalThreshold(uint256 _threshold) external onlyOwner {
        withdrawalThreshold = _threshold;
    }
    
    /**
     * @dev Owner can update chain ID mappings
     */
    function setChainIdMapping(uint256 evmChainId, uint16 lzChainId) external onlyOwner {
        chainToLzId[evmChainId] = lzChainId;
        emit ChainMappingUpdated(evmChainId, lzChainId);
    }
    
    /**
     * @dev Check if a chain is supported
     */
    function isChainSupported(uint256 chainId) external view returns (bool) {
        return chainToLzId[chainId] != 0;
    }
    
    /**
     * @dev Get all supported chains
     */
    function getSupportedChains() external view returns (uint256[] memory) {
        // Count supported chains
        uint256 count = 0;
        for (uint256 i = 1; i <= 50000; i++) {
            if (chainToLzId[i] != 0) {
                count++;
            }
        }
        
        // Create array of supported chains
        uint256[] memory supportedChains = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= 50000; i++) {
            if (chainToLzId[i] != 0) {
                supportedChains[index] = i;
                index++;
            }
        }
        
        return supportedChains;
    }
    
    /**
     * @dev Properly encode an address for LayerZero
     * This is the key function that fixes the "incorrect remote address size" error
     */
    function encodeAddress(address _addr) public pure returns (bytes memory) {
        return abi.encodePacked(_addr);
    }
    
    /**
     * @dev Create adapter parameters for LayerZero
     * This specifies gas parameters for the destination chain
     */
    function createDefaultAdapterParams(uint256 gasLimit) public pure returns (bytes memory) {
        // Version 1 of adapter params just contains the gas limit
        return abi.encodePacked(uint16(1), gasLimit);
    }
    
    /**
     * @dev Estimate fee for bridging
     */
    function estimateBridgeFee(
        uint256 destinationChainId,
        uint256 gasLimit
    ) public view returns (uint256 fee) {
        // Get the LayerZero chain ID for the destination
        uint16 lzDestChainId = chainToLzId[destinationChainId];
        require(lzDestChainId != 0, "Destination chain not supported");
        
        // Create a dummy payload for estimation
        bytes memory payload = abi.encode(uint256(1));
        
        // Create adapter parameters with the specified gas limit
        bytes memory adapterParams = createDefaultAdapterParams(gasLimit);
        
        // Estimate the fee
        (uint256 nativeFee, ) = ILayerZeroEndpoint(LAYERZERO_ENDPOINT).estimateFees(
            lzDestChainId,
            address(this),
            payload,
            false, // payInZRO - we're paying in native token
            adapterParams
        );
        
        // Add platform fee
        uint256 platformFee = (nativeFee * platformFeePercentage) / PERCENTAGE_DENOMINATOR;
        fee = nativeFee + platformFee;
        
        // Add a 10% buffer for safety
        fee = (fee * 110) / 100;
        
        return fee;
    }
    
    /**
     * @dev Bridge ETH to another chain
     */
    function bridgeETH(
        uint256 destinationChainId,
        address recipient,
        uint256 gasLimit
    ) external payable {
        // Get the LayerZero chain ID for the destination
        uint16 lzDestChainId = chainToLzId[destinationChainId];
        require(lzDestChainId != 0, "Destination chain not supported");
        
        // Minimum amount to bridge
        require(msg.value > 0.0001 ether, "Amount too small");
        
        // Estimate the fee
        uint256 fee = estimateBridgeFee(destinationChainId, gasLimit);
        require(msg.value > fee, "Insufficient ETH for fees");
        
        // Calculate amount to bridge (total - fee)
        uint256 amountToBridge = msg.value - fee;
        
        // Properly encode the recipient address for LayerZero
        bytes memory encodedRecipient = encodeAddress(recipient);
        
        // Create the payload - encode the amount being sent
        bytes memory payload = abi.encode(amountToBridge);
        
        // Create adapter parameters with the specified gas limit
        bytes memory adapterParams = createDefaultAdapterParams(gasLimit);
        
        // Calculate platform fee and protocol fee
        uint256 platformFee = (fee * platformFeePercentage) / PERCENTAGE_DENOMINATOR;
        uint256 protocolFee = fee - platformFee;
        
        // Send the message through LayerZero
        ILayerZeroEndpoint(LAYERZERO_ENDPOINT).send{value: protocolFee + amountToBridge}(
            lzDestChainId,
            encodedRecipient,
            payload,
            payable(msg.sender), // refund address
            address(0), // zroPaymentAddress - we're not using ZRO token
            adapterParams
        );
        
        emit BridgeInitiated(lzDestChainId, encodedRecipient, amountToBridge, fee);
        
        // Auto-withdraw if threshold reached
        _checkAndWithdraw();
    }
    
    /**
     * @dev Bridge ETH with default gas limit
     */
    function bridgeETH(
        uint256 destinationChainId,
        address recipient
    ) external payable {
        // Use a default gas limit of 200,000
        bridgeETH(destinationChainId, recipient, 200000);
    }
    
    /**
     * @dev Internal function to check balance and withdraw if above threshold
     */
    function _checkAndWithdraw() internal {
        if (address(this).balance >= withdrawalThreshold) {
            payable(owner).transfer(address(this).balance);
            emit FeesCollected(address(this).balance);
        }
    }
    
    /**
     * @dev Anyone can trigger a withdrawal check
     */
    function checkAndWithdraw() external {
        _checkAndWithdraw();
    }
    
    /**
     * @dev Fallback to receive ETH
     */
    receive() external payable {}
}
