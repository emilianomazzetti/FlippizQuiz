import React, { useState } from 'react';
import { GlobalPlayerScore } from '../types/quiz';
import { evaluateAllBadges, EvaluatedBadge } from '../utils/badges';
import {
  Trophy,
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  Award,
  Flame,
  Star,
  Target,
  HelpCircle,
  Medal
} from 'lucide-react';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: GlobalPlayerScore;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  student
}) => {
  const [selectedBadge, setSelectedBadge] = useState<EvaluatedBadge | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'punti_globali' | 'piazzamenti_vittorie'>('all');

  if (!isOpen) return null;

  const evaluated = evaluateAllBadges(student);
  const totalUnlocked = evaluated.filter((b) => b.isUnlocked).length;

  const filteredBadges = evaluated.filter((b) => {
    if (filter === 'unlocked') return b.isUnlocked;
    if (filter === 'punti_globali') return b.category === 'punti_globali';
    if (filter === 'piazzamenti_vittorie') return b.category === 'piazzamenti_vittorie';
    return true; // 10x10 grid
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-2xl flex items-center justify-center shadow-lg shadow-amber-500/10">
              {student.avatar || '🚀'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{student.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
                  Pannello Premi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Medagliere personale e resoconto storico FlipQuizLive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Chiudi pannello premi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Stats Summary Ribbon */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800/80 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. PUNTI TOTALI */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 shadow-inner">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Punti Generali</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  {student.totalScore.toLocaleString('it-IT')}
                </span>
              </div>
            </div>

            {/* 2. RISPOSTE CORRETTE TOTALI (ACCROSS ALL GAMES EVER) */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3 flex items-center gap-3 shadow-inner">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Risposte Giuste Totali</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {student.totalCorrectAnswers ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">corrette</span>
                </div>
              </div>
            </div>

            {/* 3. VITTORIE & PODI */}
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3 flex items-center gap-3 shadow-inner">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Medal className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Piazzamenti</span>
                <div className="flex items-center gap-2 text-xs font-black">
                  <span className="text-amber-400">🥇 {student.wins || 0}</span>
                  <span className="text-slate-300">🥈 {student.secondPlaceCount || 0}</span>
                  <span className="text-amber-600">🥉 {student.thirdPlaceCount || 0}</span>
                </div>
              </div>
            </div>

            {/* 4. MEDAGLIE SBLOCCATE */}
            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3 flex items-center gap-3 shadow-inner">
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Medagliere</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-purple-300 font-mono">{totalUnlocked}</span>
                  <span className="text-[10px] text-slate-400 font-medium">/ 100 badge</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Griglia Completa 10x10 (100)
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'unlocked'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              🌟 Sbloccati ({totalUnlocked})
            </button>
            <button
              onClick={() => setFilter('punti_globali')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'punti_globali'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              ⚡ Punti Globali (11)
            </button>
            <button
              onClick={() => setFilter('piazzamenti_vittorie')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'piazzamenti_vittorie'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              🏆 Piazzamenti e Vittorie (9)
            </button>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Tocca un badge per visualizzare requisiti e livello
          </span>
        </div>

        {/* Medagliere 10x10 Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
            {filteredBadges.map((badge) => {
              const isSelected = selectedBadge?.id === badge.id;
              const isUnlocked = badge.isUnlocked;

              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  title={`${badge.title} (${badge.categoryLabel}) - ${isUnlocked ? 'Sbloccato!' : 'Bloccato'}`}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all duration-200 cursor-pointer text-center group ${
                    isUnlocked
                      ? `bg-gradient-to-tr ${badge.unlockedColor} text-white shadow-lg shadow-black/40 ring-2 ring-amber-400/80 hover:scale-108 active:scale-95`
                      : 'bg-slate-800/40 border border-slate-700/50 opacity-30 hover:opacity-75 hover:border-slate-500 grayscale'
                  } ${isSelected ? 'ring-4 ring-white scale-110 z-10' : ''}`}
                >
                  <span className="text-xl sm:text-2xl drop-shadow-md transition-transform group-hover:scale-110">
                    {badge.icon}
                  </span>
                  <span className="text-[9px] font-black line-clamp-1 mt-0.5 leading-tight px-0.5">
                    {badge.title}
                  </span>

                  {/* Lock overlay if locked */}
                  {!isUnlocked && (
                    <div className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-[9px] text-slate-400">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {/* Sparkle if unlocked */}
                  {isUnlocked && (
                    <div className="absolute top-1 right-1 p-0.5 text-amber-300 animate-pulse">
                      <Sparkles className="w-2.5 h-2.5 fill-current" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Badge Detailed Card */}
          {selectedBadge && (
            <div className="p-4 bg-slate-950 border border-slate-700 rounded-2xl animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 ${
                    selectedBadge.isUnlocked
                      ? `bg-gradient-to-tr ${selectedBadge.unlockedColor} text-white ring-2 ring-amber-400`
                      : 'bg-slate-800 border border-slate-700 text-slate-500 opacity-60'
                  }`}
                >
                  {selectedBadge.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      {selectedBadge.categoryLabel}
                    </span>
                    {selectedBadge.isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Sbloccato
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-black uppercase flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Da Sbloccare
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-extrabold text-white mt-1">
                    {selectedBadge.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedBadge.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar in Details */}
              {selectedBadge.category !== 'mistero' && (
                <div className="w-full sm:w-60 bg-slate-900 p-3 rounded-xl border border-slate-800 shrink-0">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-bold">Progresso:</span>
                    <span className="font-mono font-black text-white">
                      {selectedBadge.currentValue.toLocaleString('it-IT')} / {selectedBadge.target.toLocaleString('it-IT')} {selectedBadge.unit}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        selectedBadge.isUnlocked
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}
                      style={{ width: `${selectedBadge.progressPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-bold mt-1">
                    {selectedBadge.progressPercent}% completato
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
