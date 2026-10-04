# Handoff per Codex — Almaíso Garden Care verso Cloudflare

Aggiornato il 5 ottobre 2026, dopo l'inizio della migrazione. Scrivi e parla in italiano con Roberto. Non pubblicare su Netlify. Non fare merge su `main`.

## Punto attuale

Il branch `cloudflare` contiene già:

- Le 22 task vive in `cloudflare/seed/inspections.json` e in `cloudflare/d1/0002_seed.sql`.
- Le 12 foto in `cloudflare/seed/photos/`, circa 6 MB, con l'elenco in `cloudflare/seed/photos.json`.
- Lo schema D1 in `cloudflare/d1/0001_schema.sql`.
- Lettura e scrittura task tramite D1 in `lib/inspection-store.ts`.
- Foto tramite R2 in `app/api/inspection-photo/route.ts` e `app/api/inspection-photos/route.ts`.
- `wrangler.jsonc` e `open-next.config.ts`. Next è stato portato a 16.3.8 solo su questo branch, perché l'adattatore Cloudflare lo richiede.
- `database_id` in `wrangler.jsonc` è ancora finto: `00000000-0000-0000-0000-000000000000`.

`main` è fermo a `c5cbfb5`. L'app viva resta https://almaiso-garden-care.netlify.app e non va spenta.

Manca l'account Cloudflare di Roberto. Senza quello non si possono creare D1, R2 e la preview.

## Prossimo passo

1. Roberto crea l'account Cloudflare e autorizza Wrangler. Non chiedere la password in chat.
2. `npx wrangler login`
3. `npx wrangler d1 create garden-care` e sostituisci `database_id` in `wrangler.jsonc`.
4. `npx wrangler r2 bucket create garden-care-photos`
5. `npx wrangler d1 migrations apply garden-care --remote`
6. `sh cloudflare/upload-photos.sh`
7. `npm run cf:deploy` e prova l'elenco, una task nuova, una foto, il cambio assegnatario, la risoluzione e il calendario solo per Roberto.
8. Non unire a `main` finché Roberto non lo dice.

## Non fare

- Non modificare `main`. Netlify pubblica solo quel branch.
- Non fare il merge del branch Cloudflare.
- Non cancellare il sito Netlify, il database, i blob o il vecchio sito ChatGPT `almaiso-garden-care.psytek332073.chatgpt.site`.
- Non riscrivere `netlify/database/migrations/0001_import_garden_care/migration.sql`. È già applicata in produzione.
- Non trattare quel file SQL come copia dei dati vivi.
- Non rimettere la sincronizzazione con il Google Sheet.
- Non inventare un grassetto. Il sito ha solo `public/cabinet-regular.woff2`.
- Non mettere chiavi nel codice, nei commit o nei messaggi.

## Dove stanno le cose

| Cosa | Dove |
|---|---|
| Codice Netlify | branch `main`, commit `c5cbfb5` |
| Codice Cloudflare | branch `cloudflare` |
| App viva | https://almaiso-garden-care.netlify.app |
| Progetto Netlify | sito `4d806c64-8c9c-4b62-9c75-f7fc706fe06a`, account `psytek78`, piano Free, 300 crediti |
| Database vivo | Netlify Database, tabella `inspections` |
| Foto vive | Netlify Blobs, store `inspection-photos` |
| Skill | `skills/new-task/SKILL.md`, ancora puntata a Netlify. Cambiala solo quando esiste l'indirizzo Cloudflare. |

I crediti delle pubblicazioni Netlify sono esauriti fino al 2 novembre 2026. Una task nuova sull'app viva non è una pubblicazione e si può ancora salvare.

## Comportamento da conservare

App in inglese. Banda verde `#2A2E1E` con `public/almaiso-logo.svg`. Sulla pagina Today, foto `public/almaiso-verde-home.jpg` non stirata e, in bianco, `Let’s keep Alma Verde thriving today.` Niente saluto e niente nome. I tre riquadri restano: il primo `#C15B45`, gli altri `#F3EEE4`.

Il link «Add to Google Calendar» solo se la task è risolta e l'assegnatario, senza spazi e senza distinzione di maiuscole, è `roberto`.

`POST /api/inspections` risponde 403 «Invalid request.» se l'origine non è il sito. `fromApp` accetta l'host inoltrato. Sulla preview Cloudflare l'origine deve essere quel dominio, non tutto internet.

La task doppia «Resolve the delicate problems of the abandoned inflorescences» è già assente dall'esportazione. Non reimportarla.
