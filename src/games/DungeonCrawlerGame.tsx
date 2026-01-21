import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, toBase, type ArcadeQuestion } from './gameUtils';
import { Footprints, Lock, Skull, Gift, ArrowRight, ShieldCheck, Heart, Sword, Ghost, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Assets Configuration ---
const EVENTS = [
    { 
        type: 'MONSTER', 
        icon: <Skull size={80} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-bounce-slow" />, 
        text: "ปีศาจปรากฏกาย!", 
        theme: "from-red-950/80 to-slate-900",
        borderColor: "border-red-800"
    },
    { 
        type: 'CHEST', 
        icon: <Gift size={80} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-pulse" />, 
        text: "หีบสมบัติโบราณ!", 
        theme: "from-yellow-950/80 to-slate-900",
        borderColor: "border-yellow-700"
    },
    { 
        type: 'TRAP', 
        icon: <Lock size={80} className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-spin-slow" />, 
        text: "กับดักเวทมนตร์!", 
        theme: "from-purple-950/80 to-slate-900",
        borderColor: "border-purple-800"
    },
    { 
        type: 'SAFE', 
        icon: <Footprints size={80} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />, 
        text: "ทางสะดวก...", 
        theme: "from-emerald-950/60 to-slate-900",
        borderColor: "border-emerald-800"
    },
    { 
        type: 'BOSS', 
        icon: <Ghost size={100} className="text-rose-600 drop-shadow-[0_0_25px_rgba(225,29,72,1)] animate-float" />, 
        text: "จอมมารลงมาจุติ!", 
        theme: "from-rose-950 to-black",
        borderColor: "border-rose-600"
    }
];

export const DungeonCrawlerGame = () => {
    const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
    
    const [floor, setFloor] = useState(1);
    const [hp, setHp] = useState(3);
    const [currentEvent, setCurrentEvent] = useState<any>(null);
    const [options, setOptions] = useState<{ val: string, isCorrect: boolean }[]>([]);
    const [question, setQuestion] = useState<ArcadeQuestion | null>(null);
    const [message, setMessage] = useState("ก้าวเข้าสู่ความมืด...");
    const [isGameOver, setIsGameOver] = useState(false);
    
    // UI Effects State
    const [isProcessing, setIsProcessing] = useState(true);
    const [shake, setShake] = useState(false);
    const [slashEffect, setSlashEffect] = useState(false); // Effect ฟันดาบ
    const [damageOverlay, setDamageOverlay] = useState(false); // Effect จอแดง
    const [transition, setTransition] = useState(false);

    const hasSaved = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearGameTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const generateEvent = useCallback(() => {
        clearGameTimer();
        setIsProcessing(true);
        setTransition(true); 

        timerRef.current = setTimeout(() => {
            let eventPool = EVENTS.slice(0, 4);
            if (floor % 5 === 0) eventPool = [EVENTS[4]]; // Boss Floor

            const type = Math.random() > 0.3 ? eventPool[Math.floor(Math.random() * (eventPool.length - 1))] : EVENTS[3];
            
            if (type.type === 'SAFE') {
                setCurrentEvent(type);
                setQuestion(null);
                setOptions([]);
                setMessage("ทางเดินเงียบสงัด... ปลอดภัย");
                setTransition(false);

                timerRef.current = setTimeout(() => {
                    setFloor(f => f + 1);
                    addScore(5);
                    generateEvent();
                }, 1500);
                return;
            }

            const q = generateQuestion(currentBase, selectedDifficulty);
            const correctVal = q.answer;
            const offset = (Math.floor(Math.random() * 3) + 1) * (Math.random() > 0.5 ? 1 : -1);
            let wrongVal = toBase(q.value + offset, currentBase);
            if (wrongVal === correctVal) wrongVal = toBase(q.value + 10, currentBase);

           const initialOpts = [
                { val: correctVal, isCorrect: true },
                { val: wrongVal, isCorrect: false }
            ];

            // ใช้การสุ่มแบบสลับที่ (Simple Swap) หรือโยนเหรียญ
            const opts = Math.random() > 0.5 ? initialOpts : [initialOpts[1], initialOpts[0]];

            setCurrentEvent(type);
            setQuestion(q);
            setOptions(opts);
            setMessage(type.text);
            setTransition(false);
            
            setTimeout(() => {
                setIsProcessing(false);
            }, 300);

        }, 500);
    }, [currentBase, selectedDifficulty, floor, addScore]);

    const handleChoice = (isCorrect: boolean) => {
        if (isProcessing) return;
        setIsProcessing(true);

        if (isCorrect) {
            // ✅ ตอบถูก: Effect ฟันดาบ
            setSlashEffect(true);
            setTimeout(() => setSlashEffect(false), 300);

            let bonus = 0;
            if (currentEvent.type === 'MONSTER') { setMessage("CRITICAL HIT! กำจัดศัตรูสำเร็จ"); bonus = 20; }
            else if (currentEvent.type === 'BOSS') { setMessage("LEGENDARY! บอสสิ้นชีพ!"); bonus = 100; }
            else if (currentEvent.type === 'CHEST') { setMessage("ปลดล็อคสำเร็จ! ได้สมบัติ!"); bonus = 50; }
            else { setMessage("ปลดกับดักเรียบร้อย!"); bonus = 30; }
            
            addScore(bonus);
            confetti({ 
                particleCount: 80, 
                spread: 80, 
                origin: { y: 0.6 },
                colors: ['#fbbf24', '#ef4444', '#ffffff'] // Gold, Red, White
            });
            
            timerRef.current = setTimeout(() => {
                setFloor(f => f + 1);
                generateEvent();
            }, 1200);

        } else {
            // ❌ ตอบผิด: Effect จอแดง + สั่น
            setMessage("พลาดท่า! คุณได้รับความเสียหาย!");
            setShake(true);
            setDamageOverlay(true);
            setTimeout(() => {
                setShake(false);
                setDamageOverlay(false);
            }, 500);

            setHp(prev => {
                const newHp = prev - 1;
                
                if (newHp <= 0) {
                    timerRef.current = setTimeout(() => setIsGameOver(true), 1000);
                    return 0;
                } else {
                    timerRef.current = setTimeout(() => {
                        setFloor(f => f + 1);
                        generateEvent();
                    }, 1500);
                    return newHp;
                }
            });
        }
    };

    useEffect(() => {
        resetScore();
        hasSaved.current = false;
        generateEvent();
        return () => clearGameTimer();
    }, [generateEvent, resetScore]);

    useEffect(() => {
        if (isGameOver && !hasSaved.current && currentScore > 0) {
            hasSaved.current = true;
            saveHighScore({ mode: 'dungeon-crawler', stats: { floor: floor } });
        }
    }, [isGameOver, currentScore, saveHighScore]);

    if (isGameOver) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-black z-50 font-sans relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-red-950/50 via-transparent to-black" />
                
                <Skull size={120} className="text-red-700 mb-6 animate-pulse relative z-10 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]" />
                <h2 className="text-7xl font-black text-white mb-2 tracking-tighter relative z-10 drop-shadow-md">YOU DIED</h2>
                
                <div className="relative z-10 bg-slate-900/80 p-6 rounded-2xl border border-white/10 backdrop-blur-sm text-center min-w-[300px] mt-6">
                     <div className="text-slate-400 text-lg">ไปถึงชั้น</div>
                     <div className="text-red-500 font-bold text-4xl font-mono mb-4">{floor}</div>
                     <div className="w-full h-px bg-white/10 mb-4" />
                     <div className="text-slate-400 text-lg">คะแนนรวม</div>
                     <div className="text-yellow-400 font-bold text-4xl font-mono">{currentScore}</div>
                </div>

                <button onClick={() => { 
                    resetScore(); setFloor(1); setHp(3); setIsGameOver(false); generateEvent(); 
                }} 
                    className="mt-8 px-12 py-4 bg-red-900 hover:bg-red-800 text-white rounded-xl font-bold text-xl 
                    shadow-[0_0_30px_rgba(153,27,27,0.6)] border border-red-500/30 transition-all active:scale-95 relative z-10">
                    จุดคบเพลิงใหม่ (RESTART)
                </button>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full bg-slate-950 flex flex-col font-sans select-none overflow-hidden ${shake ? 'animate-shake' : ''}`}>
            
            {/* --- Atmosphere Layers --- */}
            {/* 1. Base Dark Color (สีพื้นหลัก) */}
            <div className="absolute inset-0 bg-[#0c0c12]" />

            {/* 2. Grid Pattern (ลายตารางจางๆ ให้ดูเหมือนพื้นปูหิน) */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                 style={{
                     backgroundImage: 'radial-gradient(#4f4f55 1px, transparent 1px)',
                     backgroundSize: '24px 24px'
                 }}
            />
            {/* Torch Light / Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#000_120%)] z-1 pointer-events-none" />
            
            {/* Dynamic Ambient Color */}
            <div className={`absolute inset-0 bg-gradient-to-b opacity-40 transition-colors duration-1000 z-0 ${currentEvent?.theme || 'from-slate-900 to-black'}`} />

            {/* Damage Overlay (Flash Red) */}
            <div className={`absolute inset-0 bg-red-600 mix-blend-overlay pointer-events-none z-50 transition-opacity duration-100 ${damageOverlay ? 'opacity-40' : 'opacity-0'}`} />

            {/* Floating Dust Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="absolute bg-slate-500 rounded-full opacity-20 animate-float-particle"
                        style={{
                            width: Math.random() * 4 + 1 + 'px',
                            height: Math.random() * 4 + 1 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            animationDuration: Math.random() * 10 + 10 + 's',
                            animationDelay: Math.random() * 5 + 's'
                        }}
                    />
                ))}
            </div>

            {/* --- HUD --- */}
            <div className="relative z-20 pt-4 px-6 flex justify-between items-start">
                {/* Health */}
                <div className="flex flex-col gap-1">
                    <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Vitality</div>
                    <div className="flex items-center gap-1">
                        {[...Array(3)].map((_, i) => (
                            <Heart key={i} size={32} fill={i < hp ? "#ef4444" : "transparent"} 
                                className={`transition-all duration-300 drop-shadow-lg ${i < hp ? 'text-red-500 scale-100' : 'text-slate-800 scale-90'}`} />
                        ))}
                    </div>
                </div>

                {/* Floor Indicator */}
                <div className="flex flex-col items-center">
                    <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">Depth</div>
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                        <Flame size={18} className="text-orange-500 animate-pulse" />
                        <span className="text-white font-black text-xl tracking-wider">FLR {floor}</span>
                    </div>
                </div>

                {/* Score */}
                <div className="flex flex-col items-end">
                    <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Gold</div>
                    <div className="text-yellow-400 font-mono font-bold text-3xl drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                        {currentScore}
                    </div>
                </div>
            </div>

            {/* --- Main Game Area --- */}
            <div className="flex-1 flex flex-col items-center justify-center relative p-6 z-10">
                
                <div className={`transition-all duration-500 transform w-full max-w-lg relative ${transition ? 'scale-90 opacity-0 blur-sm translate-y-8' : 'scale-100 opacity-100 blur-0 translate-y-0'}`}>
                    
                    {/* Slash Effect Overlay (เมื่อโจมตี) */}
                    {slashEffect && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                            <div className="w-[120%] h-2 bg-white rotate-[-45deg] shadow-[0_0_20px_white] animate-slash" />
                        </div>
                    )}

                    {/* Stone Tablet Container */}
                    <div className={`relative bg-[#1c1c24] rounded-sm p-1 shadow-2xl overflow-hidden group
                        border-[3px] ${currentEvent?.borderColor || 'border-slate-700'}`}>
                        
                        {/* Stone Texture on Card */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                        
                        {/* Inner Bevel */}
                        <div className="h-full w-full bg-[#13131a] rounded-sm border-2 border-white/5 p-6 flex flex-col items-center gap-6 relative shadow-inner">
                            
                            {/* Entity Icon Container */}
                            <div className="relative group-hover:scale-105 transition-transform duration-500">
                                <div className={`absolute inset-0 blur-2xl opacity-40 bg-gradient-to-tr ${currentEvent?.theme || 'from-slate-700 to-transparent'}`} />
                                {currentEvent?.icon}
                            </div>
                            
                            {/* Dialogue Box */}
                            <div className="text-center relative z-10 w-full">
                                <h2 className="text-2xl font-black text-white mb-2 tracking-widest uppercase drop-shadow-md font-serif">
                                    {currentEvent?.type}
                                </h2>
                                <div className="bg-black/30 border-t border-b border-white/10 py-2 w-full backdrop-blur-sm">
                                    <p className={`text-lg font-medium font-serif italic ${message.includes('พลาด') ? 'text-red-400' : message.includes('สำเร็จ') || message.includes('ปลอดภัย') ? 'text-green-400' : 'text-slate-300'}`}>
                                        "{message}"
                                    </p>
                                </div>
                            </div>

                           // --- ส่วนที่ปรับปรุงภายใน DungeonCrawlerGame.tsx ---

{/* Challenge Section */}
{question && (
    <div className="w-full mt-2 space-y-3 md:space-y-4">
        {/* ✅ ปรับปรุงหินรูน (Question) ให้รองรับตัวเลขยาวๆ */}
        <div className="relative bg-[#2a2a35] p-4 md:p-6 rounded-md border-2 border-[#3f3f4e] text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] min-h-[80px] flex items-center justify-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#13131a] px-3 text-[8px] md:text-[10px] text-slate-500 uppercase tracking-[0.3em] border border-[#3f3f4e] whitespace-nowrap">
                Rune Code
            </div>
            
            {/* ✅ ใช้ Dynamic Font Size ตามความยาวตัวเลข (เหมือน QuickMath) */}
            <div className={`font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 font-mono tracking-widest drop-shadow-sm break-all leading-tight
                ${question.display.length > 12 ? 'text-xl md:text-3xl' : 
                  question.display.length > 8 ? 'text-3xl md:text-5xl' : 
                  'text-4xl md:text-6xl'}`}>
                {question.display}
            </div>
        </div>

                                    {/* Action Buttons (Runes) */}
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        {options.map((opt, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => handleChoice(opt.isCorrect)}
                                                disabled={isProcessing} 
                                                className={`relative group h-20 md:h-24 rounded-md border-b-4 transition-all active:border-b-0 active:translate-y-1 disabled:opacity-50
                                                    ${isProcessing 
                                                        ? 'bg-slate-800 border-slate-900 text-slate-600' 
                                                        : 'bg-[#333340] border-[#1a1a20] hover:bg-[#3e3e4d] text-slate-200'
                                                    }`}
                                            >
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none" />
                                                
                                                <div className="flex flex-col items-center justify-center gap-0.5 md:gap-1 relative z-10 px-1">
                                                    {currentEvent?.type.includes('MONSTER') || currentEvent?.type === 'BOSS' ? 
                                                        <Sword size={18} className="text-slate-500" /> :
                                                    currentEvent?.type === 'TRAP' ? 
                                                        <ShieldCheck size={18} className="text-slate-500" /> :
                                                        <ArrowRight size={18} className="text-slate-500" />
                                                    }
                                                    {/* ✅ ปรับขนาดตัวเลือกให้เล็กลงหากคำตอบยาว */}
                                                    <span className={`font-bold font-mono group-hover:text-white transition-colors break-all
                                                        ${opt.val.length > 8 ? 'text-sm md:text-xl' : 'text-xl md:text-2xl'}`}>
                                                        {opt.val}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translate(0, 0); }
                    10%, 30%, 50%, 70%, 90% { transform: translate(-8px, 2px); }
                    20%, 40%, 60%, 80% { transform: translate(8px, -2px); }
                }
                .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
                
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }

                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); filter: brightness(1); }
                    50% { transform: translateY(-15px) scale(1.1); filter: brightness(1.2); }
                }
                .animate-float { animation: float 4s infinite ease-in-out; }

                @keyframes float-particle {
                    0% { transform: translateY(0px) translateX(0px); opacity: 0; }
                    20% { opacity: 0.5; }
                    100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
                }
                .animate-float-particle { animation: float-particle linear infinite; }

                @keyframes slash {
                    0% { width: 0; opacity: 0; transform: scale(0.5) rotate(-45deg); }
                    50% { width: 150%; opacity: 1; transform: scale(1) rotate(-45deg); }
                    100% { width: 150%; opacity: 0; transform: scale(1.2) rotate(-45deg); }
                }
                .animate-slash { animation: slash 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};