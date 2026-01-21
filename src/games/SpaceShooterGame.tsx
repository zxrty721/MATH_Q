import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, toBase, type ArcadeQuestion } from './gameUtils';
import { Rocket, AlertTriangle, RotateCcw, Heart, Sparkles, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

type Asteroid = { id: number; x: number; y: number; val: string; isCorrect: boolean; speed: number; size: number; isVulnerable: boolean; };
type Bullet = { id: number; x: number; y: number; };
type Particle = { id: number; x: number; y: number; vx: number; vy: number; color: string; life: number; };

const SHIP_HITBOX_WIDTH = 5; 
const ASTEROID_BASE_SIZE = 13;
const VULNERABLE_THRESHOLD = 10; 

export const SpaceShooterGame = () => {
    const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
    
    const [gameState, setGameState] = useState({
        question: null as ArcadeQuestion | null,
        shipX: 50,
        isGameOver: false,
        asteroids: [] as Asteroid[],
        bullets: [] as Bullet[],
        particles: [] as Particle[],
        health: 3,
        wave: 1
    });

    const stateRef = useRef({
        asteroids: [] as Asteroid[],
        bullets: [] as Bullet[],
        particles: [] as Particle[],
        shipX: 50,
        lastShotTime: 0,
        spawnTimer: 0,
        health: 3,
        wave: 1,
        isFiring: false
    });
    
    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number>(0);
    const hasSaved = useRef(false);
    const diffConfig = getDifficultyConfig(selectedDifficulty);

    const addParticles = (x: number, y: number, color: string, count: number = 10) => {
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            stateRef.current.particles.push({
                id: Math.random(),
                x, y, vx: Math.cos(angle) * (Math.random() * 4), vy: Math.sin(angle) * (Math.random() * 4),
                color, life: 1
            });
        }
    };

    const spawnWave = useCallback(() => {
        const q = generateQuestion(currentBase, selectedDifficulty);
        const newAsteroids: Asteroid[] = [];
        const asteroidsCount = Math.min(3 + Math.floor(stateRef.current.wave / 2), 7);
        const lanes = Array.from({length: asteroidsCount}, (_, i) => 10 + (80 / (asteroidsCount - 1)) * i).sort(() => Math.random() - 0.5);
        const correctIndex = Math.floor(Math.random() * asteroidsCount);
        
        for(let i = 0; i < asteroidsCount; i++) {
            const isCorrect = i === correctIndex;
            let val = isCorrect ? q.answer : toBase(q.value + (Math.floor(Math.random() * 15) + 1), currentBase);
            if(!isCorrect && val === q.answer) val = toBase(q.value + 20, currentBase);
            
            newAsteroids.push({
                id: Date.now() + i, x: lanes[i], y: -15, val, isCorrect,
                speed: 0.8 + (Math.random() * 0.4) + (stateRef.current.wave * 0.05),
                size: 0.9 + Math.random() * 0.4,
                isVulnerable: false
            });
        }
        stateRef.current.asteroids.push(...newAsteroids);
        setGameState(prev => ({ ...prev, question: q }));
    }, [currentBase, selectedDifficulty]);

    const gameLoop = useCallback((time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;
        const state = stateRef.current;

        if (state.isFiring && time - state.lastShotTime > 200) {
            state.bullets.push({ id: time, x: state.shipX, y: 80 });
            state.lastShotTime = time;
        }

        state.spawnTimer += deltaTime;
        if (state.asteroids.length === 0 && state.spawnTimer > (1500 / diffConfig.speedMod)) {
            spawnWave(); state.spawnTimer = 0;
        }

        const moveFactor = deltaTime / 16;
        state.asteroids.forEach(a => {
            a.y += 0.09 * diffConfig.speedMod * moveFactor * a.speed;
            if (a.y > VULNERABLE_THRESHOLD) a.isVulnerable = true; 
        });
        
        state.bullets.forEach(b => b.y -= 2.2 * moveFactor);
        state.particles.forEach(p => { p.x += p.vx * 0.1; p.y += p.vy * 0.1; p.life -= 0.025; });
        state.particles = state.particles.filter(p => p.life > 0);

        for (let bIndex = state.bullets.length - 1; bIndex >= 0; bIndex--) {
            const bullet = state.bullets[bIndex];
            let hit = false;
            for (let aIndex = state.asteroids.length - 1; aIndex >= 0; aIndex--) {
                const ast = state.asteroids[aIndex];
                const hitRadius = (ASTEROID_BASE_SIZE * ast.size) / 1.1;
                
                if (Math.abs(bullet.x - ast.x) < hitRadius && Math.abs(bullet.y - ast.y) < hitRadius) {
                    hit = true;
                    if (ast.isVulnerable) {
                        state.bullets.splice(bIndex, 1);
                        if (ast.isCorrect) {
                            addScore(1 * diffConfig.scoreMod);
                            addParticles(ast.x, ast.y, '#f472b6', 20);
                            confetti({ particleCount: 15, origin: { x: ast.x / 100, y: ast.y / 100 } });
                            state.wave++; state.asteroids = [];
                        } else {
                            state.health--; addParticles(ast.x, ast.y, '#ef4444', 30);
                            if(state.health <= 0) { setGameState(prev => ({ ...prev, isGameOver: true })); return; }
                            state.asteroids = [];
                        }
                    } else {
                        addParticles(bullet.x, bullet.y, '#94a3b8', 3);
                        state.bullets.splice(bIndex, 1);
                    }
                    break;
                }
            }
            if (!hit && bullet.y < 0) state.bullets.splice(bIndex, 1);
        }

        if (state.asteroids.some(a => Math.abs(a.x - state.shipX) < SHIP_HITBOX_WIDTH && a.y > 85 && a.y < 91)) {
            state.health--; addParticles(state.shipX, 88, '#f43f5e', 40);
            state.asteroids = [];
            if(state.health <= 0) { setGameState(prev => ({ ...prev, isGameOver: true })); return; }
        }

        state.asteroids = state.asteroids.filter(a => a.y <= 100);
        setGameState(prev => ({ ...prev, ...state, asteroids: [...state.asteroids], bullets: [...state.bullets], particles: [...state.particles] }));
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [diffConfig.speedMod, diffConfig.scoreMod, addScore, spawnWave]);

    const handlePointerDown = (e: React.PointerEvent) => { stateRef.current.isFiring = true; handlePointerMove(e); };
    const handlePointerUp = () => { stateRef.current.isFiring = false; };
    const handlePointerMove = (e: React.PointerEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        stateRef.current.shipX = Math.max(8, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100));
    };

    const startGame = useCallback(() => {
        resetScore(); hasSaved.current = false;
        stateRef.current = { asteroids: [], bullets: [], particles: [], shipX: 50, lastShotTime: 0, spawnTimer: 1000, health: 3, wave: 1, isFiring: false };
        setGameState({ question: null, shipX: 50, isGameOver: false, asteroids: [], bullets: [], particles: [], health: 3, wave: 1 });
        spawnWave();
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [resetScore, gameLoop, spawnWave]);

    useEffect(() => { startGame(); return () => { if(requestRef.current) cancelAnimationFrame(requestRef.current); }; }, [startGame]);

    useEffect(() => {
        if (gameState.isGameOver && !hasSaved.current && currentScore > 0) {
            hasSaved.current = true;
            saveHighScore({ mode: 'space-shooter' });
        }
    }, [gameState.isGameOver, currentScore, saveHighScore]);

    return (
        <div className={`relative w-full h-full bg-[#0a0015] overflow-hidden flex flex-col touch-none ${stateRef.current.asteroids.some(a => a.y > 70) ? 'animate-pulse-red' : ''}`}
             onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
            
            {/* HUD */}
            <div className="absolute top-2 left-0 right-0 flex justify-between items-center px-4 z-40 pointer-events-none">
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => <Heart key={i} size={22} className={i < gameState.health ? 'text-rose-500 fill-rose-500' : 'text-slate-800'} />)}
                </div>
                <div className="bg-purple-950/90 border border-pink-500/40 p-2 rounded-xl backdrop-blur-md">
                    <p className="text-[10px] text-pink-400 font-bold uppercase text-center mb-1 flex items-center justify-center gap-1">
                        <Sparkles size={12} className="text-pink-400" />
                        <span>{gameState.question?.display}</span>
                        <Sparkles size={12} className="text-pink-400" />
                    </p>
                </div>
                <div className="text-white font-black text-xl italic">W:{gameState.wave}</div>
            </div>

            {/* Asteroids */}
            {gameState.asteroids.map(ast => (
                <div key={ast.id} className="absolute flex items-center justify-center" 
                     style={{ left: `${ast.x}%`, top: `${ast.y}%`, width: `${55 * ast.size}px`, height: `${55 * ast.size}px`, transform: 'translate(-50%, -50%)' }}>
                    <div className={`w-full h-full rounded-2xl border-2 flex items-center justify-center shadow-lg transition-all duration-300
                        ${ast.isVulnerable ? 'bg-fuchsia-900 border-pink-500' : 'bg-slate-700 border-slate-400 opacity-80'}`}>
                        {!ast.isVulnerable && <ShieldAlert size={16} className="absolute -top-2 -right-2 text-slate-300 animate-pulse" />}
                        <span className={`font-mono font-black ${ast.val.length > 5 ? 'text-[9px]' : 'text-sm'} ${ast.isVulnerable ? 'text-white' : 'text-slate-400'}`}>
                            {ast.val}
                        </span>
                    </div>
                </div>
            ))}

            {/* Bullets & Particles */}
            {gameState.bullets.map(b => <div key={b.id} className="absolute w-1.5 h-6 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" style={{ left: `${b.x}%`, top: `${b.y}%`, transform: 'translateX(-50%)' }} />)}
            {gameState.particles.map(p => <div key={p.id} className="absolute w-1 h-1 rounded-full" style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: p.color, opacity: p.life }} />)}

            {/* Ship */}
            <div className="absolute bottom-[12%] transition-all duration-75" style={{ left: `${gameState.shipX}%`, transform: 'translateX(-50%)' }}>
                <Rocket size={50} className="text-pink-400 fill-fuchsia-950 drop-shadow-[0_0_20px_#ec4899]" />
            </div>

            {/* ✅ FIXED: Game Over Screen Centered with Score */}
            {gameState.isGameOver && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in p-6 text-center">
                    <AlertTriangle size={80} className="text-rose-500 mb-6 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                    
                    <h2 className="text-6xl font-black text-white italic mb-8 tracking-tighter">MISSION<br/><span className="text-rose-600">FAILED</span></h2>
                    
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        {/* Score Box */}
                        <div className="bg-slate-900/80 p-6 rounded-2xl border border-rose-500/30">
                            <p className="text-rose-400 text-xs font-bold uppercase tracking-widest mb-1">Final Score</p>
                            <p className="text-5xl font-black text-white font-mono">{currentScore}</p>
                        </div>

                        {/* Stats Box */}
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Waves Survived</p>
                            <p className="text-2xl font-black text-white">{gameState.wave}</p>
                        </div>
                    </div>

                    <button 
                        onClick={startGame} 
                        className="mt-10 px-12 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-xl rounded-2xl shadow-[0_0_30px_rgba(225,29,72,0.4)] transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest"
                    >
                        <RotateCcw size={24} /> Re-Launch
                    </button>
                </div>
            )}

            <style>{`
                @keyframes pulse-red {
                    0%, 100% { box-shadow: inset 0 0 0px transparent; }
                    50% { box-shadow: inset 0 0 50px rgba(244, 63, 94, 0.3); }
                }
                .animate-pulse-red { animation: pulse-red 1s infinite; }
            `}</style>
        </div>
    );
};