import { useState, useEffect, useRef, useCallback, useMemo } from 'react'; // ✅ เพิ่ม useMemo
import { useGameStore } from '../store/gameStore';
import { getDifficultyConfig, toBase } from './gameUtils';
import { RotateCcw, ArrowRight, Heart, Zap, Clock, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
type CardData = {
    id: number;
    val: number;
    display: string;
    suit: string;
    color: string;
};

// --- Config ---
const SUITS = ['♠', '♥', '♦', '♣'];
const COLORS = ['text-cyan-400', 'text-rose-500', 'text-amber-400', 'text-emerald-400'];
const MAX_TIME = 15;

export const MemoryCardGame = () => {
    const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
    
    // State
    const [cards, setCards] = useState<CardData[]>([]);
    const [operator, setOperator] = useState<string>('+');
    const [input, setInput] = useState('');
    const [lives, setLives] = useState(3);
    const [streak, setStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState(MAX_TIME);
    const [isGameOver, setIsGameOver] = useState(false);
    
    // UI Effects
    const [shake, setShake] = useState(false);
    const [dealAnim, setDealAnim] = useState(false);
    const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

    const hasSaved = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ✅ FIX: ใช้ useMemo เพื่อป้องกัน object ถูกสร้างใหม่ทุกรอบ (ต้นเหตุ Infinite Loop)
    const diffConfig = useMemo(() => getDifficultyConfig(selectedDifficulty), [selectedDifficulty]);

    // --- Logic ---
    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startTimer = useCallback(() => {
        stopTimer();
        setTimeLeft(MAX_TIME);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    stopTimer();
                    handleTimeOut(); // หมดเวลา
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ฟังก์ชันนี้ต้องอยู่นอก useCallback ของ dealCards เพื่อแก้เรื่อง Scope
    const handleTimeOut = () => {
        setStreak(0);
        setFeedback({ text: 'TIME OUT!', color: 'text-red-500' });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        
        setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
                setIsGameOver(true);
                stopTimer();
            } else {
                // เรียก dealCards แบบ Manual เพื่อเลี่ยง Dependency Cycle
                setTimeout(() => document.getElementById('next-card-trigger')?.click(), 1000);
            }
            return newLives;
        });
    };

    const dealCards = useCallback(() => {
        setFeedback(null);
        setInput('');
        setDealAnim(true);
        setTimeout(() => setDealAnim(false), 500);
        
        // Auto Focus
        setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 50);

        let num1 = Math.floor(Math.random() * diffConfig.maxVal) + 2;
        let num2 = Math.floor(Math.random() * diffConfig.maxVal) + 2;
        const ops = diffConfig.ops;
        const op = ops[Math.floor(Math.random() * ops.length)];
        setOperator(op);

        if (op === '-') {
            if (num2 > num1) [num1, num2] = [num2, num1];
        } else if (op === '/') {
            num2 = Math.min(num2, 10);
            num1 = num2 * (Math.floor(Math.random() * 5) + 1);
        } else if (op === '*') {
            num1 = Math.min(num1, 12);
            num2 = Math.min(num2, 12);
        }

        const c1: CardData = {
            id: Date.now() + 1,
            val: num1,
            display: toBase(num1, currentBase),
            suit: SUITS[Math.floor(Math.random() * 4)],
            color: COLORS[Math.floor(Math.random() * 4)]
        };

        const c2: CardData = {
            id: Date.now() + 2,
            val: num2,
            display: toBase(num2, currentBase),
            suit: SUITS[Math.floor(Math.random() * 4)],
            color: COLORS[Math.floor(Math.random() * 4)]
        };

        setCards([c1, c2]);
        startTimer();
    }, [currentBase, diffConfig, startTimer]);

    const checkAnswer = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isGameOver || cards.length < 2) return;

        let result = 0;
        const v1 = cards[0].val;
        const v2 = cards[1].val;

        switch (operator) {
            case '+': result = v1 + v2; break;
            case '-': result = v1 - v2; break;
            case '*': result = v1 * v2; break;
            case '/': result = v1 / v2; break;
            case '%': result = v1 % v2; break;
        }

        const correctString = toBase(result, currentBase);

        if (input.trim().toUpperCase() === correctString) {
            stopTimer();
            const comboBonus = streak * 5;
            const timeBonus = Math.floor(timeLeft) * 2;
            addScore((10 * diffConfig.scoreMod) + comboBonus + timeBonus);
            
            setStreak(prev => prev + 1);
            setFeedback({ text: `CORRECT! +${comboBonus > 0 ? 'Combo' : ''}`, color: 'text-emerald-400' });
            
            confetti({ 
                particleCount: 30 + (streak * 5), 
                spread: 50, 
                origin: { y: 0.6 },
                colors: ['#34d399', '#f472b6', '#fbbf24']
            });
            
            setTimeout(dealCards, 800);
        } else {
            stopTimer();
            setStreak(0);
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) setIsGameOver(true);
                else setTimeout(dealCards, 1000);
                return newLives;
            });
            setFeedback({ text: 'WRONG!', color: 'text-rose-500' });
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setInput('');
        }
    };

    // ✅ FIX: ปรับ useEffect ให้ทำงานแค่ตอน Mount หรือเมื่อ dealCards เปลี่ยนจริงๆ เท่านั้น
    useEffect(() => {
        resetScore();
        hasSaved.current = false;
        dealCards();
        return () => stopTimer();
    }, [dealCards, resetScore]);

    useEffect(() => {
        if (isGameOver && !hasSaved.current && currentScore > 0) {
            hasSaved.current = true;
            saveHighScore({ mode: 'memory-card' });
        }
    }, [isGameOver, currentScore, saveHighScore]);

    if (isGameOver) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-in zoom-in bg-[#050505] z-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                
                <Trophy size={80} className="text-yellow-500 mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-bounce" />
                <h2 className="text-7xl font-black text-white mb-2 tracking-tighter">GAME OVER</h2>
                
                <div className="bg-slate-900/80 p-8 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col gap-4 min-w-[300px] shadow-2xl">
                    <div className="flex justify-between items-center text-slate-400">
                        <span>Final Score</span>
                        <span className="text-yellow-400 font-bold text-3xl">{currentScore}</span>
                    </div>
                </div>

                <button onClick={() => { setIsGameOver(false); setLives(3); setStreak(0); resetScore(); dealCards(); }} 
                    className="mt-8 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all active:scale-95 hover:-translate-y-1">
                    <RotateCcw size={24} /> PLAY AGAIN
                </button>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full bg-[#0a0a0f] flex flex-col font-sans select-none overflow-hidden ${shake ? 'animate-shake' : ''}`}>
            
            {/* Hidden Button for internal logic trigger */}
            <button id="next-card-trigger" className="hidden" onClick={dealCards} />

            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e1e2e_0%,#000000_100%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,27,0.5)_2px,transparent_2px),linear-gradient(90deg,rgba(18,18,27,0.5)_2px,transparent_2px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

            {/* Timer Bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-800 z-50">
                <div 
                    className={`h-full transition-all duration-100 ease-linear ${timeLeft < 5 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-cyan-500 shadow-[0_0_10px_cyan]'}`}
                    style={{ width: `${(timeLeft / MAX_TIME) * 100}%` }}
                />
            </div>

            {/* HUD */}
            <div className="relative z-10 flex justify-between items-start p-6">
                <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <Heart key={i} size={28} className={`transition-all duration-300 drop-shadow-md ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-800'}`} />
                        ))}
                    </div>
                    {streak > 1 && (
                        <div className="flex items-center gap-1 text-yellow-400 animate-pulse font-bold bg-yellow-950/30 px-2 py-1 rounded border border-yellow-500/30 w-fit">
                            <Zap size={16} fill="currentColor" />
                            <span>COMBO x{streak}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="text-slate-500 text-xs font-bold tracking-widest">SCORE</div>
                    <div className="text-white font-mono font-bold text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{currentScore}</div>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative gap-10 z-10 pb-10">
                
                <div className="bg-black/40 backdrop-blur px-6 py-2 rounded-full border border-white/10 shadow-xl">
                    <span className="text-slate-400 mr-2 text-sm uppercase tracking-wider">Solving in</span>
                    <span className="text-cyan-400 font-black text-xl tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">BASE {currentBase}</span>
                </div>

                <div className="flex items-center gap-4 md:gap-8 perspective-1000">
                    {cards.length >= 2 ? (
                        <>
                            <div className={`relative w-28 h-40 md:w-40 md:h-56 bg-gradient-to-br from-[#1e1e24] to-[#121216] rounded-2xl border border-slate-700/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between p-4 transform transition-all duration-500 hover:scale-105 group ${dealAnim ? 'translate-y-[100vh] opacity-0' : 'translate-y-0 opacity-100'}`}>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur opacity-30" />
                                <div className={`text-2xl ${cards[0].color}`}>{cards[0].suit}</div>
                                <div className={`text-center text-4xl md:text-6xl font-black text-white font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}>{cards[0].display}</div>
                                <div className={`text-2xl ${cards[0].color} self-end rotate-180`}>{cards[0].suit}</div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse" />
                                <div className="w-16 h-16 rounded-full bg-[#1a1a20] border-2 border-slate-600 flex items-center justify-center shadow-2xl relative z-10">
                                    <span className="text-3xl font-black text-white">{operator === '*' ? '×' : operator === '/' ? '÷' : operator}</span>
                                </div>
                            </div>

                            <div className={`relative w-28 h-40 md:w-40 md:h-56 bg-gradient-to-br from-[#1e1e24] to-[#121216] rounded-2xl border border-slate-700/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between p-4 transform transition-all duration-500 delay-100 hover:scale-105 group ${dealAnim ? 'translate-y-[100vh] opacity-0' : 'translate-y-0 opacity-100'}`}>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur opacity-30" />
                                <div className={`text-2xl ${cards[1].color}`}>{cards[1].suit}</div>
                                <div className={`text-center text-4xl md:text-6xl font-black text-white font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}>{cards[1].display}</div>
                                <div className={`text-2xl ${cards[1].color} self-end rotate-180`}>{cards[1].suit}</div>
                            </div>
                        </>
                    ) : (
                        <div className="text-white animate-pulse">Shuffling Deck...</div>
                    )}
                </div>

                <div className={`h-8 font-black tracking-[0.2em] text-xl uppercase transition-opacity duration-200 ${feedback ? 'opacity-100' : 'opacity-0'} ${feedback?.color}`}>
                    {feedback?.text || '...'}
                </div>

                <form onSubmit={checkAnswer} className="w-full max-w-sm px-6 flex flex-col gap-4 relative z-20">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl blur opacity-25 group-focus-within:opacity-75 transition duration-200"></div>
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="relative w-full bg-[#0f0f15] border border-slate-700 text-center text-4xl font-bold text-white py-4 rounded-xl outline-none focus:border-cyan-500 transition-all shadow-inner font-mono tracking-widest uppercase placeholder-slate-800"
                            placeholder="?"
                            autoComplete="off"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Clock size={20} className={`${timeLeft < 5 ? 'text-red-500 animate-ping' : 'text-slate-600'}`} />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-all text-lg tracking-widest"
                    >
                        CONFIRM <ArrowRight size={20} />
                    </button>
                </form>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out; }
                .perspective-1000 { perspective: 1000px; }
            `}</style>
        </div>
    );
};