'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import WalletConnectButton from '@/components/marketplace/WalletConnectButton'
import PurchaseModal from '@/components/marketplace/PurchaseModal'
import { SensorOffering } from '@/types/marketplace'
import { useHederaWallet } from '@/components/marketplace/HederaWalletConnector'

// AircraftWorth sensor data
const aircraftSensors = [
  {
    id: 'sensor-001',
    name: 'London Heathrow MLAT',
    location: '51.4700°N, 0.4543°W',
    status: 'active',
    data_types: ['raw_modes', 'mlat_positions'],
    offerings_count: 4,
    active_offerings: [
      {
        id: 'offering-001',
        sensor_id: 'sensor-001',
        data_type: 'raw_modes',
        pricing_model: 'per_hour',
        price_amount: 0.25,
        duration_hours: 24,
        description: 'Access to live Mode‑S transponder data from Heathrow MLAT network'
      },
      {
        id: 'offering-002', 
        sensor_id: 'sensor-001',
        data_type: 'mlat_positions',
        pricing_model: 'per_day',
        price_amount: 1.5,
        duration_hours: 72,
        description: 'High-precision MLAT positioning data from Heathrow sensor network'
      },
      {
        id: 'offering-003',
        sensor_id: 'sensor-001', 
        data_type: 'both',
        pricing_model: 'bundle',
        price_amount: 3.0,
        duration_hours: 168,
        description: 'Complete access to all data types for one week'
      },
      {
        id: 'offering-004',
        sensor_id: 'sensor-001',
        data_type: 'both',
        pricing_model: 'per_month',
        price_amount: 8.0,
        duration_hours: 720,
        description: 'Unlimited access to Heathrow MLAT sensor network'
      }
    ]
  },
  {
    id: 'sensor-002',
    name: 'New York JFK MLAT',
    location: '40.6413°N, 73.7781°W',
    status: 'active',
    data_types: ['mlat_positions'],
    offerings_count: 3,
    active_offerings: [
      {
        id: 'offering-005',
        sensor_id: 'sensor-002',
        data_type: 'mlat_positions',
        pricing_model: 'per_hour',
        price_amount: 0.5,
        duration_hours: 12,
        description: 'MLAT positioning data from JFK airport coverage area'
      },
      {
        id: 'offering-006',
        sensor_id: 'sensor-002',
        data_type: 'both',
        pricing_model: 'bundle',
        price_amount: 5.0,
        duration_hours: 96,
        description: 'Extended MLAT access with historical data included'
      }
    ]
  },
  {
    id: 'sensor-003',
    name: 'Los Angeles International MLAT',
    location: '33.9425°N, 118.4081°W',
    status: 'active',
    data_types: ['raw_modes', 'mlat_positions'],
    offerings_count: 3,
    active_offerings: [
      {
        id: 'offering-007',
        sensor_id: 'sensor-003',
        data_type: 'raw_modes',
        pricing_model: 'per_hour',
        price_amount: 0.3,
        duration_hours: 24,
        description: 'Mode‑S transponder data from LAX airport MLAT network'
      },
      {
        id: 'offering-008',
        sensor_id: 'sensor-003',
        data_type: 'mlat_positions',
        pricing_model: 'per_day',
        price_amount: 2.0,
        duration_hours: 48,
        description: 'High-precision MLAT data from Los Angeles sensor network'
      },
      {
        id: 'offering-009',
        sensor_id: 'sensor-003',
        data_type: 'both',
        pricing_model: 'bundle',
        price_amount: 4.0,
        duration_hours: 168,
        description: 'Complete access to LAX MLAT sensor network'
      }
    ]
  }
]

// Leaflet must be client-side only
const SensorMarketMap = dynamic(
  () => import('@/components/marketplace/SensorMarketMap'),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading sensor map...</p>
      </div>
    </div>
  )}
)

export default function MarketplacePage() {
  const { isConnected, accountId, connect } = useHederaWallet()
  const [selectedOffering, setSelectedOffering] = useState<SensorOffering | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const handlePurchase = (offering: SensorOffering) => {
    if (!isConnected) {
      connect()
      return
    }
    setSelectedOffering(offering)
    setPurchaseSuccess(null)
    setPurchaseError(null)
  }

  const handleConfirmPurchase = async (request: {
    offering_id: string
    quantity?: number
    duration_hours?: number
  }) => {
    if (!isConnected || !accountId) {
      setPurchaseError('Wallet not connected')
      return
    }

    setPurchaseLoading(true)
    setPurchaseError(null)

    try {
      const res = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          buyer_account_id: accountId,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Purchase failed')
      }

      const data = await res.json()
      setPurchaseSuccess(
        `Purchase confirmed! Transaction ID: ${data.transaction_id}. Your API key: ${data.api_key}` 
      )
      setSelectedOffering(null)
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setPurchaseLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AircraftWorth Sensor Marketplace</h1>
            <p className="mt-2 text-gray-600">
              Purchase live MLAT and Mode‑S data from our global sensor network. Payments via Hedera HBAR.
            </p>
          </div>
          <WalletConnectButton />
        </div>
      </div>

      {/* Wallet prompt banner */}
      {!isConnected && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-indigo-700">
              Connect your Hedera wallet (HashPack) to purchase sensor data access.
            </p>
            <button
              onClick={connect}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline"
            >
              Connect now →
            </button>
          </div>
        </div>
      )}

      {/* Success/Error banners */}
      {purchaseSuccess && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-green-700">✅ {purchaseSuccess}</p>
          </div>
        </div>
      )}
      {purchaseError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-red-700">❌ {purchaseError}</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: '70vh' }}>
          <SensorMarketMap onPurchase={handlePurchase} />
        </div>
      </div>

      {/* Purchase Modal */}
      {selectedOffering && (
        <PurchaseModal
          offering={selectedOffering}
          isOpen={!!selectedOffering}
          onClose={() => setSelectedOffering(null)}
          onConfirm={handleConfirmPurchase}
          isLoading={purchaseLoading}
        />
      )}
    </div>
  )
}
