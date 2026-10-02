# Garden Care — migrazione Netlify

Questo archivio contiene il codice preparato nel branch migration/netlify.
È uno snapshot del progetto; non contiene la cartella .git, credenziali,
node_modules o file di compilazione.

## Istruzioni per Codex

Lavora nella cartella garden-care-netlify dopo aver estratto questo ZIP.
Se serve Git, inizializza un repository locale e crea il branch migration/netlify.
Usa Node.js 22.13 o successivo, esegui npm ci e npm run build.
La build era riuscita nell'ambiente di preparazione.

Configurazione: netlify.toml.
Database: @netlify/database, PostgreSQL.
Migrazione: netlify/database/migrations/0001_import_garden_care.sql.
Contiene 21 attività: 20 esportate il 2026-10-02 dal sito vivo
(15 risolte) più source-11 dello snapshot del 1 ottobre, che sul sito
vivo non c'era. source-11 è aperto, senza assegnatario: test del nuovo
impianto di irrigazione. Assegnazioni, note, foto, date di completamento
e versioni hash dei 20 task vivi sono quelle dell'esportazione.
source-11 conserva la versione '1' dello snapshot.
La colonna version è text, perché il sito vivo usa hash e non interi.
L'API accetta la versione come testo e, a ogni salvataggio, ne scrive una nuova.

Non è stato creato un progetto Netlify né eseguito un deployment.
Effettua il login Netlify CLI sul computer se necessario, crea il progetto
su un piano gratuito e applica le migrazioni tramite il workflow ufficiale.
Non pubblicare semplicemente lo ZIP con Netlify Drop: l'app richiede
la build Next.js, le funzioni server e il database.

Sito attuale:
https://almaiso-garden-care.psytek332073.chatgpt.site
Mantienilo disponibile finché il nuovo sito non è verificato.

## Funzionalità presenti e limiti

La migrazione preserva il comportamento della versione pubblicata:
accesso senza login, modifica di assegnazioni e stato, nessuna creazione
o cancellazione pubblica delle attività, controllo delle versioni concorrenti.
Le note esistenti sono conservate ma non sono ancora modificabili dal pubblico.
Il collegamento Calendar segue ancora lo stato risolto della versione originale.
L'identità amministrativa di Roberto e la sua approvazione esclusiva della
chiusura sono requisiti da implementare, non funzionalità già operative.
La sincronizzazione Google Sheets non è attiva.

I dati iniziali JSON rimangono per la tipizzazione del frontend;
il backend Netlify legge dal database e non li unisce nuovamente,
così eventuali cancellazioni amministrative non vengono annullate.
