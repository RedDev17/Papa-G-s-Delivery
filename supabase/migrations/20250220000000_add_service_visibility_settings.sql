-- Add service visibility settings to site_settings table
INSERT INTO site_settings (id, value, type, description)
VALUES
  ('service_food_visible', 'true', 'boolean', 'Show or hide the Food service on the service selection page'),
  ('service_pabili_visible', 'true', 'boolean', 'Show or hide the Pabili service on the service selection page'),
  ('service_padala_visible', 'true', 'boolean', 'Show or hide the Padala service on the service selection page')
ON CONFLICT (id) DO NOTHING;
