# Inspection → Garden Care

New inspection tasks entered through ChatGPT are first written to the existing Google Sheet **Inspection**, tab **Inspections**. A Netlify scheduled function reads the eight existing columns every five minutes (UTC) and inserts new rows into Netlify Database. Refresh the app after the next run to see them. Changes made directly in the sheet to linked rows also flow into the database. The function never deletes database tasks when a sheet row is blank or removed.

## One-time setup

1. In Google Cloud, enable the Google Sheets API and create a service account with a JSON key. Share the existing Inspection spreadsheet with the service account email as **Viewer**. No public sharing is needed.
2. In the Netlify site's environment variables, set `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` to the complete JSON key. Restrict it to the production site and functions. Do not commit or paste the key into GitHub or chat.
3. Deploy the repository so Netlify applies `0002_inspection-sheet-sync` and registers the scheduled function. In Netlify Functions, open `sync-inspections` and use **Run now** once. Check its log for `created`, `updated`, and `linked`, then refresh `/api/inspections` and the app.
4. Add a normal task through the ChatGPT inspection workflow and verify one new row in the sheet and one matching task in the app after the next run. The schedule only runs for published deployments.

The first run links the 20 matching historical sheet rows to their existing database tasks without changing the current database values. The extra database task `source-11` has no matching sheet row and remains in the app. The sheet must remain append-only: insert new tasks at the bottom, without sorting or inserting/deleting rows in the source tab, because the sync uses physical row numbers as IDs. Use a filter view for display sorting. The eight-column layout stays intact.

Updates made **in the app** to assignee or completion still write to Netlify Database only. If the corresponding sheet row is later changed, the sheet values will flow into the app on the next sync. This integration covers the requested ChatGPT → Sheet → database → app creation flow; app → Sheet editing needs a separate authenticated write path.
