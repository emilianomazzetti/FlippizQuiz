import React from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Users,
  Monitor,
  Smartphone,
  HelpCircle
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
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Guida</h2>
              <p className="text-xs text-slate-400">
                Istruzioni per l'uso e regole delle attività di FlipQuiz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed">
          {/* Sezione Introduttiva */}
          <div className="p-5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-base">
              <Sparkles className="w-5 h-5" />
              <h3>Come Funziona FlipQuiz</h3>
            </div>
            <p className="text-slate-300 text-xs md:text-sm">
              FlipQuiz è la piattaforma di quiz interattivo in modalità classe capovolta: gli studenti creano le domande dal proprio smartphone o tablet, e il docente avvia la sfida live sulla LIM.
            </p>
          </div>

          {/* Ruoli principali */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-850 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Smartphone className="w-5 h-5" />
                <h4>Dispositivo Studente</h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Inquadra il QR code per accedere alla sessione con nome e avatar.</li>
                <li><strong>1 singola domanda:</strong> ogni studente invia una domanda al repository della classe.</li>
                <li>Appena inviata, accedi allo <em>Stato Attesa Quiz</em>.</li>
                <li>Se il docente cancella la tua domanda, potrai formularne un'altra.</li>
                <li>Durante il quiz rispondi alle sfide in tempo reale.</li>
              </ul>
            </div>

            <div className="p-5 bg-slate-850 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Monitor className="w-5 h-5" />
                <h4>Schermo Docente (LIM)</h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Proietta il QR code e il PIN sulla LIM per far accedere la classe.</li>
                <li>Gestisci il repository: revisiona o rimuovi le domande inserite.</li>
                <li>Avvia la sfida live per sincronizzare tutti i partecipanti.</li>
                <li>Visualizza risposte in tempo reale, podio e classifiche finali.</li>
              </ul>
            </div>
          </div>

          {/* Modalità Speciali di Gioco */}
          <div className="p-5 bg-slate-850 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <HelpCircle className="w-4 h-4" />
              <h4>Attività e Regole di Gioco</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">Testo Bucato</strong>
                Completamento di una o più parole bucate tramite menù a tendina verticale.
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">Sfida di Disegno</strong>
                Disegno a tema su tela digitale con invio definitivo e votazione peer con le stelle.
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">Più Parole</strong>
                Crea quante più parole valide possibili (1 lettera = 1 punto) fino allo scadere del tempo.
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">La Parola Più Lunga</strong>
                Usa 10 consonanti e 4 vocali per comporre la parola più lunga (+25 pt bonus vincitore).
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">Becca la Talpa</strong>
                Colpisci velocemente solo le talpe con parole pertinenti alla categoria indicata.
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">Scelta Multipla e V/F</strong>
                Quiz a tempo con bonus velocità per i 3 diti più veloci della classe.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Chiudi Guida
          </button>
        </div>
      </div>
    </div>
  );
};
