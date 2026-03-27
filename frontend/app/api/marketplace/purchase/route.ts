import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { offering_id, buyer_account_id, quantity, duration_hours } = body

    // Validate required fields
    if (!offering_id || !buyer_account_id) {
      return NextResponse.json(
        { error: 'offering_id and buyer_account_id are required' },
        { status: 400 }
      )
    }

    // Validate buyer account format (Hedera account ID)
    if (!buyer_account_id.match(/^0\.0\.\d+$/)) {
      return NextResponse.json(
        { error: 'Invalid Hedera account ID format. Expected format: 0.0.XXXXXX' },
        { status: 400 }
      )
    }

    // ── Fetch offering details from Supabase ──────────────────────
    const { data: offering, error: offeringError } = await supabase
      .from('sensor_offerings')
      .select(`
        *,
        sensors (
          id, name, operator_account_id
        )
      `)
      .eq('id', offering_id)
      .eq('is_active', true)
      .single()

    if (offeringError || !offering) {
      console.error('Offering fetch error:', offeringError)
      return NextResponse.json(
        { error: 'Offering not found or no longer active' },
        { status: 404 }
      )
    }

    // ── Calculate total cost based on pricing model ──────────────────
    let totalCost = parseFloat(offering.price_amount)
    
    if (offering.pricing_model === 'per_message' && quantity) {
      totalCost = totalCost * quantity
    } else if (offering.pricing_model === 'bundle' && quantity) {
      const bundles = Math.ceil(quantity / (offering.bundle_size || 1))
      totalCost = totalCost * bundles
    } else if (duration_hours) {
      if (offering.pricing_model === 'per_hour') totalCost = totalCost * duration_hours
      if (offering.pricing_model === 'per_day') totalCost = totalCost * (duration_hours / 24)
      if (offering.pricing_model === 'per_month') totalCost = totalCost * (duration_hours / 24 / 30)
    }

    // ── Generate API key and expiry ────────────────────────────────────
    const apiKey = `aw_live_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // ── Record purchase in Supabase ──────────────────────────────
    const { data: purchase, error: purchaseError } = await supabase
      .from('marketplace_purchases')
      .insert({
        offering_id,
        buyer_account_id,
        quantity: quantity || null,
        duration_hours: duration_hours || null,
        api_key: apiKey,
        expires_at: expiresAt,
        status: 'pending_payment',
        total_cost: totalCost,
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('Purchase insert error:', purchaseError)
      return NextResponse.json(
        { error: 'Failed to record purchase in database' },
        { status: 500 }
      )
    }

    // ── Generate mock Hedera transaction for demo ─────────────────────
    // In production, this would be a real Hedera transaction
    const mockTransactionId = `0.0.${Math.floor(Math.random() * 999999)}@${Date.now()}`
    const mockTransactionHash = `0x${Buffer.from(mockTransactionId).toString('hex').slice(0, 64)}`

    // ── Update purchase with transaction details ───────────────────────
    const { error: updateError } = await supabase
      .from('marketplace_purchases')
      .update({
        transaction_id: mockTransactionId,
        hedera_transaction_hash: mockTransactionHash,
        status: 'paid'
      })
      .eq('id', purchase.id)

    if (updateError) {
      console.error('Purchase update error:', updateError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      purchase_id: purchase.id,
      transaction_id: mockTransactionId,
      api_key: apiKey,
      expires_at: expiresAt,
      total_cost: totalCost,
      offering_details: {
        id: offering.id,
        data_type: offering.data_type,
        pricing_model: offering.pricing_model,
        sensor_name: offering.sensors?.name,
        operator_account_id: offering.sensors?.operator_account_id
      },
      message: 'Purchase completed! In production, this would trigger a real Hedera transaction.',
      next_steps: [
        '1. API key generated for immediate access',
        '2. Transaction recorded in database',
        '3. Use API key to access sensor data',
        '4. In production: Real HBAR transfer required'
      ]
    })

  } catch (error) {
    console.error('Marketplace purchase API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initiate purchase',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
