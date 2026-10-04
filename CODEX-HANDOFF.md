# Handoff per Codex — Almaíso Garden Care verso Cloudflare

Scrivi e parla in italiano con Roberto. Non pubblicare su Netlify. Non fare merge su `main`.

## Obiettivo

Tenere l’app Netlify accesa e, su un branch separato, preparare una copia su Cloudflare con le stesse task, le stesse foto e le stesse schermate. Cloudflare diventa utilizzabile solo dopo una prova. Fino ad allora la fonte vera resta Netlify.

## Non fare

- Non modificare `main`. Netlify pubblica solo quel branch.
- Non fare il merge del branch Cloudflare.
- Non cancellare il sito Netlify, il database, i blob o il vecchio sito ChatGPT `almaiso-garden-care.psytek332073.chatgpt.site`.
- Non riscrivere `netlify/database/migrations/0001_import_garden_care/migration.sql`. È già applicata in produzione. Cambiarla rompe i deploy futuri.
- Non trattare quel file SQL come copia dei dati vivi. È uno snapshot vecchio: ha ancora link di Google Drive e task poi cancellate.
- Non rimettere la sincronizzazione con il Google Sheet. Il foglio non è più la fonte.
- Non inventare un grassetto. Il sito ha solo `public/cabinet-regular.woff2`, peso normale, anche se il CSS dichiara 400, 500, 600 e 700.
- Non mettere chiavi nel codice, nei commit o nei messaggi.

## Dove stanno le cose

| Cosa | Dove |
|---|---|
| Codice | https://github.com/psytek78/Alma-Verde-garden-care branch `main`, commit `c5cbfb5` |
| App viva | https://almaiso-garden-care.netlify.app |
| Progetto Netlify | https://app.netlify.com/projects/almaiso-garden-care sito `4d806c64-8c9c-4b62-9c75-f7fc706fe06a` |
| Account | Surprise Box Project, slug `psytek78`, piano Free a crediti, 300 crediti al mese |
| Database | Netlify Database, branch `production`, tabella `inspections` |
| Foto | Netlify Blobs, store `inspection-photos` |
| Skill | `skills/new-task/SKILL.md` |

`main` a `c5cbfb5` contiene la foto della home, ma Netlify non l’ha pubblicata: il deploy è stato saltato con `Skipped due to account credit usage exceeded`. L’app viva è ancora il deploy precedente. Una task nuova non è una pubblicazione e si può ancora salvare. Ogni pubblicazione di codice costa 15 crediti. I crediti delle pubblicazioni sono esauriti fino al 2 novembre 2026, oppure finché Roberto non alza il piano.

## Comportamento da conservare

L’app è il telefono di Garden Care, in inglese. Banda verde `#2A2E1E` con il logo Almaíso già in `public/almaiso-logo.svg`. Sotto, solo sulla pagina Today, la foto `public/almaiso-verde-home.jpg` nelle sue proporzioni, senza stirarla. Sopra la foto, in bianco e nello stesso Cabinet Grotesk normale del resto: `Let’s keep Alma Verde thriving today.` Niente «Good morning» e niente nome. I tre riquadri restano quelli attuali: il primo `#C15B45`, più largo, «Need attention»; gli altri `#F3EEE4`.

Pagine: Today, Tasks, Team, More. Dalla freccia di una persona si vedono le sue task aperte e risolte. Il link «Add to Google Calendar» compare solo se la task è risolta e l’assegnatario, senza spazi e senza distinzione di maiuscole, è `roberto`. Vale anche per le task future.

Creare una task dal telefono permette scatto o upload. La foto viene ridotta nel browser prima dell’invio. Il salvataggio di un assegnatario manda `id`, `assignee`, `resolved`, `version`. Se la versione non coincide, la risposta è 409.

`GET /api/inspections` è pubblico e restituisce `{ rows }`. `POST` rifiuta con 403 «Invalid request.» se l’origine non è il sito. La funzione `fromApp` in `app/api/inspections/route.ts` accetta l’host inoltrato e `almaiso-garden-care.netlify.app`. Su Cloudflare va accettato anche il nuovo dominio, senza aprire il POST a tutto internet.

## Dati

Leggi i dati vivi da `GET https://almaiso-garden-care.netlify.app/api/inspections`, non dal SQL. Il 4 ottobre 2026 c’erano 22 task. La task doppia «Resolve the delicate problems of the abandoned inflorescences» è stata cancellata: non reimportarla dallo snapshot.

Colonne: `id`, `date`, `issue`, `cause`, `solution`, `assignee`, `resolved`, `notes`, `photo`, `completed_date`, `confirmed_at`, `version`, più `sheet_row` e `sheet_hash` rimasti vuoti dal vecchio tentativo. `version` è obbligatoria.

Le foto vive sono URL relativi `/api/inspection-photo?key=...`. I file stanno nei blob. Per copiarli serve un contesto Netlify autenticato, non solo il GET pubblico delle task. Se una foto non si scarica, lasciala vuota e segnala l’id: non inventare il file.

## Codice da sostituire, solo sul branch

- `lib/inspection-store.ts` usa `getDatabase()` di `@netlify/database`.
- `netlify/functions/upload-inspection-photo.mts` e `inspection-photo.mts` usano `@netlify/blobs`, store `inspection-photos`.
- `netlify.toml` usa `@netlify/plugin-nextjs`.
- In `package.json` ci sono già `wrangler` e pacchetti Cloudflare di sviluppo, ma non esiste `wrangler.toml`. Non significa che l’app sia pronta per Cloudflare.

Destinazione proposta, piano gratuito: Cloudflare Pages per l’app, D1 per le task, R2 per le foto. Roberto deve creare l’account e autorizzarlo. Non chiedere la password in chat.

## Ordine di lavoro

1. Crea o usa il branch `cloudflare` a partire da `c5cbfb5`. Non toccare `main`.
2. Esporta le 22 task vive e le foto, con id e versione originali.
3. Crea D1 e R2. Importa le task. Metti le foto su R2 e aggiorna `photo` con un URL della nuova app.
4. Adatta lettura, creazione, aggiornamento e foto. Mantieni il controllo di versione e il controllo dell’origine.
5. Pubblica una preview Cloudflare. Prova: elenco, task nuova, foto, cambio assegnatario, risoluzione, link calendario solo per Roberto, pagina Today con la foto non stirata.
6. Solo quando Roberto lo dice, punta il dominio o sostituisci Netlify. Prima di allora i due siti restano separati.

## Verifica

Non dichiarare il passaggio fatto se la preview Cloudflare non legge le task vere. Non spegnere Netlify per dimostrare che Cloudflare funziona.
