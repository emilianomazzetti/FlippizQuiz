import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomState, Question, Player, AnswerSubmission, GamePhase } from './src/types/quiz.js';
import { INITIAL_QUESTIONS } from './src/data/initialQuestions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.removeHeader('X-Frame-Options');
  next();
});

// Server Authoritative Room State
let roomState: RoomState = {
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
};

// SSE Subscribers
const sseClients: Response[] = [];

function broadcastState() {
  const data = JSON.stringify(roomState);
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (e) {
      // ignore dropped client
    }
  });
}

// REST & SSE Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', playersCount: Object.keys(roomState.players).length });
});

app.get('/api/room', (_req: Request, res: Response) => {
  res.json(roomState);
});

app.get('/api/room/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  // Send initial state immediately
  res.write(`data: ${JSON.stringify(roomState)}\n\n`);
  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

app.post('/api/room/join', (req: Request, res: Response) => {
  const { id, name, avatar } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome obbligatorio' });
  }

  // Use the ID provided by the client, or look up existing by name, or generate
  let playerId = id;
  if (!playerId) {
    const existingId = Object.keys(roomState.players).find(
      (pid) => roomState.players[pid].name.toLowerCase() === name.trim().toLowerCase()
    );
    playerId = existingId || `p-${Date.now()}`;
  }

  const player: Player = {
    id: playerId,
    name: name.trim(),
    avatar: avatar || '🚀',
    score: roomState.players[playerId]?.score || 0,
    streak: roomState.players[playerId]?.streak || 0,
    isSimulated: false
  };

  roomState.players[playerId] = player;
  broadcastState();
  res.json({ player, roomState });
});

app.post('/api/room/question', (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question || !question.id) {
    return res.status(400).json({ error: 'Dati domanda non validi' });
  }

  roomState.questions.unshift(question);
  broadcastState();
  res.json({ success: true, count: roomState.questions.length });
});

app.post('/api/room/start', (_req: Request, res: Response) => {
  if (roomState.questions.length === 0) {
    return res.status(400).json({ error: 'Nessuna domanda presente' });
  }

  roomState.phase = 'question_intro';
  roomState.currentQuestionIndex = 0;
  roomState.answersThisTurn = {};
  roomState.drawingsThisTurn = {};
  roomState.turnStartTime = Date.now();
  broadcastState();

  // Schedule auto transition from intro to active after 3s
  setTimeout(() => {
    if (roomState.phase === 'question_intro') {
      const q = roomState.questions[roomState.currentQuestionIndex];
      roomState.phase = 'question_active';
      roomState.turnStartTime = Date.now();
      roomState.turnDuration = q ? q.timeLimit : 25;
      broadcastState();
    }
  }, 3200);

  res.json({ success: true, phase: roomState.phase });
});

app.post('/api/room/answer', (req: Request, res: Response) => {
  const { playerId, playerName, isCorrect, timeSpent, payload } = req.body;
  if (!playerId) {
    return res.status(400).json({ error: 'Player ID mancante' });
  }

  // Prevent duplicate submissions in same turn
  if (roomState.answersThisTurn[playerId]) {
    return res.json({ alreadyAnswered: true, answer: roomState.answersThisTurn[playerId] });
  }

  const currentQ = roomState.questions[roomState.currentQuestionIndex];
  const basePoints = currentQ ? currentQ.points : 50;

  // Calculate speed rank (1st, 2nd, 3rd) among correct submissions
  const prevCorrectCount = Object.values(roomState.answersThisTurn).filter((a) => a.isCorrect).length;
  let speedRank: number | undefined = undefined;
  let bonus = 0;

  if (isCorrect) {
    if (prevCorrectCount === 0) {
      speedRank = 1;
      bonus = roomState.settings.fastFingerBonus1; // +20
    } else if (prevCorrectCount === 1) {
      speedRank = 2;
      bonus = roomState.settings.fastFingerBonus2; // +15
    } else if (prevCorrectCount === 2) {
      speedRank = 3;
      bonus = roomState.settings.fastFingerBonus3; // +10
    }
  }

  const pointsAwarded = isCorrect ? basePoints + bonus : 0;

  const submission: AnswerSubmission = {
    playerId,
    playerName: playerName || 'Studente',
    submittedAt: Date.now(),
    isCorrect,
    timeSpent: timeSpent || 0,
    pointsAwarded,
    speedRank,
    answerPayload: payload
  };

  roomState.answersThisTurn[playerId] = submission;

  // Update player score in room
  if (roomState.players[playerId]) {
    roomState.players[playerId].score += pointsAwarded;
    roomState.players[playerId].streak = isCorrect ? roomState.players[playerId].streak + 1 : 0;
  }

  broadcastState();
  res.json({ success: true, submission, updatedPlayer: roomState.players[playerId] });
});

app.post('/api/room/drawing', (req: Request, res: Response) => {
  const { playerId, playerName, dataUrl } = req.body;
  if (!playerId || !dataUrl) {
    return res.status(400).json({ error: 'Dati disegno non validi' });
  }

  roomState.drawingsThisTurn[playerId] = {
    playerId,
    playerName: playerName || 'Studente',
    dataUrl,
    votes: []
  };

  broadcastState();
  res.json({ success: true });
});

app.post('/api/room/vote-drawing', (req: Request, res: Response) => {
  const { voterId, targetPlayerId } = req.body;
  if (!voterId || !targetPlayerId) {
    return res.status(400).json({ error: 'Dati votazione non validi' });
  }

  const drawing = roomState.drawingsThisTurn[targetPlayerId];
  if (drawing && !drawing.votes.includes(voterId)) {
    drawing.votes.push(voterId);

    // Award +25 points to artist
    if (roomState.players[targetPlayerId]) {
      roomState.players[targetPlayerId].score += 25;
    }
    broadcastState();
  }

  res.json({ success: true });
});

app.post('/api/room/end-timer', (_req: Request, res: Response) => {
  const currentQ = roomState.questions[roomState.currentQuestionIndex];
  const nextPhase: GamePhase = currentQ && currentQ.type === 'draw_vote' ? 'draw_gallery' : 'question_results';
  roomState.phase = nextPhase;
  broadcastState();
  res.json({ success: true, phase: roomState.phase });
});

app.post('/api/room/next', (_req: Request, res: Response) => {
  if (roomState.phase === 'question_results' || roomState.phase === 'draw_gallery') {
    roomState.phase = 'leaderboard';
  } else if (roomState.phase === 'leaderboard') {
    const nextIdx = roomState.currentQuestionIndex + 1;
    if (nextIdx < roomState.questions.length) {
      roomState.phase = 'question_intro';
      roomState.currentQuestionIndex = nextIdx;
      roomState.answersThisTurn = {};
      roomState.drawingsThisTurn = {};
      roomState.turnStartTime = Date.now();

      setTimeout(() => {
        if (roomState.phase === 'question_intro') {
          const q = roomState.questions[roomState.currentQuestionIndex];
          roomState.phase = 'question_active';
          roomState.turnStartTime = Date.now();
          roomState.turnDuration = q ? q.timeLimit : 25;
          broadcastState();
        }
      }, 3200);
    } else {
      roomState.phase = 'podium';
    }
  }
  broadcastState();
  res.json({ success: true, phase: roomState.phase });
});

app.post('/api/room/simulate-students', (req: Request, res: Response) => {
  const count = req.body.count || 1;
  const names = [
    'Matteo P.',
    'Federica S.',
    'Lorenzo B.',
    'Elena D.',
    'Davide M.',
    'Chiara L.',
    'Andrea T.',
    'Martina G.',
    'Luca R.',
    'Sara B.'
  ];
  const avatars = ['🚀', '🦊', '🌟', '⚡', '🐼', '🎨', '🦁', '🦉', '🐬', '🐯'];

  const existingNames = new Set(
    Object.values(roomState.players).map((p) => p.name.toLowerCase())
  );

  for (let i = 0; i < count; i++) {
    const id = `bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const available = names.filter((n) => !existingNames.has(n.toLowerCase()));
    const name =
      available.length > 0
        ? available[0]
        : `${names[i % names.length]} ${Math.floor(Math.random() * 90) + 10}`;
    existingNames.add(name.toLowerCase());
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    roomState.players[id] = {
      id,
      name,
      avatar,
      score: 0,
      streak: 0,
      isSimulated: true
    };
  }

  broadcastState();
  res.json({ success: true, playersCount: Object.keys(roomState.players).length });
});

app.post('/api/room/kick', (req: Request, res: Response) => {
  const { playerId } = req.body;
  if (playerId && roomState.players[playerId]) {
    delete roomState.players[playerId];
    delete roomState.answersThisTurn[playerId];
    delete roomState.drawingsThisTurn[playerId];
    broadcastState();
  }
  res.json({ success: true });
});

app.post('/api/room/wipe', (_req: Request, res: Response) => {
  roomState.phase = 'lobby';
  roomState.currentQuestionIndex = 0;
  roomState.questions = [];
  roomState.players = {};
  roomState.answersThisTurn = {};
  roomState.drawingsThisTurn = {};
  roomState.resetEpoch = Date.now();
  broadcastState();
  res.json({ success: true, roomState });
});

app.post('/api/room/reset', (_req: Request, res: Response) => {
  roomState.phase = 'lobby';
  roomState.currentQuestionIndex = 0;
  roomState.answersThisTurn = {};
  roomState.drawingsThisTurn = {};
  broadcastState();
  res.json({ success: true, phase: roomState.phase });
});

// Vite middleware in dev or static files in production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlipQuiz Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
