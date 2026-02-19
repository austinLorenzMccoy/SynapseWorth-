'use client'

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'
import { ReactNode } from 'react'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo'

const hederaTestnet = {
  chainId: 296,
  name: 'Hedera Testnet',
  currency: 'HBAR',
  explorerUrl: 'https://hashscan.io/testnet',
  rpcUrl: 'https://testnet.hashio.io/api'
}

const metadata = {
  name: 'SynapseWorth',
  description: 'Decentralized Knowledge Economy',
  url: 'http://localhost:3001',
  icons: []
}

createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: [hederaTestnet],
  projectId,
  enableAnalytics: false
})

export function Web3ModalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
