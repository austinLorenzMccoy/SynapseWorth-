"use client"

import { useEffect, useState } from 'react'
import { MapPin, Activity } from 'lucide-react'
import { SensorOffering } from '@/types/marketplace'

// AircraftWorth sensor locations
const aircraftSensorLocations = [
  { id: 'sensor-001', name: 'London Heathrow MLAT', lat: 51.4700, lng: -0.4543, status: 'active' },
  { id: 'sensor-002', name: 'New York JFK MLAT', lat: 40.6413, lng: -73.7781, status: 'active' },
  { id: 'sensor-003', name: 'Los Angeles International MLAT', lat: 33.9425, lng: -118.4081, status: 'active' },
]

interface SensorMarketMapProps {
  onPurchase: (offering: SensorOffering) => void
}

export default function SensorMarketMap({ onPurchase }: SensorMarketMapProps) {
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null)

  useEffect(() => {
    // Initialize map (client-side only)
    const mapScript = document.createElement('script')
    mapScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    mapScript.async = true
    
    const linkScript = document.createElement('link')
    linkScript.rel = 'stylesheet'
    linkScript.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    
    document.head.appendChild(linkScript)
    document.head.appendChild(mapScript)
    
    mapScript.onload = () => {
      // @ts-ignore - Leaflet global
      const L = window.L
      
      const map = L.map('sensor-map').setView([51.0, 0.0], 2)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap contributors'
      }).addTo(map)
      
      // Add sensor markers
      aircraftSensorLocations.forEach(sensor => {
        const color = sensor.status === 'active' ? '#10b981' : '#ef4444'
        const marker = L.circleMarker([sensor.lat, sensor.lng], {
          radius: 50000, // 50km coverage radius
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.6
        }).addTo(map)
        
        marker.bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">${sensor.name}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${sensor.location}</p>
            <p style="margin: 4px 0 0 0;">
              <strong>Status:</strong> 
              <span style="color: ${sensor.status === 'active' ? '#10b981' : '#ef4444'}">
                ${sensor.status.toUpperCase()}
              </span>
            </p>
          </div>
        `)
        
        marker.on('click', () => {
          setSelectedSensor(sensor.id)
        })
      })
    }
  }, [])
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="bg-white border-b p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Type
            </label>
            <select
              value={filters.data_type}
              onChange={(e) => setFilters(prev => ({ ...prev, data_type: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="raw_modes">Raw Mode‑S</option>
              <option value="mlat_positions">MLAT Positions</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pricing Model
            </label>
            <select
              value={filters.pricing_model}
              onChange={(e) => setFilters(prev => ({ ...prev, pricing_model: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Models</option>
              <option value="per_message">Per Message</option>
              <option value="per_hour">Per Hour</option>
              <option value="per_day">Per Day</option>
              <option value="per_month">Per Month</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchSensors}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[51.5, -0.1]}
          zoom={8}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapController sensors={sensors} />
          
          {sensors.map((sensor) => (
            <Marker
              key={sensor.id}
              position={[
                sensor.location.coordinates[1],
                sensor.location.coordinates[0]
              ]}
              icon={sensorIcon}
              eventHandlers={{
                click: () => setSelectedSensor(sensor),
              }}
            >
              <Popup>
                <div className="p-2 min-w-64">
                  <h3 className="font-semibold text-lg mb-2">{sensor.name}</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Offerings:</span> {sensor.offerings_count}
                    </div>
                    
                    {sensor.min_price && (
                      <div>
                        <span className="font-medium">From:</span>{' '}
                        {formatPrice(sensor.min_price, 'HBAR')}
                      </div>
                    )}
                    
                    {sensor.last_heartbeat && (
                      <div>
                        <span className="font-medium">Last seen:</span>{' '}
                        {new Date(sensor.last_heartbeat).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <h4 className="font-medium text-sm">Available Offerings:</h4>
                    {sensor.active_offerings.map((offering) => (
                      <div key={offering.id} className="bg-gray-50 p-2 rounded text-xs">
                        <div className="font-medium">
                          {formatDataType(offering.data_type)}
                        </div>
                        <div>
                          {formatPricingModel(offering.pricing_model)} -{' '}
                          {formatPrice(offering.price_amount, offering.token_id)}
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Selected Sensor Sidebar */}
      {selectedSensor && (
        <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg">{selectedSensor.name}</h3>
            <button
              onClick={() => setSelectedSensor(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Location:</span>{' '}
              {selectedSensor.location.coordinates[1].toFixed(4)},{' '}
              {selectedSensor.location.coordinates[0].toFixed(4)}
            </div>
            
            <div>
              <span className="font-medium">Active Offerings:</span>{' '}
              {selectedSensor.offerings_count}
            </div>
            
            {selectedSensor.min_price && (
              <div>
                <span className="font-medium">Starting from:</span>{' '}
                {formatPrice(selectedSensor.min_price, 'HBAR')}
              </div>
            )}
            
            <div className="pt-2 border-t">
              <h4 className="font-medium mb-2">All Offerings:</h4>
              <div className="space-y-2">
                {selectedSensor.active_offerings.map((offering) => (
                  <div key={offering.id} className="bg-gray-50 p-2 rounded">
                    <div className="font-medium text-xs">
                      {formatDataType(offering.data_type)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatPricingModel(offering.pricing_model)}
                    </div>
                    <div className="text-xs font-medium text-indigo-600">
                      {formatPrice(offering.price_amount, offering.token_id)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
