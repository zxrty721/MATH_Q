import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, type ArcadeQuestion } from './gameUtils';
import { Sword, Zap, FlaskConical, Skull, Crown, RotateCcw, Scroll } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Assets & Config ---
const MONSTERS = [
    { name: 'Slime', hp: 50, atk: 5, color: 'text-emerald-400', icon: '🦠', aura: 'shadow-emerald-500/50' },
    { name: 'Goblin', hp: 80, atk: 8, color: 'text-green-500', icon: '👺', aura: 'shadow-green-500/50' },
    { name: 'Skeleton', hp: 120, atk: 12, color: 'text-slate-200', icon: '💀', aura: 'shadow-slate-200/50' },
    { name: 'Orc', hp: 180, atk: 15, color: 'text-teal-500', icon: '🧟', aura: 'shadow-teal-500/50' },
    { name: 'Dragon', hp: 300, atk: 25, color: 'text-red-500', icon: '🐉', aura: 'shadow-red-500/50' },
];

type CombatState = 'IDLE' | 'PLAYER_TURN' | 'CALCULATING' | 'ANIMATING' | 'ENEMY_TURN' | 'VICTORY' | 'DEFEAT';

export const MonsterSlayerGame = () => {
    const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
    
    // --- State ---
    const [combatState, setCombatState] = useState<CombatState>('IDLE');
    const [player, setPlayer] = useState({ hp: 100, maxHp: 100, mp: 50, maxMp: 50, potions: 2 });
    const [monster, setMonster] = useState({ ...MONSTERS[0], maxHp: MONSTERS[0].hp });
    const [level, setLevel] = useState(1);
    const [question, setQuestion] = useState<ArcadeQuestion | null>(null);
    const [input, setInput] = useState('');
    const [selectedAction, setSelectedAction] = useState<'ATTACK' | 'SKILL' | 'HEAL' | null>(null);
    const [log, setLog] = useState<string>('A wild monster appears!');
    const [shake, setShake] = useState(false);
    const [effect, setEffect] = useState<{ type: string, val: string | number } | null>(null);

    const hasSaved = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // --- ✅ FIX: Auto Refocus System ---
    // ฟังก์ชันดึง Focus กลับมาที่ช่องพิมพ์
    const focusInput = () => {
        if (combatState === 'CALCULATING' && inputRef.current) {
            inputRef.current.focus();
        }
    };

    // ดึง Focus ทุกครั้งที่คลิกที่ไหนก็ได้ในหน้าจอ (เฉพาะตอนสู้)
    useEffect(() => {
        const handleClick = () => focusInput();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [combatState]);

    // ดึง Focus ทันทีที่เข้าหน้าคำนวณ
    useEffect(() => {
        if (combatState === 'CALCULATING') {
            // รอเล็กน้อยให้ UI render เสร็จแล้ว focus
            setTimeout(focusInput, 50);
        }
    }, [combatState]);
    // ------------------------------------

    // --- Actions ---
    const startBattle = () => {
        const monsterIdx = Math.min(level - 1, MONSTERS.length - 1);
        const baseMonster = MONSTERS[monsterIdx];
        const scale = 1 + Math.floor((level-1)/5) * 0.5;
        
        setMonster({
            ...baseMonster,
            hp: Math.floor(baseMonster.hp * scale),
            maxHp: Math.floor(baseMonster.hp * scale),
            atk: Math.floor(baseMonster.atk * scale)
        });
        setCombatState('PLAYER_TURN');
        setLog(`Level ${level}: ${baseMonster.name} approaches!`);
    };

    const handleActionSelect = (action: 'ATTACK' | 'SKILL' | 'HEAL') => {
        if (action === 'SKILL' && player.mp < 20) {
            setLog("Not enough Mana!");
            return;
        }
        if (action === 'HEAL' && player.potions <= 0) {
            setLog("No potions left!");
            return;
        }

        setSelectedAction(action);
        const q = generateQuestion(currentBase, selectedDifficulty);
        setQuestion(q);
        setCombatState('CALCULATING');
        setInput('');
    };

    const executePlayerAction = (isCorrect: boolean) => {
        setCombatState('ANIMATING');
        
        if (isCorrect) {
            // ✅ Action Success
            if (selectedAction === 'ATTACK') {
                const dmg = Math.floor(20 + Math.random() * 10);
                setMonster(prev => ({ ...prev, hp: Math.max(0, prev.hp - dmg) }));
                setEffect({ type: 'dmg', val: dmg });
                setLog(`You attacked for ${dmg} damage!`);
                triggerShake();
            } 
            else if (selectedAction === 'SKILL') {
                const dmg = Math.floor(40 + Math.random() * 20);
                setMonster(prev => ({ ...prev, hp: Math.max(0, prev.hp - dmg) }));
                setPlayer(prev => ({ ...prev, mp: prev.mp - 20 }));
                setEffect({ type: 'crit', val: dmg });
                setLog(`CRITICAL HIT! ${dmg} damage!`);
                triggerShake();
            }
            else if (selectedAction === 'HEAL') {
                const heal = 40;
                setPlayer(prev => ({ 
                    ...prev, 
                    hp: Math.min(prev.maxHp, prev.hp + heal),
                    potions: prev.potions - 1 
                }));
                setEffect({ type: 'heal', val: heal });
                setLog(`Recovered ${heal} HP!`);
            }
            addScore(10 * (selectedAction === 'SKILL' ? 2 : 1));
        } else {
            // ❌ Action Failed
            setLog("Cast Failed! You missed!");
            setEffect({ type: 'miss', val: 'MISS' });
        }

        // Check Monster Death
        setTimeout(() => {
            setEffect(null);
            if (monster.hp <= 0 && isCorrect && selectedAction !== 'HEAL') {
                handleVictory();
            } else {
                // Enemy Turn
                setTimeout(enemyTurn, 1000);
            }
        }, 1000);
    };

    const enemyTurn = () => {
        setCombatState('ENEMY_TURN');
        if (monster.hp > 0) {
            const dmg = Math.floor(monster.atk * (0.8 + Math.random() * 0.4));
            setPlayer(prev => ({ ...prev, hp: Math.max(0, prev.hp - dmg) }));
            setLog(`${monster.name} attacks! Took ${dmg} dmg.`);
            triggerShake();
            
            setTimeout(() => {
                if (player.hp - dmg <= 0) {
                    handleDefeat();
                } else {
                    setPlayer(prev => ({ ...prev, mp: Math.min(prev.maxMp, prev.mp + 5) })); // Regen MP
                    setCombatState('PLAYER_TURN');
                }
            }, 1000);
        }
    };

    const handleVictory = () => {
        setCombatState('VICTORY');
        setLog("Victory! Level Up!");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#f59e0b'] }); // Gold confetti
        addScore(50);
        setTimeout(() => {
            setLevel(l => l + 1);
            setPlayer(prev => ({ ...prev, maxHp: prev.maxHp + 10, hp: prev.maxHp + 10, mp: prev.maxMp, potions: prev.potions + 1 }));
            startBattle();
        }, 2500);
    };

    const handleDefeat = () => {
        setCombatState('DEFEAT');
        setLog("You have been defeated...");
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 300);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (combatState !== 'CALCULATING') return;
        executePlayerAction(input.toUpperCase() === question?.answer);
    };

    useEffect(() => {
        resetScore();
        hasSaved.current = false;
        startBattle();
    }, []);

    useEffect(() => {
        if (combatState === 'DEFEAT' && !hasSaved.current && currentScore > 0) {
            hasSaved.current = true;
            saveHighScore({ mode: 'monster-slayer', stats: { level: level } });
        }
    }, [combatState, currentScore, saveHighScore, level]);

    if (combatState === 'DEFEAT') {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-in zoom-in bg-[#0a0a0a] z-50">
                <Skull size={80} className="text-red-800 mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(153,27,27,0.8)]" />
                <h2 className="text-6xl font-black text-white font-serif tracking-widest">YOU DIED</h2>
                <div className="text-slate-400 text-xl mt-4">MAX LEVEL: <span className="text-amber-500 font-bold">{level}</span></div>
                <div className="text-slate-400 text-xl">SCORE: <span className="text-amber-500 font-bold">{currentScore}</span></div>
                <button onClick={() => { resetScore(); setLevel(1); setPlayer({hp:100, maxHp:100, mp:50, maxMp:50, potions:2}); startBattle(); }} 
                    className="mt-8 px-10 py-3 bg-red-900 hover:bg-red-800 text-white rounded-sm border border-red-500 font-bold text-xl shadow-[0_0_20px_rgba(153,27,27,0.5)] flex items-center gap-2 uppercase tracking-widest">
                    <RotateCcw size={24} /> Resurrect
                </button>
            </div>
        );
    }

    return (
        // ✅ เพิ่ม onClick={focusInput} ที่ Container หลัก เพื่อกันเหนียว
        <div 
            onClick={focusInput}
            className={`relative w-full h-full bg-[#050505] overflow-hidden flex flex-col font-serif select-none ${shake ? 'animate-shake' : ''}`}
        >
            
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e1b4b_0%,#000000_100%)] z-0" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-mosaic.png')] opacity-30 pointer-events-none mix-blend-overlay" />
            
            {/* Rising Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-1 bg-purple-500/30 rounded-full animate-rise" 
                        style={{
                            left: `${Math.random() * 100}%`,
                            bottom: '-10%',
                            animationDuration: `${5 + Math.random() * 10}s`,
                            animationDelay: `${Math.random() * 5}s`
                        }} 
                    />
                ))}
            </div>

            {/* Top Bar (Stats) */}
            <div className="relative z-10 p-4 border-b border-white/10 bg-[#0f0b15]/90 backdrop-blur-sm shadow-xl flex justify-between items-end">
                <div className="flex gap-6 w-full max-w-lg">
                    {/* HP Bar */}
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-red-300 font-bold uppercase tracking-widest mb-1">
                            <span>Vitality</span>
                            <span>{player.hp}/{player.maxHp}</span>
                        </div>
                        <div className="h-4 bg-black/50 border border-red-900/50 rounded-sm relative overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-900 to-red-600 transition-all duration-500" style={{ width: `${(player.hp/player.maxHp)*100}%` }} />
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4px_100%]" />
                        </div>
                    </div>

                    {/* MP Bar */}
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">
                            <span>Mana</span>
                            <span>{player.mp}/{player.maxMp}</span>
                        </div>
                        <div className="h-4 bg-black/50 border border-blue-900/50 rounded-sm relative overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-600 transition-all duration-500" style={{ width: `${(player.mp/player.maxMp)*100}%` }} />
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4px_100%]" />
                        </div>
                    </div>
                </div>

                {/* Level Badge */}
                <div className="flex flex-col items-center justify-center bg-amber-900/20 border border-amber-500/30 px-3 py-1 rounded ml-4">
                    <Crown size={16} className="text-amber-400 mb-1" />
                    <span className="text-amber-400 text-xs font-black">LV.{level}</span>
                </div>
            </div>

            {/* Battle Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                
                {/* Monster */}
                <div className="relative mb-12 transform transition-transform duration-300 hover:scale-105 group">
                    {/* Aura Glow */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 ${monster.aura} group-hover:opacity-40 transition-opacity`} />
                    
                    <div className="text-[140px] md:text-[180px] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] animate-bounce-slow relative z-10 filter sepia-[0.3]">
                        {monster.icon}
                    </div>

                    {/* Floating Text Effect */}
                    {effect && (
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-5xl font-black animate-pop-up whitespace-nowrap z-50 text-stroke
                            ${effect.type === 'dmg' ? 'text-red-500' : effect.type === 'crit' ? 'text-amber-400 text-7xl' : effect.type === 'heal' ? 'text-green-400' : 'text-slate-400'}`}>
                            {effect.type === 'heal' ? '+' : ''}{effect.val}
                        </div>
                    )}
                    
                    {/* Boss Name & HP */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 flex flex-col items-center">
                        <div className={`text-lg font-bold uppercase tracking-widest ${monster.color} drop-shadow-md mb-1`}>{monster.name}</div>
                        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                            <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(monster.hp/monster.maxHp)*100}%` }} />
                        </div>
                    </div>
                </div>

                {/* Combat Log (Scroll Style) */}
                <div className="bg-[#1e1b29]/80 border-y border-white/10 w-full py-2 flex justify-center backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                        <Scroll size={14} className="text-amber-500" />
                        <span>{log}</span>
                    </div>
                </div>

            </div>

            {/* Action Menu (Bottom) */}
            <div className="bg-[#151019] p-4 border-t-4 border-[#2d2436] min-h-[200px] flex items-center justify-center relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                
                {combatState === 'CALCULATING' ? (
                    <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center text-amber-200/80 border-b border-amber-500/20 pb-2">
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">INCANTATION</span>
                            <span className="font-mono text-xs opacity-50">Base {currentBase} &rarr; 10</span>
                        </div>
                        <div className="bg-black/50 p-6 rounded-lg border border-amber-500/30 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-4xl font-black text-white mb-4 tracking-widest">{question?.display}</div>
                            
                            {/* ✅ Input: เพิ่ม autoFocus และ onBlur เพื่อดึง focus กลับถ้าหลุด */}
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                // เมื่อหลุด focus ให้พยายามดึงกลับ
                                onBlur={() => {
                                    if(combatState === 'CALCULATING') {
                                        // Delay นิดหน่อยเพื่อให้ event อื่นทำงานก่อน (เช่นการกดปุ่มเปลี่ยนแอพ)
                                        setTimeout(() => inputRef.current?.focus(), 10);
                                    }
                                }}
                                className="w-full bg-transparent text-center text-3xl font-bold text-amber-400 outline-none placeholder-white/5 uppercase font-mono tracking-widest"
                                placeholder="?"
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold py-3 rounded border border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95 transition-all uppercase tracking-widest text-sm">
                            Cast Spell
                        </button>
                    </form>
                ) : (
                    <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
                        {/* Attack Button */}
                        <button 
                            disabled={combatState !== 'PLAYER_TURN'}
                            onClick={() => handleActionSelect('ATTACK')}
                            className="group bg-[#25202b] hover:bg-[#3e1a1a] disabled:opacity-40 disabled:bg-[#1a161f] text-slate-300 hover:text-red-200 border border-white/5 hover:border-red-500/50 p-4 rounded-sm flex flex-col items-center gap-3 transition-all active:scale-95"
                        >
                            <Sword size={28} className="group-hover:rotate-12 transition-transform duration-300" />
                            <span className="font-bold text-sm tracking-widest">STRIKE</span>
                        </button>
                        
                        {/* Skill Button */}
                        <button 
                            disabled={combatState !== 'PLAYER_TURN' || player.mp < 20}
                            onClick={() => handleActionSelect('SKILL')}
                            className="group bg-[#25202b] hover:bg-[#1a233e] disabled:opacity-40 disabled:bg-[#1a161f] text-slate-300 hover:text-blue-200 border border-white/5 hover:border-blue-500/50 p-4 rounded-sm flex flex-col items-center gap-3 transition-all active:scale-95 relative"
                        >
                            <div className="absolute top-2 right-2 text-[9px] text-blue-400 bg-blue-950/50 px-1 border border-blue-500/20">20 MP</div>
                            <Zap size={28} className="group-hover:scale-110 transition-transform duration-300 shadow-blue-500" />
                            <span className="font-bold text-sm tracking-widest">MAGIC</span>
                        </button>

                        {/* Heal Button */}
                        <button 
                            disabled={combatState !== 'PLAYER_TURN' || player.potions <= 0}
                            onClick={() => handleActionSelect('HEAL')}
                            className="group bg-[#25202b] hover:bg-[#1a3e2a] disabled:opacity-40 disabled:bg-[#1a161f] text-slate-300 hover:text-green-200 border border-white/5 hover:border-green-500/50 p-4 rounded-sm flex flex-col items-center gap-3 transition-all active:scale-95 relative"
                        >
                            <div className="absolute top-2 right-2 text-[9px] text-green-400 bg-green-950/50 px-1 border border-green-500/20">x{player.potions}</div>
                            <FlaskConical size={28} className="group-hover:-rotate-12 transition-transform duration-300" />
                            <span className="font-bold text-sm tracking-widest">POTION</span>
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.3s ease-in-out; }
                .animate-bounce-slow { animation: bounce 3s infinite; }
                @keyframes pop-up {
                    0% { opacity: 0; transform: translate(-50%, 0) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -100%) scale(1); }
                }
                .animate-pop-up { animation: pop-up 1s ease-out forwards; }
                .text-stroke { -webkit-text-stroke: 1px black; }
                
                @keyframes rise {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { transform: translateY(-100vh) scale(0); opacity: 0; }
                }
                .animate-rise { animation: rise linear infinite; }
            `}</style>
        </div>
    );
};