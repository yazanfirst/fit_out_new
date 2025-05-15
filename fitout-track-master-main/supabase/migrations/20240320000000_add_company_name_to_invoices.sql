-- Add company_name column to invoices table
ALTER TABLE invoices ADD COLUMN company_name TEXT;

-- Update existing records to have a default value
UPDATE invoices SET company_name = '' WHERE company_name IS NULL; 