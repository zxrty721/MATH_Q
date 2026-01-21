import { useGameStore } from '../store/gameStore';
import { X, Construction, CircuitBoard } from 'lucide-react';

// Import เกม
import { FallingNumbersGame } from '../games/FallingNumbersGame';
import { BaseDefenseGame } from '../games/BaseDefenseGame';
import { QuickMathGame } from '../games/QuickMathGame';
import { MathSnakeGame } from '../games/MathSnakeGame';
import { Puzzle2048Game } from '../games/Puzzle2048Game';
import { SpaceShooterGame } from '../games/SpaceShooterGame';
import { TimeBombGame } from '../games/TimeBombGame';
import { MonsterSlayerGame } from '../games/MonsterSlayerGame';
import { DungeonCrawlerGame } from '../games/DungeonCrawlerGame';
import { MemoryCardGame } from '../games/MemoryCardGame';

const ScoreDisplay = () => {
  const currentScore = useGameStore(state => state.currentScore); 
  return (
    <div className="bg-black/60 px-4 md:px-6 py-1.5 rounded-lg border border-slate-700 shadow-inner flex items-center gap-3 md:gap-4">
      <div className="flex flex-col items-end leading-none">
        <span className="text-[7px] md:text-[9px] text-cyan-500 uppercase font-black tracking-widest">Score</span>
        <span className="text-xl md:text-3xl font-mono font-black text-white tabular-nums">
            {currentScore}
        </span>
      </div>
    </div>
  );
};

export const GameContainer = () => {
  const activeGame = useGameStore(state => state.activeGame);
  const quitGame = useGameStore(state => state.quitGame);

  const gameComponents: Record<string, React.ReactNode> = {
    'falling-numbers': <FallingNumbersGame />,
    'base-defense': <BaseDefenseGame />,
    'quick-math': <QuickMathGame />,
    'math-snake': <MathSnakeGame />,
    'puzzle-2048': <Puzzle2048Game />,
    'space-shooter': <SpaceShooterGame />,
    'time-bomb': <TimeBombGame />,
    'monster-slayer': <MonsterSlayerGame />,
    'dungeon-crawler': <DungeonCrawlerGame />,
    'memory-card': <MemoryCardGame />,
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05050a] flex flex-col font-sans select-none overflow-hidden">
      
      {/* Header HUD - Compact for Mobile */}
      <div className="relative z-50 flex justify-between items-center px-4 py-2 md:px-6 md:py-3 bg-[#0f111a] border-b border-slate-800 shadow-xl">
        <div className="flex items-center">
           <ScoreDisplay />
        </div>

        {/* Exit Button */}
        <button 
            onClick={quitGame} 
            className="p-2 md:p-3 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-lg transition-all active:scale-90"
        >
          <X size={20} className="text-slate-400 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Game Stage Area */}
      <div className="flex-1 relative overflow-hidden bg-[#020205]">
        {/* Background Grid - ปรับให้จางลงในมือถือเพื่อไม่ให้กวนสายตา */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
        
        {/* Render Active Game */}
        <div className="relative z-10 w-full h-full overflow-hidden">
            {activeGame && gameComponents[activeGame] ? (
              gameComponents[activeGame]
            ) : (
                /* Default / Coming Soon Screen */
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <CircuitBoard size={300} />
                    </div>

                    <div className="relative p-8 bg-[#0f111a] border border-slate-800 rounded-2xl shadow-2xl max-w-xs">
                       <div className="p-4 bg-black rounded-full border border-slate-700 mb-4 inline-block">
                          <Construction size={32} className="text-yellow-500 animate-bounce" />
                       </div>
                       <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">System Offline</h2>
                       <p className="text-slate-500 font-mono text-xs leading-relaxed">
                           โมดูลนี้ยังไม่เปิดใช้งานในเวอร์ชันนี้<br/>โปรดรออัปเดตถัดไป
                       </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};