// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract RevertCatcher {
    address public constant HYPERLANE_MAILBOX = 0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D;
    
    event CallResult(bool success, bytes returnData);
    
    // Function to test a low-level call and capture any revert reason
    function testCall(bytes calldata callData) external payable {
        (bool success, bytes memory returnData) = HYPERLANE_MAILBOX.call{value: msg.value}(callData);
        
        emit CallResult(success, returnData);
        
        if (!success) {
            // Try to extract revert reason
            if (returnData.length > 0) {
                // If there's return data, try to extract the revert reason
                assembly {
                    let returnDataSize := mload(returnData)
                    revert(add(32, returnData), returnDataSize)
                }
            } else {
                revert("Call failed with no return data");
            }
        }
    }
    
    // Helper to create calldata for dispatch
    function createDispatchCalldata(
        uint32 destinationDomain,
        address recipient,
        bytes calldata messageBody
    ) external pure returns (bytes memory) {
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        return abi.encodeWithSignature(
            "dispatch(uint32,bytes32,bytes)",
            destinationDomain,
            recipientBytes32,
            messageBody
        );
    }
}
