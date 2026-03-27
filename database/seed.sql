-- AircraftWorth Marketplace Seed Data
-- Run this after creating the schema

-- Insert real AircraftWorth sensors
INSERT INTO sensors (id, name, location, last_heartbeat, operator_account_id, status) VALUES
('sensor_heathrow', 'London Heathrow MLAT', '{"coordinates": [51.4700, -0.4543]}', NOW(), '0.0.123456', 'active'),
('sensor_jfk', 'New York JFK MLAT', '{"coordinates": [40.6413, -73.7781]}', NOW(), '0.0.234567', 'active'),
('sensor_lax', 'Los Angeles International MLAT', '{"coordinates": [33.9425, -118.4081]}', NOW(), '0.0.345678', 'active'),
('sensor_dubai', 'Dubai International MLAT', '{"coordinates": [25.2532, 55.3657]}', NOW(), '0.0.456789', 'active'),
('sensor_singapore', 'Singapore Changi MLAT', '{"coordinates": [1.3644, 103.9915]}', NOW(), '0.0.567890', 'active');

-- Insert sensor offerings with realistic pricing
INSERT INTO sensor_offerings (sensor_id, data_type, pricing_model, price_amount, token_id, bundle_size, is_active, description) VALUES

-- London Heathrow offerings
('sensor_heathrow', 'raw_modes', 'per_hour', 0.25, 'HBAR', NULL, true, 'Real-time Mode‑S data from Heathrow'),
('sensor_heathrow', 'mlat_positions', 'per_day', 1.5, 'HBAR', NULL, true, 'Daily MLAT position data package'),
('sensor_heathrow', 'both', 'bundle', 3.0, 'HBAR', 1000, true, 'Bundle: 1000 messages of both data types'),
('sensor_heathrow', 'both', 'per_month', 8.0, 'HBAR', NULL, true, 'Monthly access to both MLAT and Mode‑S data'),

-- New York JFK offerings  
('sensor_jfk', 'mlat_positions', 'per_hour', 0.5, 'HBAR', NULL, true, 'Real-time MLAT positions from JFK'),
('sensor_jfk', 'raw_modes', 'per_day', 2.0, 'HBAR', NULL, true, 'Daily Mode‑S data package'),
('sensor_jfk', 'both', 'bundle', 5.0, 'HBAR', 1500, true, 'Bundle: 1500 messages of both data types'),

-- Los Angeles International offerings
('sensor_lax', 'raw_modes', 'per_hour', 0.3, 'HBAR', NULL, true, 'Real-time Mode‑S data from LAX'),
('sensor_lax', 'mlat_positions', 'per_day', 2.0, 'HBAR', NULL, true, 'Daily MLAT position data from LAX'),
('sensor_lax', 'both', 'bundle', 4.0, 'HBAR', 800, true, 'Bundle: 800 messages of both data types'),

-- Dubai International offerings
('sensor_dubai', 'mlat_positions', 'per_hour', 0.4, 'HBAR', NULL, true, 'Real-time MLAT positions from Dubai'),
('sensor_dubai', 'both', 'per_day', 3.0, 'HBAR', NULL, true, 'Daily access to both data types from Dubai'),
('sensor_dubai', 'both', 'per_month', 12.0, 'HBAR', NULL, true, 'Monthly unlimited access from Dubai'),

-- Singapore Changi offerings
('sensor_singapore', 'raw_modes', 'per_hour', 0.35, 'HBAR', NULL, true, 'Real-time Mode‑S data from Singapore'),
('sensor_singapore', 'mlat_positions', 'per_day', 2.5, 'HBAR', NULL, true, 'Daily MLAT positions from Singapore'),
('sensor_singapore', 'both', 'bundle', 6.0, 'HBAR', 1200, true, 'Bundle: 1200 messages of both data types from Singapore');

-- Create a sample purchase for testing
INSERT INTO marketplace_purchases (offering_id, buyer_account_id, quantity, duration_hours, api_key, expires_at, status, total_cost, transaction_id, hedera_transaction_hash) VALUES
('offering_001', '0.0.999999', 1000, NULL, 'aw_live_12345678901234567890123456789012', 
 NOW() + INTERVAL '24 hours', 'paid', 3.0, '0.0.789012@1714320000000', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
