export type GameMode = 
  | 'addition' | 'subtraction' | 'multiplication' | 'division' 
  | 'equation' | 'linear' | 'quadratic' 
  | 'area' | 'variable' | 'probability';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameStatus = 'setup' | 'playing' | 'summary' | 'leaderboard' | 'about';

export interface GameConfig {
  base: number;
  mode: GameMode;
  difficulty: Difficulty;
}

export interface Question {
  id: string;
  display: string;
  subDisplay?: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}