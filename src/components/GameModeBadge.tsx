import { getGameModeInfo, getDifficultyInfo } from '../utils/gameConfig';
import { Layers, Signal } from 'lucide-react'; // Icon สำหรับ Base/Diff

interface GameModeBadgeProps {
  mode: string;
  base?: number;      // รับค่า base (ถ้ามี)
  difficulty?: string; // รับค่า difficulty (ถ้ามี)
  className?: string;
}

export const GameModeBadge = ({ mode, base, difficulty, className = '' }: GameModeBadgeProps) => {
  const { label, icon: Icon, color } = getGameModeInfo(mode);
  
  // Map สีสำหรับความยาก
  const getDiffColor = (diff?: string) => {
    switch(diff) {
      case 'easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'hard': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      
      {/* 1. ส่วนหัว: Icon + ชื่อโหมด */}
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${color.replace('text-', 'bg-')}/10`}>
          <Icon size={16} className={color} />
        </div>
        <span className={`font-bold text-sm text-slate-200`}>
          {label}
        </span>
      </div>

      {/* 2. ส่วนรายละเอียด: Base & Difficulty (ถ้าส่งมา) */}
      {(base || difficulty) && (
        <div className="flex items-center gap-2">
          {/* Base Tag */}
          {base && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/30 border border-cyan-500/20">
              <Layers size={10} />
              <span>ฐาน {base}</span>
            </div>
          )}

          {/* Diff Tag */}
          {difficulty && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getDiffColor(difficulty)}`}>
              <Signal size={10} />
              <span>{getDifficultyInfo(difficulty)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};