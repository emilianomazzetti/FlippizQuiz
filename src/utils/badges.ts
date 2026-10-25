import { GlobalPlayerScore } from '../types/quiz';

export interface BadgeDefinition {
  id: string;
  category: 'punti_globali' | 'piazzamenti_vittorie' | 'mistero';
  categoryLabel: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  unit: string;
  unlockedColor: string;
  checkUnlocked: (stats: GlobalPlayerScore) => boolean;
  getProgress: (stats: GlobalPlayerScore) => { current: number; target: number; percentage: number };
}

// 1. PUNTI GLOBALI BADGES (11 levels)
export const PUNTI_GLOBALI_BADGES: BadgeDefinition[] = [
  {
    id: 'pg_pivello',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Pivello',
    description: 'Ha collezionato 100 punti nella classifica globale',
    icon: '🌱',
    target: 100,
    unit: 'pt',
    unlockedColor: 'from-emerald-500 to-teal-600',
    checkUnlocked: (s) => (s.totalScore || 0) >= 100,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 100,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 100) * 100))
    })
  },
  {
    id: 'pg_esploratore',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Esploratore dei Quiz',
    description: 'Ha collezionato 150 punti nella classifica globale',
    icon: '🧭',
    target: 150,
    unit: 'pt',
    unlockedColor: 'from-cyan-500 to-blue-600',
    checkUnlocked: (s) => (s.totalScore || 0) >= 150,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 150,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 150) * 100))
    })
  },
  {
    id: 'pg_apprendista',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Apprendista Provetto',
    description: 'Ha collezionato 300 punti nella classifica globale',
    icon: '⚡',
    target: 300,
    unit: 'pt',
    unlockedColor: 'from-sky-500 to-indigo-600',
    checkUnlocked: (s) => (s.totalScore || 0) >= 300,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 300,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 300) * 100))
    })
  },
  {
    id: 'pg_esperto',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Giocatore Esperto',
    description: 'Ha collezionato 600 punti nella classifica globale',
    icon: '🎯',
    target: 600,
    unit: 'pt',
    unlockedColor: 'from-indigo-500 to-purple-600',
    checkUnlocked: (s) => (s.totalScore || 0) >= 600,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 600,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 600) * 100))
    })
  },
  {
    id: 'pg_asse',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Asse del Gioco',
    description: 'Ha collezionato 900 punti nella classifica globale',
    icon: '🔥',
    target: 900,
    unit: 'pt',
    unlockedColor: 'from-purple-500 to-pink-600',
    checkUnlocked: (s) => (s.totalScore || 0) >= 900,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 900,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 900) * 100))
    })
  },
  {
    id: 'pg_campione',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Campione della Classe',
    description: 'Ha collezionato 1.000 punti nella classifica globale',
    icon: '👑',
    target: 1000,
    unit: 'pt',
    unlockedColor: 'from-amber-500 to-yellow-500',
    checkUnlocked: (s) => (s.totalScore || 0) >= 1000,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 1000,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 1000) * 100))
    })
  },
  {
    id: 'pg_veterano',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Veterano Insuperabile',
    description: 'Ha collezionato 1.500 punti nella classifica globale',
    icon: '🛡️',
    target: 1500,
    unit: 'pt',
    unlockedColor: 'from-orange-500 to-red-600',
    checkUnlocked: (s) => (s.totalScore || 0) >= 1500,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 1500,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 1500) * 100))
    })
  },
  {
    id: 'pg_mastro',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Mastro dei Quiz',
    description: 'Ha collezionato 2.000 punti nella classifica globale',
    icon: '🧙‍♂️',
    target: 2000,
    unit: 'pt',
    unlockedColor: 'from-rose-500 to-pink-600',
    checkUnlocked: (s) => (s.totalScore || 0) >= 2000,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 2000,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 2000) * 100))
    })
  },
  {
    id: 'pg_dominatore',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Dominatore Globale',
    description: 'Ha collezionato 3.000 punti nella classifica globale',
    icon: '🌍',
    target: 3000,
    unit: 'pt',
    unlockedColor: 'from-teal-500 to-emerald-600',
    checkUnlocked: (s) => (s.totalScore || 0) >= 3000,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 3000,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 300) * 10))
    })
  },
  {
    id: 'pg_titano',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Titano del Sapere',
    description: 'Ha collezionato 6.000 punti nella classifica globale',
    icon: '🏛️',
    target: 6000,
    unit: 'pt',
    unlockedColor: 'from-amber-600 to-orange-700',
    checkUnlocked: (s) => (s.totalScore || 0) >= 6000,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 6000,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 6000) * 100))
    })
  },
  {
    id: 'pg_leggenda',
    category: 'punti_globali',
    categoryLabel: 'Punti Globali',
    title: 'Leggenda Cosmica',
    description: 'Ha collezionato 150.000 punti nella classifica globale',
    icon: '✨',
    target: 150000,
    unit: 'pt',
    unlockedColor: 'from-fuchsia-600 via-purple-600 to-indigo-700',
    checkUnlocked: (s) => (s.totalScore || 0) >= 150000,
    getProgress: (s) => ({
      current: s.totalScore || 0,
      target: 150000,
      percentage: Math.min(100, Math.round(((s.totalScore || 0) / 150000) * 100))
    })
  }
];

// 2. PIAZZAMENTI E VITTORIE BADGES (9 levels)
export const PIAZZAMENTI_VITTORIE_BADGES: BadgeDefinition[] = [
  {
    id: 'pv_primo_successo',
    category: 'piazzamenti_vittorie',
    categoryLabel: 'Piazzamenti e Vittorie',
    title: 'Primo Successo',
    description: 'Ha vinto almeno 1 quiz',
    icon: '🥇',
    target: 1,
    unit: 'vittoria',
    unlockedColor: 'from-yellow-400 to-amber-600',
    checkUnlocked: (s) => (s.wins || 0) >= 1,
    getProgress: (s) => ({
      current: s.wins || 0,
      target: 1,
      percentage: Math.min(100, (s.wins || 0) >= 1 ? 100 : 0)
    })
  },
  {
    id: 'pv_sul_podio',
    category: 'piazzamenti_vittorie',
    categoryLabel: 'Piazzamenti e Vittorie',
    title: 'Sul Podio',
    description: 'Si è piazzato tra i primi 3 per 5 volte',
    icon: '🏆',
    target: 5,
    unit: 'podi',
    unlockedColor: 'from-indigo-500 to-blue-600',
    checkUnlocked: (s) => (s.top3Count || 0) >= 5,
    getProgress: (s) => ({
      current: s.top3Count || 0,
      target: 5,
      percentage: Math.min(100, Math.round(((s.top3Count || 0) / 5) * 100))
    })
  },
  {
    id: 'pv_collezionista',
    category: 'piazzamenti_vittorie',
    categoryLabel: 'Piazzamenti e Vittorie',
    title: 'Collezionista di Medaglie',
    description: 'Si è piazzato al 2° o 3° posto per 10 volte',
    icon: '🎖️',
    target: 10,
    unit: 'medaglie',
    unlockedColor: 'from-purple-500 to-indigo-600',
    checkUnlocked: (s) => ((s.secondPlaceCount || 0) + (s.thirdPlaceCount || 0)) >= 10,
    getProgress: (s) => {
      const sum = (s.secondPlaceCount || 0) + (s.thirdPlaceCount || 0);
      return {
        current: sum,
        target: 10,
        percentage: Math.min(100, Math.round((sum / 10) * 100))
      };
    }
  },
  {
    id: 'pv_eterno_secondo',
    category: 'piazzamenti_vittorie',
    categoryLabel: 'Piazzamenti e Vittorie',
    title: 'Eterno Secondo',
    description: 'Ha conquistato il 2° posto per 5 volte',
    icon: '🥈',
    target: 5,
    unit: 'argenti',
    unlockedColor: 'from-slate-400 to-slate-600',
    checkUnlocked: (s) => (s.secondPlaceCount || 0) >= 5,
    getProgress: (s) => ({
      current: s.secondPlaceCount || 0,
      target: 5,
      percentage: Math.min(100, Math.round(((s.secondPlaceCount || 0) / 5) * 100))
    })
  },
  {
    id: 'pv_bronzo',
    category: 'piazzamenti_vittorie',
    categoryLabel: 'Piazzamenti e Vittorie',
    title: 'Medaglia di Bronzo',
    description: 'Ha conquistato il 3° posto per 5 volte',
    icon: '🥉',
    target: 5,
    unit: 'bronzi',
    unlockedColor: 'from-amber-700 to-amber-900',
    checkUnlocked: (s) => (s.thirdPlaceCount || 0) >= 5,
    getProgress: (s) => ({
      current: s.thirdPlaceCount || 0,
      target: 5,
      percentage: Math.min(100, Math.round(((s.thirdPlaceCount || 0) / 5) * 100))
    })
  },
  {
    id: 'pv_vincitore_seriale',
    category: 'piazzamenti_vittorie',
    categoryLabel: 'Piazzamenti e Vittorie',
    title: 'Vincitore Seriale',
    description: 'Ha vinto 5 quiz (1° posto)',
    icon: '🌟',
    target: 5,
    unit: 'vittorie',
    unlockedColor: 'from-amber-400 to-yellow-500',
    checkUnlocked: (s) => (s.wins || 0) >= 5,
    getProgress: (s) => ({
      current: s.wins || 0,
      target: 5,
      percentage: Math.min(100, Math.round(((s.wins || 0) / 5) * 100))
    })
  },
  {
    id: 'pv_inarrestabile',
    category: 'piazzamenti_vittorie',
    categoryLabel: 'Piazzamenti e Vittorie',
    title: 'Inarrestabile',
    description: 'Ha vinto 10 quiz (1° posto)',
    icon: '🚀',
    target: 10,
    unit: 'vittorie',
    unlockedColor: 'from-rose-500 to-amber-500',
    checkUnlocked: (s) => (s.wins || 0) >= 10,
    getProgress: (s) => ({
      current: s.wins || 0,
      target: 10,
      percentage: Math.min(100, Math.round(((s.wins || 0) / 10) * 100))
    })
  },
  {
    id: 'pv_dominatore_gioco',
    category: 'piazzamenti_vittorie',
    categoryLabel: 'Piazzamenti e Vittorie',
    title: 'Dominatore del Gioco',
    description: 'Ha vinto 25 quiz (1° posto)',
    icon: '💎',
    target: 25,
    unit: 'vittorie',
    unlockedColor: 'from-cyan-400 via-blue-500 to-indigo-600',
    checkUnlocked: (s) => (s.wins || 0) >= 25,
    getProgress: (s) => ({
      current: s.wins || 0,
      target: 25,
      percentage: Math.min(100, Math.round(((s.wins || 0) / 25) * 100))
    })
  },
  {
    id: 'pv_re_dei_quiz',
    category: 'piazzamenti_vittorie',
    categoryLabel: 'Piazzamenti e Vittorie',
    title: 'Re dei Quiz',
    description: 'Ha vinto 50 quiz (1° posto)',
    icon: '👑',
    target: 50,
    unit: 'vittorie',
    unlockedColor: 'from-amber-300 via-yellow-400 to-amber-600',
    checkUnlocked: (s) => (s.wins || 0) >= 50,
    getProgress: (s) => ({
      current: s.wins || 0,
      target: 50,
      percentage: Math.min(100, Math.round(((s.wins || 0) / 50) * 100))
    })
  }
];

// Generate 10x10 Matrix (100 Badges)
// Slot 0..10: Punti Globali (11 badges)
// Slot 11..19: Piazzamenti e Vittorie (9 badges)
// Slot 20..99: Mystery locked slots
export function getFull10x10BadgesList(): BadgeDefinition[] {
  const list: BadgeDefinition[] = [
    ...PUNTI_GLOBALI_BADGES,
    ...PIAZZAMENTI_VITTORIE_BADGES
  ];

  const currentCount = list.length; // 20
  for (let i = currentCount; i < 100; i++) {
    list.push({
      id: `mistero_${i + 1}`,
      category: 'mistero',
      categoryLabel: 'Prossime Sfide',
      title: `Badge #${i + 1}`,
      description: 'Obiettivo misterioso ancora da sbloccare nei prossimi FlipQuizLive',
      icon: '🔒',
      target: 999999,
      unit: '',
      unlockedColor: 'from-slate-700 to-slate-800',
      checkUnlocked: () => false,
      getProgress: () => ({ current: 0, target: 1, percentage: 0 })
    });
  }

  return list;
}

export interface EvaluatedBadge extends BadgeDefinition {
  isUnlocked: boolean;
  currentValue: number;
  progressPercent: number;
  slotIndex: number;
}

export function evaluateAllBadges(stats: GlobalPlayerScore): EvaluatedBadge[] {
  const full = getFull10x10BadgesList();
  return full.map((b, idx) => {
    const isUnlocked = b.checkUnlocked(stats);
    const prog = b.getProgress(stats);
    return {
      ...b,
      isUnlocked,
      currentValue: prog.current,
      progressPercent: prog.percentage,
      slotIndex: idx + 1
    };
  });
}

// Compare old and new stats to see if any badge was newly earned
export function getNewlyUnlockedBadges(
  prevStats: GlobalPlayerScore,
  nextStats: GlobalPlayerScore
): BadgeDefinition[] {
  const full = [...PUNTI_GLOBALI_BADGES, ...PIAZZAMENTI_VITTORIE_BADGES];
  const newlyUnlocked: BadgeDefinition[] = [];

  for (const b of full) {
    const wasUnlocked = b.checkUnlocked(prevStats);
    const isNowUnlocked = b.checkUnlocked(nextStats);
    if (!wasUnlocked && isNowUnlocked) {
      newlyUnlocked.push(b);
    }
  }

  return newlyUnlocked;
}
