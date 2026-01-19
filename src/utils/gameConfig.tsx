
import { 
  Plus, Minus, X, Divide, Equal, Square, 
  TrendingUp, Radius, Variable, Dices 
} from 'lucide-react';

// Map ข้อมูลโหมดเกมทั้งหมดไว้ที่นี่ที่เดียว
export const GAME_MODES_MAP: Record<string, { label: string; icon: any; color: string }> = {
  'addition':       { label: 'การบวก', icon: Plus, color: 'text-blue-400' },
  'subtraction':    { label: 'การลบ', icon: Minus, color: 'text-rose-400' },
  'multiplication': { label: 'การคูณ', icon: X, color: 'text-amber-400' },
  'division':       { label: 'การหาร', icon: Divide, color: 'text-emerald-400' },
  'equation':       { label: 'สมการ', icon: Equal, color: 'text-indigo-400' },
  'area':           { label: 'หาพื้นที่', icon: Square, color: 'text-pink-400' },
  'linear':         { label: 'กราฟเส้น', icon: TrendingUp, color: 'text-cyan-400' },
  'quadratic':      { label: 'กำลังสอง', icon: Radius, color: 'text-violet-400' },
  'variable':       { label: 'ตัวแปร', icon: Variable, color: 'text-orange-400' },
  'probability':    { label: 'ความน่าจะเป็น', icon: Dices, color: 'text-lime-400' },
};

// Helper Function เรียกใช้ง่ายๆ
export const getGameModeInfo = (mode: string) => {
  return GAME_MODES_MAP[mode] || { label: mode, icon: Plus, color: 'text-slate-400' };
};

// Helper สำหรับความยาก
export const getDifficultyInfo = (diff: string) => {
  const map: Record<string, string> = { 
    'easy': 'ง่าย', 
    'medium': 'ปานกลาง', 
    'hard': 'ยาก' 
  };
  return map[diff] || diff;
};