# Garden Care: Netlify as the task register

The `inspections` table in Netlify Database is the only task register. The original Google Sheet is a historical reference; the deployed application does not read or write it. Existing rows stay in the database. Migration `0001_import_garden_care` is the exact production migration. Migration `0002_inspection-sheet-sync` remains unchanged because it has already been applied in the preview database; its unused columns do not start a sync.

## Chat workflow

The Ispezione skill extracts one task per issue, with `date` (`YYYY-MM-DD` in Atlantic/Canary), `issue`, `cause`, `solution`, `assignee`, `resolved`, `notes`, and `photo`. It should distinguish visible evidence from a suspected cause and leave assignee empty when the person is unknown. It sends the task directly to the Netlify API. The app reads the same record immediately after refresh. Changes from chat and changes to assignee or status in the app update that record; the `version` field rejects stale saves.

`scripts/garden-care.mjs` provides `list`, `get --id`, `create --file`, `update --id --file`, and `upload-photo --file`. Set `GARDEN_CARE_API_URL` to the preview URL when testing. The default is the production site. `create` writes a UUID into its JSON input file before sending so a retry cannot silently duplicate a task. Keep that file until the result is confirmed. `update` accepts a JSON object containing only the fields to change and fetches the current version before saving. A conflict requires a fresh read and review.

For a photo available as a local JPEG, PNG or WebP file, `upload-photo` returns a relative `/api/inspection-photo?key=...` link to set as the task's `photo`. Netlify Blobs stores the photo. The upload limit is 3 MB, within Netlify's function request limit. Existing external photo links remain usable. If an attached photo cannot be passed to the upload command, do not claim that it was saved; ask for an accessible file or link.

## Private write credential

Set a random secret of at least 32 characters as `GARDEN_CARE_WRITE_TOKEN` in Netlify's **Deploy Previews** and **Production** contexts, marked **Contains secret values**. Netlify Functions need access to it. Create a new deploy after adding or changing it because each deploy receives the values that existed at deploy time. Store the same token only in a private local credential file at `~/.config/almaiso-garden-care/write-token` (mode `0600`) or in the local process environment. Never put it in Git, a chat message, a command argument, or logs. The chat API and photo upload require `Authorization: Bearer <token>`.

The app can create a task directly and can change assignee and status on an existing task. The chat API can update all task fields. The app does not yet have user sign-in; do not treat its same-origin check as an access control system for a private register.

## API

- `GET /api/inspections`: read all tasks.
- `POST /api/inspections`: create a task from the app, or update assignee and status of an existing task.
- `POST /api/inspections/chat`: create a task with a client-generated UUID and all eight fields. Returns `201`, or the existing identical task on retry.
- `PATCH /api/inspections/chat`: update a task with all eight fields, `id`, and current `version`. Returns `409` if the record changed.
- `POST /api/inspection-photos`: authenticated multipart photo upload (`file`). Returns a relative photo URL.
- `GET /api/inspection-photo?key=<uuid>`: retrieve an uploaded photo for display.

Before release, test on the PR preview: create a clearly marked test task through the chat workflow; confirm its returned ID in `GET /api/inspections` and in the app; change its assignee and status in the app; confirm the chat API reads those values; then update its notes through chat and confirm the app shows them. Verify a photo upload and link when a test image is available. Keep the PR unmerged until the preview has passed.
