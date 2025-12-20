/*
  # Add Receiver Details to Padala Bookings
  
  1. Changes
    - Add `receiver_name` column to `padala_bookings` table
    - Add `receiver_contact` column to `padala_bookings` table
*/

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'padala_bookings' AND column_name = 'receiver_name') THEN
    ALTER TABLE padala_bookings ADD COLUMN receiver_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'padala_bookings' AND column_name = 'receiver_contact') THEN
    ALTER TABLE padala_bookings ADD COLUMN receiver_contact text;
  END IF;
END $$;
