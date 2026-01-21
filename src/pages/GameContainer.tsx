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
    <div className="relative group overflow-hidden bg-black/60 p-2 px-6 rounded-md border border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,1)] flex items-center gap-4">
      {/* Sheen Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
      
      <div className="flex flex-col items-end leading-none">
        <span className="text-[9px] text-cyan-500 uppercase font-bold tracking-[0.2em] mb-1">Current Score</span>
        <span className="text-3xl font-mono font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            {currentScore}
        </span>
      </div>
    </div>
  );
};

export const GameContainer = () => {
  const activeGame = useGameStore(state => state.activeGame);
  const quitGame = useGameStore(state => state.quitGame);

  return (
    <div className="fixed inset-0 z-50 bg-[#05050a] flex flex-col font-sans select-none">
      
      {/* Header HUD - Solid Design (No Blur) */}
      <div className="relative z-50 flex justify-between items-center px-6 py-3 bg-[#0f111a] border-b-2 border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        {/* Decor Lines */}
        <div className="absolute bottom-0 left-0 w-1/3 h-[2px] bg-gradient-to-r from-cyan-500/50 to-transparent" />
        <div className="absolute bottom-0 right-0 w-1/3 h-[2px] bg-gradient-to-l from-rose-500/50 to-transparent" />

        <div className="flex items-center gap-4">
           <ScoreDisplay />
        </div>

        <button 
            onClick={quitGame} 
            className="relative group p-3 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-md transition-all active:scale-95 shadow-lg overflow-hidden"
        >
          <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/10 transition-colors" />
          <X size={24} className="text-slate-400 group-hover:text-rose-500 group-hover:rotate-90 transition-all duration-300" />
        </button>
      </div>

      {/* Game Stage Area */}
      <div className="flex-1 relative overflow-hidden bg-[#020205]">
        
        {/* Background Patterns (แทนการใช้ Blur) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_120%)] pointer-events-none" />

        {/* Render Active Game */}
        <div className="relative z-10 w-full h-full">
            {activeGame === 'falling-numbers' && <FallingNumbersGame />}
            {activeGame === 'base-defense' && <BaseDefenseGame />}
            {activeGame === 'quick-math' && <QuickMathGame />}
            {activeGame === 'math-snake' && <MathSnakeGame />}
            {activeGame === 'puzzle-2048' && <Puzzle2048Game />}
            
            {activeGame === 'space-shooter' && <SpaceShooterGame />}
            {activeGame === 'time-bomb' && <TimeBombGame />}
            {activeGame === 'monster-slayer' && <MonsterSlayerGame />}
            {activeGame === 'dungeon-crawler' && <DungeonCrawlerGame />}
            {activeGame === 'memory-card' && <MemoryCardGame />}
            
            {/* Coming Soon Screen */}
            {!['falling-numbers', 'base-defense', 'quick-math', 'math-snake', 'puzzle-2048', 'space-shooter', 'time-bomb', 'monster-slayer', 'dungeon-crawler', 'memory-card'].includes(activeGame!) && (
                <div className="flex flex-col items-center justify-center h-full gap-8 relative">
                    {/* Animated Background Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                        <CircuitBoard size={400} className="animate-pulse" />
                    </div>

                    <div className="relative p-10 bg-[#0f111a] border-2 border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center max-w-md text-center">
                       {/* Warning Strip */}
                       <div className="w-full h-2 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] mb-6 rounded-full opacity-80" />
                       
                       <div className="p-6 bg-black rounded-full border border-slate-700 mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                          <Construction size={48} className="text-yellow-500 animate-bounce" />
                       </div>
                       
                       <h2 className="text-4xl font-black text-white mb-3 tracking-wider uppercase">System Offline</h2>
                       <p className="text-slate-400 font-mono text-sm leading-relaxed">
                           โมดูลเกมนี้กำลังอยู่ในขั้นตอนการพัฒนา<br/>
                           โปรดรอการอัปเดต Patch ถัดไป
                       </p>

                       <div className="mt-8 px-4 py-2 bg-slate-900 rounded border border-slate-800 text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">
                           Status: In Progress
                       </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};