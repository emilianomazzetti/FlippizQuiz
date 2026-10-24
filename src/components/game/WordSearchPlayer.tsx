import React, { useState, useMemo, useRef } from 'react';
import { WordSearchContent } from '../../types/quiz';
import { Check, RotateCcw, Sparkles } from 'lucide-react';
import { generateWordSearchGrid } from '../../utils/wordSearchGenerator';
import { sound } from '../../utils/audio';

interface WordSearchPlayerProps {
  content: WordSearchContent;
  onAnswer: (isCorrect: boolean, payload?: any) => void;
  disabled?: boolean;
}

export const WordSearchPlayer: React.FC<WordSearchPlayerProps> = ({
  content,
  onAnswer,
  disabled = false
}) => {
  const gridSize = content.gridSize || 8;
  const wordsKey = (content.words || []).join(',');

  const { matrix: grid, wordsToFind } = useMemo(
    () => generateWordSearchGrid(content.words || [], gridSize),
    [wordsKey, gridSize]
  );

  const [selectedCoords, setSelectedCoords] = useState<{ r: number; c: number }[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCoords, setFoundCoords] = useState<{ r: number; c: number; word: string }[]>([]);

  // Drag selection state
  const isDraggingRef = useRef(false);

  // Evaluate current sequence of coordinates against target words
  const evaluateSequence = (coords: { r: number; c: number }[]) => {
    if (coords.length < 2 || disabled) return false;

    const wordFormed = coords.map((c) => grid[c.r][c.c]).join('');
    const revFormed = wordFormed.split('').reverse().join('');

    const matchedWord = wordsToFind.find(
      (w) => !foundWords.includes(w) && (w === wordFormed || w === revFormed)
    );

    if (matchedWord) {
      sound.playCorrect();
      const nextFound = [...foundWords, matchedWord];
      setFoundWords(nextFound);
      setFoundCoords((prev) => [
        ...prev,
        ...coords.map((c) => ({ ...c, word: matchedWord }))
      ]);
      setSelectedCoords([]);

      onAnswer(nextFound.length > 0, {
        foundWords: nextFound,
        totalWords: wordsToFind.length,
        count: nextFound.length,
        foundAll: nextFound.length === wordsToFind.length
      });
      return true;
    }
    return false;
  };

  // Handle cell selection (both for tap and swipe)
  const handleSelectCell = (r: number, c: number) => {
    if (disabled || isCoordFound(r, c)) return;

    // Check if cell is already in current selected sequence
    const existingIndex = selectedCoords.findIndex((sc) => sc.r === r && sc.c === c);

    if (existingIndex !== -1) {
      // If tapping the very last selected cell, remove it (undo last step)
      if (existingIndex === selectedCoords.length - 1) {
        const next = selectedCoords.slice(0, -1);
        setSelectedCoords(next);
        evaluateSequence(next);
      }
      return;
    }

    // Otherwise, append cell to active sequence
    const nextCoords = [...selectedCoords, { r, c }];
    setSelectedCoords(nextCoords);
    sound.playTick();

    // Check match instantly
    evaluateSequence(nextCoords);
  };

  const handlePointerDownCell = (r: number, c: number, e: React.PointerEvent) => {
    if (disabled || isCoordFound(r, c)) return;
    isDraggingRef.current = true;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
    handleSelectCell(r, c);
  };

  const handlePointerEnterCell = (r: number, c: number) => {
    if (!isDraggingRef.current || disabled || isCoordFound(r, c)) return;
    handleSelectCell(r, c);
  };

  const handlePointerUpGrid = () => {
    isDraggingRef.current = false;
    evaluateSequence(selectedCoords);
  };

  const handleClearSelection = () => {
    setSelectedCoords([]);
  };

  const isCoordFound = (r: number, c: number) => {
    return foundCoords.some((fc) => fc.r === r && fc.c === c);
  };

  const getSelectedIndex = (r: number, c: number) => {
    return selectedCoords.findIndex((sc) => sc.r === r && sc.c === c);
  };

  const currentWordFormed = selectedCoords.map((sc) => grid[sc.r][sc.c]).join('');

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-5 select-none">
      {/* Active word in construction & Clear selection button */}
      <div className="bg-slate-900 border-2 border-indigo-500/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Parola in composizione:
          </span>
          {currentWordFormed ? (
            <span className="text-xl md:text-2xl font-black text-amber-300 font-mono tracking-widest bg-slate-950 px-4 py-1 rounded-xl border border-amber-400/40 shadow-inner">
              {currentWordFormed}
            </span>
          ) : (
            <span className="text-xs text-indigo-300 italic">
              Tocca o trascina il dito sulle lettere per comporre una parola
            </span>
          )}
        </div>

        {selectedCoords.length > 0 && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 border border-rose-500/30 transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Azzera Selezione
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
        {/* Interactive Grid */}
        <div
          onPointerUp={handlePointerUpGrid}
          onPointerLeave={handlePointerUpGrid}
          className="grid gap-2 p-4 bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl select-none touch-none"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
          }}
        >
          {grid.map((row, r) =>
            row.map((char, c) => {
              const found = isCoordFound(r, c);
              const selIdx = getSelectedIndex(r, c);
              const isSelected = selIdx !== -1;

              return (
                <button
                  key={`cell-${r}-${c}`}
                  type="button"
                  onPointerDown={(e) => handlePointerDownCell(r, c, e)}
                  onPointerEnter={() => handlePointerEnterCell(r, c)}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl font-black text-lg flex items-center justify-center transition-all cursor-pointer relative ${
                    found
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 font-black shadow-lg scale-102'
                      : isSelected
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-400 scale-108 shadow-xl z-10'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 shadow active:scale-95'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  {char}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">
                      {selIdx + 1}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Target Words List */}
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 w-full md:w-60 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Parole da trovare:
            </h4>
            <span className="text-xs font-mono font-black text-amber-300">
              {foundWords.length}/{wordsToFind.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {wordsToFind.map((word) => {
              const isFound = foundWords.includes(word);
              return (
                <div
                  key={word}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-black flex items-center justify-between transition-all ${
                    isFound
                      ? 'bg-emerald-500/20 text-emerald-300 line-through border border-emerald-500/40 shadow-inner'
                      : 'bg-slate-950 text-white border border-slate-800/80'
                  }`}
                >
                  <span>{word}</span>
                  {isFound && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-slate-400 mt-2 font-bold flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>+5 pt per ogni parola trovata</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold">
              🏆 Risolvi tutte le parole per sbloccare i punti di default della domanda!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
