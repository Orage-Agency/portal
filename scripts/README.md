# Database Setup Instructions

This directory contains SQL migration scripts for the Orage Client Portal. These scripts set up the database schema in Supabase.

## Running the Scripts

You have two options to run these scripts:

### Option 1: Using the v0 Interface (Recommended)

1. Navigate to any page in your app
2. Open the browser console (F12 or Right-click > Inspect > Console)
3. Look for the "Scripts" section in the v0 interface
4. Click "Run" on each script in order:
   - `001_create_tables.sql`
   - `002_update_invitations_schema.sql`
   - `003_add_missing_client_fields.sql`
   - `004_add_notification_client_fields.sql`

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard at [supabase.com](https://supabase.com)
2. Navigate to the "SQL Editor" section in the left sidebar
3. Create a new query
4. Copy and paste each script in order:
   - `001_create_tables.sql` - Creates the base tables
   - `002_update_invitations_schema.sql` - Updates invitations table
   - `003_add_missing_client_fields.sql` - Adds missing client fields
   - `004_add_notification_client_fields.sql` - Adds notification client fields
5. Click "Run" for each script

## What Each Script Does

- **001_create_tables.sql**: Creates the initial database schema with tables for clients, client_logins, invitations, and notifications. Also sets up Row Level Security (RLS) policies.

- **002_update_invitations_schema.sql**: Updates the invitations table to match the application's data structure (offer_type, setup_fee, monthly_fee instead of plan/price).

- **003_add_missing_client_fields.sql**: Adds the `phone` and `updated_at` fields to the clients table.

- **004_add_notification_client_fields.sql**: Adds `client_id` and `client_name` fields to notifications for better tracking and navigation.

## Verifying the Setup

After running all scripts, you can verify the setup by:

1. Checking the "Table Editor" in Supabase dashboard
2. You should see 4 tables: `clients`, `client_logins`, `invitations`, and `notifications`
3. Each table should have the columns as defined in the scripts

## Troubleshooting

- **Error: "relation already exists"**: This means the table was already created. You can safely ignore this error or drop the table first if you want to recreate it.
- **Error: "column already exists"**: This means the column was already added. You can safely ignore this error.
- **Permission errors**: Make sure you're logged into the correct Supabase project and have admin access.

## Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Supabase connection in the app settings
3. Make sure all environment variables are correctly set
