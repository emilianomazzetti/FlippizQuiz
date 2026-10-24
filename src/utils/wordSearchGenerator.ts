// High-variety seeded Word Search Grid Generator for FlipQuiz
// Ensures teacher monitor and student devices generate the identical puzzle
// with diverse placements across 8 directions (horizontal, vertical, diagonal).

export interface WordSearchGridResult {
  matrix: string[][];
  solutionCoords: { r: number; c: number; word: string }[];
  wordsToFind: string[];
}

// Simple deterministic hash to 32-bit integer
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Mulberry32 PRNG for deterministic random sequences
function createPrng(seedVal: number) {
  let s = seedVal;
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateWordSearchGrid(
  rawWords: string[],
  gridSize: number = 8,
  customSeed?: string
): WordSearchGridResult {
  const wordsToFind = (rawWords || [])
    .map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, ''))
    .filter((w) => w.length > 0 && w.length <= gridSize);

  const seedKey = customSeed || wordsToFind.join('_') + `_${gridSize}`;
  const prng = createPrng(hashString(seedKey));

  const letters = 'ABCDEFGHILMNOPQRSTUVZ';
  const matrix: string[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => '')
  );
  const solutionCoords: { r: number; c: number; word: string }[] = [];

  // 8 possible directions: [dr, dc]
  const directions: [number, number][] = [
    [0, 1],   // horizontal left-to-right
    [0, -1],  // horizontal right-to-left
    [1, 0],   // vertical top-to-bottom
    [-1, 0],  // vertical bottom-to-top
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal down-left
    [-1, 1],  // diagonal up-right
    [-1, -1]  // diagonal up-left
  ];

  // Fisher-Yates shuffle with PRNG
  function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Sort longest words first so they fit more easily
  const sortedWords = [...wordsToFind].sort((a, b) => b.length - a.length);

  for (const word of sortedWords) {
    let placed = false;
    const shuffledDirs = shuffle(directions);

    // Try up to 150 random attempts to place each word
    for (let attempt = 0; attempt < 150 && !placed; attempt++) {
      const [dr, dc] = shuffledDirs[attempt % shuffledDirs.length];
      const startR = Math.floor(prng() * gridSize);
      const startC = Math.floor(prng() * gridSize);

      const endR = startR + dr * (word.length - 1);
      const endC = startC + dc * (word.length - 1);

      if (endR >= 0 && endR < gridSize && endC >= 0 && endC < gridSize) {
        // Check if word fits without conflicting with already placed letters
        let canFit = true;
        for (let i = 0; i < word.length; i++) {
          const r = startR + dr * i;
          const c = startC + dc * i;
          if (matrix[r][c] !== '' && matrix[r][c] !== word[i]) {
            canFit = false;
            break;
          }
        }

        if (canFit) {
          for (let i = 0; i < word.length; i++) {
            const r = startR + dr * i;
            const c = startC + dc * i;
            matrix[r][c] = word[i];
            solutionCoords.push({ r, c, word });
          }
          placed = true;
        }
      }
    }

    // Fallback: simple horizontal scan if random placement was crowded
    if (!placed) {
      for (let r = 0; r < gridSize && !placed; r++) {
        for (let c = 0; c <= gridSize - word.length && !placed; c++) {
          let canFit = true;
          for (let i = 0; i < word.length; i++) {
            if (matrix[r][c + i] !== '' && matrix[r][c + i] !== word[i]) {
              canFit = false;
              break;
            }
          }
          if (canFit) {
            for (let i = 0; i < word.length; i++) {
              matrix[r][c + i] = word[i];
              solutionCoords.push({ r, c: c + i, word });
            }
            placed = true;
          }
        }
      }
    }
  }

  // Fill all remaining empty cells with seeded pseudo-random letters
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!matrix[r][c]) {
        const charIdx = Math.floor(prng() * letters.length);
        matrix[r][c] = letters[charIdx];
      }
    }
  }

  return { matrix, solutionCoords, wordsToFind };
}
