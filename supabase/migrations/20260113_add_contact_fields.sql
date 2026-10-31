-- Add WhatsApp and Telegram contact fields to subscribers table
-- Migration: 20260112_add_contact_fields

ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS telegram_handle TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS telegram_opt_in BOOLEAN DEFAULT false;

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_phone_number ON subscribers(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscribers_telegram_handle ON subscribers(telegram_handle) WHERE telegram_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscribers_whatsapp_opt_in ON subscribers(whatsapp_opt_in) WHERE whatsapp_opt_in = true;
CREATE INDEX IF NOT EXISTS idx_subscribers_telegram_opt_in ON subscribers(telegram_opt_in) WHERE telegram_opt_in = true;

-- Add comment
COMMENT ON COLUMN subscribers.phone_number IS 'WhatsApp phone number in international format (e.g. +21629838340)';
COMMENT ON COLUMN subscribers.telegram_handle IS 'Telegram username (with or without @) or phone number';
COMMENT ON COLUMN subscribers.whatsapp_opt_in IS 'User opted in to WhatsApp check-ins';
COMMENT ON COLUMN subscribers.telegram_opt_in IS 'User opted in to Telegram check-ins';
