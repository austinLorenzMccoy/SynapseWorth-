import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'

interface PurchaseRequest {
  offering_id: string
  buyer_account_id: string
  quantity?: number
  duration_hours?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: PurchaseRequest = await request.json()
    
    // Validate request
    if (!body.offering_id || !body.buyer_account_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Generate mock transaction data for hackathon demo
    const mockTransaction = {
      transaction_id: `0.0.${Math.floor(Math.random() * 999999)}@${Date.now()}`,
      offering_id: body.offering_id,
      buyer_account_id: body.buyer_account_id,
      amount: Math.random() * 10, // Random HBAR amount
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      network: 'testnet',
    }
    
    // Generate API key for access
    const apiKey = `aw_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`
    
    console.log('Mock purchase transaction:', mockTransaction)
    
    return NextResponse.json({
      success: true,
      transaction_id: mockTransaction.transaction_id,
      api_key: apiKey,
      expires_at: mockTransaction.expires_at,
      message: 'Purchase recorded! Your API key is ready for use.',
      next_steps: [
        '1. API key generated for immediate access',
        '2. Transaction logged for demo purposes',
        '3. Use API key to access sensor data',
        '4. In production: Real HBAR transfer required'
      ]
    })
  } catch (error) {
    console.error('Marketplace purchase API error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate purchase' },
      { status: 500 }
    )
  }
}
