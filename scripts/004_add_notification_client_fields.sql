-- Add clientId and clientName to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications(client_id);
