import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dataType = searchParams.get('data_type')
    const pricingModel = searchParams.get('pricing_model')

    // Build offerings query with proper joins
    let offeringsQuery = supabase
      .from('sensor_offerings')
      .select(`
        id, sensor_id, data_type, pricing_model,
        price_amount, token_id, bundle_size, is_active,
        description,
        sensors (
          id, name, location, last_heartbeat, 
          operator_account_id, status
        )
      `)
      .eq('is_active', true)
      .eq('sensors.status', 'active')

    // Apply filters if provided
    if (dataType) {
      offeringsQuery = offeringsQuery.eq('data_type', dataType)
    }
    if (pricingModel) {
      offeringsQuery = offeringsQuery.eq('pricing_model', pricingModel)
    }

    const { data: offerings, error: offeringsError } = await offeringsQuery

    if (offeringsError) {
      console.error('Supabase query error:', offeringsError)
      throw new Error(`Database query failed: ${offeringsError.message}`)
    }

    if (!offerings || offerings.length === 0) {
      return NextResponse.json([])
    }

    // Group offerings by sensor
    const sensorMap = new Map<string, any>()

    for (const offering of offerings) {
      const sensor = offering.sensors as any
      if (!sensor) {
        console.warn('Offering missing sensor data:', offering.id)
        continue
      }

      if (!sensorMap.has(sensor.id)) {
        sensorMap.set(sensor.id, {
          id: sensor.id,
          name: sensor.name,
          location: sensor.location,
          last_heartbeat: sensor.last_heartbeat,
          offerings_count: 0,
          min_price: null,
          active_offerings: [],
        })
      }

      const sensorData = sensorMap.get(sensor.id)
      sensorData.offerings_count++
      sensorData.active_offerings.push({
        id: offering.id,
        sensor_id: offering.sensor_id,
        data_type: offering.data_type,
        pricing_model: offering.pricing_model,
        price_amount: parseFloat(offering.price_amount),
        token_id: offering.token_id,
        bundle_size: offering.bundle_size,
        is_active: offering.is_active,
        description: offering.description,
        sensor_name: sensor.name,
        sensor_location: sensor.location,
      })

      // Update minimum price
      const price = parseFloat(offering.price_amount)
      if (sensorData.min_price === null || price < sensorData.min_price) {
        sensorData.min_price = price
      }
    }

    // Convert to array and sort by name
    const sensors = Array.from(sensorMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )

    // Add caching headers
    return NextResponse.json(sensors, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    })

  } catch (error) {
    console.error('Sensors API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch sensors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
