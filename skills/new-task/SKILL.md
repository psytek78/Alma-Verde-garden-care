---
name: new-task
description: Create or open a Garden Care task in the Netlify database. Use it in any Almaiso Verde chat when the user dictates a garden problem, says new task or inspection, or asks to open an existing task.
---

# New task — Garden Care

Netlify Database is the only source. Do not write to the Google Inspection sheet.

App: https://almaiso-garden-care.netlify.app
Register: `GET https://almaiso-garden-care.netlify.app/api/inspections`

## Create a task

When the user describes a problem, a job, or says "new task", save the task immediately. Do not ask for confirmation when the problem is clear. Ask only for the problem if it is missing.

Fill these fields:

- `date`: today in the Atlantic/Canary timezone, format `YYYY-MM-DD`, unless the user gives another date.
- `issue`: the problem or job, in one sentence.
- `cause`: only if the user states it; otherwise `""`. Do not invent it.
- `solution`: only if the user states it; otherwise `""`.
- `assignee`: the person named by the user; otherwise `""`.
- `resolved`: `true` only if the user says it is already done; otherwise `false`.
- `notes`: useful details dictated by the user; otherwise `""`.
- `photo`: an `https://` link given by the user, or `""`. Do not say a photo was saved if you only have an attached file and no link.

Send `POST https://almaiso-garden-care.netlify.app/api/inspections` with the header `Origin: https://almaiso-garden-care.netlify.app` and `Content-Type: application/json`. The body contains only the eight fields, without `id`.

Then read `GET /api/inspections` again and check that the returned id is present. Reply with the problem, date, assignee, status, and this link to open it in the app: https://almaiso-garden-care.netlify.app

If the response is not 201, report the error and do not say that the task was created.

## Open a task

If the user asks to open, show, or find a task, read `GET /api/inspections`. Search by id or by the words in the problem. Show date, problem, cause, solution, assignee, status, notes, and photo. If more than one matches, list them and do not change them. The link to open the app is https://almaiso-garden-care.netlify.app

## Do not

- Do not delete tasks.
- Do not rewrite existing tasks in order to create a new one.
- Do not use the Google Sheet as the source.
- Do not put keys or tokens in the message.
