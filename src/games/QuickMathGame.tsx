import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, toBase } from './gameUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Timer, RotateCcw, AlertTriangle } from 'lucide-react';
// --- ⚡ Visual Components ---

const PowerBar = memo(({ timeLeft, maxTime, isCritical }: { timeLeft: number, maxTime: number, isCritical: boolean }) => {
  const progress = (timeLeft / maxTime) * 100;
  
  return (
    <div className="w-full max-w-2xl mt-1 z-20 relative px-2">
        <div className="flex justify-between items-end mb-1 font-mono font-bold">
            <span className={`flex items-center gap-1 text-[10px] md:text-xs tracking-widest ${isCritical ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
              <Timer size={14} /> POWER CELL
            </span>
            <span className={`text-2xl md:text-4xl tabular-nums drop-shadow-[0_0_8px_currentColor] ${isCritical ? 'text-red-500' : 'text-white'}`}>
                {(timeLeft / 1).toFixed(1)}<span className="text-xs ml-0.5 opacity-60">s</span>
            </span>
        </div>
        
        <div className="h-3 md:h-4 bg-slate-900/80 rounded-full border border-slate-700 overflow-hidden relative shadow-inner">
            <motion.div 
                className={`h-full relative z-0 ${isCritical ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_15px_red]' : 'bg-gradient-to-r from-cyan-600 to-blue-500 shadow-[0_0_10px_cyan]'}`}
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.2 }}
            />
        </div>
    </div>
  );
});

const QuestionUnit = memo(({ display, combo }: { display: string, combo: number }) => {
    // ✅ Dynamic Font Size based on text length (Fix Base 2 Overflow)
    const getFontSize = (text: string) => {
        const len = text?.length || 0;
        if (len > 12) return 'text-2xl md:text-5xl';
        if (len > 8) return 'text-4xl md:text-7xl';
        return 'text-5xl md:text-9xl';
    };

    return (
        <div className="flex-1 flex items-center justify-center w-full max-w-4xl z-10 relative mx-auto px-4 py-4">
            <div className={`absolute inset-0 bg-gradient-to-r blur-3xl opacity-20 transition-colors duration-300
                ${combo > 5 ? 'from-purple-600 to-pink-600' : combo > 2 ? 'from-yellow-500 to-orange-600' : 'from-cyan-500 to-blue-600'}`} 
            />
            
            <div className="relative group w-full transform transition-all duration-300">
                <div className="bg-[#0f172a]/95 backdrop-blur-md border-y-2 md:border-y-4 border-slate-500/20 p-8 md:p-14 text-center shadow-2xl relative overflow-hidden rounded-2xl">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] text-slate-500 tracking-[0.4em] font-bold uppercase z-10">
                        Target Value
                    </div>

                    <div className={`relative z-10 font-black tracking-tighter font-mono break-all leading-tight
                        ${getFontSize(display)}
                        ${combo > 5 ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]'}
                    `}>
                        {display}
                    </div>
                </div>
            </div>
        </div>
    );
});

const ChoicesGrid = memo(({ choices, onAnswer, disabled }: { choices: string[], onAnswer: (c: string) => void, disabled: boolean }) => {
    const getChoiceFontSize = (text: string) => {
        return text.length > 8 ? 'text-lg md:text-3xl' : 'text-2xl md:text-5xl';
    };

    return (
        <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-2xl mb-6 md:mb-10 z-20 px-2 mx-auto shrink-0">
            {choices.map((choice, i) => (
            <button
                key={`${choice}-${i}`}
                onClick={() => onAnswer(choice)}
                disabled={disabled}
                className="relative overflow-hidden bg-[#1e293b] hover:bg-[#334155] border-2 border-slate-700 active:border-cyan-400 rounded-xl group transition-all duration-100 shadow-lg active:scale-95 h-20 md:h-28 flex items-center justify-center p-2"
            >
                <span className={`relative z-10 font-black text-slate-200 group-active:text-white transition-all font-mono break-all ${getChoiceFontSize(choice)}`}>
                    {choice}
                </span>
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-slate-500" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-slate-500" />
            </button>
            ))}
        </div>
    );
});

// --- Main Logic ---

export const QuickMathGame = () => {
  const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
  
  const [problem, setProblem] = useState<any>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  
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
    while (choiceSet.size < 4 && safety < 100) {
      const offset = (Math.floor(Math.random() * (currentBase === 2 ? 4 : 10)) + 1) * (Math.random() > 0.5 ? 1 : -1);
      let fakeVal = q.value + offset;
      if (fakeVal < 0) fakeVal = 0;
      
      const fakeStr = toBase(fakeVal, currentBase);
      if (fakeStr !== q.answer) choiceSet.add(fakeStr);
      safety++;
    }
    while (choiceSet.size < 4) choiceSet.add(toBase(q.value + choiceSet.size + 1, currentBase));

    // Improved Shuffle
    const initialChoices = Array.from(choiceSet);
    setChoices([...initialChoices].sort(() => Math.random() - 0.5));
  }, [currentBase, selectedDifficulty]);

  const restartGame = useCallback(() => {
    resetScore();
    setIsGameOver(false);
    hasSaved.current = false;
    setTimeLeft(maxTime);
    setCombo(0);
    nextRound();
  }, [resetScore, maxTime, nextRound]);

  useEffect(() => { restartGame(); }, [restartGame]);

  useEffect(() => {
    if (isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) { setIsGameOver(true); return 0; }
        return prev - 0.1; 
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isGameOver]);

  const handleAnswer = useCallback((ans: string) => {
    if (isGameOver) return;

    if (ans === problem?.answer) {
      const comboBonus = Math.min(combo, 5); 
      addScore((1 * diffConfig.scoreMod) + comboBonus);
      setCombo(c => c + 1);
      setTimeLeft(prev => Math.min(prev + (combo > 3 ? 2.5 : 1.5), maxTime));
      setAddedTime(true);
      setScreenFlash('green');
      setTimeout(() => { setAddedTime(false); setScreenFlash(null); }, 300);
      nextRound();
    } else {
      setCombo(0);
      setShake(true);
      setScreenFlash('red');
      setTimeout(() => { setShake(false); setScreenFlash(null); }, 400);
      setTimeLeft(prev => Math.max(0, prev - 4)); 
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
      <div className="flex flex-col items-center justify-center h-full bg-[#050505] text-white p-6 z-50 text-center">
        <AlertTriangle size={60} className="text-red-500 mb-4" />
        <h2 className="text-4xl md:text-6xl font-black mb-6">SYSTEM<br/><span className="text-red-500">OFFLINE</span></h2>
        <div className="bg-slate-900 px-8 py-4 rounded-xl border border-white/10 mb-8">
            <span className="text-slate-400 text-xs uppercase tracking-widest">Score</span>
            <div className="text-4xl font-black">{currentScore}</div>
        </div>
        <button onClick={restartGame} className="px-8 py-4 bg-cyan-600 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-all">
          <RotateCcw size={20} /> REBOOT
        </button>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-[#020617] flex flex-col items-center p-2 md:p-4 overflow-hidden ${shake ? 'animate-shake' : ''}`}>
      <div className={`absolute inset-0 z-0 transition-opacity duration-150 ${screenFlash === 'green' ? 'bg-cyan-500/10' : screenFlash === 'red' ? 'bg-red-500/20' : 'opacity-0'}`} />
      
      {/* HUD */}
      <div className="w-full flex justify-between items-center px-2 z-20">
          <div className="flex flex-col">
              <span className="text-[8px] uppercase text-slate-500 tracking-tighter">Multiplier</span>
              <div className="flex items-center gap-1">
                <Zap size={14} className={combo > 0 ? "text-yellow-400 fill-yellow-400" : "text-slate-700"} />
                <span className={`font-black text-xl font-mono ${combo > 0 ? 'text-yellow-400' : 'text-slate-700'}`}>{combo}x</span>
              </div>
          </div>
          <div className="text-right">
              <span className="text-[8px] uppercase text-slate-500 tracking-tighter">Output</span>
              <div className="text-xl font-bold font-mono text-white">{currentScore}</div>
          </div>
      </div>

      <PowerBar timeLeft={timeLeft} maxTime={maxTime} isCritical={timeLeft <= 5} />

      <div className="flex-1 flex flex-col justify-center items-center w-full min-h-0">
        <QuestionUnit display={problem?.display} combo={combo} />
      </div>

      <ChoicesGrid choices={choices} onAnswer={handleAnswer} disabled={false} />

      <AnimatePresence>
        {addedTime && (
            <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -40 }} exit={{ opacity: 0 }}
                className="absolute top-1/2 text-green-400 font-black text-3xl z-50 pointer-events-none">+TIME</motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px) rotate(-1deg); }
          75% { transform: translateX(8px) rotate(1deg); }
        }
        .animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};