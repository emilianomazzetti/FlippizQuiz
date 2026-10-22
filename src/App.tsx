import React, { useState, useEffect, useRef } from 'react';
import {
  RoomState,
  Question,
  Player,
  AnswerSubmission,
  DrawingSubmission,
  GamePhase
} from './types/quiz';
import { INITIAL_QUESTIONS } from './data/initialQuestions';
import { TeacherMonitor } from './components/TeacherMonitor';
import { StudentDevice } from './components/StudentDevice';
import { ArchitectureGuideModal } from './components/ArchitectureGuideModal';
import { FirebaseDiagnosticModal } from './components/FirebaseDiagnosticModal';
import { sound } from './utils/audio';
import confetti from 'canvas-confetti';
import { api } from './services/api';
import { firebaseSync } from './services/firebaseSync';
import {
  Monitor,
  Smartphone,
  BookOpen,
  Sparkles,
  HelpCircle,
  Users,
  Play,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function getAppBaseUrl(): string {
  if (typeof window === 'undefined') return 'https://flipquiz.app/';
  let path = window.location.pathname;
  if (path.endsWith('.html')) {
    path = path.substring(0, path.lastIndexOf('/') + 1);
  } else if (!path.endsWith('/')) {
    path = path + '/';
  }
  return `${window.location.origin}${path}`;
}

export default function App() {
  // View mode: Teacher Monitor (LIM) vs Student Mobile
  const [viewRole, setViewRole] = useState<'teacher' | 'student'>('teacher');
  const [isLockedStudent, setIsLockedStudent] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState<boolean>(false);

  // App Base URL for QR codes that preserves repository path (e.g. /FlipQuix/)
  const appUrl = getAppBaseUrl();

  // Current student session (if playing on student view)
  const [myPlayerId, setMyPlayerId] = useState<string>('player-me');
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [wasKicked, setWasKicked] = useState<boolean>(false);
  const myPlayerRef = useRef<Player | null>(null);

  useEffect(() => {
    myPlayerRef.current = myPlayer;
  }, [myPlayer]);

  // Room PIN from URL if scanned via QR code
  const [initialPin, setInitialPin] = useState<string>('FLIP-101');

  // Core Room State
  const [roomState, setRoomState] = useState<RoomState>({
    roomCode: 'FLIP-101',
    roomName: 'Classe 3B • Scienze e Storia',
    phase: 'lobby',
    currentQuestionIndex: 0,
    questions: INITIAL_QUESTIONS,
    players: {},
    answersThisTurn: {},
    drawingsThisTurn: {},
    turnStartTime: 0,
    turnDuration: 25,
    settings: {
      basePoints: 50,
      fastFingerBonus1: 20,
      fastFingerBonus2: 15,
      fastFingerBonus3: 10,
      defaultTimeLimit: 25,
      soundEnabled: true
    }
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botAnswerTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Check URL query parameters (e.g. ?pin=FLIP-101&role=student from QR code)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const pinParam = searchParams.get('pin');
      const roleParam = searchParams.get('role');

      // Users accessing through QR code / student link can NEVER enter Teacher view
      if (pinParam || roleParam === 'student') {
        setIsLockedStudent(true);
        setViewRole('student');
        if (pinParam) {
          setInitialPin(pinParam.toUpperCase());
        }
      }
    } catch (e) {
      console.warn('URL parsing note:', e);
    }
  }, []);

  // Real-time synchronization subscription on mount
  useEffect(() => {
    // 1. Restore local player if saved
    try {
      const saved = localStorage.getItem('flipquiz_my_player');
      if (saved) {
        const parsed: Player = JSON.parse(saved);
        setMyPlayer(parsed);
        setMyPlayerId(parsed.id);
        // Ensure player is represented in local roomState
        setRoomState((prev) => ({
          ...prev,
          players: {
            ...prev.players,
            [parsed.id]: parsed
          }
        }));
      }

      // Restore custom teacher configuration if saved
      const savedConfig = localStorage.getItem('flipquiz_custom_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig && Array.isArray(parsedConfig.questions)) {
          setRoomState((prev) => ({
            ...prev,
            questions: parsedConfig.questions,
            settings: parsedConfig.settings ? { ...prev.settings, ...parsedConfig.settings } : prev.settings
          }));
        }
      }
    } catch (e) {
      console.warn('Could not read saved player/config from storage:', e);
    }

    // 2. Listen to Firebase connection state
    const unsubConn = firebaseSync.listenToConnection((online) => {
      setIsFirebaseOnline(online);
    });

    // 3. Initialize room in Firebase RTDB and start listening
    firebaseSync.initRoom(roomState).then((state) => {
      setRoomState(state);
    });

    const unsubFirebase = firebaseSync.listenToRoom(roomState.roomCode, (firebaseState) => {
      setRoomState((prev) => {
        const curPlayer = myPlayerRef.current;
        // Detect database wipe or full reset
        const isWiped =
          (firebaseState.resetEpoch && firebaseState.resetEpoch !== prev.resetEpoch) ||
          (firebaseState.phase === 'lobby' && Object.keys(firebaseState.players || {}).length === 0 && Object.keys(prev.players || {}).length > 0);

        if (isWiped) {
          try {
            localStorage.removeItem('flipquiz_my_player');
            localStorage.removeItem('flipquiz_custom_config');
          } catch (e) {}
          if (curPlayer) {
            setWasKicked(true);
          }
          setMyPlayer(null);
          setMyPlayerId('');
          return {
            ...firebaseState,
            players: {},
            answersThisTurn: {},
            drawingsThisTurn: {}
          };
        }

        let mergedPlayers = { ...(firebaseState.players || {}) };
        // If local student was in room but removed by teacher (kick out)
        if (curPlayer && !mergedPlayers[curPlayer.id]) {
          if (prev.players && prev.players[curPlayer.id]) {
            try {
              localStorage.removeItem('flipquiz_my_player');
            } catch (e) {}
            setWasKicked(true);
            setMyPlayer(null);
            setMyPlayerId('');
            return {
              ...firebaseState,
              answersThisTurn: firebaseState.answersThisTurn || {},
              drawingsThisTurn: firebaseState.drawingsThisTurn || {}
            };
          }
          mergedPlayers[curPlayer.id] = curPlayer;
        }

        return {
          ...firebaseState,
          players: mergedPlayers,
          answersThisTurn: firebaseState.answersThisTurn || {},
          drawingsThisTurn: firebaseState.drawingsThisTurn || {}
        };
      });
    }, roomState);

    // 4. Same-tab BroadcastChannel sync for multi-tab
    const unsubApi = api.subscribeToRoom((serverState) => {
      setRoomState(serverState);
    });

    return () => {
      unsubConn();
      unsubFirebase();
      unsubApi();
    };
  }, []);

  // Listen for student closing tab / browser to remove them from active players
  useEffect(() => {
    if (!myPlayerId || !roomState.roomCode) return;

    const handleDisconnect = () => {
      firebaseSync.removePlayer(roomState.roomCode, myPlayerId);
      api.leave(myPlayerId);
    };

    window.addEventListener('beforeunload', handleDisconnect);
    window.addEventListener('pagehide', handleDisconnect);

    return () => {
      window.removeEventListener('beforeunload', handleDisconnect);
      window.removeEventListener('pagehide', handleDisconnect);
    };
  }, [myPlayerId, roomState.roomCode]);

  // Keep myPlayer score and streak in sync with roomState.players
  const activeStudent: Player | null =
    myPlayer && roomState.players && roomState.players[myPlayer.id]
      ? roomState.players[myPlayer.id]
      : myPlayer;

  // Automatically transition from question_intro (3 seconds) to question_active
  useEffect(() => {
    if (roomState.phase === 'question_intro') {
      const introTimer = setTimeout(() => {
        const currentQ = roomState.questions[roomState.currentQuestionIndex];
        const duration = currentQ ? currentQ.timeLimit : 25;

        setRoomState((prev) => {
          const updated: RoomState = {
            ...prev,
            phase: 'question_active',
            turnStartTime: Date.now(),
            turnDuration: duration,
            answersThisTurn: {}
          };
          api.broadcastLocal(updated);
          return updated;
        });

        // Sync with Firebase
        firebaseSync.setPhase(
          roomState.roomCode,
          'question_active',
          roomState.currentQuestionIndex,
          duration
        );
      }, 3200);

      return () => clearTimeout(introTimer);
    }
  }, [roomState.phase, roomState.currentQuestionIndex, roomState.questions, roomState.roomCode]);

  // Handle countdown & simulated bot answers during question_active (only executed on Teacher screen)
  useEffect(() => {
    if (roomState.phase === 'question_active') {
      const currentQ = roomState.questions[roomState.currentQuestionIndex];
      const duration = (currentQ?.timeLimit || 25) * 1000;

      // Simulate bot answers only if on teacher screen
      clearBotTimeouts();
      if (viewRole === 'teacher') {
        const simulatedPlayers = Object.values(roomState.players || {}).filter((p) => p.isSimulated);

        simulatedPlayers.forEach((bot) => {
          const randomDelay = Math.random() * (duration * 0.55) + 1200;
          const willBeCorrect = Math.random() > 0.3; // 70% chance correct

          const timeout = setTimeout(() => {
            registerAnswer(bot.id, bot.name, willBeCorrect, randomDelay / 1000);
          }, randomDelay);

          botAnswerTimeouts.current.push(timeout);
        });
      }

      // End of question timer
      timerRef.current = setTimeout(() => {
        handleEndQuestionTimer();
      }, duration);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        clearBotTimeouts();
      };
    }
  }, [roomState.phase, roomState.currentQuestionIndex, viewRole]);

  const clearBotTimeouts = () => {
    botAnswerTimeouts.current.forEach((t) => clearTimeout(t));
    botAnswerTimeouts.current = [];
  };

  const handleEndQuestionTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearBotTimeouts();

    const currentQ = roomState.questions[roomState.currentQuestionIndex];
    const nextPhase: GamePhase =
      currentQ && currentQ.type === 'draw_vote' ? 'draw_gallery' : 'question_results';

    setRoomState((prev) => {
      let finalAnswers = { ...prev.answersThisTurn };
      let finalPlayers = { ...prev.players };

      // For "La Parola Più Lunga": award +25 points to whoever created the longest word
      if (currentQ && currentQ.type === 'longest_word') {
        const answersList = Object.values(finalAnswers).filter(
          (a) => a.isCorrect && (a.answerPayload?.length || a.answerPayload?.word?.length)
        );

        if (answersList.length > 0) {
          const maxLen = Math.max(
            ...answersList.map((a) => a.answerPayload?.length || a.answerPayload?.word?.length || 0)
          );

          if (maxLen > 0) {
            answersList.forEach((a) => {
              const aLen = a.answerPayload?.length || a.answerPayload?.word?.length || 0;
              if (aLen === maxLen) {
                const sub = finalAnswers[a.playerId];
                if (sub && !sub.answerPayload?.hasWonLongestBonus) {
                  finalAnswers[a.playerId] = {
                    ...sub,
                    pointsAwarded: sub.pointsAwarded + 25,
                    answerPayload: {
                      ...sub.answerPayload,
                      hasWonLongestBonus: true,
                      bonusAwarded: 25
                    }
                  };

                  const pl = finalPlayers[a.playerId];
                  if (pl) {
                    finalPlayers[a.playerId] = {
                      ...pl,
                      score: pl.score + 25
                    };
                  }
                }
              }
            });
          }
        }
      }

      const updated: RoomState = {
        ...prev,
        answersThisTurn: finalAnswers,
        players: finalPlayers,
        phase: nextPhase
      };
      api.broadcastLocal(updated);
      return updated;
    });

    firebaseSync.setPhase(roomState.roomCode, nextPhase);
    api.endTimerNow();
  };

  // Register an answer submission (from real student or bot)
  const registerAnswer = (
    playerId: string,
    playerName: string,
    isCorrect: boolean,
    timeSpent: number,
    payload?: any
  ) => {
    setRoomState((prev) => {
      const currentQ = prev.questions[prev.currentQuestionIndex];
      const isWordBuilder = currentQ && currentQ.type === 'word_builder';
      const isLongestWord = currentQ && currentQ.type === 'longest_word';
      const isMoleWhack = currentQ && currentQ.type === 'mole_whack';
      const isContinuous = isWordBuilder || isLongestWord || isMoleWhack;
      const existingSubmission = prev.answersThisTurn[playerId];

      // For standard questions, don't allow duplicate submissions.
      // For continuous games, allow live updates as player progresses.
      if (existingSubmission && !isContinuous) return prev;

      const basePoints = currentQ ? currentQ.points : 50;

      // Count previous correct answers to calculate speed rank (1st, 2nd, 3rd)
      const prevCorrectCount = Object.values(prev.answersThisTurn).filter(
        (a) => a.isCorrect && a.playerId !== playerId
      ).length;

      let speedRank: number | undefined = undefined;
      let bonus = 0;

      if (isCorrect && !isContinuous) {
        if (prevCorrectCount === 0) {
          speedRank = 1;
          bonus = prev.settings.fastFingerBonus1; // +20
        } else if (prevCorrectCount === 1) {
          speedRank = 2;
          bonus = prev.settings.fastFingerBonus2; // +15
        } else if (prevCorrectCount === 2) {
          speedRank = 3;
          bonus = prev.settings.fastFingerBonus3; // +10
        }
      }

      // Point calculation:
      // 1. Word Builder: basePoints + totalLetters used (1 letter = 1 point)
      // 2. Longest Word: basePoints + word length (1 letter = 1 point) + potential +25 bonus at end of round
      // 3. Mole Whack: basePoints + mole hits score
      // 4. Standard: basePoints + speed bonus
      let pointsAwarded = 0;
      if (isCorrect) {
        if (isWordBuilder) {
          const totalLetters =
            payload?.totalLetters !== undefined
              ? payload.totalLetters
              : payload?.words
              ? payload.words.reduce((acc: number, w: string) => acc + w.length, 0)
              : 0;
          pointsAwarded = basePoints + totalLetters;
        } else if (isLongestWord) {
          const wordLen = payload?.length || payload?.word?.length || 0;
          pointsAwarded = basePoints + wordLen;
        } else if (isMoleWhack) {
          pointsAwarded = basePoints + (payload?.bonusPoints || 0);
        } else {
          pointsAwarded = basePoints + bonus;
        }
      }

      const previousPoints = existingSubmission ? existingSubmission.pointsAwarded : 0;
      const scoreDelta = pointsAwarded - previousPoints;

      const submission: AnswerSubmission = {
        playerId,
        playerName,
        submittedAt: Date.now(),
        isCorrect,
        timeSpent,
        pointsAwarded,
        speedRank: existingSubmission?.speedRank || speedRank,
        answerPayload: payload
      };

      const updatedAnswers = {
        ...prev.answersThisTurn,
        [playerId]: submission
      };

      // Always guarantee player is included in players map
      const existingPlayer = prev.players[playerId] || {
        id: playerId,
        name: playerName,
        avatar: '🚀',
        score: 0,
        streak: 0,
        isSimulated: false
      };

      const updatedPlayers = {
        ...prev.players,
        [playerId]: {
          ...existingPlayer,
          score: Math.max(0, existingPlayer.score + scoreDelta),
          streak: isCorrect ? existingPlayer.streak + (existingSubmission ? 0 : 1) : 0
        }
      };

      const updatedState: RoomState = {
        ...prev,
        answersThisTurn: updatedAnswers,
        players: updatedPlayers
      };

      api.broadcastLocal(updatedState);

      // Push answer to Firebase Realtime Database
      firebaseSync.submitAnswer(
        prev.roomCode,
        submission,
        scoreDelta,
        isCorrect
      );

      return updatedState;
    });
  };

  // Student joining room
  const handleJoinRoom = (name: string, avatar: string, pin: string) => {
    const cleanName = name.trim();

    // Check duplicate student name (case-insensitive)
    const existingPlayers = Object.values(roomState.players || {});
    const isDuplicate = existingPlayers.some(
      (p) => p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (isDuplicate) {
      alert(`Il nome "${cleanName}" è già presente nella sessione. Scegli un nome diverso o aggiungi l'iniziale del cognome.`);
      return;
    }

    const newPlayerId = `p-${Date.now()}`;
    const newPlayer: Player = {
      id: newPlayerId,
      name: cleanName,
      avatar,
      score: 0,
      streak: 0,
      isSimulated: false
    };

    setWasKicked(false);
    setMyPlayerId(newPlayerId);
    setMyPlayer(newPlayer);
    try {
      localStorage.setItem('flipquiz_my_player', JSON.stringify(newPlayer));
    } catch (e) {}

    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        players: {
          ...prev.players,
          [newPlayerId]: newPlayer
        }
      };
      api.broadcastLocal(updated);
      return updated;
    });

    // Write to Firebase
    firebaseSync.joinPlayer(pin, newPlayer);
    api.join(newPlayerId, name, avatar, pin);
  };

  // Student submitting new question to repository
  const handleSubmitQuestion = (question: Question) => {
    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        questions: [question, ...prev.questions]
      };
      api.broadcastLocal(updated);
      return updated;
    });

    firebaseSync.submitQuestion(roomState.roomCode, question);
    api.submitQuestion(question);
    sound.playCorrect();
  };

  // Student answering current question
  const handleSubmitAnswer = (isCorrect: boolean, payload?: any) => {
    const player = activeStudent || {
      id: myPlayerId,
      name: myPlayer?.name || 'Studente',
      avatar: myPlayer?.avatar || '🚀',
      score: 0,
      streak: 0,
      isSimulated: false
    };

    const timeSpent =
      roomState.turnStartTime > 0 ? (Date.now() - roomState.turnStartTime) / 1000 : 2.0;

    // Immediate local recording & sound feedback
    registerAnswer(player.id, player.name, isCorrect, timeSpent, payload);
    sound.playFastFinger();

    // Broadcast to server and other devices
    api.submitAnswer(player.id, player.name, isCorrect, timeSpent, payload);
  };

  // Student saving drawing
  const handleSaveDrawing = (dataUrl: string) => {
    const player = activeStudent || myPlayer;
    if (!player) return;

    const drawing: DrawingSubmission = {
      playerId: player.id,
      playerName: player.name,
      dataUrl,
      votes: []
    };

    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        drawingsThisTurn: {
          ...prev.drawingsThisTurn,
          [player.id]: drawing
        }
      };
      api.broadcastLocal(updated);
      return updated;
    });

    firebaseSync.saveDrawing(roomState.roomCode, drawing);
    api.saveDrawing(player.id, player.name, dataUrl);
  };

  // Peer voting for drawing
  const handleVoteDrawing = (targetPlayerId: string) => {
    const player = activeStudent || myPlayer;
    if (!player) return;

    setRoomState((prev) => {
      const currentDrawing = prev.drawingsThisTurn[targetPlayerId];
      if (!currentDrawing) return prev;

      const votes = currentDrawing.votes.includes(player.id)
        ? currentDrawing.votes
        : [...currentDrawing.votes, player.id];

      // Award +25 points to artist for each star received
      const artist = prev.players[targetPlayerId];
      const updatedPlayers = artist
        ? {
            ...prev.players,
            [targetPlayerId]: {
              ...artist,
              score: artist.score + 25
            }
          }
        : prev.players;

      const updated: RoomState = {
        ...prev,
        players: updatedPlayers,
        drawingsThisTurn: {
          ...prev.drawingsThisTurn,
          [targetPlayerId]: {
            ...currentDrawing,
            votes
          }
        }
      };

      api.broadcastLocal(updated);
      return updated;
    });

    firebaseSync.voteDrawing(roomState.roomCode, player.id, targetPlayerId);
    api.voteDrawing(player.id, targetPlayerId);
  };

  // Teacher starting quiz
  const handleStartGame = () => {
    if (roomState.questions.length === 0) return;
    const duration = roomState.questions[0]?.timeLimit || 25;

    setRoomState((prev) => {
      // Reset all students' score and streak to 0 on new quiz!
      const resetPlayers = Object.fromEntries(
        Object.entries(prev.players || {}).map(([id, p]) => [
          id,
          {
            ...p,
            score: 0,
            streak: 0
          }
        ])
      );

      const updated: RoomState = {
        ...prev,
        players: resetPlayers,
        phase: 'question_intro',
        currentQuestionIndex: 0,
        answersThisTurn: {},
        drawingsThisTurn: {},
        turnStartTime: Date.now()
      };
      api.broadcastLocal(updated);
      firebaseSync.pushRoomState(updated);
      return updated;
    });

    firebaseSync.setPhase(roomState.roomCode, 'question_intro', 0, duration);
    api.startGame();
  };

  // Teacher progressing to next step
  const handleNextQuestion = () => {
    if (roomState.phase === 'question_results' || roomState.phase === 'draw_gallery') {
      setRoomState((prev) => {
        const updated: RoomState = {
          ...prev,
          phase: 'leaderboard'
        };
        api.broadcastLocal(updated);
        return updated;
      });
      firebaseSync.setPhase(roomState.roomCode, 'leaderboard');
    } else if (roomState.phase === 'leaderboard') {
      const nextIdx = roomState.currentQuestionIndex + 1;
      if (nextIdx < roomState.questions.length) {
        const nextQ = roomState.questions[nextIdx];
        const duration = nextQ?.timeLimit || 25;

        setRoomState((prev) => {
          const updated: RoomState = {
            ...prev,
            phase: 'question_intro',
            currentQuestionIndex: nextIdx,
            answersThisTurn: {},
            turnStartTime: Date.now()
          };
          api.broadcastLocal(updated);
          return updated;
        });
        firebaseSync.setPhase(roomState.roomCode, 'question_intro', nextIdx, duration);
      } else {
        setRoomState((prev) => {
          const updated: RoomState = {
            ...prev,
            phase: 'podium'
          };
          api.broadcastLocal(updated);
          return updated;
        });
        firebaseSync.setPhase(roomState.roomCode, 'podium');
      }
    }
    api.nextStep();
  };

  // Teacher updating points and time limit for a question (or globally for all)
  const handleUpdateQuestionPointsAndTime = (
    qId: string | 'all',
    points: number,
    timeLimit: number
  ) => {
    setRoomState((prev) => {
      const updatedQuestions = prev.questions.map((q) =>
        qId === 'all' || q.id === qId ? { ...q, points, timeLimit } : q
      );
      const updatedSettings = {
        ...prev.settings,
        ...(qId === 'all' ? { basePoints: points, defaultTimeLimit: timeLimit } : {})
      };
      const updated: RoomState = {
        ...prev,
        questions: updatedQuestions,
        settings: updatedSettings
      };

      try {
        localStorage.setItem(
          'flipquiz_custom_config',
          JSON.stringify({
            questions: updatedQuestions,
            settings: updatedSettings
          })
        );
      } catch (e) {
        console.warn('Could not save custom config to localStorage:', e);
      }

      firebaseSync.pushRoomState(updated);
      api.broadcastLocal(updated);
      return updated;
    });
  };

  // Teacher forcefully terminating the race/game immediately to podium
  const handleTerminateGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearBotTimeouts();

    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        phase: 'podium'
      };
      api.broadcastLocal(updated);
      return updated;
    });

    firebaseSync.setPhase(roomState.roomCode, 'podium');
    sound.playFanfare();
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 }
    });
  };

  // Teacher completely wiping room data from Firebase RTDB and resetting session
  const handleWipeDatabase = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearBotTimeouts();

    const freshEpoch = Date.now();
    const freshState: RoomState = {
      roomCode: roomState.roomCode,
      roomName: roomState.roomName || 'FlipQuiz Classe Live',
      phase: 'lobby',
      currentQuestionIndex: 0,
      questions: [],
      players: {},
      answersThisTurn: {},
      drawingsThisTurn: {},
      turnStartTime: 0,
      turnDuration: 25,
      resetEpoch: freshEpoch,
      settings: {
        basePoints: 50,
        fastFingerBonus1: 20,
        fastFingerBonus2: 15,
        fastFingerBonus3: 10,
        defaultTimeLimit: 25,
        soundEnabled: true
      }
    };

    // 1. Clear local storage for current student session
    try {
      localStorage.removeItem('flipquiz_my_player');
      localStorage.removeItem('flipquiz_custom_config');
    } catch (e) {}

    // 2. Disconnect local student and reset kicked notice
    setMyPlayer(null);
    setMyPlayerId('');
    setWasKicked(false);

    // 3. Set room state locally and broadcast (completely empty players!)
    setRoomState(freshState);
    api.broadcastLocal(freshState);

    // 4. Wipe completely from Firebase RTDB and backend
    firebaseSync.wipeRoomDatabase(roomState.roomCode, freshState);
    api.wipeRoom();
  };

  // Teacher deleting question
  const handleDeleteQuestion = (qId: string) => {
    setRoomState((prev) => {
      const updatedQuestions = prev.questions.filter((q) => q.id !== qId);
      const updated: RoomState = {
        ...prev,
        questions: updatedQuestions
      };
      firebaseSync.pushRoomState(updated);
      api.broadcastLocal(updated);
      return updated;
    });
  };

  // Teacher kicking out a student (kick out)
  const handleKickStudent = (playerId: string) => {
    if (myPlayer && myPlayer.id === playerId) {
      setWasKicked(true);
      setMyPlayer(null);
      setMyPlayerId('');
      try {
        localStorage.removeItem('flipquiz_my_player');
      } catch (e) {}
    }

    setRoomState((prev) => {
      const updatedPlayers = { ...prev.players };
      delete updatedPlayers[playerId];
      const updatedAnswers = { ...prev.answersThisTurn };
      delete updatedAnswers[playerId];
      const updated: RoomState = {
        ...prev,
        players: updatedPlayers,
        answersThisTurn: updatedAnswers
      };
      firebaseSync.pushRoomState(updated);
      api.broadcastLocal(updated);
      return updated;
    });

    api.kickPlayer(playerId);
  };

  // Teacher adding simulated classmate bots (+1 bot alla volta)
  const handleAddSimulatedStudents = (count: number = 1) => {
    const names = ['Matteo P.', 'Federica S.', 'Lorenzo B.', 'Elena D.', 'Davide M.', 'Chiara L.', 'Andrea T.', 'Sofia R.', 'Marco G.'];
    const avatars = ['🚀', '🦊', '🌟', '⚡', '🐼', '🎨', '🦁', '🦉'];
    const newBots: Record<string, Player> = {};

    const existingNames = Object.values(roomState.players).map((p) => p.name);
    const availableNames = names.filter((n) => !existingNames.includes(n));

    for (let i = 0; i < count; i++) {
      const id = `bot-${Date.now()}-${i}`;
      const name = availableNames[i] || `Bot Studente ${Object.keys(roomState.players).length + i + 1}`;
      const avatar = avatars[(Object.keys(roomState.players).length + i) % avatars.length];
      newBots[id] = {
        id,
        name,
        avatar,
        score: 0,
        streak: 0,
        isSimulated: true
      };
    }

    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        players: {
          ...prev.players,
          ...newBots
        }
      };
      firebaseSync.pushRoomState(updated);
      api.broadcastLocal(updated);
      return updated;
    });

    api.simulateStudents(count);
  };

  // Sound toggle
  const handleToggleSound = () => {
    setRoomState((prev) => {
      const nextVal = !prev.settings.soundEnabled;
      sound.setEnabled(nextVal);
      return {
        ...prev,
        settings: {
          ...prev.settings,
          soundEnabled: nextVal
        }
      };
    });
  };

  // Reset session to lobby
  const handleResetGame = () => {
    setRoomState((prev) => {
      const updated: RoomState = {
        ...prev,
        phase: 'lobby',
        currentQuestionIndex: 0,
        answersThisTurn: {}
      };
      api.broadcastLocal(updated);
      return updated;
    });
    firebaseSync.resetRoom(roomState.roomCode);
    api.resetGame();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Universal Classroom Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-40 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">FlipQuiz</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                  PanQuiz Flipped Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gli studenti creano le domande • Il docente avvia live sulla LIM
              </p>
            </div>
          </div>

          {/* Mode Switcher: LIM vs Dispositivo Studente (Hidden if joined via QR code) */}
          {!isLockedStudent ? (
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setViewRole('teacher')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  viewRole === 'teacher'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Schermo Docente (LIM)
              </button>

              <button
                onClick={() => setViewRole('student')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  viewRole === 'student'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Dispositivo Studente
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black shadow-sm">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Dispositivo Studente</span>
            </div>
          )}

          {/* Firebase Connection & Guide Buttons */}
          <div className="flex items-center gap-2">
            {viewRole === 'teacher' ? (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border select-none cursor-default ${
                  isFirebaseOnline
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
                title={isFirebaseOnline ? 'Firebase RTDB: Connesso' : 'Firebase RTDB: Connessione in corso...'}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isFirebaseOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="hidden sm:inline">RTDB</span>
              </div>
            ) : (
              <button
                onClick={() => setIsFirebaseModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer border ${
                  isFirebaseOnline
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                }`}
                title="Stato del database Firebase (gioco-multi-utente). Clicca per verificare la connessione"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isFirebaseOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>
                  {isFirebaseOnline ? 'Firebase RTDB: Online' : 'Firebase RTDB: Connessione...'}
                </span>
              </button>
            )}

            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guida
            </button>
          </div>
        </div>
      </header>

      {/* Main Interactive Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col">
        {viewRole === 'teacher' ? (
          <TeacherMonitor
            roomState={roomState}
            appUrl={appUrl}
            onStartGame={handleStartGame}
            onNextQuestion={handleNextQuestion}
            onEndQuestionTimerNow={handleEndQuestionTimer}
            onTerminateGame={handleTerminateGame}
            onUpdateQuestionPointsAndTime={handleUpdateQuestionPointsAndTime}
            onDeleteQuestion={handleDeleteQuestion}
            onAddSimulatedStudents={handleAddSimulatedStudents}
            onKickStudent={handleKickStudent}
            onToggleSound={handleToggleSound}
            onResetGame={handleResetGame}
          />
        ) : (
          <StudentDevice
            roomState={roomState}
            myPlayer={activeStudent}
            initialPin={initialPin}
            wasKicked={wasKicked}
            onJoinRoom={handleJoinRoom}
            onSubmitQuestion={handleSubmitQuestion}
            onSubmitAnswer={handleSubmitAnswer}
            onSaveDrawing={handleSaveDrawing}
            onVoteDrawing={handleVoteDrawing}
            onStartQuiz={handleStartGame}
          />
        )}
      </main>

      {/* Architecture & Pedagogical Guide Modal */}
      <ArchitectureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Firebase Live Diagnostic Modal */}
      <FirebaseDiagnosticModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}
