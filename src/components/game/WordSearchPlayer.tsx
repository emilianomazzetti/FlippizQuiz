import React, { useState, useEffect, useMemo } from 'react';
import { WordSearchContent } from '../../types/quiz';
import { Check, CheckCircle2 } from 'lucide-react';

interface WordSearchPlayerProps {
  content: WordSearchContent;
  onAnswer: (isCorrect: boolean, payload?: any) => void;
  disabled?: boolean;
}

interface GridCell {
  row: number;
  col: number;
  char: string;
}

export const WordSearchPlayer: React.FC<WordSearchPlayerProps> = ({
  content,
  onAnswer,
  disabled = false
}) => {
  const gridSize = content.gridSize || 8;
  const wordsKey = (content.words || []).join(',');
  const wordsToFind = useMemo(
    () => (content.words || []).map((w) => w.trim().toUpperCase()),
    [wordsKey]
  );

  const [grid, setGrid] = useState<string[][]>(() => {
    const letters = 'ABCDEFGHILMNOPQRSTUVZ';
    const matrix: string[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => '')
    );

    // Place words horizontally or vertically
    wordsToFind.forEach((word) => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 50) {
        attempts++;
        const isHorizontal = Math.random() > 0.5;
        if (isHorizontal) {
          const row = Math.floor(Math.random() * gridSize);
          const maxCol = gridSize - word.length;
          if (maxCol >= 0) {
            const col = Math.floor(Math.random() * (maxCol + 1));
            let fits = true;
            for (let i = 0; i < word.length; i++) {
              if (matrix[row][col + i] !== '' && matrix[row][col + i] !== word[i]) {
                fits = false;
                break;
              }
            }
            if (fits) {
              for (let i = 0; i < word.length; i++) {
                matrix[row][col + i] = word[i];
              }
              placed = true;
            }
          }
        } else {
          const col = Math.floor(Math.random() * gridSize);
          const maxRow = gridSize - word.length;
          if (maxRow >= 0) {
            const row = Math.floor(Math.random() * (maxRow + 1));
            let fits = true;
            for (let i = 0; i < word.length; i++) {
              if (matrix[row + i][col] !== '' && matrix[row + i][col] !== word[i]) {
                fits = false;
                break;
              }
            }
            if (fits) {
              for (let i = 0; i < word.length; i++) {
                matrix[row + i][col] = word[i];
              }
              placed = true;
            }
          }
        }
      }
    });

    // Fill empty cells with random letters
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!matrix[r][c]) {
          matrix[r][c] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }
    return matrix;
  });
  const [selectedCoords, setSelectedCoords] = useState<{ r: number; c: number }[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCoords, setFoundCoords] = useState<{ r: number; c: number; word: string }[]>([]);

  const toggleSelect = (r: number, c: number) => {
    if (disabled) return;
    const exists = selectedCoords.some((coord) => coord.r === r && coord.c === c);
    let newCoords: { r: number; c: number }[] = [];

    if (exists) {
      newCoords = selectedCoords.filter((coord) => !(coord.r === r && coord.c === c));
    } else {
      newCoords = [...selectedCoords, { r, c }];
    }
    setSelectedCoords(newCoords);

    // Check if the current selection forms one of the words to find
    const wordFormed = newCoords.map((coord) => grid[coord.r][coord.c]).join('');
    const revFormed = wordFormed.split('').reverse().join('');

    const matchedWord = wordsToFind.find(
      (w) => (!foundWords.includes(w) && (w === wordFormed || w === revFormed))
    );

    if (matchedWord) {
      const nextFound = [...foundWords, matchedWord];
      setFoundWords(nextFound);
      setFoundCoords((prev) => [
        ...prev,
        ...newCoords.map((coord) => ({ ...coord, word: matchedWord }))
      ]);
      setSelectedCoords([]);

      // If all found, trigger success
      if (nextFound.length === wordsToFind.length) {
        onAnswer(true, { foundAll: true });
      }
    }
  };

  const isCoordFound = (r: number, c: number) => {
    return foundCoords.some((fc) => fc.r === r && fc.c === c);
  };

  const isCoordSelected = (r: number, c: number) => {
    return selectedCoords.some((sc) => sc.r === r && sc.c === c);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          Trova le parole nascoste toccando le lettere in sequenza
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
        {/* Letter Grid */}
        <div
          className="grid gap-1.5 p-3 bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl select-none"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
          }}
        >
          {grid.map((row, r) =>
            row.map((char, c) => {
              const found = isCoordFound(r, c);
              const selected = isCoordSelected(r, c);

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  disabled={disabled || found}
                  onClick={() => toggleSelect(r, c)}
                  className={`w-9 h-9 md:w-11 md:h-11 rounded-xl font-black text-sm md:text-base flex items-center justify-center transition-all ${
                    found
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 font-black'
                      : selected
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 scale-105'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700/60'
                  }`}
                >
                  {char}
                </button>
              );
            })
          )}
        </div>

        {/* Word Targets List */}
        <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 w-full md:w-56 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Parole da trovare:
          </h4>
          <div className="flex flex-col gap-2">
            {wordsToFind.map((word) => {
              const isFound = foundWords.includes(word);
              return (
                <div
                  key={word}
                  className={`px-3 py-2 rounded-xl text-sm font-black flex items-center justify-between transition-all ${
                    isFound
                      ? 'bg-emerald-500/20 text-emerald-300 line-through border border-emerald-500/40'
                      : 'bg-slate-900/60 text-white border border-slate-800'
                  }`}
                >
                  <span>{word}</span>
                  {isFound && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-slate-400 mt-2">
            Trovate: {foundWords.length} su {wordsToFind.length}
          </div>
        </div>
      </div>
    </div>
  );
};
