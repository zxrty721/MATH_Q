import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, toBase, type ArcadeQuestion } from './gameUtils';
import { Scissors, Biohazard, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Colors for Wires (Toxic Theme) ---
const WIRE_COLORS = [
    { name: 'red', bg: 'bg-rose-600', shadow: 'shadow-rose-600/50', cut: 'bg-rose-900' },
    { name: 'blue', bg: 'bg-cyan-500', shadow: 'shadow-cyan-500/50', cut: 'bg-cyan-900' },
    { name: 'green', bg: 'bg-lime-500', shadow: 'shadow-lime-500/50', cut: 'bg-lime-900' },
    { name: 'yellow', bg: 'bg-yellow-400', shadow: 'shadow-yellow-400/50', cut: 'bg-yellow-700' },
];

export const TimeBombGame = () => {
    const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
    
    // State
    const [timeLeft, setTimeLeft] = useState(30);
    const [question, setQuestion] = useState<ArcadeQuestion | null>(null);
    const [wires, setWires] = useState<{ id: number, val: string, color: any, isCut: boolean }[]>([]);
    const [isExploded, setIsExploded] = useState(false);
    const [shake, setShake] = useState(false);
    const [isRoundOver, setIsRoundOver] = useState(false); 

    const hasSaved = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const diffConfig = getDifficultyConfig(selectedDifficulty);

    // --- Init Round ---
    const nextRound = () => {
        const q = generateQuestion(currentBase, selectedDifficulty);
        setQuestion(q);
        setIsRoundOver(false); 

        const newWires = [];
        const correctIndex = Math.floor(Math.random() * 4);
        const shuffledColors = [...WIRE_COLORS].sort(() => 0.5 - Math.random());

        for(let i=0; i<4; i++) {
            let val = '';
            if(i === correctIndex) {
                val = q.answer;
            } else {
                let fake = toBase(q.value + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 10) + 1), currentBase);
                if(fake === q.answer) fake = toBase(q.value + 20, currentBase);
                val = fake;
            }
            newWires.push({
                id: i,
                val: val,
                color: shuffledColors[i],
                isCut: false
            });
        }
        setWires(newWires);
    };

    const startGame = () => {
        resetScore();
        setIsExploded(false);
        hasSaved.current = false;
        setTimeLeft(selectedDifficulty === 'hard' ? 20 : 40);
        nextRound();

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    setIsExploded(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        startGame();
        return () => { if(timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // --- Interaction ---
   const cutWire = (index: number) => {
        if(isExploded || wires[index].isCut || isRoundOver) return;

        const targetWire = wires[index];
        const isCorrect = targetWire.val === question?.answer;

        const updatedWires = [...wires];
        updatedWires[index].isCut = true;
        setWires(updatedWires);

        if (isCorrect) {
            setIsRoundOver(true); 
            addScore(1 * diffConfig.scoreMod);
            setTimeLeft(prev => Math.min(prev + 5, 99)); 
            
            confetti({ 
                particleCount: 40, 
                spread: 70, 
                origin: { y: 0.7 },
                colors: ['#84cc16', '#22c55e', '#ffffff'] // Lime, Green, White
            });
            setTimeout(nextRound, 500); 
        } else {
            setIsRoundOver(true); 
            setShake(true);
            setTimeout(() => setShake(false), 300);
            setTimeLeft(prev => {
                const newVal = prev - 10;
                if(newVal <= 0) {
                    setIsExploded(true);
                    return 0;
                }
                return newVal;
            });
            setTimeout(() => {
                if(!isExploded) nextRound();
            }, 1000);
        }
    };

    // Save Score
    useEffect(() => {
        if (isExploded && !hasSaved.current && currentScore > 0) {
            hasSaved.current = true;
            saveHighScore({ mode: 'time-bomb' });
            if(timerRef.current) clearInterval(timerRef.current);
        }
    }, [isExploded]);

    if (isExploded) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-in zoom-in bg-[#051a05] z-50 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/virus.png')] opacity-20 pointer-events-none" />
                
                <Biohazard size={120} className="text-lime-500 mb-6 animate-spin-slow drop-shadow-[0_0_30px_rgba(132,204,22,0.8)]" />
                <h2 className="text-7xl font-black text-lime-400 tracking-tighter drop-shadow-[0_0_10px_rgba(132,204,22,0.8)] uppercase">CONTAINMENT FAILED</h2>
                <div className="text-lime-800 text-2xl mt-4 font-bold bg-lime-400/90 px-4 py-1 rounded">FINAL SCORE: {currentScore}</div>
                
                <button onClick={startGame} className="mt-10 px-12 py-4 bg-lime-700 hover:bg-lime-600 text-white rounded-none border-4 border-lime-400 font-bold text-2xl shadow-[0_0_30px_rgba(132,204,22,0.4)] flex items-center gap-3 active:scale-95 transition-all">
                    <RotateCcw size={28} /> DECONTAMINATE
                </button>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full bg-[#0a0f0a] flex flex-col items-center justify-center font-sans overflow-hidden ${shake ? 'animate-shake' : ''}`}>
            
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#0f1f0f_0,#0f1f0f_10px,#0a0f0a_10px,#0a0f0a_20px)] opacity-50 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(132,204,22,0.15)_0%,transparent_70%)] pointer-events-none" />

            {/* Bomb Container */}
            <div className="relative bg-[#1a2e1a] p-6 md:p-10 rounded-xl border-4 border-[#2f4f2f] shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-lg w-full flex flex-col gap-6">
                
                {/* Hazard Tape */}
                <div className="absolute top-0 left-4 right-4 h-4 bg-[repeating-linear-gradient(45deg,#facc15_0,#facc15_10px,#000_10px,#000_20px)] rounded-b-md opacity-80" />
                
                {/* Timer Screen */}
                <div className="bg-black border-4 border-[#3f5f3f] rounded-lg p-6 mt-4 text-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(132,204,22,0.1)_2px,transparent_2px)] bg-[size:100%_4px] pointer-events-none z-10" />
                    
                    <div className="flex justify-between items-center mb-2">
                         <Biohazard size={20} className="text-lime-700 animate-pulse" />
                         <span className="text-[10px] text-lime-800 font-bold tracking-[0.3em] uppercase">BIO-TIMER</span>
                         <Biohazard size={20} className="text-lime-700 animate-pulse" />
                    </div>

                    <div className={`text-6xl md:text-7xl font-mono font-black tracking-widest drop-shadow-[0_0_15px_rgba(132,204,22,0.5)] ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-lime-500'}`}>
                        00:{timeLeft.toString().padStart(2, '0')}
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <span className="text-lime-700 text-xs font-bold uppercase tracking-widest">NEUTRALIZE:</span>
                        <span className="text-white text-xl md:text-2xl font-mono bg-[#0f1f0f] px-3 py-1 rounded border border-lime-800/50">
                            {question?.display}
                        </span>
                    </div>
                </div>

                {/* Wires */}
                <div className="flex flex-col gap-4 relative px-2 pb-2">
                    {wires.map((wire) => (
                        <button 
                            key={wire.id}
                            onClick={() => cutWire(wire.id)}
                            disabled={wire.isCut || isRoundOver}
                            className={`group relative h-14 w-full flex items-center justify-between px-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                            {/* Wire Line */}
                            <div className={`absolute inset-x-0 h-3 top-1/2 -translate-y-1/2 rounded-full shadow-lg transition-all ${wire.isCut ? wire.color.cut + ' w-[48%]' : wire.color.bg + ' ' + wire.color.shadow}`} />
                            
                            {/* Cut End Right (if cut) */}
                            {wire.isCut && (
                                <div className={`absolute right-0 h-3 top-1/2 -translate-y-1/2 rounded-full w-[48%] ${wire.color.cut}`} />
                            )}

                            {/* Label Tag */}
                            <div className="relative z-10 bg-[#e5e7eb] text-black font-black font-mono text-xl px-2 py-1 rounded shadow border-2 border-[#9ca3af] group-hover:scale-110 transition-transform skew-x-[-10deg]">
                                {wire.val}
                            </div>

                            {/* Tool Icon */}
                            {!wire.isCut && (
                                <div className="relative z-10 text-white/30 group-hover:text-lime-400 transition-colors">
                                    <Scissors size={20} className="rotate-90" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Rust / Grime Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grunge-wall.png')] opacity-10 pointer-events-none mix-blend-multiply rounded-xl" />
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(3px, 3px) rotate(2deg); }
                    50% { transform: translate(0, 0) rotate(0eg); }
                    75% { transform: translate(-3px, 3px) rotate(-2deg); }
                }
                .animate-shake { animation: shake 0.1s infinite; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};