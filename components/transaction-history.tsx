"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTransactionHistory, type BridgeTransaction } from "@/services/enhanced-bridge-service"
import { CHAINS } from "@/config/contracts"
import { formatDistanceToNow } from "date-fns"

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([])

  useEffect(() => {
    // Load transaction history
    const txs = getTransactionHistory()
    setTransactions(txs)

    // Set up interval to refresh every 30 seconds
    const interval = setInterval(() => {
      const updatedTxs = getTransactionHistory()
      setTransactions(updatedTxs)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (transactions.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">No transactions found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => {
            const destChain = CHAINS.find((c) => c.id === tx.destinationChainId)

            return (
              <div key={tx.hash} className="p-3 bg-gray-700 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {destChain?.logo} Bridged to {destChain?.name || `Chain ${tx.destinationChainId}`}
                    </p>
                    <p className="text-sm text-gray-300">
                      Amount: {tx.amount} ETH + {tx.fee} ETH fee
                    </p>
                    <p className="text-xs text-gray-400">{formatDistanceToNow(tx.timestamp, { addSuffix: true })}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        tx.status === "completed"
                          ? "bg-green-900/50 text-green-300"
                          : tx.status === "failed"
                            ? "bg-red-900/50 text-red-300"
                            : "bg-yellow-900/50 text-yellow-300"
                      }`}
                    >
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <a
                    href={`https://optimistic.etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-xs"
                  >
                    View on Explorer: {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
