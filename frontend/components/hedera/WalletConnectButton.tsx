'use client'

import { useState, useEffect } from 'react'
import { useHederaWallet } from './HederaWalletConnector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Wallet2, AlertCircle, CheckCircle, Copy } from 'lucide-react'

export default function WalletConnectButton() {
  const [mounted, setMounted] = useState(false)
  const { isConnected, accountId, balance, network, walletType, connect, disconnect } = useHederaWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setShowDetails(false)
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const copyAccountId = () => {
    if (accountId) {
      navigator.clipboard.writeText(accountId)
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Connect Your Hedera Wallet</CardTitle>
          <CardDescription>
            Connect your HashPack or other Hedera wallet to access the AircraftWorth marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet2 className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>HashPack Wallet supported</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Secure WalletConnect protocol</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Hedera Testnet ready</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Wallet Connected</CardTitle>
              <CardDescription>
                {walletType ? walletType.charAt(0).toUpperCase() + walletType.slice(1) : 'Hedera'} Wallet
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            {network.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Account ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{accountId?.slice(0, 12)}...</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAccountId}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="font-mono text-sm">{balance.toFixed(4)} HBAR</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDisconnect}
            className="flex-1"
          >
            Disconnect
          </Button>
        </div>

        {showDetails && (
          <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Full Account ID:</span>
              <span className="font-mono">{accountId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Network:</span>
              <Badge variant="secondary">{network}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Wallet Type:</span>
              <span>{walletType || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="default" className="bg-green-500">Connected</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
