-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  plan TEXT NOT NULL,
  price NUMERIC NOT NULL,
  setup_fee NUMERIC,
  start_date TEXT NOT NULL,
  portal_access TEXT NOT NULL,
  msa_content TEXT,
  invoice_content TEXT,
  welcome_content TEXT,
  client_signature TEXT,
  agency_signature TEXT,
  signed_at TIMESTAMP,
  agency_signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create client_logins table
CREATE TABLE IF NOT EXISTS public.client_logins (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  price NUMERIC NOT NULL,
  setup_fee NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table (allow all operations - admin portal)
CREATE POLICY "Allow all operations on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

-- Create policies for client_logins table
CREATE POLICY "Allow all operations on client_logins" ON public.client_logins FOR ALL USING (true) WITH CHECK (true);

-- Create policies for invitations table
CREATE POLICY "Allow all operations on invitations" ON public.invitations FOR ALL USING (true) WITH CHECK (true);

-- Create policies for notifications table
CREATE POLICY "Allow all operations on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_client_logins_client_id ON public.client_logins(client_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
