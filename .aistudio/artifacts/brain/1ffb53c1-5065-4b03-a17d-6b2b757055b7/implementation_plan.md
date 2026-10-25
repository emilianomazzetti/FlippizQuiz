# Piano di Implementazione: Nuove Attività e Migliorie FlipQuiz

Piano dettagliato per implementare la nuova attività didattica **"Becca la talpa"**, trasformare il Memory in **"Associazione Semplice"** flessibile (testo/immagine), potenziare la ricerca immagini web, abilitare immagini nelle opzioni a scelta multipla, risolvere l'errore del Puzzle e consentire al docente l'espulsione degli studenti (kick-out) con riconnessione.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisioni confermate nella fase di chiarimento:
> - **Penalità "Becca la talpa"**: se uno studente colpisce un cartellino errato perde **-10 punti**, mentre se colpisce il cartellino della categoria corretta guadagna punti cumulativi (+10 pt ciascuno).
> - **Nuova Galleria Immagini Web**: integrazione di ricerca web arricchita (Wikimedia Commons API ad alta risoluzione + libreria didattica curata per materie scolastiche), superando la limitata selezione precedente.

---

### 1. Panoramica & Concetto Chiave

1. **"Becca la talpa" (Whack-a-Mole Didattico)**:
   - Nuova modalità di gioco arcade/educativa per l'apprendimento della grammatica (Nomi, Aggettivi, Verbi, Articoli).
   - L'insegnante sceglie la categoria target, la griglia (3x3 o 4x4) e la durata di comparsa (2, 3, 4, 5, 6 secondi oppure "casuale").
   - Dalle buche della griglia spuntano talpe con cartellini contenenti parole. Lo studente deve colpire solo le talpe con parole appartenenti alla categoria target prima che si nascondano.
   - Punteggio cumulativo continuo: `Punti Base + (10 pt × talpe corrette) - (10 pt × errori)`.

2. **Ridenominazione in "Associazione Semplice" & Celle Flessibili**:
   - Ridenominazione di "Memory e Testo" in "Associazione Semplice".
   - Supporto a qualsiasi combinazione per ciascuna coppia di celle: **solo testo**, **solo immagine**, o **testo + immagine** per entrambe le celle collegate.

3. **Galleria di Ricerca Immagini Web Potenziata**:
   - Ricerca in tempo reale su Wikimedia Commons (milioni di immagini storiche, scientifiche, geografiche, artistiche in alta risoluzione senza licenze restrittive) + libreria didattica curata organizzata per materia (Storia, Scienze, Geografia, Arte, Animali, Matematica).

4. **Immagini nelle Opzioni a Risposta Multipla**:
   - Nel creatore di domande, ogni singola opzione di risposta (A, B, C, D) permette di associare un'immagine cercata dal web o via link, rendendo possibili quiz visivi (es. "Quale tra queste è una foglia aghiforme?").

5. **Fix Errore Puzzle ("bank is not defined")**:
   - Revisione e stabilizzazione completa del componente `PuzzlePlayer` e `QuestionRenderer`, garantendo la definizione di tutti gli hook di stato (`bank`, `placedSlots`, `submitted`).

6. **Espulsione Studente (Kick Out)**:
   - Dalla barra dei partecipanti collegati in classe (`TeacherMonitor`), il docente può cliccare su una "✕" accanto a qualsiasi studente per espellerlo dalla stanza.
   - Il client dello studente riceve l'aggiornamento, azzera la sessione e torna alla schermata iniziale per potersi ricollegare reinserendo il nome.

---

### 2. Esperienza Utente & Design Visivo

- **Becca la talpa (UX/UI)**:
  - Griglia verde prato con buche tridimensionali in stile cartoon educativo.
  - Talpa animata in CSS (`transform: translateY`) che emerge dal terreno mostrando un cartellino leggibile in carattere display chiaro.
  - Feedback immediato: colpo corretto mostra scintille dorate e suono di incoraggiamento (`+10 pt`), colpo errato scuote il cartellino (`-10 pt`).
  - Contatore in alto con cartellini catturati, errori e categoria bersaglio in evidenza.

- **Associazione Semplice (UX/UI)**:
  - Schede interattive con layout a doppia colonna o griglia responsiva.
  - Le celle supportano rendering misto: chip testuale grande se solo testo, card visiva con anteprima se solo immagine, o card combinata con foto sopra e didascalia sotto.

- **Galleria Ricerca Web**:
  - Modal moderna con barra di ricerca istantanea, tag filtro veloci per materia (*Storia, Scienze, Arte, Geografia, ecc.*), griglia di anteprime ad alta definizione con caricamento fluido e fallback anti-errore.

---

### 3. Decisioni di Prodotto & Dati

| Funzionalità | Approccio Scelto | Vantaggio |
| :--- | :--- | :--- |
| **Becca la talpa** | Generatore di parole categorizzate (nomi, verbi, aggettivi, articoli) agganciato al dizionario esteso | Parole sempre coerenti e variegate senza doverle digitare a mano una per una |
| **Punteggio Talpa** | Base domanda + (10 × corrette) - (10 × errate) | Premia l'attenzione e scoraggia il clic casuale compulsivo |
| **Associazione Semplice** | Struttura coppia aperta `{ itemA: { text?, image? }, itemB: { text?, image? } }` | Massima flessibilità didattica per qualsiasi materia |
| **Kick Out Studente** | Rimozione diretta della chiave `players[id]` in Firebase RTDB | Sincronizzazione in millisecondi; lo studente viene rimandato alla schermata di login |

---

### 4. Architettura Tecnica & Diagramma di Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                          FLIPQUIZ CLASSROOM APP                         │
├──────────────────────────┬─────────────────────────────────────────────┤
│      TEACHER SCREEN      │                STUDENT DEVICE               │
│                          │                                             │
│  ┌────────────────────┐  │  ┌───────────────────────────────────────┐  │
│  │   TeacherMonitor   │  │  │             StudentDevice             │  │
│  │ ────────────────── │  │  │ ───────────────────────────────────── │  │
│  │ • Kick out button  │  │  │ • Auto-logout when kicked out         │  │
│  │ • + Bot Cazzullo   │  │  │ • QuestionRenderer:                   │  │
│  │ • Live timer rule  │  │  │   - MoleWhackPlayer (Becca la talpa)  │  │
│  └─────────┬──────────┘  │  │   - SimpleAssociationPlayer           │  │
│            │             │  │   - MultipleChoice (with images)      │  │
│            │             │  │   - PuzzlePlayer (stable state)       │  │
│            │             │  └───────────────────┬───────────────────┘  │
└────────────┼────────────────────────────────────┼──────────────────────┘
             ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          FIREBASE RTDB / STATE                         │
│  • rooms/{code}/players/{id}        <-- Kick removes player node       │
│  • rooms/{code}/questions           <-- Added 'mole_whack' type        │
│  • rooms/{code}/answersThisTurn     <-- Continuous score accumulation  │
│  • services/imageSearch.ts          <-- Wikimedia Commons + HD Curated │
└────────────────────────────────────────────────────────────────────────┘
```

#### Mappatura delle Modifiche al Codice

1. **`src/types/quiz.ts`**:
   - Aggiunta del tipo di domanda `'mole_whack'` a `QuestionType`.
   - Modello `MoleWhackContent`: `{ category: 'nomi' | 'aggettivi' | 'verbi' | 'articoli'; duration: 2 | 3 | 4 | 5 | 6 | 'casuale'; gridSize: 3 | 4 }`.
   - Ridenominazione/estensione di `MemoryMatchContent` in `SimpleAssociationContent` con supporto a `{ text?: string; image?: string }` per entrambi i lati.
   - Aggiornamento di `MultipleChoiceContent` con `imageUrl?: string` nelle opzioni.

2. **`src/utils/imageSearch.ts` & `src/components/ImagePickerModal.tsx`**:
   - Funzione di ricerca asincrona su Wikimedia Commons API (`action=query&generator=search&prop=imageinfo&iiprop=url...`) combinata con oltre 100 immagini educative in alta risoluzione organizzate per materia.

3. **`src/components/game/MoleWhackPlayer.tsx`**:
   - Nuovo componente di gioco con griglia (3x3 o 4x4), talpe che emergono con cartellino, animazioni fluide e gestione punteggio con penalità `-10 pt`.

4. **`src/components/game/SimpleAssociationPlayer.tsx`**:
   - Nuova versione di `MemoryMatchPlayer` con nome "Associazione Semplice", visualizzazione dinamica di immagini/testi e associazione a coppie.

5. **`src/components/QuestionCreator.tsx`**:
   - Aggiornamento tab: "Associazione Semplice" (con campi flessibili foto/testo per entrambe le parti).
   - In Risposta Multipla: pulsante icona immagine su ciascuna opzione per aprire `ImagePickerModal`.
   - Nuova scheda per configurare "Becca la talpa" (scelta categoria, tempo e griglia).

6. **`src/components/TeacherMonitor.tsx`**:
   - Pulsante kick-out `✕` su ogni badge studente connesso che richiama `onKickPlayer(playerId)`.

7. **`src/App.tsx`**:
   - Handler `handleKickPlayer(playerId)` che rimuove lo studente da `roomState.players` e cancella il record in Firebase RTDB.
   - Riconoscimento della disconnessione nel listener dello studente con reset immediato a schermata di login.
   - Rimozione del pulsante ridondante "Configurazione Docente" dalla barra di navigazione superiore, mantenendo l'accesso alla configurazione direttamente dalle singole domande nel repository.

8. **`src/components/TeacherMonitor.tsx`**:
   - Rimozione del pulsante ridondante "Voce Benvenuto", mantenendo la riproduzione vocale automatica di benvenuto all'avvio dello schermo docente.
