'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PublishPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Publish Data</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Data Publishing Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Publish your MLAT and Mode‑S sensor data on the AircraftWorth marketplace. Set your own pricing, manage subscriptions, and reach aviation data buyers worldwide.
            </p>
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Coming Features</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• Custom pricing models</li>
                <li>• Subscription management</li>
                <li>• Data quality controls</li>
                <li>• Analytics dashboard</li>
                <li>• Automated payouts</li>
                <li>• API key management</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
