import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, type ArcadeQuestion } from './gameUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, RotateCcw, Cpu } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- ⚡ Optimized Component: Falling Item ---
const FallingItem = memo(({ problem, spawnX, isSolved, speed, onComplete }: { 
  problem: ArcadeQuestion, 
  spawnX: number, 
  isSolved: boolean, 
  speed: number,
  onComplete: (def: string) => void 
}) => {
  return (
    <motion.div
      key={problem.id}
      variants={{
        initial: { y: -100, opacity: 0, scale: 0.8 },
        // ✅ ปรับระยะการตกให้หยุดสูงขึ้นในมือถือ (55vh) เพื่อหลบคีย์บอร์ด
        falling: { y: window.innerWidth < 768 ? "55vh" : "68vh", opacity: 1, scale: 1 },
        solved: { scale: 1.5, opacity: 0, rotate: 180 }
      }}
      initial="initial"
      animate={isSolved ? "solved" : "falling"}
      transition={{ 
        duration: isSolved ? 0.3 : 14 / speed, 
        ease: isSolved ? "backIn" : "linear" 
      }}
      onAnimationComplete={onComplete}
      className="absolute top-0 z-20 flex flex-col items-center will-change-transform"
      style={{ left: `${spawnX}%` }}
    >
      <div className="relative group min-w-[80px] md:min-w-[110px]">
        {/* Laser Trail - สั้นลงในมือถือ */}
        <div className="absolute -top-20 md:-top-32 inset-x-1/2 w-[1px] md:w-[2px] h-20 md:h-32 bg-gradient-to-t from-cyan-400 to-transparent opacity-40" />

        <div className={`relative px-4 py-3 md:px-6 md:py-4 bg-slate-900/95 backdrop-blur border-2 md:border-[3px] ${isSolved ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]'} rounded-xl flex items-center justify-center overflow-hidden`}>
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')]" />
           
           <div className="flex items-center gap-2 md:gap-3 z-10">
              <Cpu size={16} className={isSolved ? "text-emerald-400" : "text-cyan-400"} />
              <div className="text-white font-mono font-black text-2xl md:text-4xl tracking-tighter md:tracking-widest whitespace-nowrap">
                  {problem.display.split('=')[0]}
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
});

export const FallingNumbersGame = () => {
  const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
  const [problem, setProblem] = useState<any>(null);
  const [input, setInput] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [spawnX, setSpawnX] = useState(50);
  const [isSolved, setIsSolved] = useState(false);
  
  const hasSaved = useRef(false);
  const diffConfig = getDifficultyConfig(selectedDifficulty);
  const inputRef = useRef<HTMLInputElement>(null);

  const spawn = useCallback(() => {
    const q = generateQuestion(currentBase, selectedDifficulty);
    // ✅ บีบระยะเกิดในมือถือให้แคบลง (25-75%) เพื่อไม่ให้ล้นขอบ
    const isMobile = window.innerWidth < 768;
    const randomX = isMobile 
        ? Math.floor(Math.random() * 50) + 25 
        : Math.floor(Math.random() * 70) + 15;
    
    setIsSolved(false);
    setSpawnX(randomX);
    setProblem({ ...q, id: Date.now() });
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentBase, selectedDifficulty]);

  const restartGame = useCallback(() => {
    resetScore();
    setIsGameOver(false);
    hasSaved.current = false; 
    setProblem(null);
    spawn();
  }, [resetScore, spawn]);

  useEffect(() => { restartGame(); }, [restartGame]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!problem || isSolved) return;
      if (input.toUpperCase() === problem.answer) {
        setIsSolved(true);
        addScore(1 * diffConfig.scoreMod);
        confetti({ particleCount: 30, origin: { x: spawnX / 100, y: 0.6 } });
        setTimeout(() => { if (!isGameOver) spawn(); }, 300); 
      } else {
        setInput('');
        document.getElementById('input-container')?.classList.add('animate-glitch-shake');
        setTimeout(() => document.getElementById('input-container')?.classList.remove('animate-glitch-shake'), 400);
      }
    }
  };

  const handleAnimationComplete = useCallback((definition: string) => {
    if (definition === 'falling' && !isSolved) {
      setIsGameOver(true);
      if (!hasSaved.current && currentScore > 0) {
        hasSaved.current = true;
        saveHighScore({ mode: 'falling-numbers' });
      }
    }
  }, [isSolved, currentScore, saveHighScore]);

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#05050a] text-cyan-400 p-6 z-50">
        <Terminal size={60} className="mb-4 text-red-500" />
        <h2 className="text-4xl md:text-7xl font-black text-white text-center mb-6">SYSTEM FAILURE</h2>
        <div className="bg-slate-900 border border-red-500/30 p-6 rounded-2xl text-center mb-8">
            <p className="text-slate-400 text-sm uppercase tracking-widest">Final Score</p>
            <p className="text-5xl font-black text-white">{currentScore}</p>
        </div>
        <button onClick={restartGame} className="px-10 py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform flex items-center gap-2">
            <RotateCcw size={20} /> REBOOT
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#05050a] overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#1e293b_0%,#05050a_100%)] opacity-70" />
      
      <AnimatePresence>
        {problem && !isGameOver && (
          <FallingItem problem={problem} spawnX={spawnX} isSolved={isSolved} speed={diffConfig.speedMod} onComplete={handleAnimationComplete} />
        )}
      </AnimatePresence>

      {/* ✅ Input Console: ปรับตำแหน่งและขนาดให้เหมาะกับมือถือ */}
      <div className="absolute bottom-6 md:bottom-10 z-30 w-full px-4 max-w-lg">
        <div id="input-container" className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-4 md:p-6 rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
                <p className="text-cyan-400 text-[10px] md:text-xs tracking-[0.3em] font-bold uppercase">DECRYPT: BASE {currentBase}</p>
            </div>
            
            <div className="relative w-full">
                <input 
                    ref={inputRef}
                    inputMode="text" // ให้มือถือเปิดคีย์บอร์ดแบบปกติแต่รองรับ A-F
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-black/50 border-2 border-cyan-500/50 text-center text-2xl md:text-4xl font-black text-white py-3 rounded-xl focus:border-cyan-400 outline-none font-mono"
                    placeholder="ENTER CODE"
                    autoComplete="off"
                />
            </div>
        </div>
      </div>

      <style>{`
        @keyframes glitch-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); border-color: #ef4444; }
          75% { transform: translateX(5px); border-color: #ef4444; }
        }
        .animate-glitch-shake { animation: glitch-shake 0.2s ease-in-out 2; }
      `}</style>
    </div>
  );
};