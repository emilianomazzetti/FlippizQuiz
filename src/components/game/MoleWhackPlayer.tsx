import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MoleWhackContent } from '../../types/quiz';
import { sound } from '../../utils/audio';
import { Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';

interface MoleWhackPlayerProps {
  content: MoleWhackContent;
  onAnswer: (isCorrect: boolean, payload?: any) => void;
  disabled?: boolean;
}

// Words pools categorized by grammatical function
const CATEGORY_WORDS: Record<'nomi' | 'aggettivi' | 'verbi' | 'articoli', string[]> = {
  nomi: [
    'CANE', 'GATTO', 'SOLE', 'LUNA', 'MARE', 'CASA', 'LIBRO', 'ALBERO',
    'FIUME', 'MONTAGNA', 'SCUOLA', 'TAVOLO', 'AMICO', 'NOTTE', 'PIAZZA',
    'CUORE', 'TERRA', 'STELLA', 'TEMPO', 'TRENO', 'PALLA', 'FIORE', 'STRADA'
  ],
  aggettivi: [
    'BELLO', 'BRUTTO', 'GRANDE', 'PICCOLO', 'ALTO', 'BASSO', 'DOLCE',
    'SALATO', 'FORTE', 'DEBOLE', 'CALDO', 'FREDDO', 'FELICE', 'TRISTE',
    'VELOCE', 'LENTO', 'NUOVO', 'VECCHIO', 'CHIARO', 'SCURO', 'AZZURRO'
  ],
  verbi: [
    'CORRERE', 'MANGIARE', 'SALTARE', 'DORMIRE', 'CANTARE', 'SCRIVERE',
    'LEGGERE', 'GIOCARE', 'ANDARE', 'VEDERE', 'VOLARE', 'NUOTARE',
    'RIDERE', 'PARLARE', 'APRIRE', 'CHIUDERE', 'AMARE', 'PARTIRE', 'STUDIARE'
  ],
  articoli: [
    'IL', 'LO', 'LA', 'I', 'GLI', 'LE', 'UN', 'UNO', 'UNA',
    'DEI', 'DEGLI', 'DELLE', 'AGLI', 'ALLE', 'NEI', 'NEGLI', 'SUI', 'SUGLI'
  ]
};

interface ActiveMole {
  id: string;
  holeIndex: number;
  word: string;
  isCorrectCategory: boolean;
  emergedAt: number;
  durationMs: number;
  isHit?: 'correct' | 'wrong';
}

export const MoleWhackPlayer: React.FC<MoleWhackPlayerProps> = ({
  content,
  onAnswer,
  disabled = false
}) => {
  const targetCategory = (content.category || 'nomi').toLowerCase() as
    | 'nomi'
    | 'aggettivi'
    | 'verbi'
    | 'articoli';

  // Grid size is strictly 3x3 (9 holes)
  const gridSize = 3;
  const totalHoles = 9;

  // Calculate base display duration in milliseconds
  const fixedDurationSec =
    content.duration === 'casuale' ? null : (Number(content.duration) || 3);

  const [activeMoles, setActiveMoles] = useState<Record<number, ActiveMole>>({});
  const [correctHits, setCorrectHits] = useState(0);
  const [wrongHits, setWrongHits] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{ text: string; type: 'correct' | 'wrong' } | null>(null);

  const correctPool = useMemo(() => CATEGORY_WORDS[targetCategory] || CATEGORY_WORDS.nomi, [targetCategory]);
  const otherCategories = useMemo(
    () => (['nomi', 'aggettivi', 'verbi', 'articoli'] as const).filter((c) => c !== targetCategory),
    [targetCategory]
  );
  const distractorPool = useMemo(
    () => otherCategories.flatMap((c) => CATEGORY_WORDS[c]),
    [otherCategories]
  );

  // Sync answer state with parent: ensure bonusPoints, score, and netPoints are all provided
  const reportScore = (cHits: number, wHits: number) => {
    const netPoints = Math.max(0, cHits * 10 - wHits * 10);
    onAnswer(true, {
      correctCount: cHits,
      wrongCount: wHits,
      bonusPoints: netPoints,
      netPoints: netPoints,
      score: netPoints,
      totalMolePoints: netPoints,
      category: targetCategory,
      summary: `Talpe: ${cHits} colpite (+${netPoints} pt)`
    });
  };

  // Main Game Loop for Mole Emergence
  useEffect(() => {
    if (disabled) return;

    const interval = setInterval(() => {
      setActiveMoles((prev) => {
        const now = Date.now();
        const updated: Record<number, ActiveMole> = {};

        // 1. Remove expired moles
        Object.entries(prev).forEach(([idxStr, mole]) => {
          const idx = Number(idxStr);
          if (now - mole.emergedAt < mole.durationMs && !mole.isHit) {
            updated[idx] = mole;
          }
        });

        // 2. Decide if a new mole should emerge
        const currentCount = Object.keys(updated).length;
        const maxSimultaneous = gridSize === 4 ? 3 : 2;

        if (currentCount < maxSimultaneous) {
          // Find empty holes
          const emptyHoles: number[] = [];
          for (let i = 0; i < totalHoles; i++) {
            if (!updated[i]) emptyHoles.push(i);
          }

          if (emptyHoles.length > 0) {
            const randomHole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
            const isCorrect = Math.random() > 0.45; // 55% chance of correct word

            const chosenWord = isCorrect
              ? correctPool[Math.floor(Math.random() * correctPool.length)]
              : distractorPool[Math.floor(Math.random() * distractorPool.length)];

            const durationSec =
              fixedDurationSec !== null
                ? fixedDurationSec
                : Math.floor(Math.random() * 5) + 2; // 2 to 6 seconds

            updated[randomHole] = {
              id: `mole-${now}-${randomHole}`,
              holeIndex: randomHole,
              word: chosenWord,
              isCorrectCategory: isCorrect,
              emergedAt: now,
              durationMs: durationSec * 1000
            };
          }
        }

        return updated;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [disabled, gridSize, totalHoles, correctPool, distractorPool, fixedDurationSec]);

  // Handle hitting a mole
  const handleHitMole = (holeIndex: number) => {
    if (disabled) return;
    const mole = activeMoles[holeIndex];
    if (!mole || mole.isHit) return;

    if (mole.isCorrectCategory) {
      // Correct!
      sound.playCorrect();
      const newCorrect = correctHits + 1;
      setCorrectHits(newCorrect);
      setLastFeedback({ text: `+10 PT • "${mole.word}" è un ${targetCategory.toUpperCase()}!`, type: 'correct' });

      setActiveMoles((prev) => ({
        ...prev,
        [holeIndex]: { ...mole, isHit: 'correct' }
      }));
      reportScore(newCorrect, wrongHits);
    } else {
      // Wrong!
      sound.playWrong();
      const newWrong = wrongHits + 1;
      setWrongHits(newWrong);
      setLastFeedback({ text: `-10 PT • "${mole.word}" non è un ${targetCategory.toUpperCase()}!`, type: 'wrong' });

      setActiveMoles((prev) => ({
        ...prev,
        [holeIndex]: { ...mole, isHit: 'wrong' }
      }));
      reportScore(correctHits, newWrong);
    }

    // Hide mole after hit feedback
    setTimeout(() => {
      setActiveMoles((prev) => {
        const next = { ...prev };
        delete next[holeIndex];
        return next;
      });
    }, 450);
  };

  const netScore = Math.max(0, correctHits * 10 - wrongHits * 10);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 select-none animate-fade-in">
      {/* Category Stimulus Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 border-2 border-amber-400/60 p-4 rounded-3xl text-center shadow-xl flex items-center justify-between px-6 text-white">
        <div className="text-left">
          <span className="text-[11px] uppercase font-black tracking-widest text-amber-200 block">
            Obiettivo di Gioco
          </span>
          <h3 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white">
            Colpisci solo i: <span className="underline underline-offset-4 decoration-white">{targetCategory}</span>
          </h3>
        </div>

        <div className="flex items-center gap-4 text-center">
          <div className="px-3 py-1.5 bg-black/30 rounded-2xl border border-white/20">
            <span className="text-[10px] text-emerald-300 font-bold block">Presi</span>
            <span className="text-lg font-black text-emerald-300 font-mono">+{correctHits}</span>
          </div>
          <div className="px-3 py-1.5 bg-black/30 rounded-2xl border border-white/20">
            <span className="text-[10px] text-rose-300 font-bold block">Errori</span>
            <span className="text-lg font-black text-rose-300 font-mono">-{wrongHits}</span>
          </div>
        </div>
      </div>

      {/* Floating Immediate Feedback */}
      {lastFeedback && (
        <div
          className={`py-2 px-4 rounded-xl text-xs font-black text-center shadow-md animate-bounce transition-all ${
            lastFeedback.type === 'correct'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
          }`}
        >
          {lastFeedback.text}
        </div>
      )}

      {/* Whack-a-Mole Meadow / Grid Field */}
      <div className="p-4 md:p-6 bg-emerald-950/80 border-4 border-emerald-800 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Grass meadow texture overlay */}
        <div className="absolute inset-0 bg-radial from-emerald-800/20 to-transparent pointer-events-none" />

        <div
          className="grid gap-3 md:gap-4 relative z-10"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: totalHoles }).map((_, index) => {
            const mole = activeMoles[index];
            const isMoleOut = !!mole;

            return (
              <div
                key={index}
                onClick={() => isMoleOut && handleHitMole(index)}
                className={`relative aspect-square rounded-3xl bg-amber-950/90 border-4 border-amber-900 shadow-inner flex flex-col justify-end items-center overflow-hidden cursor-pointer transition-all ${
                  isMoleOut ? 'hover:scale-[1.02] active:scale-95' : ''
                }`}
              >
                {/* Underground Hole Rim */}
                <div className="absolute bottom-1 w-4/5 h-4 bg-stone-900 rounded-full border border-stone-800 shadow-inner" />

                {/* Animated Mole popping up */}
                {isMoleOut && (
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center p-1 transition-transform duration-200 transform ${
                      mole.isHit === 'correct'
                        ? 'scale-110 rotate-6 brightness-125'
                        : mole.isHit === 'wrong'
                        ? 'scale-90 -rotate-6 brightness-75'
                        : 'scale-100'
                    }`}
                  >
                    {/* The Mole Head & Whiskers */}
                    <div className="relative flex flex-col items-center">
                      <div className="w-12 h-10 md:w-16 md:h-12 bg-amber-800 rounded-t-full border-2 border-amber-900 flex items-center justify-center shadow-lg relative">
                        {/* Eyes */}
                        <div className="flex gap-3 mb-1">
                          <span className="w-2 h-2 rounded-full bg-slate-900 border border-white" />
                          <span className="w-2 h-2 rounded-full bg-slate-900 border border-white" />
                        </div>
                        {/* Pink Nose */}
                        <div className="w-3.5 h-2.5 bg-rose-400 rounded-full absolute bottom-1.5 shadow-sm" />
                      </div>

                      {/* Sign / Cartellino */}
                      <div
                        className={`mt-[-2px] px-2.5 py-1.5 rounded-xl border-2 font-black text-xs md:text-sm tracking-wide shadow-xl max-w-[95%] text-center truncate ${
                          mole.isHit === 'correct'
                            ? 'bg-emerald-500 border-white text-white ring-4 ring-emerald-300'
                            : mole.isHit === 'wrong'
                            ? 'bg-rose-600 border-white text-white ring-4 ring-rose-400'
                            : 'bg-amber-100 border-amber-900 text-slate-950'
                        }`}
                      >
                        {mole.word}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <span>
          Griglia: {gridSize}x{gridSize} ({totalHoles} buche) • Durata comparsa: {content.duration} {content.duration === 'casuale' ? '' : 'sec'}
        </span>
        <span className="text-amber-300 font-bold">
          Punti accumulati: +{netScore} pt
        </span>
      </div>
    </div>
  );
};
