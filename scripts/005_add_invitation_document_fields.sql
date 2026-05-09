-- Add document content and PDF fields to invitations table
-- These fields store the admin-edited documents and generated PDFs

ALTER TABLE invitations ADD COLUMN IF NOT EXISTS msa_content TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS welcome_content TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invoice_content TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS msa_pdf_data TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS welcome_pdf_data TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invoice_pdf_data TEXT;
