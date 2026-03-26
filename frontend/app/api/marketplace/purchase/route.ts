import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { offering_id, buyer_account_id, quantity, duration_hours } = body

    if (!offering_id || !buyer_account_id) {
      return NextResponse.json(
        { error: 'offering_id and buyer_account_id are required' },
        { status: 400 }
      )
    }

    // ── Mock offering data for hackathon demo ──────────────────────
    const mockOffering = {
      id: offering_id,
      price_amount: Math.random() * 5 + 0.5, // Random price between 0.5-5.5 HBAR
      pricing_model: 'per_hour',
    }

    // ── Calculate total cost ────────────────────────────────────────
    let totalCost = mockOffering.price_amount
    if (mockOffering.pricing_model === 'per_message' && quantity) {
      totalCost = mockOffering.price_amount * quantity
    } else if (mockOffering.pricing_model === 'bundle' && quantity) {
      totalCost = mockOffering.price_amount * Math.ceil(quantity / 100)
    } else if (duration_hours) {
      if (mockOffering.pricing_model === 'per_hour') totalCost = mockOffering.price_amount * duration_hours
      if (mockOffering.pricing_model === 'per_day') totalCost = mockOffering.price_amount * (duration_hours / 24)
      if (mockOffering.pricing_model === 'per_month') totalCost = mockOffering.price_amount * (duration_hours / 24 / 30)
    }

    // ── Generate API key ────────────────────────────────────────────
    const apiKey = `aw_live_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // ── Mock transaction for hackathon demo ──────────────────────
    const mockTransactionId = `0.0.${Math.floor(Math.random() * 999999)}@${Date.now()}`

    return NextResponse.json({
      success: true,
      purchase_id: `purchase_${Date.now()}`,
      transaction_id: mockTransactionId,
      api_key: apiKey,
      expires_at: expiresAt,
      total_cost: totalCost,
      message: 'Purchase recorded! In production, this would trigger a real Hedera transaction.',
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
