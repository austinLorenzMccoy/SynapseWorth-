'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Manage your AircraftWorth account settings, preferences, and marketplace configurations.
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Features</h3>
              <ul className="space-y-2 text-sm text-gray-800">
                <li>• Profile management</li>
                <li>• Notification preferences</li>
                <li>• API key management</li>
                <li>• Wallet connections</li>
                <li>• Privacy settings</li>
                <li>• Data sharing preferences</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
