// This file is just for documentation purposes and is not actually used in the code
// It documents the shape of the window.ethereum object for reference

/**
 * @typedef {Object} EthereumProvider
 * @property {Function} request - Method to make JSON-RPC requests to Ethereum
 * @property {Function} on - Method to add event listeners
 * @property {Function} removeListener - Method to remove event listeners
 */

/**
 * @typedef {Object} Window
 * @property {EthereumProvider} ethereum - The Ethereum provider injected by MetaMask
 */
