-- AircraftWorth Marketplace Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sensors table - Physical MLAT/Mode‑S sensor locations
CREATE TABLE IF NOT EXISTS sensors (
  id TEXT PRIMARY KEY DEFAULT 'sensor_' || substr(gen_random_uuid()::text, 1, 8),
  name TEXT NOT NULL,
  location JSONB NOT NULL CHECK (jsonb_typeof(location) = 'object'),
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  operator_account_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sensor offerings table - Data packages available for purchase
CREATE TABLE IF NOT EXISTS sensor_offerings (
  id TEXT PRIMARY KEY DEFAULT 'offering_' || substr(gen_random_uuid()::text, 1, 8),
  sensor_id TEXT NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('raw_modes', 'mlat_positions', 'both')),
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('per_message', 'per_minute', 'per_hour', 'per_day', 'per_month', 'bundle')),
  price_amount DECIMAL(10,8) NOT NULL CHECK (price_amount > 0),
  token_id TEXT NOT NULL DEFAULT 'HBAR',
  bundle_size INTEGER CHECK (bundle_size > 0),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace purchases table - Transaction records
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id TEXT PRIMARY KEY DEFAULT 'purchase_' || substr(gen_random_uuid()::text, 1, 8),
  offering_id TEXT NOT NULL REFERENCES sensor_offerings(id) ON DELETE CASCADE,
  buyer_account_id TEXT NOT NULL,
  quantity INTEGER CHECK (quantity > 0),
  duration_hours INTEGER CHECK (duration_hours > 0),
  api_key TEXT UNIQUE NOT NULL DEFAULT 'aw_live_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 32),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'expired', 'cancelled')),
  total_cost DECIMAL(10,8) NOT NULL CHECK (total_cost >= 0),
  transaction_id TEXT,
  hedera_transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensors_location ON sensors USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_sensors_status ON sensors (status);
CREATE INDEX IF NOT EXISTS idx_sensor_offerings_sensor_id ON sensor_offerings (sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_offerings_active ON sensor_offerings (is_active);
CREATE INDEX IF NOT EXISTS idx_sensor_offerings_data_type ON sensor_offerings (data_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer ON marketplace_purchases (buyer_account_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_api_key ON marketplace_purchases (api_key);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_status ON marketplace_purchases (status);

-- Row Level Security (RLS) Policies
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active sensors and offerings
CREATE POLICY "Public read access to active sensors" ON sensors
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public read access to active offerings" ON sensor_offerings
  FOR SELECT USING (is_active = true);

-- Users can only see their own purchases
CREATE POLICY "Users can view own purchases" ON marketplace_purchases
  FOR SELECT USING (buyer_account_id = auth.jwt() ->> 'sub');

-- Only authenticated users can create purchases
CREATE POLICY "Users can create purchases" ON marketplace_purchases
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL);

-- Users can update their own purchases
CREATE POLICY "Users can update own purchases" ON marketplace_purchases
  FOR UPDATE USING (buyer_account_id = auth.jwt() ->> 'sub');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON sensors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sensor_offerings_updated_at BEFORE UPDATE ON sensor_offerings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_purchases_updated_at BEFORE UPDATE ON marketplace_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
