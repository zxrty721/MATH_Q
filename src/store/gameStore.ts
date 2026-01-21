import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { useAuthStore } from './authStore';
import type { AppStatus } from '../types';

export type GameId = 
  | 'falling-numbers' | 'quick-math' | 'base-defense' | 'math-snake' | 'memory-card'
  | 'space-shooter' | 'puzzle-2048' | 'time-bomb' | 'monster-slayer' | 'dungeon-crawler';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

// ✅ อัปเดต Type ให้ตรงกับ DB
export interface HistoryItem {
  id: string;
  game_id: GameId; 
  score: number;
  difficulty: GameDifficulty;
  base_mode: number; // ✅ เพิ่ม Base Mode
  created_at: string;
  game_details?: Record<string, any>; // ✅ เปลี่ยนเป็น Dictionary เพื่อรองรับทุกค่า
}

interface GameState {
  status: AppStatus;
  activeGame: GameId | null;
  currentBase: number;
  currentScore: number;
  selectedDifficulty: GameDifficulty;
  
  currentView: 'MENU' | 'GAME' | 'HISTORY';
  history: HistoryItem[];
  highScores: Record<string, number>;

  goToHome: () => void;
  goToAbout: () => void;
  startGame: (gameId: GameId, difficulty: GameDifficulty) => void;
  setBase: (base: number) => void;
  quitGame: () => void;
  addScore: (points: number) => void;
  resetScore: () => void;
  
  setStatus: (status: AppStatus) => void;
  navigateTo: (view: 'MENU' | 'GAME' | 'HISTORY') => void;
  saveHighScore: (details?: any) => Promise<void>;
  fetchHistory: (forceRefresh?: boolean) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'home',
  activeGame: null,
  currentBase: 10,
  currentScore: 0,
  selectedDifficulty: 'medium',
  
  currentView: 'MENU',
  history: [],
  highScores: {},

  goToHome: () => set({ status: 'home', activeGame: null, currentView: 'MENU' }),
  goToAbout: () => set({ status: 'about', activeGame: null, currentView: 'MENU' }),
  
  setStatus: (status) => set({ status }),
  navigateTo: (view) => set({ currentView: view }),

  startGame: (gameId, difficulty) => set({ 
    activeGame: gameId, 
    selectedDifficulty: difficulty, 
    currentScore: 0,
    currentView: 'GAME',
    status: 'home'
  }),

  setBase: (base) => set({ currentBase: base }),
  
  quitGame: () => set({ activeGame: null, currentScore: 0, currentView: 'MENU' }),
  
  addScore: (points) => set((state) => ({ currentScore: state.currentScore + points })),
  
  resetScore: () => set({ currentScore: 0 }),

  saveHighScore: async (details = {}) => {
    const state = get();
    const user = useAuthStore.getState().user;
    
    if (!user || !state.activeGame || state.currentScore <= 0) return;

    const playerName = user.email?.split('@')[0] || 'Unknown';

    const { data, error } = await supabase.from('arcade_scores').insert({
      user_id: user.id,
      player_name: playerName,
      game_id: state.activeGame,
      score: state.currentScore,
      base_mode: state.currentBase,
      difficulty: state.selectedDifficulty,
      game_details: details
    }).select().single();

    if (error) {
      console.error("Error saving score:", error);
    } else if (data) {
      const newItem: HistoryItem = {
        id: data.id,
        game_id: data.game_id, 
        score: data.score,
        difficulty: data.difficulty,
        base_mode: data.base_mode, // ✅ Map ค่ากลับมา
        created_at: data.created_at,
        game_details: data.game_details
      };

      const currentHigh = state.highScores[state.activeGame] || 0;

      set((s) => ({
        history: [newItem, ...s.history],
        highScores: {
            ...s.highScores,
            [state.activeGame!]: Math.max(currentHigh, state.currentScore)
        }
      }));
    }
  },

  fetchHistory: async (forceRefresh = false) => {
    const state = get();
    if (!forceRefresh && state.history.length > 0) return;

    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('arcade_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
        console.error("Fetch Error:", error);
    } else if (data) {
        const newHighScores: Record<string, number> = {};
        data.forEach((item: any) => {
            const gid = item.game_id;
            const s = item.score;
            if (!newHighScores[gid] || s > newHighScores[gid]) {
                newHighScores[gid] = s;
            }
        });

        // ✅ Map ข้อมูลให้ครบถ้วน
        const formattedHistory: HistoryItem[] = data.map((item: any) => ({
            id: item.id,
            game_id: item.game_id,
            score: item.score,
            difficulty: item.difficulty,
            base_mode: item.base_mode, // ✅ ดึง Base
            created_at: item.created_at,
            game_details: item.game_details // ✅ ดึง Details
        }));

        set({ 
            history: formattedHistory, 
            highScores: newHighScores 
        });
    }
  }
}));