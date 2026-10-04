CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  issue TEXT NOT NULL,
  cause TEXT NOT NULL,
  solution TEXT NOT NULL,
  assignee TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL,
  photo TEXT NOT NULL,
  completed_date TEXT,
  confirmed_at TEXT,
  version TEXT NOT NULL CHECK (length(version) > 0),
  sheet_row INTEGER,
  sheet_hash TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS inspections_sheet_row_unique ON inspections (sheet_row) WHERE sheet_row IS NOT NULL;
