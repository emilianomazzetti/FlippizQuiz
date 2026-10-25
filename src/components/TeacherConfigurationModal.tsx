import React, { useState, useEffect } from 'react';
import { Settings, Check, Music, Pause, Play, Volume2 } from 'lucide-react';
import { RoomState } from '../types/quiz';
import { sound } from '../utils/audio';

interface TeacherConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomState: RoomState;
  onUpdateQuestionPointsAndTime: (qId: string | 'all', points: number, timeLimit: number) => void;
  initialSelectedQId?: string;
}

export const TeacherConfigurationModal: React.FC<TeacherConfigurationModalProps> = ({
  isOpen,
  onClose,
  roomState,
  onUpdateQuestionPointsAndTime,
  initialSelectedQId = 'all'
}) => {
  const [selectedConfigQId, setSelectedConfigQId] = useState<string>(initialSelectedQId);
  const [editPoints, setEditPoints] = useState<number>(50);
  const [editTime, setEditTime] = useState<number>(25);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Background Music state
  const [selectedMusicTheme, setSelectedMusicTheme] = useState<string>(() => sound.getMusicTheme() || 'gameshow');
  const [musicVolume, setMusicVolume] = useState<number>(() => Math.round(sound.getMusicVolume() * 100));
  const [isMusicPreviewPlaying, setIsMusicPreviewPlaying] = useState<boolean>(false);
  const [autoPlayMusicDuringQuestions, setAutoPlayMusicDuringQuestions] = useState<boolean>(true);

  // Initialize or reset fields when opened or question changes
  useEffect(() => {
    if (isOpen) {
      const targetId = initialSelectedQId || 'all';
      setSelectedConfigQId(targetId);
      if (targetId === 'all') {
        setEditPoints(roomState.settings?.basePoints ?? 50);
        setEditTime(roomState.settings?.defaultTimeLimit ?? 25);
      } else {
        const found = roomState.questions.find((q) => q.id === targetId);
        if (found) {
          setEditPoints(found.points);
          setEditTime(found.timeLimit);
        }
      }
      setSelectedMusicTheme(sound.getMusicTheme() || 'gameshow');
      setMusicVolume(Math.round(sound.getMusicVolume() * 100));
      setConfigSavedToast(false);
    } else {
      if (isMusicPreviewPlaying) {
        sound.stopBackgroundMusic();
        setIsMusicPreviewPlaying(false);
      }
    }
  }, [isOpen, initialSelectedQId, roomState.settings?.basePoints, roomState.settings?.defaultTimeLimit, roomState.questions]);

  if (!isOpen) return null;

  const toggleMusicPreview = () => {
    if (isMusicPreviewPlaying) {
      sound.stopBackgroundMusic();
      setIsMusicPreviewPlaying(false);
    } else {
      if (selectedMusicTheme === 'none') return;
      sound.startBackgroundMusic(selectedMusicTheme, musicVolume / 100);
      setIsMusicPreviewPlaying(true);
    }
  };

  const handleSave = () => {
    onUpdateQuestionPointsAndTime(selectedConfigQId, editPoints, editTime);
    sound.setMusicTheme(selectedMusicTheme);
    sound.setMusicVolume(musicVolume / 100);

    setConfigSavedToast(true);
    sound.playCorrect();

    setTimeout(() => {
      setConfigSavedToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Pinned Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Configurazione Docente</h3>
              <p className="text-xs text-slate-400">Punti, tempi delle domande e colonna sonora</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Chiudi"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-4 overflow-y-auto pr-2 my-3 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
              {/* Question Target Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Applica modifiche a:
                </label>
                <select
                  value={selectedConfigQId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedConfigQId(val);
                    if (val === 'all') {
                      setEditPoints(roomState.settings?.basePoints ?? 50);
                      setEditTime(roomState.settings?.defaultTimeLimit ?? 25);
                    } else {
                      const found = roomState.questions.find((q) => q.id === val);
                      if (found) {
                        setEditPoints(found.points);
                        setEditTime(found.timeLimit);
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="all">⚡ Tutte le domande del quiz (Configurazione Globale)</option>
                  {roomState.questions.map((q, idx) => (
                    <option key={q.id} value={q.id}>
                      Domanda {idx + 1}: {q.title} ({q.creatorName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Points selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Punti base per risposta esatta:
                </label>
                <div className="flex gap-2">
                  {[20, 50, 100].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setEditPoints(pts)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                        editPoints === pts
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {pts} pt
                    </button>
                  ))}
                </div>
              </div>

              {/* Time limit selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Tempo risposta per la domanda:
                  </label>
                  <span className="text-xs font-black text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {editTime >= 60
                      ? `${Math.floor(editTime / 60)}m ${editTime % 60 ? (editTime % 60) + 's' : ''}`.trim()
                      : `${editTime}s`}{' '}
                    ({editTime} secondi)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[10, 20, 30, 45, 60, 90, 120, 180, 300].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditTime(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                        editTime === t
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {t >= 60 ? `${t / 60}m` : `${t}s`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTime((t) => Math.max(10, t - 10))}
                    disabled={editTime <= 10}
                    className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-xs font-bold text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    -10s
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTime((t) => Math.min(300, t + 10))}
                    disabled={editTime >= 300}
                    className="flex-1 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-black cursor-pointer"
                  >
                    +10 secondi (max 5m)
                  </button>
                </div>
              </div>

              {/* Sezione Musica di Sottofondo Quiz */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Musica di Sottofondo Durante il Quiz
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleMusicPreview}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isMusicPreviewPlaying ? (
                      <>
                        <Pause className="w-3 h-3 text-amber-400" />
                        Ferma Anteprima
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                        Ascolta Tema
                      </>
                    )}
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'gameshow', name: '📺 Quiz Show Groovy', desc: 'Incalzante & Suspense' },
                    { id: 'arcade', name: '🎮 Arcade 8-Bit Retro', desc: 'Chiptune energico' },
                    { id: 'lofi', name: '☕ Chill Classroom', desc: 'Calmo & Concentrazione' },
                    { id: 'epic', name: '🎺 Epico Avventura', desc: 'Trionfale & Fanfare' },
                    { id: 'none', name: '🔇 Nessuna Musica', desc: 'Silenzioso' }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setSelectedMusicTheme(theme.id);
                        sound.setMusicTheme(theme.id);
                        if (isMusicPreviewPlaying && theme.id !== 'none') {
                          sound.startBackgroundMusic(theme.id, musicVolume / 100);
                        } else if (theme.id === 'none') {
                          sound.stopBackgroundMusic();
                          setIsMusicPreviewPlaying(false);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedMusicTheme === theme.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-white ring-2 ring-indigo-400/40 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-750'
                      }`}
                    >
                      <span className="block font-bold text-xs text-slate-200">{theme.name}</span>
                      <span className="text-[10px] text-slate-400">{theme.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Volume & Auto-Play */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400 font-bold">Volume Musica:</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={musicVolume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMusicVolume(val);
                        sound.setMusicVolume(val / 100);
                      }}
                      className="w-24 accent-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-indigo-300 w-8">{musicVolume}%</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-bold">
                    <input
                      type="checkbox"
                      checked={autoPlayMusicDuringQuestions}
                      onChange={(e) => setAutoPlayMusicDuringQuestions(e.target.checked)}
                      className="rounded accent-indigo-500"
                    />
                    <span>Suona durante le domande</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>
                  <strong>Regole Punteggio:</strong>
                </p>
                <p>• Risposta corretta: {editPoints} punti (o valore impostato)</p>
                <p>• Crucipuzzle: 5 punti per ogni parola trovata (+ superamento se trovi almeno 1 parola)</p>
                <p>• Bonus 3 diti più veloci: 1° (+20 pt), 2° (+15 pt), 3° (+10 pt)</p>
                <p>• Sfida Disegno: +25 pt per ogni stella ⭐ ricevuta dai compagni!</p>
              </div>

              {configSavedToast && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-bounce">
                  <Check className="w-4 h-4 stroke-[3]" />
                  Modifiche salvate con successo!
                </div>
              )}
        </div>

        {/* Pinned Footer with Save Button */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
          >
            Chiudi
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            Salva Modifiche
          </button>
        </div>
      </div>
    </div>
  );
};
