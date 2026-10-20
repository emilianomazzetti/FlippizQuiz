import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Layers,
  Cpu,
  GraduationCap,
  Sparkles,
  Zap,
  ShieldCheck,
  Database
} from 'lucide-react';

interface ArchitectureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGuideModal: React.FC<ArchitectureGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                Progetto FlipQuiz: Valutazione, Architettura & Miglioramenti
              </h2>
              <p className="text-xs text-slate-400">
                Analisi informatica e pedagogica per il prof. Emiliano Mazzetti
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-sm leading-relaxed">
          {/* 1. Valutazione Pedagogica */}
          <section className="space-y-3 bg-indigo-950/30 border border-indigo-500/30 p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-base">
              <Sparkles className="w-5 h-5" />
              <h3>1. Valutazione del Progetto FlipQuiz: Perché è un'idea straordinaria</h3>
            </div>
            <p className="text-slate-300">
              Il modello <strong>"Flipped Classroom" applicato al quiz</strong> trasforma gli studenti
              da fruitori passivi a <strong>co-creatori attivi</strong> del sapere.
              Nella <em>Tassonomia di Bloom</em>, creare una domanda richiede i livelli cognitivi più alti
              (Analisi, Valutazione, Creazione) rispetto al mero ricordo. Vedere il proprio nome proiettato sulla LIM
              (<em>"Domanda creata da Marco R."</em>) crea un fortissimo senso di appartenenza, autoefficacia e sana motivazione.
            </p>
          </section>

          {/* 2. Google Apps Script vs React + Firebase/Express */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-base">
              <Cpu className="w-5 h-5" />
              <h3>2. Analisi Tecnica: Google Apps Script + Sheets vs React + Firebase / Express</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Apps Script Bottlenecks */}
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <h4>Criticità di Google Apps Script + Sheets</h4>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li>
                    <strong>Latenza e Concorrenza:</strong> Google Sheets ha una latenza di 500-2000ms.
                    Se 25-30 studenti premono contemporaneamente il pulsante per il "dito più veloce",
                    Google Sheets va in <em>concurrency lock</em> o superamento quote.
                  </li>
                  <li>
                    <strong>Nessun Push Real-Time:</strong> GAS non supporta WebSocket o SSE nativi.
                    Per sincronizzare il timer servirebbe un <em>polling</em> HTTP ogni secondo,
                    che esaurisce le quote di Google Workspace in pochi minuti.
                  </li>
                  <li>
                    <strong>Manutenibilità HTML frammentata:</strong> Creare 13 file HTML separati rende
                    il codice non riutilizzabile, difficile da testare e lento da caricare.
                  </li>
                </ul>
              </div>

              {/* Modern React + Realtime Engine */}
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <h4>La Scelta Vincente: React + Motore Real-Time</h4>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li>
                    <strong>Componenti Modulari React 19:</strong> Ognuna delle 13 tipologie è un componente
                    specializzato riusabile sia in creazione che in esecuzione.
                  </li>
                  <li>
                    <strong>Sincronizzazione Sub-50ms:</strong> Il server centrale o Firebase distribuisce
                    lo scorrere del tempo al millisecondo, calcolando con precisione assoluta i 3 diti più veloci.
                  </li>
                  <li>
                    <strong>Zero-Friction Login:</strong> Gli studenti inquadrano il QR code e inseriscono
                    solo il nome da banco, senza dover fare login con Google Workspace!
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Le 13 Tipologie Implementate */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-base">
              <Layers className="w-5 h-5" />
              <h3>3. Tutte le 13 Tipologie di Gioco Integrate e Pronte</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              {[
                { n: '1. Risposta Multipla', d: 'Opzioni configurabili, 1 esatta, immagine di supporto' },
                { n: '2. Vero / Falso', d: 'Pulsanti giganti animati verde/rosso' },
                { n: '3. Risposta Aperta', d: 'Confronto testuale normalizzato (case-insensitive)' },
                { n: '4. Risposta a Buchi', d: 'Evidenziazione parola in giallo al tocco + 3 distrattori' },
                { n: '5. Memory e Testo', d: '4 immagini + 4 testi abbinabili con drag & drop o tocco' },
                { n: '6. Disegna & Vota', d: 'Canvas con pennello, forme e galleria con voto a stelle ⭐' },
                { n: '7. Identifica Celle', d: 'Stimolo (es. Napoleone) + griglia celle giuste e trappole' },
                { n: '8. Ordina le Celle', d: '4 elementi da posizionare in sequenza logica' },
                { n: '9. Anagramma', d: 'Parola mescolata in tessere da ricomporre' },
                { n: '10. Puzzle', d: 'Immagine scomposta in 4 o 9 tessere da ricostruire' },
                { n: '11. Crucipuzzle', d: 'Griglia di lettere con parole nascoste e lettere casuali' },
                { n: '12. Matematica', d: 'Generatore calcoli (+, -, x, :) con riporti e limiti 10/100/1000' },
                { n: '13. Più Parole', d: '5 consonanti + 2 vocali, dizionario italiano e punti a tempo' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                  <span className="font-bold text-white block">{item.n}</span>
                  <span className="text-slate-400 text-[11px] mt-0.5 block">{item.d}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Suggerimenti Didattici e Funzionalità Aggiunte */}
          <section className="space-y-3 bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-base">
              <Lightbulb className="w-5 h-5" />
              <h3>4. Miglioramenti Didattici Aggiunti</h3>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>
                <strong>Ricerca Immagini tipo Google Documenti:</strong> Modal con libreria didattica
                organizzata in categorie (Storia, Scienze, Geografia, Arte, Animali) + inserimento URL diretto.
              </li>
              <li>
                <strong>Simulatore Studenti Virtuali:</strong> Il docente può aggiungere con 1 clic 4 studenti
                virtuali (es. Luca, Giulia, Marco, Sofia) per testare l'intera sessione da solo.
              </li>
              <li>
                <strong>Sintetizzatore Sonoro Web Audio API:</strong> Effetti sonori arcade (ticchettio,
                risposta esatta, errore, fanfare) senza file audio esterni pesanti o problemi di copyright.
              </li>
              <li>
                <strong>Pannello Configurazione Docente:</strong> Possibilità di cambiare tempi (10s, 25s, 40s, 60s)
                e punti base (50 standard) per ogni singola domanda.
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            FlipQuiz pronto per l'uso immediato in classe
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Chiudi Guida
          </button>
        </div>
      </div>
    </div>
  );
};
