'use client'

import { useState, useEffect } from 'react'
import { HederaWalletConnect } from '@hashgraph/hedera-wallet-connect'

interface HederaWallet {
  isConnected: boolean
  accountId: string | null
  balance: number
  network: 'testnet' | 'mainnet'
  walletType: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signTransaction: (transactionData: any) => Promise<any>
  sendTransaction: (signedTransaction: any) => Promise<any>
  getAccountInfo: () => Promise<any>
}

export function useHederaWallet(): HederaWallet {
  const [isConnected, setIsConnected] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet')
  const [walletType, setWalletType] = useState<string | null>(null)
  const [walletConnect, setWalletConnect] = useState<HederaWalletConnect | null>(null)

  useEffect(() => {
    // Initialize WalletConnect
    initializeWalletConnect()
  }, [])

  const initializeWalletConnect = async () => {
    try {
      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      if (!projectId) {
        console.warn('WalletConnect Project ID not found in environment variables')
        return
      }

      const wc = new HederaWalletConnect({
        projectId,
        metadata: {
          name: 'AircraftWorth',
          description: 'Decentralized Aviation Tracking & Data Marketplace',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://aircraft-worth.vercel.app',
          icons: ['https://aircraft-worth.vercel.app/AircraftWorth-Icon.png']
        }
      })

      setWalletConnect(wc)

      // Check for existing sessions
      const sessions = await wc.getActiveSessions()
      if (sessions.length > 0) {
        const session = sessions[0]
        setAccountId(session.namespaces['hedera'].accounts[0].split(':')[2])
        setIsConnected(true)
        setWalletType(session.namespaces['hedera'].accounts[0].split(':')[0])
        await fetchBalance(session.namespaces['hedera'].accounts[0].split(':')[2])
      }
    } catch (error) {
      console.error('Error initializing WalletConnect:', error)
    }
  }

  const connect = async () => {
    if (!walletConnect) {
      throw new Error('WalletConnect not initialized')
    }

    try {
      // Connect to wallet
      const { uri } = await walletConnect.connect({
        requiredNamespaces: {
          hedera: {
            chains: ['hedera:296'], // Testnet
            methods: ['getAccountInfo', 'signAndExecuteTransaction', 'signTransaction'],
            events: ['accountsChanged', 'chainChanged']
          }
        }
      })

      // For mobile wallets, show QR code or deep link
      if (uri) {
        // Open QR code modal or mobile deep link
        console.log('WalletConnect URI:', uri)
        // In production, you'd show a QR code modal here
        alert('Scan QR code with your mobile wallet or open the deep link')
      }

      // Wait for connection
      const session = await walletConnect.waitForSession()
      
      setAccountId(session.namespaces['hedera'].accounts[0].split(':')[2])
      setIsConnected(true)
      setWalletType(session.namespaces['hedera'].accounts[0].split(':')[0])
      await fetchBalance(session.namespaces['hedera'].accounts[0].split(':')[2])

    } catch (error) {
      console.error('Error connecting wallet:', error)
      throw error
    }
  }

  const disconnect = async () => {
    if (!walletConnect) return

    try {
      await walletConnect.disconnect()
      setIsConnected(false)
      setAccountId(null)
      setBalance(0)
      setWalletType(null)
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  const fetchBalance = async (account: string) => {
    try {
      if (!walletConnect) return

      // Get account info including balance
      const accountInfo = await walletConnect.request({
        topic: walletConnect.getActiveSessions()[0]?.topic,
        request: {
          method: 'getAccountInfo',
          params: {
            accountId: account
          }
        }
      })

      setBalance(parseFloat(accountInfo.balance?.tokens?.HBAR || 0))
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance(0)
    }
  }

  const signTransaction = async (transactionData: any) => {
    if (!walletConnect || !isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      const result = await walletConnect.request({
        topic: walletConnect.getActiveSessions()[0]?.topic,
        request: {
          method: 'signTransaction',
          params: {
            transaction: transactionData
          }
        }
      })

      return result
    } catch (error) {
      console.error('Error signing transaction:', error)
      throw error
    }
  }

  const sendTransaction = async (signedTransaction: any) => {
    if (!walletConnect || !isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      const result = await walletConnect.request({
        topic: walletConnect.getActiveSessions()[0]?.topic,
        request: {
          method: 'signAndExecuteTransaction',
          params: {
            transaction: signedTransaction
          }
        }
      })

      return result
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw error
    }
  }

  const getAccountInfo = async () => {
    if (!walletConnect || !accountId) {
      throw new Error('Wallet not connected')
    }

    try {
      const accountInfo = await walletConnect.request({
        topic: walletConnect.getActiveSessions()[0]?.topic,
        request: {
          method: 'getAccountInfo',
          params: {
            accountId: accountId
          }
        }
      })

      return accountInfo
    } catch (error) {
      console.error('Error getting account info:', error)
      throw error
    }
  }

  return {
    isConnected,
    accountId,
    balance,
    network,
    walletType,
    connect,
    disconnect,
    signTransaction,
    sendTransaction,
    getAccountInfo
  }
}

export default useHederaWallet
