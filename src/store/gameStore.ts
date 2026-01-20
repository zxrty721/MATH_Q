import { create } from "zustand";
import { generateQuestion } from "../utils/mathGenerator";
import { supabase } from "../utils/supabaseClient";
import { useAuthStore } from "./authStore";
import type {
  GameConfig,
  GameStatus,
  Question,
  GameMode,
  Difficulty,
} from "../types";

interface GameState {
  status: GameStatus;
  config: GameConfig;

  // Gameplay State
  currentQIndex: number;
  score: number;
  history: Question[];
  timeLeft: number;
  currentAnswerStatus: "unanswered" | "correct" | "wrong" | "timeout";
  selectedOption: string | null;

  // Cache State
  historyCache: any[];
  isHistoryLoading: boolean;

  // Leaderboard Cache State
  leaderboardCache: any[];
  leaderboardParams: { mode: string; diff: string; base: string };
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
  goToAbout: () => void;

  saveScore: () => Promise<void>;

  // Fetch Actions
  fetchHistoryCache: (force?: boolean) => Promise<void>;
  fetchLeaderboard: (
    mode: string,
    diff: string,
    base: string,
    force?: boolean,
  ) => Promise<void>;

  // ✅ ฟังก์ชันใหม่: ดึงรายละเอียดข้อสอบจาก Supabase (ใช้ ID)
  fetchGameDetail: (id: string) => Promise<Question[] | null>;

  setDetailViewOpen: (isOpen: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: "setup",
  config: { base: 10, mode: "addition", difficulty: "easy" },

  currentQIndex: 0,
  score: 0,
  history: [],
  timeLeft: 0,
  currentAnswerStatus: "unanswered",
  selectedOption: null,

  historyCache: [],
  isHistoryLoading: false,

  leaderboardCache: [],
  leaderboardParams: { mode: "all", diff: "all", base: "all" },
  isLeaderboardLoading: false,

  isDetailViewOpen: false,

  // --- Gameplay Actions ---
  setBase: (base) => set((state) => ({ config: { ...state.config, base } })),
  setMode: (mode) => set((state) => ({ config: { ...state.config, mode } })),
  setDifficulty: (difficulty) => {
    const finalConfig = { ...get().config, difficulty };
    const firstQ = generateQuestion(finalConfig);
    set({
      config: finalConfig,
      status: "playing",
      score: 0,
      currentQIndex: 0,
      history: [firstQ],
      timeLeft: difficulty === "hard" ? 20 : difficulty === "medium" ? 40 : 60,
      currentAnswerStatus: "unanswered",
      selectedOption: null,
    });
  },

  submitAnswer: (ans) => {
    const state = get();
    if (state.currentAnswerStatus !== "unanswered") return;
    const currQ = state.history[state.currentQIndex];
    const isCorrect = ans === currQ.correctAnswer;
    const status = ans === null ? "timeout" : isCorrect ? "correct" : "wrong";
    const updatedHistory = [...state.history];
    updatedHistory[state.currentQIndex] = {
      ...currQ,
      userAnswer: ans || "Timeout",
      isCorrect,
    };
    set({
      history: updatedHistory,
      score: state.score + (isCorrect ? 1 : 0),
      currentAnswerStatus: status,
      selectedOption: ans,
    });
  },

  nextQuestion: () => {
    const state = get();
    if (state.currentQIndex >= 9) {
      set({ status: "summary" });
      state.saveScore();
    } else {
      const nextQ = generateQuestion(state.config);
      set({
        currentQIndex: state.currentQIndex + 1,
        history: [...state.history, nextQ],
        timeLeft:
          state.config.difficulty === "hard"
            ? 20
            : state.config.difficulty === "medium"
              ? 40
              : 60,
        currentAnswerStatus: "unanswered",
        selectedOption: null,
      });
    }
  },

  decrementTime: () => {
    const state = get();
    if (
      state.status !== "playing" ||
      state.currentAnswerStatus !== "unanswered"
    )
      return;
    if (state.timeLeft > 0) set({ timeLeft: state.timeLeft - 1 });
    else state.submitAnswer(null);
  },

  resetGame: () =>
    set({
      status: "setup",
      history: [],
      currentAnswerStatus: "unanswered",
      isDetailViewOpen: false,
    }),
  goToSummary: () => set({ status: "summary", isDetailViewOpen: false }),
  goToLeaderboard: () =>
    set({ status: "leaderboard", isDetailViewOpen: false }),
  goToAbout: () => set({ status: "about", isDetailViewOpen: false }),
  setDetailViewOpen: (isOpen) => set({ isDetailViewOpen: isOpen }),

  // --- 🔥 SAVE SYSTEM (Supabase ONLY) ---
  saveScore: async () => {
    const state = get();
    const user = useAuthStore.getState().user;

    if (!user) return;
    const playerName = user.email?.split("@")[0] || "Unknown";

    // ✅ บันทึกทุกอย่างรวมทั้ง questions_data ลง Supabase ทีเดียวจบ
    const { error } = await supabase.from("game_history").insert({
      user_id: user.id,
      player_name: playerName,
      mode: state.config.mode,
      difficulty: state.config.difficulty,
      score: state.score,
      total_questions: 10,
      base_config: { base: state.config.base },
      questions_data: state.history, // ✅ ใส่ JSON ไปเลย
    });

    if (error) {
      console.error("Save Error:", error);
      return;
    }

    // Clear Cache เพื่อให้โหลดใหม่
    set({
      historyCache: [],
      leaderboardCache: [],
    });
  },

  // --- 🔥 HISTORY FETCH (Get everything) ---
  fetchHistoryCache: async (force = false) => {
    const state = get();
    const user = useAuthStore.getState().user;

    if (state.isHistoryLoading || !user) return;
    if (!force && state.historyCache.length > 0) return;

    set({ isHistoryLoading: true });
    try {
      // ✅ เลือก questions_data มาด้วยเลย เพราะเป็นประวัติเราเอง
      const { data, error } = await supabase
        .from("game_history")
        .select(
          "id, created_at, mode, difficulty, score, base_config, questions_data",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) {
        set({ historyCache: data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ isHistoryLoading: false });
    }
  },

  // --- 🔥 LEADERBOARD FETCH (Metadata ONLY) ---
  fetchLeaderboard: async (
    mode: string,
    diff: string,
    base: string,
    force = false,
  ) => {
    const state = get();
    if (state.isLeaderboardLoading) return;

    const isParamsMatch =
      state.leaderboardParams.mode === mode &&
      state.leaderboardParams.diff === diff &&
      state.leaderboardParams.base === base;

    if (isParamsMatch && !force && state.leaderboardCache.length > 0) return;

    set({ isLeaderboardLoading: true });
    try {
      let query = supabase
        .from("game_history")
        .select(
          "id, player_name, score, mode, difficulty, base_config, created_at",
        ) // ❌ ไม่ดึง questions_data (ประหยัดเน็ต)
        .order("score", { ascending: false })
        .limit(10);

      if (mode !== "all") query = query.eq("mode", mode);
      if (diff !== "all") query = query.eq("difficulty", diff);
      if (base !== "all")
        query = query.contains("base_config", { base: Number(base) });

      const { data, error } = await query;
      if (!error && data) {
        set({
          leaderboardCache: data,
          leaderboardParams: { mode, diff, base },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLeaderboardLoading: false });
    }
  },

  // --- ✅ NEW: Fetch Specific Game Detail ---
  fetchGameDetail: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("game_history")
        .select("questions_data")
        .eq("id", id)
        .single();

      if (error || !data) return null;
      return data.questions_data as Question[];
    } catch (err) {
      console.error(err);
      return null;
    }
  },
}));
