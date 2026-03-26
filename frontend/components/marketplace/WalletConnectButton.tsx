"use client"

import { useHederaWallet } from './HederaWalletConnector'

export default function WalletConnectButton() {
  const { isConnected, accountId, connect, disconnect } = useHederaWallet()

  return (
    <button
      onClick={isConnected ? disconnect : connect}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isConnected
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      {isConnected ? (
        <>
          <span className="inline-block w-2 h-2 bg-white rounded-full mr-2"></span>
          {accountId ? `${accountId.slice(0, 8)}...` : 'Connected'}
        </>
      ) : (
        <>
          <span className="inline-block w-2 h-2 bg-white rounded-full mr-2"></span>
          Connect HashPack
        </>
      )}
    </button>
  )
}
