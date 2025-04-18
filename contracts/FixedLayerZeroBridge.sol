// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

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

contract FixedLayerZeroBridge {
    // Owner address
    address public owner;

    // LayerZero endpoint address on Optimism
    address public constant LAYERZERO_ENDPOINT = 0x3c2269811836af69497E5F486A85D7316753cf62;

    // LayerZero chain IDs mapping
    mapping(uint256 => uint16) public chainToLzId;

    // Fee configuration
    uint256 public platformFeePercentage = 50; // 50% of the bridge fee goes to platform
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;
    uint256 public withdrawalThreshold = 0.01 ether; // Auto-withdraw at 0.01 ETH

    // Events
    event BridgeInitiated(uint16 dstChainId, bytes recipient, uint256 amount, uint256 fee);
    event FeesCollected(uint256 amount);

    constructor() {
        owner = msg.sender;

        // Initialize LayerZero chain ID mappings
        chainToLzId[1] = 101;      // Ethereum
        chainToLzId[10] = 111;     // Optimism
        chainToLzId[42161] = 110;  // Arbitrum
        chainToLzId[137] = 109;    // Polygon
        chainToLzId[8453] = 184;   // Base
        chainToLzId[43114] = 106;  // Avalanche
        chainToLzId[56] = 102;     // BSC
        chainToLzId[250] = 112;     // Fantom
        chainToLzId[1284] = 126;    // Moonbeam
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
    function setChainIdMapping(uint256 chainId, uint16 lzId) external onlyOwner {
        chainToLzId[chainId] = lzId;
    }

    // Check for any problematic Unicode characters in the contract

    // For example, check the bridgeNative function
    /**
     * @dev Bridge native token (ETH) via LayerZero
     */
    function bridgeNative(
        uint256 destinationChainId,
        address recipient
    ) external payable {
        // Validate inputs
        require(msg.value > 0, "Must send ETH to bridge");
        require(chainToLzId[destinationChainId] != 0, "Unsupported destination chain");

        // Get the LayerZero chain ID for the destination
        uint16 lzDestinationChainId = chainToLzId[destinationChainId];

        // Calculate fees - fixed fee of 0.0003 ETH
        uint256 bridgeFee = 0.0003 ether;
        require(msg.value > bridgeFee, "Insufficient ETH for fees");

        // Calculate platform fee (50%) and amount to bridge
        uint256 platformFee = bridgeFee / 2;
        uint256 amountToBridge = msg.value - bridgeFee;

        // Properly format the recipient address for LayerZero
        // This is the key fix - we need to properly encode the address
        bytes memory recipientBytes = abi.encodePacked(recipient);

        // Create a simple payload with the amount
        bytes memory payload = abi.encode(amountToBridge);

        // Empty adapter params
        bytes memory adapterParams = "";

        // Calculate protocol fee
        uint256 protocolFee = bridgeFee - platformFee;

        // Send the message through LayerZero
        ILayerZeroEndpoint(LAYERZERO_ENDPOINT).send{value: protocolFee + amountToBridge}(
            lzDestinationChainId,
            recipientBytes,
            payload,
            payable(address(this)),
            address(0), // No ZRO token payment
            adapterParams
        );

        emit BridgeInitiated(lzDestinationChainId, recipientBytes, amountToBridge, bridgeFee);

        // Auto-withdraw if threshold reached
        _checkAndWithdraw();
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
