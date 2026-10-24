import React, { useState, useMemo, useRef } from 'react';
import { WordSearchContent } from '../../types/quiz';
import { Check } from 'lucide-react';
import { generateWordSearchGrid } from '../../utils/wordSearchGenerator';

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

  // Drag / Swipe selection state
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const evaluateCoords = (coords: { r: number; c: number }[]) => {
    if (coords.length === 0 || disabled) return;

    const wordFormed = coords.map((coord) => grid[coord.r][coord.c]).join('');
    const revFormed = wordFormed.split('').reverse().join('');

    const matchedWord = wordsToFind.find(
      (w) => !foundWords.includes(w) && (w === wordFormed || w === revFormed)
    );

    if (matchedWord) {
      const nextFound = [...foundWords, matchedWord];
      setFoundWords(nextFound);
      setFoundCoords((prev) => [
        ...prev,
        ...coords.map((coord) => ({ ...coord, word: matchedWord }))
      ]);
      setSelectedCoords([]);

      onAnswer(nextFound.length > 0, {
        foundWords: nextFound,
        totalWords: wordsToFind.length,
        count: nextFound.length,
        foundAll: nextFound.length === wordsToFind.length
      });
    } else {
      setSelectedCoords([]);
    }
  };

  const handleCellPointerDown = (r: number, c: number, e: React.PointerEvent) => {
    if (disabled || isCoordFound(r, c)) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedCoords([{ r, c }]);
  };

  const handleCellPointerEnter = (r: number, c: number) => {
    if (!isDragging || disabled || isCoordFound(r, c)) return;
    // Prevent duplicates in path
    if (!selectedCoords.some((coord) => coord.r === r && coord.c === c)) {
      setSelectedCoords((prev) => [...prev, { r, c }]);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    evaluateCoords(selectedCoords);
  };

  // Fallback click selection for accessibility or tap-by-tap
  const handleCellClick = (r: number, c: number) => {
    if (disabled || isCoordFound(r, c) || isDragging) return;
    const exists = selectedCoords.some((coord) => coord.r === r && coord.c === c);
    let newCoords: { r: number; c: number }[] = [];

    if (exists) {
      newCoords = selectedCoords.filter((coord) => !(coord.r === r && coord.c === c));
    } else {
      newCoords = [...selectedCoords, { r, c }];
    }
    setSelectedCoords(newCoords);

    // Evaluate on click if at least 2-3 letters
    if (newCoords.length >= 2) {
      evaluateCoords(newCoords);
    }
  };

  const isCoordFound = (r: number, c: number) => {
    return foundCoords.some((fc) => fc.r === r && fc.c === c);
  };

  const isCoordSelected = (r: number, c: number) => {
    return selectedCoords.some((sc) => sc.r === sc.r && sc.r === r && sc.c === c);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 select-none touch-none">
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          Trascina il dito o clicca le lettere in sequenza per trovare le parole nascoste (+5 pt a parola!)
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
        {/* Letter Grid */}
        <div
          ref={gridRef}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="grid gap-1.5 p-3.5 bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl select-none"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
          }}
        >
          {grid.map((row, r) =>
            row.map((char, c) => {
              const found = isCoordFound(r, c);
              const selected = selectedCoords.some((sc) => sc.r === r && sc.c === c);

              return (
                <div
                  key={`${r}-${c}`}
                  onPointerDown={(e) => handleCellPointerDown(r, c, e)}
                  onPointerEnter={() => handleCellPointerEnter(r, c)}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl font-black text-base md:text-lg flex items-center justify-center transition-all cursor-pointer ${
                    found
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 font-black shadow-md'
                      : selected
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-400/50 scale-105 shadow-lg'
                      : 'bg-slate-800 text-slate-100 hover:bg-slate-750 border border-slate-700/80 shadow'
                  }`}
                >
                  {char}
                </div>
              );
            })
          )}
        </div>

        {/* Word Targets List */}
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 w-full md:w-60 flex flex-col gap-3 shadow-xl">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Parole da trovare:
          </h4>
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

          <div className="text-center text-xs text-slate-400 mt-2 font-bold">
            Trovate: <span className="text-emerald-400 font-black text-sm">{foundWords.length}</span> su {wordsToFind.length}
          </div>
        </div>
      </div>
    </div>
  );
};
