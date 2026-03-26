"use client"

import { useState, useEffect, useRef } from 'react'

interface HederaWalletState {
  isConnected: boolean
  accountId: string | null
  walletType: string | null
  balance: number | null
}

export function useHederaWallet() {
  const [state, setState] = useState<HederaWalletState>({
    isConnected: false,
    accountId: null,
    walletType: null,
    balance: null,
  })

  const connect = async () => {
    try {
      // Mock HashPack connection for hackathon demo
      const mockAccountId = `0.0.${Math.floor(Math.random() * 9000000) + 1000000}`
      const mockBalance = Math.random() * 100
      
      setState({
        isConnected: true,
        accountId: mockAccountId,
        walletType: 'HashPack',
        balance: mockBalance,
      })
      
      // Store in localStorage for persistence
      localStorage.setItem('hedera_wallet_connection', JSON.stringify({
        accountId: mockAccountId,
        walletType: 'HashPack',
        connectedAt: new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Wallet connection error:', error)
      throw error
    }
  }

  const disconnect = () => {
    setState({
      isConnected: false,
      accountId: null,
      walletType: null,
      balance: null,
    })
    localStorage.removeItem('hedera_wallet_connection')
  }

  useEffect(() => {
    // Check for existing connection on mount
    const stored = localStorage.getItem('hedera_wallet_connection')
    if (stored) {
      try {
        const connection = JSON.parse(stored)
        setState({
          isConnected: true,
          accountId: connection.accountId,
          walletType: connection.walletType,
          balance: Math.random() * 100, // Mock balance
        })
      } catch (error) {
        console.error('Error parsing stored wallet connection:', error)
      }
    }
  }, [])

  return {
    ...state,
    connect,
    disconnect,
  }
}
