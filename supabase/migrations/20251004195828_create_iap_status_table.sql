/*
  # Create IAP Status Table

  1. New Tables
    - `iap_status`
      - `id` (uuid, primary key) - Unique identifier for each subscription record
      - `user_id` (uuid, foreign key) - References auth.users, tracks which user owns the subscription
      - `platform` (text) - Either 'android' or 'ios', identifies the purchase platform
      - `product_id` (text) - SKU/product identifier from the app store (e.g., premium_monthly)
      - `purchase_token` (text) - Unique token from the store used for validation
      - `expiry_date` (timestamptz) - When the subscription expires
      - `is_premium` (boolean) - Current premium status (true if active subscription)
      - `created_at` (timestamptz) - When the record was first created
      - `updated_at` (timestamptz) - Last validation/update timestamp

  2. Security
    - Enable RLS on `iap_status` table
    - Users can view only their own subscription status
    - Only the service role (Edge Function) can insert/update records

  3. Indexes
    - Index on user_id for fast lookups
    - Index on expiry_date for cleanup queries

  4. Important Notes
    - This table stores the validated subscription status from Google Play and App Store
    - Edge Functions will validate purchases and update this table
    - The app queries this table to determine premium status
    - Expired subscriptions should be marked as is_premium=false
*/

-- Create the iap_status table
CREATE TABLE IF NOT EXISTS iap_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('android', 'ios')),
  product_id text NOT NULL,
  purchase_token text NOT NULL,
  expiry_date timestamptz,
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_iap_status_user_id ON iap_status(user_id);
CREATE INDEX IF NOT EXISTS idx_iap_status_expiry_date ON iap_status(expiry_date);
CREATE INDEX IF NOT EXISTS idx_iap_status_platform ON iap_status(platform);

-- Enable Row Level Security
ALTER TABLE iap_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription status
CREATE POLICY "Users can view own subscription status"
  ON iap_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can insert subscription records
CREATE POLICY "Service role can insert subscriptions"
  ON iap_status
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can update subscription records
CREATE POLICY "Service role can update subscriptions"
  ON iap_status
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Users cannot modify their own subscription records
-- (Only Edge Functions with service_role can modify)

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_iap_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on each update
DROP TRIGGER IF EXISTS trigger_update_iap_status_updated_at ON iap_status;
CREATE TRIGGER trigger_update_iap_status_updated_at
  BEFORE UPDATE ON iap_status
  FOR EACH ROW
  EXECUTE FUNCTION update_iap_status_updated_at();