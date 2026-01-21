import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, type ArcadeQuestion } from './gameUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, RotateCcw, Cpu, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- ⚡ Optimized Component: ตัวเลขที่กำลังตก (Data Packet) ---
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
        initial: { y: -150, opacity: 0, scale: 0.8 },
        // ✅ FIX: ลดระดับการตกลงมาที่ 72vh พอ เพื่อไม่ให้จมลงไปหลัง Input Bar
        falling: { y: "72vh", opacity: 1, scale: 1 },
        solved: { scale: 1.8, opacity: 0, rotate: 360 }
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
      {/* Cyber Data Chip Style */}
      <div className="relative group min-w-[110px]">
        {/* Data Trail (Laser) - ยาวขึ้นเล็กน้อย */}
        <div className="absolute -top-32 inset-x-1/2 w-[2px] h-32 bg-gradient-to-t from-cyan-400 to-transparent opacity-60" />

        {/* Chip Body */}
        <div className={`relative px-6 py-4 bg-slate-900/90 backdrop-blur border-[3px] ${isSolved ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.6)]' : 'border-cyan-500 shadow-[0_0_25px_rgba(34,211,238,0.5)]'} rounded-lg flex items-center justify-center overflow-hidden transition-all group-hover:scale-105`}>
           
           {/* Circuit Pattern */}
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')]" />
           
           {/* Scanning Line Effect */}
           <div className="absolute inset-0 h-full w-4 bg-cyan-400/20 skew-x-12 animate-scan" style={{ animationDuration: '1.5s' }} />

           {/* Problem Display */}
           <div className="flex items-center gap-3 z-10">
              <Cpu size={20} className={isSolved ? "text-emerald-400" : "text-cyan-400 animate-pulse"} />
              <div className="text-white font-mono font-black text-3xl md:text-4xl tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">
                  {problem.display.split('=')[0]}
              </div>
           </div>

           {/* Corner LEDs */}
           <div className="absolute top-1.5 left-1.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
           <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-300" />
           <div className="absolute bottom-1.5 left-1.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-500" />
           <div className="absolute bottom-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-700" />
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

  // --- Logic ---
  
  const spawn = useCallback(() => {
    if (useGameStore.getState().currentScore < 0) return;

    const q = generateQuestion(currentBase, selectedDifficulty);
    const randomX = Math.floor(Math.random() * 70) + 15; // บีบขอบเขตการเกิดเข้ามาหน่อย ไม่ให้ชิดขอบจอเกินไป
    
    setIsSolved(false);
    setSpawnX(randomX);
    setProblem({ ...q, id: Date.now() });
    setInput('');
    // Focus กลับไปที่ Input ทุกครั้งที่ข้อใหม่มา
    setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
    }, 100);
  }, [currentBase, selectedDifficulty]);

  const restartGame = useCallback(() => {
    resetScore();
    setIsGameOver(false);
    hasSaved.current = false; 
    setProblem(null);
    spawn();
  }, [resetScore, spawn]);

  useEffect(() => { 
    restartGame(); 
  }, [restartGame]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!problem || isSolved) return;

      if (input.toUpperCase() === problem.answer) {
        setIsSolved(true);
        addScore(1 * diffConfig.scoreMod);
        
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { x: spawnX / 100, y: 0.7 },
          colors: ['#22d3ee', '#34d399', '#ffffff'],
          shapes: ['square'],
          gravity: 1.5,
          scalar: 1,
          drift: 0,
          ticks: 100
        });

        setTimeout(() => {
            if (!isGameOver) spawn();
        }, 300); 

      } else {
        setInput(''); 
        const gameContainer = document.getElementById('input-container');
        if(gameContainer) {
            gameContainer.classList.remove('animate-glitch-shake');
            void gameContainer.offsetWidth;
            gameContainer.classList.add('animate-glitch-shake');
        }
      }
    }
  };

  const handleAnimationComplete = useCallback((definition: string) => {
    if (definition === 'falling' && !isSolved) {
      setIsGameOver(true);
      if (!hasSaved.current && useGameStore.getState().currentScore > 0) {
        hasSaved.current = true;
        saveHighScore({ mode: 'falling-numbers' });
      }
    }
  }, [isSolved, saveHighScore]);

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#05050a] text-cyan-400 font-mono gap-8 animate-in zoom-in relative overflow-hidden z-50">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/30 to-[#05050a] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
            <Terminal size={100} className="mb-6 text-red-500 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" />
            <h2 className="text-6xl md:text-8xl font-black text-white drop-shadow-[3px_3px_0_#dc2626] glitch-effect animate-glitch-text tracking-tighter">SYSTEM FAILURE</h2>
            
            <div className="mt-8 bg-slate-900/80 border-2 border-red-900/50 p-6 rounded-2xl backdrop-blur-sm text-center shadow-xl">
                <div className="text-xl text-red-300 mb-2 tracking-widest">DATA SECURED</div>
                <div className="text-white font-black text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{currentScore} <span className="text-xl text-slate-400">BITs</span></div>
            </div>
            
            <button 
            onClick={restartGame}
            className="mt-10 px-12 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-2xl shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all uppercase tracking-[0.2em] flex items-center gap-3 active:scale-95 rounded-xl group"
            >
            <RotateCcw size={28} className="group-hover:-rotate-180 transition-transform duration-500" /> 
            REBOOT_SYSTEM()
            </button>
        </div>
      </div>
    );
  }

  return (
    <div id="game-area" className="relative w-full h-full bg-[#05050a] overflow-hidden flex flex-col items-center font-sans select-none">
      
      {/* 🌌 Background Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#1e293b_0%,#05050a_100%)]" />
      <div className="absolute inset-0 opacity-20 pointer-events-none matrix-bg mix-blend-screen" />
      
      {/* Grid Floor Perspective */}
      <div className="absolute bottom-0 w-[150%] h-64 -left-[25%] bg-[linear-gradient(to_top,rgba(34,211,238,0.2)_1px,transparent_1px),linear-gradient(to_right,rgba(34,211,238,0.2)_1px,transparent_1px)] bg-[size:50px_50px] perspective-floor shadow-[0_-20px_40px_rgba(34,211,238,0.1)]" style={{ transform: 'perspective(600px) rotateX(60deg)' }} />

      {/* Falling Object Layer */}
      <AnimatePresence>
        {problem && !isGameOver && (
          <FallingItem 
            problem={problem}
            spawnX={spawnX}
            isSolved={isSolved}
            speed={diffConfig.speedMod}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>

      {/* ✅ NEW: Input Console (Floating Glassmorphism Bar) */}
      <div className="absolute bottom-10 z-30 w-full flex justify-center px-4">
        <div id="input-container" className="relative bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 p-5 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(34,211,238,0.1)] w-full max-w-2xl flex flex-col items-center transition-all">
            
            {/* Header Label */}
            <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-cyan-400 animate-pulse" />
                <p className="text-cyan-400 text-sm tracking-[0.4em] font-bold uppercase drop-shadow-sm">DECRYPT: BASE <span className="text-white text-base">{currentBase}</span></p>
                <Zap size={16} className="text-cyan-400 animate-pulse" />
            </div>
            
            {/* Input Box Container */}
            <div className="relative w-full max-w-md group">
                {/* Animated Border Glow */}
                <div className="absolute -inset-[3px] bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-xl opacity-40 group-focus-within:opacity-100 blur-md transition-all duration-300 animate-border-flow" />
                
                <input 
                    ref={inputRef}
                    autoFocus
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="relative w-full bg-[#0a0a12] border-2 border-cyan-500/50 text-center text-4xl font-black text-white outline-none uppercase placeholder-slate-700/50 py-3 rounded-xl shadow-inner focus:border-cyan-400 transition-all font-mono tracking-widest"
                    placeholder="INPUT CODE"
                    autoComplete="off"
                />
                {/* Blinking Cursor Effect */}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400/50 text-3xl animate-pulse pointer-events-none">_</span>
            </div>
        </div>
      </div>

      <style>{`
        /* Matrix Rain */
        .matrix-bg {
          background-image: 
            linear-gradient(0deg, transparent, rgba(34, 211, 238, 0.4) 50%, transparent 100%),
            repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(34, 211, 238, 0.05) 10px, rgba(34, 211, 238, 0.05) 20px);
          background-size: 100% 200%;
          animation: matrix-flow 15s linear infinite;
        }
        @keyframes matrix-flow {
          from { background-position: 0 0; }
          to { background-position: 0 200%; }
        }

        /* Scan Line Animation */
        @keyframes scan {
            0% { transform: translateX(-150%) skewX(15deg); }
            100% { transform: translateX(600%) skewX(15deg); }
        }
        .animate-scan {
            animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* Glitch Text & Shake */
        .glitch-effect {
          text-shadow: 4px 0 #00ffff, -4px 0 #ff0000;
        }
        @keyframes glitch-text {
          0% { text-shadow: 4px 0 #00ffff, -4px 0 #ff0000; }
          25% { text-shadow: -4px 0 #00ffff, 4px 0 #ff0000; transform: translate(3px, 2px); }
          50% { text-shadow: 4px 0 #00ffff, -4px 0 #ff0000; transform: translate(-3px, -2px); }
          75% { text-shadow: -4px 0 #00ffff, 4px 0 #ff0000; transform: translate(3px, -2px); }
          100% { text-shadow: 4px 0 #00ffff, -4px 0 #ff0000; transform: translate(0, 0); }
        }
        .animate-glitch-text {
            animation: glitch-text 0.2s infinite linear alternate-reverse;
        }

        @keyframes glitch-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px) rotate(-1deg); border-color: #ef4444; box-shadow: 0 0 20px #ef4444; }
          40% { transform: translateX(10px) rotate(1deg); border-color: #ef4444; box-shadow: 0 0 20px #ef4444;}
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .animate-glitch-shake {
          animation: glitch-shake 0.4s ease-out;
        }

        /* Border Flow Animation */
        @keyframes border-flow {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }
        .animate-border-flow {
            background-size: 200% 200%;
            animation: border-flow 2s linear infinite;
        }

        /* Perspective Floor */
        .perspective-floor {
            transform-origin: bottom center;
            mask-image: linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 80%);
        }
      `}</style>
    </div>
  );
};