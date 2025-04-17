// This service uses Stargate Bridge API instead of direct contract interaction

/**
 * Redirect to Stargate Bridge UI with pre-filled parameters
 */
export function bridgeViaStargate(sourceChainId: number, destinationChainId: number, amount: string): void {
  // Validate source chain is Optimism
  if (sourceChainId !== 10) {
    alert("Source chain must be Optimism")
    return
  }

  // Construct Stargate URL with parameters
  const stargateUrl = new URL("https://stargate.finance/transfer")

  // Add query parameters
  stargateUrl.searchParams.append("srcChainId", sourceChainId.toString())
  stargateUrl.searchParams.append("dstChainId", destinationChainId.toString())
  stargateUrl.searchParams.append("srcToken", "ETH") // Use ETH as source token
  stargateUrl.searchParams.append("dstToken", "ETH") // Use ETH as destination token
  stargateUrl.searchParams.append("amount", amount)

  // Open Stargate in a new tab
  window.open(stargateUrl.toString(), "_blank")
}
