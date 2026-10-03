---
name: nuova-task
description: Crea o apre una task di Garden Care nel database Netlify. Usala in qualsiasi chat di Almaiso Verde quando l'utente detta un problema in giardino, dice nuova task, ispezione, oppure chiede di aprire una task esistente.
---

# Nuova task — Garden Care

Netlify Database è l'unica fonte. Non scrivere sul foglio Google Inspection.

App: https://almaiso-garden-care.netlify.app
Registro: `GET https://almaiso-garden-care.netlify.app/api/inspections`

## Creare una task

Quando l'utente descrive un problema, un lavoro o dice «nuova task», registra subito la task. Non chiedere conferma se il problema è chiaro. Chiedi solo il problema se manca del tutto.

Compila questi campi:

- `date`: oggi nel fuso Atlantic/Canary, formato `YYYY-MM-DD`, salvo un'altra data detta dall'utente.
- `issue`: il problema o il lavoro, in una frase.
- `cause`: solo se l'utente la indica; altrimenti `""`. Non inventarla.
- `solution`: solo se l'utente la indica; altrimenti `""`.
- `assignee`: la persona nominata; altrimenti `""`.
- `resolved`: `true` solo se dice che è già fatto; altrimenti `false`.
- `notes`: dettagli utili dettati dall'utente; altrimenti `""`.
- `photo`: un link `https://` fornito dall'utente, oppure `""`. Non dire che una foto è salvata se hai solo il file allegato e non un link.

Invia `POST https://almaiso-garden-care.netlify.app/api/inspections` con intestazione `Origin: https://almaiso-garden-care.netlify.app` e `Content-Type: application/json`. Il corpo contiene solo gli otto campi, senza `id`.

Poi rileggi `GET /api/inspections` e verifica che l'id restituito sia presente. Rispondi con problema, data, assegnatario, stato e questo link per aprirla nell'app: https://almaiso-garden-care.netlify.app

Se la risposta non è 201, riporta l'errore e non dire che la task è stata creata.

## Aprire una task

Se l'utente chiede di aprire, mostrare o cercare una task, leggi `GET /api/inspections`. Cerca per id o per le parole del problema. Mostra data, problema, causa, soluzione, assegnatario, stato, note e foto. Se ce n'è più di una, elencale e non modificarle. Il link per aprirla nell'app è https://almaiso-garden-care.netlify.app

## Non fare

- Non cancellare task.
- Non riscrivere le task già presenti per crearne una nuova.
- Non usare il foglio Google come fonte.
- Non mettere chiavi o token nel messaggio.
