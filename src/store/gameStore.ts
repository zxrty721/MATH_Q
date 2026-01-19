import { create } from 'zustand';
import { generateQuestion } from '../utils/mathGenerator';
import { supabase } from '../utils/supabaseClient';
import { localDB } from '../utils/localDB';
import { useAuthStore } from './authStore';
import type { GameConfig, GameStatus, Question, GameMode, Difficulty } from '../types';

interface GameState {
  status: GameStatus;
  config: GameConfig;
  
  // Gameplay State
  currentQIndex: number;
  score: number;
  history: Question[];
  timeLeft: number;
  currentAnswerStatus: 'unanswered' | 'correct' | 'wrong' | 'timeout';
  selectedOption: string | null;

  // ✅ Cache State (เก็บใน RAM)
  historyCache: any[];
  isHistoryLoading: boolean;

  // ✅ Leaderboard Cache State
  leaderboardCache: any[];
  leaderboardParams: { mode: string; diff: string; base: string }; // จำว่า Cache นี้ของโหมดไหน
  isLeaderboardLoading: boolean;

  // UI State
  isDetailViewOpen: boolean; 

  // Actions
  setBase: (base: number) => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (diff: Difficulty) => void;
  submitAnswer: (ans: string | null) => void;
  nextQuestion: () => void;
  decrementTime: () => void;
  resetGame: () => void;
  goToSummary: () => void;
  goToLeaderboard: () => void;
  
  saveScore: () => Promise<void>;
  
  // Fetch Actions
  fetchHistoryCache: (force?: boolean) => Promise<void>;
  fetchLeaderboard: (mode: string, diff: string, base: string, force?: boolean) => Promise<void>;
  
  setDetailViewOpen: (isOpen: boolean) => void; 
  goToAbout: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // --- Init Values ---
  status: 'setup',
  config: { base: 10, mode: 'addition', difficulty: 'easy' },
  
  currentQIndex: 0, score: 0, history: [],
  timeLeft: 0, currentAnswerStatus: 'unanswered', selectedOption: null,

  // Cache Init
  historyCache: [],
  isHistoryLoading: false,

  leaderboardCache: [],
  leaderboardParams: { mode: 'all', diff: 'all', base: 'all' },
  isLeaderboardLoading: false,

  isDetailViewOpen: false,
goToAbout: () => set({ status: 'about', isDetailViewOpen: false }),
  // --- Gameplay Actions ---
  setBase: (base) => set((state) => ({ config: { ...state.config, base } })),
  setMode: (mode) => set((state) => ({ config: { ...state.config, mode } })),
  setDifficulty: (difficulty) => {
    const finalConfig = { ...get().config, difficulty };
    const firstQ = generateQuestion(finalConfig);
    set({
      config: finalConfig, status: 'playing', score: 0, currentQIndex: 0, history: [firstQ],
      timeLeft: difficulty === 'hard' ? 20 : difficulty === 'medium' ? 40 : 60,
      currentAnswerStatus: 'unanswered', selectedOption: null
    });
  },

  submitAnswer: (ans) => {
    const state = get();
    if (state.currentAnswerStatus !== 'unanswered') return;
    const currQ = state.history[state.currentQIndex];
    const isCorrect = ans === currQ.correctAnswer;
    const status = ans === null ? 'timeout' : (isCorrect ? 'correct' : 'wrong');
    const updatedHistory = [...state.history];
    updatedHistory[state.currentQIndex] = { ...currQ, userAnswer: ans || "Timeout", isCorrect };
    set({ history: updatedHistory, score: state.score + (isCorrect ? 1 : 0), currentAnswerStatus: status, selectedOption: ans });
  },

  nextQuestion: () => {
    const state = get();
    if (state.currentQIndex >= 9) {
      set({ status: 'summary' });
      state.saveScore(); 
    } else {
      const nextQ = generateQuestion(state.config);
      set({
        currentQIndex: state.currentQIndex + 1, history: [...state.history, nextQ],
        timeLeft: state.config.difficulty === 'hard' ? 20 : state.config.difficulty === 'medium' ? 40 : 60,
        currentAnswerStatus: 'unanswered', selectedOption: null
      });
    }
  },

  decrementTime: () => {
    const state = get();
    if (state.status !== 'playing' || state.currentAnswerStatus !== 'unanswered') return;
    if (state.timeLeft > 0) set({ timeLeft: state.timeLeft - 1 });
    else state.submitAnswer(null);
  },

  resetGame: () => set({ status: 'setup', history: [], currentAnswerStatus: 'unanswered', isDetailViewOpen: false }),
  goToSummary: () => set({ status: 'summary', isDetailViewOpen: false }),
  goToLeaderboard: () => set({ status: 'leaderboard', isDetailViewOpen: false }),
  setDetailViewOpen: (isOpen) => set({ isDetailViewOpen: isOpen }),

  // --- 🔥 SAVE SYSTEM (Trigger Invalidation) ---
  saveScore: async () => {
    const state = get();
    const user = useAuthStore.getState().user; 

    if (!user) return;
    const playerName = user.email?.split('@')[0] || 'Unknown';

    // 1. บันทึก Metadata ลง Supabase
    const { data, error } = await supabase
      .from('game_history')
      .insert({
        user_id: user.id,
        player_name: playerName,
        mode: state.config.mode,
        difficulty: state.config.difficulty,
        score: state.score,
        total_questions: 10,
        base_config: { base: state.config.base }
      })
      .select('id')
      .single();

    if (error) { console.error("Save Error:", error); return; }

    // 2. ✅ CRITICAL: ล้าง Cache ทิ้งทันทีที่มีการบันทึก
    // ครั้งต่อไปที่เปิดหน้า History หรือ Leaderboard มันจะรู้ตัวว่า Cache ว่างเปล่า และไปดึงใหม่เอง
    set({ 
      historyCache: [], 
      leaderboardCache: [] 
    });

    // 3. บันทึก Detail ลง IndexedDB (Local)
    if (data && data.id) {
      await localDB.saveDetails(data.id, state.history);
    }
  },

  // --- 🔥 HISTORY FETCH (RAM Cache Forever) ---
  fetchHistoryCache: async (force = false) => {
    const state = get();
    const user = useAuthStore.getState().user;
    
    // Guard Clauses
    if (state.isHistoryLoading) return;
    if (!user) return;

    // ✅ Logic: ถ้ามีข้อมูลใน Cache แล้ว และไม่ได้สั่ง force -> ใช้ของเดิมตลอดกาล (จนกว่าจะรีเฟรชหน้าเว็บ)
    if (!force && state.historyCache.length > 0) {
      return; // ใช้ Cache ใน RAM
    }

    set({ isHistoryLoading: true });
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('id, created_at, mode, difficulty, score, base_config')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) {
        set({ historyCache: data });
      }
    } catch (err) { console.error(err); } 
    finally { set({ isHistoryLoading: false }); }
  },

  // --- 🔥 LEADERBOARD FETCH (RAM Cache with Params Check) ---
  fetchLeaderboard: async (mode: string, diff: string, base: string, force = false) => {
    const state = get();
    if (state.isLeaderboardLoading) return;

    // ✅ Check Params: เช็คว่า Filter ตรงกับที่ Cache ไว้ไหม?
    const isParamsMatch = 
      state.leaderboardParams.mode === mode && 
      state.leaderboardParams.diff === diff &&
      state.leaderboardParams.base === base;

    // ✅ Logic: ถ้า Filter ตรงกัน + มีข้อมูลอยู่แล้ว + ไม่ Force -> ใช้ Cache ตลอดกาล
    if (isParamsMatch && !force && state.leaderboardCache.length > 0) {
      return; // ใช้ Cache ใน RAM
    }

    set({ isLeaderboardLoading: true });
    
    try {
      let query = supabase
        .from('game_history')
        .select('player_name, score, mode, difficulty, base_config, created_at')
        .order('score', { ascending: false })
        .limit(10);

      // Apply Filters
      if (mode !== 'all') query = query.eq('mode', mode);
      if (diff !== 'all') query = query.eq('difficulty', diff);
      if (base !== 'all') query = query.contains('base_config', { base: Number(base) });

      const { data, error } = await query;
      
      if (!error && data) {
        set({ 
          leaderboardCache: data, 
          // อัปเดต Params ล่าสุดที่ Cache ไว้
          leaderboardParams: { mode, diff, base } 
        });
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      set({ isLeaderboardLoading: false });
    }
  }
}));