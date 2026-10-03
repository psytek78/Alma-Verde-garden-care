# Garden Care data source

Netlify Database is the only source for garden care tasks. The app at almaiso-garden-care.netlify.app reads and writes that database. New tasks are created in the app and stored there.

The Google Sheet Inspection is no longer read or updated by this application. Do not schedule a sync from the sheet into the database, and do not let a sheet row overwrite assignee, status, notes, or photos.

Existing tasks stay in the database. Creating a task does not delete or rewrite them.
