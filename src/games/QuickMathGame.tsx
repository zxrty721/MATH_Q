import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, toBase } from './gameUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Timer, Trophy, RotateCcw, BatteryCharging, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- ⚡ Visual Components ---

const PowerBar = memo(({ timeLeft, maxTime, isCritical }: { timeLeft: number, maxTime: number, isCritical: boolean }) => {
  const progress = (timeLeft / maxTime) * 100;
  
  return (
    <div className="w-full max-w-3xl mt-2 z-20 relative px-4 md:px-0">
        <div className="flex justify-between items-end mb-1 font-mono font-bold tracking-widest">
            <span className={`flex items-center gap-2 ${isCritical ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
              <Timer size={18} /> POWER CELL
            </span>
            <span className={`text-4xl tabular-nums drop-shadow-[0_0_10px_currentColor] ${isCritical ? 'text-red-500' : 'text-white'}`}>
                {(timeLeft / 1).toFixed(1)}<span className="text-sm ml-1 opacity-60">s</span>
            </span>
        </div>
        
        {/* Bar Container */}
        <div className="h-4 bg-slate-900/80 rounded-sm border border-slate-700 overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_95%,rgba(0,0,0,0.5)_95%)] bg-[size:20px_100%] z-10 pointer-events-none" />
            
            {/* Liquid Energy */}
            <motion.div 
                className={`h-full relative z-0 ${isCritical ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_20px_red]' : 'bg-gradient-to-r from-cyan-600 to-blue-500 shadow-[0_0_15px_cyan]'}`}
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.2 }}
            >
                <div className="absolute inset-0 bg-white/20 animate-pulse-fast" />
            </motion.div>
        </div>
    </div>
  );
});

const QuestionUnit = memo(({ display, combo }: { display: string, combo: number }) => (
    // ✅ FIX: เพิ่ม mx-auto และปรับ padding
    <div className="flex-1 flex items-center justify-center w-full max-w-4xl z-10 relative mx-auto px-4">
        {/* Reactor Core Glow */}
        <div className={`absolute inset-0 bg-gradient-to-r blur-3xl opacity-30 transition-colors duration-300
            ${combo > 5 ? 'from-purple-600 to-pink-600' : combo > 2 ? 'from-yellow-500 to-orange-600' : 'from-cyan-500 to-blue-600'}`} 
        />
        
        <div className="relative group w-full transform transition-all duration-300 scale-100 hover:scale-[1.02]">
            {/* Frame */}
            <div className="bg-[#0f172a]/90 backdrop-blur-md border-y-4 border-slate-500/30 p-10 md:p-14 text-center shadow-2xl relative overflow-hidden rounded-xl">
                {/* Scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,27,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] pointer-events-none z-0" />
                
                {/* Label */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 tracking-[0.5em] font-bold uppercase z-10">
                    Target Value
                </div>

                {/* Number */}
                <div className={`relative z-10 text-6xl md:text-9xl font-black tracking-tighter drop-shadow-2xl font-mono
                    ${combo > 5 ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]' : 'text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]'}
                `}>
                    {display}
                </div>
            </div>
            
            {/* Mechanical Details */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-16 bg-slate-700 rounded-r-md border-l border-white/10" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-16 bg-slate-700 rounded-l-md border-r border-white/10" />
        </div>
    </div>
));

const ChoicesGrid = memo(({ choices, onAnswer, disabled }: { choices: string[], onAnswer: (c: string) => void, disabled: boolean }) => (
    <div className="grid grid-cols-2 gap-3 md:gap-6 w-full max-w-3xl mb-4 md:mb-8 z-20 px-4 md:px-0 mx-auto">
        {choices.map((choice, i) => (
          <button
            key={`${choice}-${i}`}
            onClick={() => onAnswer(choice)}
            disabled={disabled}
            className="relative overflow-hidden bg-[#1e293b] hover:bg-[#334155] border-2 border-slate-700 hover:border-cyan-400 rounded-lg group transition-all duration-100 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-24 md:h-32 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors duration-200" />
            
            <span className="relative z-10 text-3xl md:text-5xl font-black text-slate-200 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all font-mono">
                {choice}
            </span>
            
            {/* Tech Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-slate-500 group-hover:border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-slate-500 group-hover:border-cyan-400" />
          </button>
        ))}
    </div>
));

// --- Main Logic ---

export const QuickMathGame = () => {
  const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
  
  const [problem, setProblem] = useState<any>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  
  // Effects
  const [shake, setShake] = useState(false);
  const [screenFlash, setScreenFlash] = useState<'green' | 'red' | null>(null);
  const [addedTime, setAddedTime] = useState(false);
  
  const hasSaved = useRef(false);
  const diffConfig = getDifficultyConfig(selectedDifficulty);
  const maxTime = diffConfig.speedMod === 1 ? 60 : diffConfig.speedMod === 1.5 ? 45 : 30;

  const nextRound = useCallback(() => {
    const q = generateQuestion(currentBase, selectedDifficulty);
    setProblem(q);
    
    const choiceSet = new Set<string>();
    choiceSet.add(q.answer);

    let safety = 0;
    while (choiceSet.size < 4 && safety < 50) {
      const offset = (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.5 ? 1 : -1);
      let fakeVal = q.value + offset;
      if (fakeVal < 0) fakeVal = 0;
      
      const fakeStr = toBase(fakeVal, currentBase);
      if (fakeStr !== q.answer) choiceSet.add(fakeStr);
      safety++;
    }
    while (choiceSet.size < 4) choiceSet.add(toBase(q.value + choiceSet.size + 5, currentBase));

    setChoices(Array.from(choiceSet).sort(() => 0.5 - Math.random()));
  }, [currentBase, selectedDifficulty]);

  const restartGame = useCallback(() => {
    resetScore();
    setIsGameOver(false);
    hasSaved.current = false;
    setTimeLeft(maxTime);
    setCombo(0);
    setScreenFlash(null);
    nextRound();
  }, [resetScore, maxTime, nextRound]);

  useEffect(() => {
    restartGame();
  }, [restartGame]);

  useEffect(() => {
    if (isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setIsGameOver(true);
          return 0;
        }
        return prev - 0.1; 
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isGameOver]);

  const handleAnswer = useCallback((ans: string) => {
    if (isGameOver) return;

    if (ans === problem?.answer) {
      // ✅ CORRECT
      const comboBonus = Math.min(combo, 5); 
      addScore((1 * diffConfig.scoreMod) + comboBonus);
      setCombo(c => c + 1);
      
      const bonusTime = combo > 3 ? 3 : 2;
      setTimeLeft(prev => Math.min(prev + bonusTime, maxTime));
      
      setAddedTime(true);
      setScreenFlash('green');
      setTimeout(() => {
        setAddedTime(false);
        setScreenFlash(null);
      }, 300);

      if (combo > 2) {
          confetti({
            particleCount: 20 + (combo * 5),
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#22d3ee', '#ffffff']
          });
      }

      nextRound();
    } else {
      // ❌ WRONG
      setCombo(0);
      setShake(true);
      setScreenFlash('red');
      setTimeout(() => {
        setShake(false);
        setScreenFlash(null);
      }, 400);
      
      setTimeLeft(prev => Math.max(0, prev - 5)); 
      nextRound();
    }
  }, [isGameOver, problem, diffConfig.scoreMod, maxTime, nextRound, addScore, combo]);

  useEffect(() => {
    if (isGameOver && !hasSaved.current && currentScore > 0) {
      hasSaved.current = true;
      saveHighScore({ mode: 'quick-math' });
    }
  }, [isGameOver, currentScore, saveHighScore]);

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#050505] text-white font-mono gap-6 animate-in zoom-in relative overflow-hidden z-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2)_0%,transparent_70%)] pointer-events-none" />
        
        <AlertTriangle size={80} className="text-red-500 animate-bounce drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
        <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter drop-shadow-lg text-center">
            SYSTEM<br/><span className="text-red-500">OFFLINE</span>
        </h2>
        
        <div className="flex flex-col items-center gap-2 bg-slate-900/80 px-10 py-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
            <span className="text-slate-400 text-sm tracking-[0.3em] uppercase">Total Output</span>
            <div className="flex items-center gap-3">
                <Trophy className="text-yellow-400" size={32} /> 
                <span className="text-white font-black text-5xl tabular-nums">{currentScore}</span>
            </div>
        </div>

        <button 
          onClick={restartGame} 
          className="mt-6 px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xl rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all uppercase transform hover:scale-105 active:scale-95 flex items-center gap-3 tracking-widest"
        >
          <RotateCcw size={24} /> REBOOT SYSTEM
        </button>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-[#020617] overflow-hidden flex flex-col items-center p-4 font-sans select-none ${shake ? 'animate-shake' : ''}`}>
      
      {/* 🌌 Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1e293b_0%,#020617_100%)] z-0" />
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] pointer-events-none mix-blend-overlay" />
      
      <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-150 ${screenFlash === 'green' ? 'bg-cyan-500/20' : screenFlash === 'red' ? 'bg-red-500/30' : 'opacity-0'}`} />
      
      {timeLeft <= 5 && (
        <div className="absolute inset-0 border-[10px] border-red-600/50 animate-pulse pointer-events-none z-50 shadow-[inset_0_0_50px_red]" />
      )}

      {/* ⚡ Voltage/Combo Indicator */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
          <div className="flex items-center gap-1">
            <Zap size={20} className={combo > 0 ? "text-yellow-400 fill-yellow-400 animate-bounce" : "text-slate-700"} />
            <span className={`font-black text-2xl font-mono ${combo > 0 ? 'text-yellow-400' : 'text-slate-700'}`}>
                {combo > 0 ? `${combo}x` : '0x'}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Voltage Multiplier</span>
      </div>

      <AnimatePresence>
        {addedTime && (
            <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1.2, y: -50 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/3 text-green-400 font-black text-5xl z-50 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] pointer-events-none flex items-center"
            >
            <BatteryCharging size={40} className="mr-2" /> +Time
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- HUD Layout --- */}
      
      {/* Timer Bar */}
      <PowerBar timeLeft={timeLeft} maxTime={maxTime} isCritical={timeLeft <= 5} />

      <div className="mt-2 text-slate-500 font-mono text-xs tracking-widest uppercase relative z-20">
        Current Output: <span className="text-white font-bold">{currentScore}</span> units
      </div>

      {/* ✅ FIX: เพิ่ม items-center เพื่อให้กล่องคำถามอยู่ตรงกลางจอแนวนอน */}
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <QuestionUnit display={problem?.display} combo={combo} />
      </div>

      {/* Choices */}
      <ChoicesGrid choices={choices} onAnswer={handleAnswer} disabled={false} />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px) rotate(-2deg); }
          75% { transform: translateX(10px) rotate(2deg); }
        }
        .animate-shake {
          animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes pulse-fast {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 0.4; }
        }
        .animate-pulse-fast {
            animation: pulse-fast 1s infinite;
        }
      `}</style>
    </div>
  );
};