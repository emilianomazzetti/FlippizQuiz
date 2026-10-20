/**
 * Real-time API Client & Multi-Tab Synchronization Service
 */
import { RoomState, Question, Player, AnswerSubmission } from '../types/quiz';

const bc = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('flipquiz_channel')
  : null;

export const api = {
  // Listen for real-time room updates via SSE & BroadcastChannel
  subscribeToRoom(onUpdate: (state: RoomState) => void): () => void {
    let eventSource: EventSource | null = null;
    let isSubscribed = true;

    // Listen to local BroadcastChannel for instant same-browser multi-tab sync
    if (bc) {
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'ROOM_UPDATE') {
          onUpdate(event.data.roomState);
        }
      };
    }

    // Connect to server SSE stream
    try {
      eventSource = new EventSource('/api/room/events');
      eventSource.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const state: RoomState = JSON.parse(event.data);
          onUpdate(state);
        } catch (e) {
          console.error('Error parsing room SSE:', e);
        }
      };

      eventSource.onerror = () => {
        // Fallback polling if SSE is disconnected
      };
    } catch (e) {
      console.warn('SSE not supported or failed to connect:', e);
    }

    return () => {
      isSubscribed = false;
      if (eventSource) eventSource.close();
    };
  },

  broadcastLocal(roomState: RoomState) {
    if (bc) {
      bc.postMessage({ type: 'ROOM_UPDATE', roomState });
    }
  },

  async getRoom(): Promise<RoomState | null> {
    try {
      const res = await fetch('/api/room');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getRoom failed, using local state:', e);
    }
    return null;
  },

  async join(
    id: string,
    name: string,
    avatar: string,
    pin: string
  ): Promise<{ player: Player; roomState: RoomState } | null> {
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, avatar, pin })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API join failed:', e);
    }
    return null;
  },

  async submitQuestion(question: Question): Promise<boolean> {
    try {
      const res = await fetch('/api/room/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      return res.ok;
    } catch (e) {
      console.warn('API submitQuestion failed:', e);
    }
    return false;
  },

  async startGame(): Promise<boolean> {
    try {
      const res = await fetch('/api/room/start', { method: 'POST' });
      return res.ok;
    } catch (e) {
      console.warn('API startGame failed:', e);
    }
    return false;
  },

  async submitAnswer(
    playerId: string,
    playerName: string,
    isCorrect: boolean,
    timeSpent: number,
    payload?: any
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/room/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName, isCorrect, timeSpent, payload })
      });
      return res.ok;
    } catch (e) {
      console.warn('API submitAnswer failed:', e);
    }
    return false;
  },

  async saveDrawing(playerId: string, playerName: string, dataUrl: string): Promise<boolean> {
    try {
      const res = await fetch('/api/room/drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName, dataUrl })
      });
      return res.ok;
    } catch (e) {
      console.warn('API saveDrawing failed:', e);
    }
    return false;
  },

  async voteDrawing(voterId: string, targetPlayerId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/room/vote-drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId, targetPlayerId })
      });
      return res.ok;
    } catch (e) {
      console.warn('API voteDrawing failed:', e);
    }
    return false;
  },

  async endTimerNow(): Promise<boolean> {
    try {
      const res = await fetch('/api/room/end-timer', { method: 'POST' });
      return res.ok;
    } catch (e) {
      console.warn('API endTimerNow failed:', e);
    }
    return false;
  },

  async nextStep(): Promise<boolean> {
    try {
      const res = await fetch('/api/room/next', { method: 'POST' });
      return res.ok;
    } catch (e) {
      console.warn('API nextStep failed:', e);
    }
    return false;
  },

  async simulateStudents(count: number): Promise<boolean> {
    try {
      const res = await fetch('/api/room/simulate-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      return res.ok;
    } catch (e) {
      console.warn('API simulateStudents failed:', e);
    }
    return false;
  },

  async kickPlayer(playerId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/room/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      return res.ok;
    } catch (e) {
      console.warn('API kickPlayer failed:', e);
    }
    return false;
  },

  async wipeRoom(): Promise<boolean> {
    try {
      const res = await fetch('/api/room/wipe', { method: 'POST' });
      return res.ok;
    } catch (e) {
      console.warn('API wipeRoom failed:', e);
    }
    return false;
  },

  async resetGame(): Promise<boolean> {
    try {
      const res = await fetch('/api/room/reset', { method: 'POST' });
      return res.ok;
    } catch (e) {
      console.warn('API resetGame failed:', e);
    }
    return false;
  }
};
