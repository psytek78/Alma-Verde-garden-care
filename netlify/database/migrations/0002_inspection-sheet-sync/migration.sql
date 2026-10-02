ALTER TABLE inspections ADD COLUMN IF NOT EXISTS sheet_row integer;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS sheet_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS inspections_sheet_row_unique ON inspections (sheet_row) WHERE sheet_row IS NOT NULL;
