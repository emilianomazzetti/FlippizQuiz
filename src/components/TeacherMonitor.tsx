import React, { useState, useEffect } from 'react';
import {
  RoomState,
  Question,
  Player,
  AnswerSubmission,
  DrawingSubmission
} from '../types/quiz';
import { QRCodeDisplay } from './QRCodeDisplay';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Play,
  Settings,
  Users,
  Trophy,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
  PlusCircle,
  HelpCircle,
  Trash2,
  RotateCcw,
  Zap,
  Star,
  Copy,
  Check,
  Flag,
  AlertTriangle,
  StopCircle,
  UserX
} from 'lucide-react';

interface TeacherMonitorProps {
  roomState: RoomState;
  appUrl: string;
  onStartGame: () => void;
  onNextQuestion: () => void;
  onEndQuestionTimerNow: () => void;
  onTerminateGame: () => void;
  onUpdateQuestionPointsAndTime: (qId: string | 'all', points: number, timeLimit: number) => void;
  onDeleteQuestion: (qId: string) => void;
  onAddSimulatedStudents: (count?: number) => void;
  onKickStudent?: (playerId: string) => void;
  onToggleSound: () => void;
  onResetGame: () => void;
  onWipeDatabase: () => void;
}

export const TeacherMonitor: React.FC<TeacherMonitorProps> = ({
  roomState,
  appUrl,
  onStartGame,
  onNextQuestion,
  onEndQuestionTimerNow,
  onTerminateGame,
  onUpdateQuestionPointsAndTime,
  onDeleteQuestion,
  onAddSimulatedStudents,
  onKickStudent,
  onToggleSound,
  onResetGame,
  onWipeDatabase
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedConfigQId, setSelectedConfigQId] = useState<string>('all');
  const [editPoints, setEditPoints] = useState<number>(50);
  const [editTime, setEditTime] = useState<number>(25);
  const [configSavedToast, setConfigSavedToast] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(25);

  const playersList = Object.values(roomState.players || {});
  const questionsList = roomState.questions || [];
  const currentQ = questionsList[roomState.currentQuestionIndex] || questionsList[0];
  const answersList = Object.values(roomState.answersThisTurn || {});
  const drawingsList = Object.values(roomState.drawingsThisTurn || {});
  const soundEnabled = roomState.settings?.soundEnabled ?? true;

  // Sound effects on phase transitions
  useEffect(() => {
    if (roomState.phase === 'question_intro') {
      sound.playFastFinger();
    } else if (roomState.phase === 'podium') {
      sound.playFanfare();
      confetti({
        particleCount: 140,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  }, [roomState.phase]);

  const qTimeLimit = currentQ?.timeLimit || 25;
  const turnStartTime = roomState.turnStartTime;

  // Authoritative remaining time calculation: never resets on answer submit or re-renders
  const calculateRemainingSeconds = () => {
    if (turnStartTime) {
      const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
      return Math.max(0, qTimeLimit - elapsed);
    }
    return qTimeLimit;
  };

  // Active countdown timer with ticking sound on teacher screen during question_active
  useEffect(() => {
    if (roomState.phase !== 'question_active' || !currentQ) return;

    setTimeRemaining(calculateRemainingSeconds());
    let lastTicked = -1;

    const interval = setInterval(() => {
      const rem = calculateRemainingSeconds();
      setTimeRemaining(rem);

      if (rem <= 0) {
        clearInterval(interval);
        onEndQuestionTimerNow();
        return;
      }

      if (soundEnabled && rem !== lastTicked) {
        lastTicked = rem;
        if (rem <= 5) {
          sound.playUrgentTick();
        } else {
          sound.playTick();
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [roomState.phase, roomState.currentQuestionIndex, turnStartTime, qTimeLimit, soundEnabled]);

  // Auto terminate question timer when ALL connected players have answered for this turn
  useEffect(() => {
    if (
      roomState.phase === 'question_active' &&
      playersList.length > 0 &&
      currentQ?.type !== 'draw_vote' &&
      currentQ?.type !== 'word_builder' &&
      currentQ?.type !== 'longest_word' &&
      currentQ?.type !== 'mole_whack'
    ) {
      const allConnectedHaveAnswered =
        playersList.length > 0 &&
        playersList.every((p) => {
          const ans = roomState.answersThisTurn && roomState.answersThisTurn[p.id];
          return (
            ans &&
            (!roomState.turnStartTime || ans.submittedAt >= roomState.turnStartTime - 1500)
          );
        });

      if (allConnectedHaveAnswered) {
        onEndQuestionTimerNow();
      }
    }
  }, [answersList.length, playersList.length, roomState.phase, roomState.turnStartTime, currentQ?.type]);

  // Auto advance to leaderboard when all connected students have voted in draw_gallery
  useEffect(() => {
    if (roomState.phase === 'draw_gallery' && playersList.length > 0) {
      const totalStars = drawingsList.reduce((acc, d) => acc + (d.votes?.length || 0), 0);
      if (totalStars >= playersList.length && drawingsList.length > 0) {
        const timer = setTimeout(() => {
          onNextQuestion();
        }, 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [roomState.phase, drawingsList, playersList.length, onNextQuestion]);

  const renderCorrectAnswerSummary = () => {
    if (!currentQ) return null;

    if (currentQ.type === 'fill_blanks') {
      const c = currentQ.content as any;
      const originalText = c.originalText || '';
      const rawTokens = originalText.split(' ');
      const blanksList = c.blanks && c.blanks.length > 0
        ? c.blanks
        : [{ id: 'b-0', correctWord: c.blankWord || '' }];
      const availableBlanks = [...blanksList];

      return (
        <div className="p-6 bg-emerald-500/15 border-2 border-emerald-500/50 rounded-3xl text-center space-y-3">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block">
            ✓ Frase Completa con le Parole Corrette al Posto Giusto:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xl md:text-2xl font-bold text-white leading-relaxed">
            {rawTokens.map((token: string, idx: number) => {
              const cleanToken = token.replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ]/g, '').toUpperCase();
              const matchedIdx = availableBlanks.findIndex(
                (b: any) => b && b.correctWord?.trim().toUpperCase() === cleanToken
              );
              if (matchedIdx !== -1) {
                const b = availableBlanks[matchedIdx];
                availableBlanks[matchedIdx] = null;
                const trailing = token.match(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ]+$/)?.[0] || '';
                return (
                  <span key={idx} className="inline-flex items-center">
                    <span className="px-3.5 py-1 bg-emerald-500 text-slate-950 font-black rounded-xl border border-emerald-300 shadow-md">
                      {b.correctWord}
                    </span>
                    {trailing && <span className="ml-0.5">{trailing}</span>}
                  </span>
                );
              }
              return <span key={idx}>{token}</span>;
            })}
          </div>
        </div>
      );
    }

    if (currentQ.type === 'longest_word') {
      const validAnswers = answersList.filter(
        (a) => a.isCorrect && (a.answerPayload?.word || a.answerPayload?.length)
      );
      const longestAns = [...validAnswers].sort(
        (a, b) =>
          (b.answerPayload?.length || b.answerPayload?.word?.length || 0) -
          (a.answerPayload?.length || a.answerPayload?.word?.length || 0)
      )[0];

      return (
        <div className="p-6 bg-fuchsia-500/15 border-2 border-fuchsia-500/50 rounded-3xl text-center space-y-3">
          <span className="text-xs font-black text-fuchsia-400 uppercase tracking-widest block">
            🏆 La Parola Più Lunga Trovata dalla Classe (+25 Bonus Vincitore)
          </span>
          {longestAns ? (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-3xl md:text-4xl font-black text-white font-mono">
                "{longestAns.answerPayload.word}"
              </span>
              <span className="text-sm font-extrabold text-fuchsia-300">
                {longestAns.answerPayload.length} lettere • Composta da <strong className="text-white underline">{longestAns.playerName}</strong> (+25 pt Bonus!)
              </span>
            </div>
          ) : (
            <span className="text-base font-bold text-slate-400">
              Nessuna parola valida trovata in questo turno.
            </span>
          )}
        </div>
      );
    }

    let text = '';
    if (currentQ.type === 'multiple_choice') {
      const corr = (currentQ.content as any).options?.find((o: any) => o.isCorrect);
      text = corr ? corr.text : '';
    } else if (currentQ.type === 'true_false') {
      text = (currentQ.content as any).isTrueCorrect ? 'Vero' : 'Falso';
    } else if (currentQ.type === 'open_short') {
      text = (currentQ.content as any).acceptedAnswers?.join(', ');
    } else if (currentQ.type === 'word_builder') {
      const allWords = answersList.flatMap((a) => a.answerPayload?.words || []);
      const uniqueWords = Array.from(new Set(allWords));
      text = uniqueWords.length > 0
        ? `Parole trovate dalla classe (${uniqueWords.length}): ${uniqueWords.join(', ')}`
        : 'Crea quante più parole possibili (1 lettera = 1 punto)';
    } else if (currentQ.type === 'anagram') {
      text = (currentQ.content as any).phraseOrWord;
    } else if (currentQ.type === 'math_challenge') {
      text = (currentQ.content as any).generatedProblems?.map((p: any) => `${p.equation} = ${p.answer}`).join('; ');
    } else if (currentQ.type === 'word_search') {
      text = (currentQ.content as any).words?.join(', ');
    } else if (currentQ.type === 'order_cells') {
      text = (currentQ.content as any).correctOrder?.map((o: any) => o.text).join(' → ');
    } else if (currentQ.type === 'cell_identify') {
      text = (currentQ.content as any).cells?.filter((c: any) => c.isMatch).map((c: any) => c.text).join(', ');
    }

    return text ? (
      <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-center space-y-1">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Risposta Corretta</span>
        <span className="text-xl font-black text-white">{text}</span>
      </div>
    ) : null;
  };

  // Ranked leaderboard
  const sortedPlayers = [...playersList].sort((a, b) => b.score - a.score);

  // Fastest fingers
  const fastestFingers = [...answersList]
    .filter((a) => a.isCorrect)
    .sort((a, b) => a.submittedAt - b.submittedAt)
    .slice(0, 3);

  // Open config for a question
  const openQuestionConfig = (q?: Question) => {
    if (q) {
      setSelectedConfigQId(q.id);
      setEditPoints(q.points);
      setEditTime(q.timeLimit);
    } else {
      setSelectedConfigQId('all');
      setEditPoints(roomState.settings?.basePoints ?? 50);
      setEditTime(roomState.settings?.defaultTimeLimit ?? 25);
    }
    setIsConfigOpen(true);
  };

  const saveQuestionConfig = () => {
    onUpdateQuestionPointsAndTime(selectedConfigQId, editPoints, editTime);
    setConfigSavedToast(true);
    setTimeout(() => {
      setConfigSavedToast(false);
      setIsConfigOpen(false);
    }, 1200);
  };

  const isGameRunning =
    roomState.phase !== 'lobby' && roomState.phase !== 'podium';

  return (
    <div className="w-full min-h-[85vh] flex flex-col justify-between text-slate-100">
      {/* Top Classroom Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md mb-6">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-black text-sm tracking-widest text-white shadow">
            {roomState.roomCode}
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white">FlipQuiz Live Monitor</h1>
            <p className="text-xs text-slate-400">Schermo Proiezione Docente / LIM</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-indigo-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={soundEnabled ? 'Disattiva suoni' : 'Attiva suoni'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Termina Gara Button (Always available when game is running) */}
          {isGameRunning && (
            <button
              onClick={onTerminateGame}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/40 transition-transform active:scale-95 cursor-pointer animate-pulse"
              title="Termina immediatamente la gara e mostra il podio finale"
            >
              <Flag className="w-4 h-4 fill-white" />
              Termina Gara
            </button>
          )}

          {/* Configurazione Docente */}
          <button
            onClick={() => openQuestionConfig()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            Configurazione Docente
          </button>

          {/* Reset & Wipe Database Button */}
          <button
            onClick={() => setIsWipeModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-xs font-bold text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Azzera completamente i dati della stanza da Firebase e resetta la sessione"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            Azzera DB
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 rounded-xl border border-slate-800 text-xs font-bold text-slate-300">
            <Users className="w-4 h-4 text-emerald-400" />
            {playersList.length} Studenti
          </div>
        </div>
      </div>

      {/* Main Classroom Screen Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-2">
        {/* PHASE 1: LOBBY & REPOSITORY */}
        {roomState.phase === 'lobby' && (
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: QR Code & Access */}
            <div className="md:col-span-5 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30 mb-4">
                Inquadra per Partecipare
              </span>

              <QRCodeDisplay value={`${appUrl}?pin=${roomState.roomCode}&role=student`} size={220} />

              <div className="mt-5 w-full p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">Link diretto studente:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${appUrl}?pin=${roomState.roomCode}&role=student`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copiato!' : 'Copia Link'}
                </button>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Firebase RTDB Sincronizzato Live
              </div>

              <div className="mt-6 w-full p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">Codice PIN Stanza:</span>
                <span className="text-2xl font-black font-mono text-amber-300 tracking-wider">
                  {roomState.roomCode}
                </span>
              </div>

            </div>

            {/* Right Column: Question Repository & Start */}
            <div className="md:col-span-7 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Repository Domande</h2>
                  <p className="text-xs text-slate-400">
                    Domande create dagli studenti pronte per la sfida
                  </p>
                </div>

                <button
                  onClick={onStartGame}
                  disabled={roomState.questions.length === 0}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:hover:scale-100 text-white font-black text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Avvia FlipQuiz Live
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {roomState.questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 font-black text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 line-clamp-1">
                          {q.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>
                            Creatore: <strong className="text-indigo-300">{q.creatorName}</strong>
                          </span>
                          <span>•</span>
                          <span className="capitalize">{q.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{q.timeLimit}s</span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">{q.points} pt</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openQuestionConfig(q)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        title="Modifica tempi e punti"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteQuestion(q.id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Elimina dal quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {roomState.questions.length === 0 && (
                  <div className="p-12 text-center text-slate-500 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                    <p className="font-semibold text-sm">Nessuna domanda ancora nel repository.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Gli studenti possono inviare domande tramite QR code oppure usa il pulsante Simula Studenti.
                    </p>
                  </div>
                )}
              </div>

              {/* Connected Students List & Add Bot Controls */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-400 block">
                    Studenti collegati in classe ({playersList.length}):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAddSimulatedStudents(1)}
                      className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                      title="Aggiungi un bot alla volta alla classe"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>+1 Bot</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {playersList.map((p) => (
                    <div
                      key={p.id}
                      className="px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700/80 text-xs font-bold text-slate-200 flex items-center gap-2 group hover:border-slate-600 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {p.avatar} {p.name}
                      {p.isSimulated && <span className="text-[10px] text-slate-400 font-mono">(Bot)</span>}
                      {onKickStudent && (
                        <button
                          type="button"
                          onClick={() => onKickStudent(p.id)}
                          className="ml-1 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors cursor-pointer"
                          title={`Espelli ${p.name} dalla sessione (Kick out)`}
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {playersList.length === 0 && (
                    <span className="text-xs text-slate-500 italic">
                      In attesa degli studenti... (inquadra il QR code oppure clicca su "+1 Bot")
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: QUESTION INTRO SPLASH */}
        {roomState.phase === 'question_intro' && currentQ && (
          <div className="text-center space-y-6 max-w-3xl animate-scale-up">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-black uppercase tracking-widest border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
              Domanda {roomState.currentQuestionIndex + 1} di {roomState.questions.length}
            </div>

            <div className="p-10 bg-slate-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl space-y-4">
              <p className="text-sm uppercase font-bold tracking-widest text-slate-400">
                Questa domanda è stata creata dal vostro compagno:
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-amber-300 tracking-wide">
                {currentQ.creatorName}
              </h2>
              <div className="pt-4 text-slate-300 text-lg font-semibold">
                Preparatevi sui vostri dispositivi! Il tempo parte tra pochissimo...
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: ACTIVE LIVE QUESTION WITH COUNTDOWN & TICKING */}
        {roomState.phase === 'question_active' && currentQ && (
          <div className="w-full max-w-4xl flex flex-col items-center gap-6 animate-fade-in">
            {/* Header with Creator, Countdown Timer, and Timing */}
            <div className="w-full flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Autore:</span>
                <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-xs">
                  {currentQ.creatorName}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 capitalize">
                  {currentQ.type.replace('_', ' ')}
                </span>
              </div>

              {/* GIANT TICKING TIMER DISPLAY ON TEACHER SCREEN */}
              <div
                className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-mono text-2xl font-black shadow-xl transition-all ${
                  timeRemaining <= 5
                    ? 'bg-rose-500/25 text-rose-400 border-2 border-rose-500 animate-pulse ring-4 ring-rose-500/30'
                    : 'bg-indigo-500/20 text-amber-300 border-2 border-indigo-500/40'
                }`}
              >
                <Clock className={`w-6 h-6 ${timeRemaining <= 5 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
                <span>{timeRemaining}s</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {answersList.length} risposte registrate
                </div>
                <button
                  onClick={onEndQuestionTimerNow}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Termina Tempo Ora
                </button>
              </div>
            </div>

            {/* Giant Question Display */}
            <div className="w-full bg-slate-900 border-2 border-slate-700/80 p-8 rounded-3xl shadow-2xl text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                {currentQ.title}
              </h2>

              {currentQ.imageUrl && (
                <div className="max-h-72 rounded-2xl overflow-hidden border border-slate-800 inline-block bg-slate-950">
                  <img
                    src={currentQ.imageUrl}
                    alt="Domanda"
                    className="max-h-72 w-auto object-contain mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Live student response indicators */}
            <div className="w-full bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 block mb-2 text-center uppercase tracking-wider">
                Risposte in tempo reale dalla classe ({answersList.length} su {playersList.length}):
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {playersList.map((p) => {
                  const hasAnswered = !!(roomState.answersThisTurn && roomState.answersThisTurn[p.id]);
                  return (
                    <div
                      key={p.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        hasAnswered
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm scale-102'
                          : 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span>{p.name}</span>
                      {hasAnswered ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                      )}
                      {onKickStudent && (
                        <button
                          type="button"
                          onClick={() => onKickStudent(p.id)}
                          className="ml-0.5 p-0.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors cursor-pointer"
                          title={`Espelli ${p.name}`}
                        >
                          <UserX className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3.5: DRAWING GALLERY & PEER STAR VOTING (SFIDA DI DISEGNO) */}
        {roomState.phase === 'draw_gallery' && currentQ && (
          <div className="w-full max-w-5xl flex flex-col gap-6 animate-fade-in">
            <div className="text-center bg-slate-900 border-2 border-amber-500/50 p-6 rounded-3xl shadow-2xl space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <Star className="w-7 h-7 fill-amber-400 stroke-amber-400" />
                <h2 className="text-3xl font-black text-white">
                  Galleria d'Arte della Classe: Votazione Stelle ⭐
                </h2>
                <Star className="w-7 h-7 fill-amber-400 stroke-amber-400" />
              </div>
              <p className="text-base text-amber-300 font-extrabold">
                "{(currentQ.content as any)?.prompt || currentQ.title}"
              </p>
              <p className="text-xs text-slate-300">
                Gli studenti stanno votando sui loro smartphone per il disegno che preferiscono (+25 pt all'artista per ogni stella)!
              </p>
            </div>

            {(() => {
              const maxStars = Math.max(...drawingsList.map((d) => d.votes?.length || 0), 0);
              const totalVotes = drawingsList.reduce((acc, d) => acc + (d.votes?.length || 0), 0);
              const allHaveVoted = playersList.length > 0 && totalVotes >= playersList.length;

              return (
                <>
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
                    <span className="text-slate-400">
                      Voti espressi dalla classe: <strong className="text-amber-400 font-mono text-sm">{totalVotes}</strong> su {playersList.length}
                    </span>
                    {allHaveVoted ? (
                      <span className="text-emerald-400 font-black flex items-center gap-1.5 animate-pulse">
                        <CheckCircle className="w-4 h-4" /> Tutti hanno votato! Passaggio alla classifica...
                      </span>
                    ) : (
                      <span className="text-slate-400">In attesa dei voti...</span>
                    )}
                  </div>

                  {drawingsList.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
                      Nessun disegno registrato per questa sfida.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {drawingsList.map((item) => {
                        const starCount = item.votes?.length || 0;
                        const isLeading = maxStars > 0 && starCount === maxStars;

                        return (
                          <div
                            key={item.playerId}
                            className={`rounded-3xl overflow-hidden border-2 bg-slate-850 shadow-2xl flex flex-col transition-all relative ${
                              isLeading
                                ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-amber-500/20'
                                : 'border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {isLeading && (
                              <div className="absolute top-3 right-3 z-10 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-lg flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5" />
                                1° Posto (+{starCount * 25} pt)
                              </div>
                            )}

                            <div className="aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                              <img
                                src={item.dataUrl}
                                alt={`Disegno di ${item.playerName}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="p-4 bg-slate-900 flex items-center justify-between border-t border-slate-800">
                              <div>
                                <h4 className="font-black text-white text-base">{item.playerName}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  <span className="text-xs font-black text-amber-300">
                                    {starCount} {starCount === 1 ? 'stella' : 'stelle'} (+{starCount * 25} pt)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            <div className="flex justify-center mt-4">
              <button
                onClick={onNextQuestion}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base shadow-2xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                Vai alla Classifica Live
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 4: QUESTION RESULTS & FASTEST FINGERS PODIUM */}
        {roomState.phase === 'question_results' && currentQ && (
          <div className="w-full max-w-4xl flex flex-col gap-8 animate-fade-in">
            <div className="text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                Turno Concluso
              </span>
              <h2 className="text-3xl font-black text-white">Risultati della Domanda</h2>
              <p className="text-xs text-slate-400">
                Domanda di <strong className="text-amber-300">{currentQ.creatorName}</strong>
              </p>
            </div>

            {/* Correct Answer & User Submissions Sharing */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
              {renderCorrectAnswerSummary()}

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 text-left">
                  Risposte di tutti i partecipanti ({answersList.length} su {playersList.length}):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {playersList.map((player) => {
                    const sub = roomState.answersThisTurn[player.id];
                    const isSuccess = !!(sub && sub.isCorrect);

                    // Determine detailed answer text for what the student answered
                    let answerDetail = '';
                    if (!sub) {
                      answerDetail = 'Nessuna risposta data (Tempo scaduto)';
                    } else if (currentQ.type === 'fill_blanks') {
                      const userAnswers =
                        sub.answerPayload?.userAnswers ||
                        (sub.answerPayload?.selectedWords
                          ? Object.values(sub.answerPayload.selectedWords)
                          : null);
                      answerDetail =
                        userAnswers && userAnswers.length > 0
                          ? `Parole scelte: [${userAnswers.join(', ')}]`
                          : sub.answerPayload?.summary || (sub.isCorrect ? 'Completato' : 'Errato');
                    } else if (currentQ.type === 'longest_word') {
                      answerDetail = sub.answerPayload?.word
                        ? `Parola: "${sub.answerPayload.word}" (${sub.answerPayload.length} lettere)`
                        : 'Nessuna parola valida trovata';
                    } else if (currentQ.type === 'word_builder') {
                      const words = sub.answerPayload?.words || [];
                      const totalLetters = sub.answerPayload?.totalLetters || 0;
                      answerDetail =
                        words.length > 0
                          ? `Parole (${words.length}): [${words.join(', ')}] • ${totalLetters} lettere`
                          : 'Nessuna parola composta';
                    } else if (currentQ.type === 'mole_whack') {
                      answerDetail = `Talpe colpite: ${sub.answerPayload?.correctCount ?? 0} prese, ${sub.answerPayload?.errorCount ?? 0} errori`;
                    } else if (currentQ.type === 'multiple_choice') {
                      answerDetail = sub.answerPayload?.text ? `Opzione: "${sub.answerPayload.text}"` : (sub.isCorrect ? 'Opzione corretta' : 'Opzione errata');
                    } else if (currentQ.type === 'true_false') {
                      answerDetail = sub.answerPayload?.value !== undefined ? `Scelto: ${sub.answerPayload.value ? 'VERO' : 'FALSO'}` : (sub.isCorrect ? 'Corretta' : 'Errata');
                    } else if (currentQ.type === 'open_short') {
                      answerDetail = sub.answerPayload?.text ? `Risposta: "${sub.answerPayload.text}"` : (sub.isCorrect ? 'Corretta' : 'Errata');
                    } else if (sub.answerPayload?.summary) {
                      answerDetail = sub.answerPayload.summary;
                    } else {
                      answerDetail = sub.isCorrect ? 'Risposta corretta' : 'Risposta errata';
                    }

                    return (
                      <div
                        key={player.id}
                        className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 transition-all shadow-sm ${
                          isSuccess
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                            : 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{player.avatar}</span>
                            <span className="font-extrabold text-sm text-white">{player.name}</span>
                            {player.isSimulated && (
                              <span className="text-[10px] text-slate-400 font-mono">(Bot)</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isSuccess ? (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Corretta ({sub.timeSpent?.toFixed(1) || '0'}s)
                              </span>
                            ) : (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                {sub ? `Errata (${sub.timeSpent?.toFixed(1) || '0'}s)` : 'Non ha risposto'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs font-semibold pl-6 opacity-95 break-words">
                          {answerDetail}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fastest Fingers 3 Bonus Podium */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
                <h3 className="text-xl font-black text-white uppercase tracking-wider">
                  I 3 Diti Più Veloci della Classe
                </h3>
                <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
              </div>

              {fastestFingers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fastestFingers.map((sub, idx) => {
                    const bonus = idx === 0 ? '+20 Bonus' : idx === 1 ? '+15 Bonus' : '+10 Bonus';
                    const medal = idx === 0 ? '🥇 1° Posto' : idx === 1 ? '🥈 2° Posto' : '🥉 3° Posto';
                    const borderCol =
                      idx === 0
                        ? 'border-amber-400 bg-amber-500/10'
                        : idx === 1
                        ? 'border-slate-300 bg-slate-300/10'
                        : 'border-amber-700 bg-amber-700/10';

                    return (
                      <div
                        key={sub.playerId}
                        className={`p-5 rounded-2xl border-2 flex flex-col items-center text-center shadow-lg ${borderCol}`}
                      >
                        <span className="text-sm font-black text-slate-300 mb-1">{medal}</span>
                        <h4 className="text-lg font-black text-white">{sub.playerName}</h4>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{sub.timeSpent.toFixed(2)}s</span>
                        </div>
                        <span className="mt-2 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black">
                          {bonus}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-slate-500 py-6">
                  Nessuna risposta corretta registrata per questa domanda.
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={onNextQuestion}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-base shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                Vai alla Classifica Live
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 5: LEADERBOARD */}
        {roomState.phase === 'leaderboard' && (
          <div className="w-full max-w-3xl flex flex-col gap-6 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Trophy className="w-6 h-6 fill-amber-400" />
                <h2 className="text-3xl font-black text-white">Classifica Live</h2>
              </div>
              <p className="text-xs text-slate-400">
                Punteggi dopo la domanda {roomState.currentQuestionIndex + 1}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-3 max-h-[440px] overflow-y-auto">
              {sortedPlayers.map((player, idx) => {
                return (
                  <div
                    key={player.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      idx === 0
                        ? 'border-amber-400 bg-amber-500/15 shadow-lg'
                        : idx === 1
                        ? 'border-slate-400 bg-slate-400/10'
                        : idx === 2
                        ? 'border-amber-700 bg-amber-700/10'
                        : 'border-slate-800 bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-base text-white">
                          {player.avatar} {player.name}
                        </h4>
                        {player.streak > 1 && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-extrabold">
                            <Flame className="w-3.5 h-3.5 fill-amber-400" />
                            {player.streak} di fila!
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-white font-mono">
                        {player.score}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">pt</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                onClick={onNextQuestion}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                {roomState.currentQuestionIndex + 1 < roomState.questions.length
                  ? 'Prossima Domanda'
                  : 'Podio Finale!'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 6: FINAL PODIUM */}
        {roomState.phase === 'podium' && (
          <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-fade-in text-center">
            <div className="space-y-2">
              <span className="px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 font-black text-xs uppercase tracking-widest border border-amber-400/30">
                FlipQuiz Completato!
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white">Podio della Classe</h2>
              <p className="text-sm text-slate-400">
                Complimenti a tutti gli studenti per le fantastiche domande create e risolte!
              </p>
            </div>

            {/* Podium Visual Stand */}
            <div className="flex items-end justify-center gap-4 w-full max-w-xl my-6">
              {/* 2nd Place */}
              {sortedPlayers[1] && (
                <div className="flex-1 flex flex-col items-center animate-slide-up">
                  <span className="text-3xl mb-2">🥈</span>
                  <h4 className="font-extrabold text-white text-base line-clamp-1">
                    {sortedPlayers[1].avatar} {sortedPlayers[1].name}
                  </h4>
                  <span className="text-xs text-slate-400 font-bold mb-2">
                    {sortedPlayers[1].score} pt
                  </span>
                  <div className="w-full h-36 bg-gradient-to-t from-slate-700 to-slate-600 rounded-t-3xl flex items-center justify-center font-black text-3xl text-white shadow-xl">
                    2
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {sortedPlayers[0] && (
                <div className="flex-1 flex flex-col items-center animate-scale-up">
                  <span className="text-4xl mb-2">👑 🥇</span>
                  <h4 className="font-black text-amber-300 text-lg line-clamp-1">
                    {sortedPlayers[0].avatar} {sortedPlayers[0].name}
                  </h4>
                  <span className="text-sm text-amber-400 font-extrabold mb-2">
                    {sortedPlayers[0].score} pt
                  </span>
                  <div className="w-full h-48 bg-gradient-to-t from-amber-600 to-yellow-500 rounded-t-3xl flex items-center justify-center font-black text-4xl text-slate-950 shadow-2xl ring-4 ring-amber-300">
                    1
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {sortedPlayers[2] && (
                <div className="flex-1 flex flex-col items-center animate-slide-up">
                  <span className="text-3xl mb-2">🥉</span>
                  <h4 className="font-extrabold text-white text-base line-clamp-1">
                    {sortedPlayers[2].avatar} {sortedPlayers[2].name}
                  </h4>
                  <span className="text-xs text-slate-400 font-bold mb-2">
                    {sortedPlayers[2].score} pt
                  </span>
                  <div className="w-full h-28 bg-gradient-to-t from-amber-900 to-amber-800 rounded-t-3xl flex items-center justify-center font-black text-2xl text-amber-200 shadow-xl">
                    3
                  </div>
                </div>
              )}
            </div>

            {/* Other Participants Below Podium */}
            {sortedPlayers.length > 3 && (
              <div className="w-full max-w-xl bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">
                  Altri Partecipanti in Classifica
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sortedPlayers.slice(3).map((player, idx) => (
                    <div
                      key={player.id}
                      className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center">
                          {idx + 4}°
                        </span>
                        <span className="font-bold text-sm text-white">
                          {player.avatar} {player.name}
                        </span>
                      </div>
                      <span className="font-black text-amber-300 text-sm">
                        {player.score} pt
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onResetGame}
              className="px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Torna alla Lobby per una Nuova Sessione
            </button>
          </div>
        )}
      </div>

      {/* Teacher Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Configurazione Docente</h3>
                  <p className="text-xs text-slate-400">Modifica punteggi e tempi delle domande</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
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
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {pts} pt
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tempo risposta per la domanda:
                </label>
                <div className="flex gap-2">
                  {[10, 25, 40, 60].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditTime(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                        editTime === t
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {t} secondi
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>
                  <strong>Regole Punteggio:</strong>
                </p>
                <p>• Risposta corretta: {editPoints} punti (o valore impostato)</p>
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

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Chiudi
              </button>
              <button
                type="button"
                onClick={saveQuestionConfig}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Wipe Database */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-rose-500/60 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Azzera Database Firebase</h3>
                <p className="text-xs text-rose-300">Azione irreversibile</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sei sicuro di voler <strong>eliminare tutti i dati della stanza {roomState.roomCode}</strong> dal Database di Firebase?
              Verranno azzerati punteggi, risposte, disegni e partecipanti connessi, ripristinando la stanza pulita alla lobby iniziale.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  onWipeDatabase();
                  setIsWipeModalOpen(false);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Sì, Cancella Dati e Resetta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
