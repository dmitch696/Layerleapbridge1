// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract HyperlaneProbe {
    // Hyperlane Mailbox on Optimism
    address public constant MAILBOX = 0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D;
    
    // Events for debugging
    event MailboxInfo(string name, address mailbox);
    event CallAttempt(string method, bytes data, uint256 value);
    event CallResult(bool success, bytes returnData);
    
    constructor() {
        // Log the mailbox address on deployment
        emit MailboxInfo("Hyperlane Mailbox", MAILBOX);
    }
    
    // Function to check if the mailbox exists and has code
    function checkMailbox() external view returns (bool, uint256) {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D)
        }
        return (codeSize > 0, codeSize);
    }
    
    // Function to test a simple call to the mailbox
    function testMailboxCall() external payable {
        // Try to call a simple view function like "localDomain()" if it exists
        bytes memory data = abi.encodeWithSignature("localDomain()");
        
        emit CallAttempt("localDomain", data, 0);
        
        (bool success, bytes memory returnData) = MAILBOX.staticcall(data);
        
        emit CallResult(success, returnData);
        
        // Return the result to the caller
        if (success) {
            // If successful, return the domain ID
            assembly {
                let returnDataSize := mload(returnData)
                revert(add(32, returnData), returnDataSize)
            }
        } else {
            // If failed, return the error
            assembly {
                let returnDataSize := mload(returnData)
                revert(add(32, returnData), returnDataSize)
            }
        }
    }
    
    // Function to test a minimal dispatch call
    function testMinimalDispatch(uint32 destinationDomain) external payable {
        // Create minimal valid parameters
        bytes32 recipientBytes32 = bytes32(uint256(uint160(msg.sender)));
        bytes memory messageBody = "";
        
        // Encode the function call
        bytes memory data = abi.encodeWithSignature(
            "dispatch(uint32,bytes32,bytes)",
            destinationDomain,
            recipientBytes32,
            messageBody
        );
        
        emit CallAttempt("dispatch", data, msg.value);
        
        // Make the call
        (bool success, bytes memory returnData) = MAILBOX.call{value: msg.value}(data);
        
        emit CallResult(success, returnData);
        
        // Return the result
        if (!success) {
            assembly {
                let returnDataSize := mload(returnData)
                revert(add(32, returnData), returnDataSize)
            }
        }
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}
