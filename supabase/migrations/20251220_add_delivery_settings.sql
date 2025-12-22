-- Add delivery fee settings to site_settings table

INSERT INTO site_settings (id, value, type, description)
VALUES 
  ('delivery_base_fee', '60', 'number', 'Base delivery fee in Pesos'),
  ('delivery_per_km_fee', '13', 'number', 'Delivery fee per kilometer in Pesos'),
  ('delivery_base_distance', '0', 'number', 'Base distance included in base fee (km)')
ON CONFLICT (id) DO UPDATE 
SET value = EXCLUDED.value,
    description = EXCLUDED.description;
