import React, { useState, useEffect, useRef } from 'react';
import { MoleWhackContent } from '../../types/quiz';
import { getWordsByGrammarCategory, getRandomDistractor } from '../../utils/wordDictionary';
import { sound } from '../../utils/audio';
import { Sparkles, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface WhackMolePlayerProps {
  content: MoleWhackContent;
  onAnswer: (isCorrect: boolean, payload?: any) => void;
  disabled?: boolean;
}

interface ActiveMole {
  id: string;
  holeIndex: number;
  word: string;
  isTarget: boolean;
  spawnTime: number;
  visibleDuration: number; // in ms
  state: 'popping' | 'up' | 'hit' | 'hiding';
}

interface HitEffect {
  id: string;
  holeIndex: number;
  isCorrect: boolean;
  text: string;
}

export const WhackMolePlayer: React.FC<WhackMolePlayerProps> = ({
  content,
  onAnswer,
  disabled = false
}) => {
  const category = content.category || 'nomi';
  const durationSetting = content.duration || 'casuale';
  const gridSize = content.gridSize || 3;
  const totalHoles = gridSize * gridSize;

  const [activeMoles, setActiveMoles] = useState<Record<number, ActiveMole>>({});
  const [correctHits, setCorrectHits] = useState(0);
  const [wrongHits, setWrongHits] = useState(0);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // References to keep callbacks current in game loop
  const stateRef = useRef({
    activeMoles,
    correctHits,
    wrongHits,
    disabled,
    submitted
  });
  stateRef.current = {
    activeMoles,
    correctHits,
    wrongHits,
    disabled,
    submitted
  };

  const targetCategoryLabel = {
    nomi: 'NOMI (es. cane, scuola, stella)',
    aggettivi: 'AGGETTIVI (es. bello, veloce, felice)',
    verbi: 'VERBI (es. correre, cantare, leggere)',
    articoli: 'ARTICOLI (es. il, lo, la, un, uno)'
  }[category];

  // Helper to get duration for a mole
  const getMoleDurationMs = (): number => {
    if (durationSetting === 'casuale') {
      // random between 2500ms and 5500ms
      return Math.floor(Math.random() * 3000) + 2500;
    }
    return Number(durationSetting) * 1000;
  };

  // Main game tick: spawn and despawn moles
  useEffect(() => {
    if (disabled || submitted) return;

    const targetPool = getWordsByGrammarCategory(category);

    const interval = setInterval(() => {
      const { activeMoles: currentMoles } = stateRef.current;
      const now = Date.now();
      const updated: Record<number, ActiveMole> = {};

      // 1. Check existing moles for expiration
      Object.entries(currentMoles).forEach(([holeStr, mole]) => {
        const h = Number(holeStr);
        if (mole.state === 'hit') {
          // If hit recently, give it 400ms then remove
          if (now - mole.spawnTime < mole.visibleDuration) {
            updated[h] = mole;
          }
        } else if (now - mole.spawnTime < mole.visibleDuration) {
          updated[h] = mole;
        }
      });

      // 2. Decide if we should spawn new moles
      // Limit concurrent moles to 2 for 3x3, 3 for 4x4
      const maxConcurrent = gridSize === 4 ? 3 : 2;
      const currentCount = Object.keys(updated).length;

      if (currentCount < maxConcurrent) {
        // Find empty holes
        const emptyHoles: number[] = [];
        for (let i = 0; i < totalHoles; i++) {
          if (!updated[i]) emptyHoles.push(i);
        }

        if (emptyHoles.length > 0) {
          const chosenHole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
          // 50% chance target category, 50% chance distractor
          const isTarget = Math.random() < 0.55;
          let word = '';

          if (isTarget) {
            word = targetPool[Math.floor(Math.random() * targetPool.length)];
          } else {
            const dist = getRandomDistractor(category);
            word = dist.word;
          }

          const dur = getMoleDurationMs();
          updated[chosenHole] = {
            id: `mole-${now}-${chosenHole}`,
            holeIndex: chosenHole,
            word,
            isTarget,
            spawnTime: now,
            visibleDuration: dur,
            state: 'up'
          };
        }
      }

      setActiveMoles(updated);
    }, 450);

    return () => clearInterval(interval);
  }, [category, durationSetting, gridSize, totalHoles, disabled, submitted]);

  // Handle whacking a mole
  const handleWhack = (holeIndex: number) => {
    if (disabled || submitted) return;
    const mole = activeMoles[holeIndex];
    if (!mole || mole.state === 'hit') return;

    const isCorrect = mole.isTarget;

    // Trigger visual hit effect
    const effectId = `eff-${Date.now()}-${holeIndex}`;
    setHitEffects((prev) => [
      ...prev,
      {
        id: effectId,
        holeIndex,
        isCorrect,
        text: isCorrect ? '+1 PRESA! ✨' : '-10 PT! ❌'
      }
    ]);
    setTimeout(() => {
      setHitEffects((prev) => prev.filter((e) => e.id !== effectId));
    }, 900);

    // Audio & vibration
    if (isCorrect) {
      sound.playCorrect();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
      setCorrectHits((prev) => prev + 1);
    } else {
      sound.playWrong();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150]);
      }
      setWrongHits((prev) => prev + 1);
    }

    // Mark mole as hit
    setActiveMoles((prev) => ({
      ...prev,
      [holeIndex]: {
        ...mole,
        state: 'hit'
      }
    }));
  };

  // Compute live score
  const totalScore = Math.max(0, correctHits * 10 - wrongHits * 10);

  // Auto-send answer update to room so student score is always saved even if round ends
  useEffect(() => {
    onAnswer(correctHits > 0, {
      correctCount: correctHits,
      errorCount: wrongHits,
      bonusPoints: totalScore,
      targetCategory: category
    });
  }, [correctHits, wrongHits, category, totalScore]);

  const handleFinishEarly = () => {
    if (disabled || submitted) return;
    setSubmitted(true);
    onAnswer(correctHits > 0, {
      correctCount: correctHits,
      errorCount: wrongHits,
      bonusPoints: totalScore,
      completedEarly: true
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 select-none">
      {/* Target Category Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-teal-500/20 border-2 border-amber-400/50 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/30">
            🐹
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                Becca la Talpa
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Griglia {gridSize}x{gridSize} • Tempo:{' '}
                {durationSetting === 'casuale' ? 'Casuale' : `${durationSetting}s`}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-white mt-0.5">
              Colpisci solo: <span className="text-amber-300 underline">{targetCategoryLabel}</span>
            </h3>
          </div>
        </div>

        {/* Live Score Counter */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider">Prese</span>
            <span className="text-xl font-black">{correctHits}</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider">Errori (-10)</span>
            <span className="text-xl font-black">{wrongHits}</span>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-indigo-600 text-white flex flex-col items-center shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider">Punti Talpa</span>
            <span className="text-xl font-black">+{totalScore}</span>
          </div>
        </div>
      </div>

      {/* Penalty Reminder */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-900/60 py-1.5 px-4 rounded-xl border border-slate-800">
        <ShieldAlert className="w-4 h-4 text-rose-400" />
        <span>Attento: se colpisci un cartellino errato perdi <strong>-10 pt</strong>!</span>
      </div>

      {/* Whack-a-Mole Meadow & Grid */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-b from-emerald-950 via-green-900 to-slate-900 rounded-3xl border-2 border-emerald-700/60 shadow-2xl overflow-hidden">
        {/* Grass decorative tufts */}
        <div className="absolute top-2 left-6 text-emerald-500/40 text-xl font-black pointer-events-none">
          🌱 🌿
        </div>
        <div className="absolute top-3 right-8 text-emerald-500/40 text-xl font-black pointer-events-none">
          🌿 🌱
        </div>
        <div className="absolute bottom-2 left-10 text-emerald-500/30 text-lg font-black pointer-events-none">
          🌱
        </div>
        <div className="absolute bottom-3 right-12 text-emerald-500/30 text-lg font-black pointer-events-none">
          🌱 🌿
        </div>

        <div
          className="grid gap-3 sm:gap-5 mx-auto max-w-2xl"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: totalHoles }).map((_, index) => {
            const mole = activeMoles[index];
            const isHit = mole && mole.state === 'hit';
            const hitEffect = hitEffects.find((e) => e.holeIndex === index);

            return (
              <div
                key={index}
                className="relative aspect-square flex flex-col items-center justify-end"
              >
                {/* Floating Feedback Tag on Whack */}
                {hitEffect && (
                  <div
                    className={`absolute -top-6 z-30 px-3 py-1 rounded-full text-xs sm:text-sm font-black shadow-2xl animate-bounce ${
                      hitEffect.isCorrect
                        ? 'bg-emerald-400 text-slate-950 ring-2 ring-white scale-110'
                        : 'bg-rose-500 text-white ring-2 ring-white scale-110'
                    }`}
                  >
                    {hitEffect.text}
                  </div>
                )}

                {/* The Mole (pops out above the hole) */}
                {mole && (
                  <div
                    onClick={() => handleWhack(index)}
                    className={`absolute z-20 bottom-3 w-[88%] sm:w-[84%] flex flex-col items-center cursor-pointer transition-all duration-200 transform ${
                      isHit
                        ? 'scale-90 opacity-70 translate-y-3 rotate-6'
                        : 'animate-bounce hover:scale-105 active:scale-95'
                    }`}
                  >
                    {/* The Cartellino (Card with word) */}
                    <div
                      className={`w-full py-1.5 px-2 rounded-xl text-center font-black shadow-2xl border-2 transition-transform ${
                        isHit
                          ? mole.isTarget
                            ? 'bg-emerald-400 border-white text-slate-950 ring-4 ring-emerald-300'
                            : 'bg-rose-600 border-white text-white ring-4 ring-rose-400'
                          : 'bg-white border-amber-400 text-slate-900 hover:border-amber-300'
                      }`}
                    >
                      <span className="text-xs sm:text-base tracking-wide uppercase font-extrabold truncate block">
                        {mole.word}
                      </span>
                    </div>

                    {/* Cute Mole Head */}
                    <div className="relative -mt-1 w-14 h-12 sm:w-18 sm:h-16 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-full border-2 border-amber-950 flex flex-col items-center justify-center shadow-lg">
                      {/* Ears */}
                      <div className="absolute -top-1.5 -left-1 w-3.5 h-3.5 bg-amber-800 rounded-full border border-amber-950" />
                      <div className="absolute -top-1.5 -right-1 w-3.5 h-3.5 bg-amber-800 rounded-full border border-amber-950" />

                      {/* Eyes */}
                      <div className="flex gap-2.5 sm:gap-3 mt-1">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-black rounded-full flex items-center justify-center">
                          <span className="w-1 h-1 bg-white rounded-full self-start ml-0.5 mt-0.5" />
                        </div>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-black rounded-full flex items-center justify-center">
                          <span className="w-1 h-1 bg-white rounded-full self-start ml-0.5 mt-0.5" />
                        </div>
                      </div>

                      {/* Cute Snout & Whiskers */}
                      <div className="w-5 h-3 bg-rose-300 rounded-full mt-0.5 border border-rose-400 flex items-center justify-center">
                        <span className="w-2 h-1 bg-rose-700 rounded-full" />
                      </div>

                      {/* Whack hammer icon on hit */}
                      {isHit && (
                        <div className="absolute -top-3 -right-2 text-2xl animate-spin">
                          🔨
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* The Hole in the Dirt Ground */}
                <div className="w-full h-8 sm:h-10 bg-gradient-to-b from-amber-950 to-stone-950 rounded-full border-4 border-amber-800/80 shadow-inner relative z-10 flex items-center justify-center">
                  <div className="w-3/4 h-3 bg-black/60 rounded-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Early submit button */}
      <button
        type="button"
        disabled={disabled || submitted}
        onClick={handleFinishEarly}
        className="w-full py-3.5 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
      >
        <CheckCircle2 className="w-5 h-5" />
        {submitted ? 'Punteggio Confermato' : 'Fine Gioco • Invia Risultato'}
      </button>
    </div>
  );
};
