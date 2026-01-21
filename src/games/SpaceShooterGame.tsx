import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, toBase, type ArcadeQuestion } from './gameUtils';
import { Rocket, AlertTriangle, RotateCcw, Heart, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
type Asteroid = {
    id: number;
    x: number;
    y: number;
    val: string;
    isCorrect: boolean;
    speed: number;
    size: number;
};

type Bullet = {
    id: number;
    x: number;
    y: number;
};

type Particle = {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
};

// --- Config ---
const SHIP_WIDTH = 10;
const ASTEROID_BASE_SIZE = 13;

export const SpaceShooterGame = () => {
    const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
    
    // State
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

    // Refs
    const stateRef = useRef({
        asteroids: [] as Asteroid[],
        bullets: [] as Bullet[],
        particles: [] as Particle[],
        shipX: 50,
        lastShotTime: 0,
        spawnTimer: 0,
        health: 3,
        wave: 1
    });
    
    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number>(0);
    const hasSaved = useRef(false);
    
    const diffConfig = getDifficultyConfig(selectedDifficulty);
    const SPAWN_RATE = 2000 / diffConfig.speedMod;

    // --- Particles ---
    const addParticles = (x: number, y: number, color: string, count: number = 10) => {
        const newParticles: Particle[] = [];
        for(let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 2;
            newParticles.push({
                id: Date.now() + i + Math.random(),
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                life: 1
            });
        }
        stateRef.current.particles.push(...newParticles);
    };

    // --- Spawn Wave ---
    const spawnWave = useCallback(() => {
        const q = generateQuestion(currentBase, selectedDifficulty);
        const newAsteroids: Asteroid[] = [];
        
        const asteroidsCount = Math.min(3 + Math.floor(stateRef.current.wave / 3), 6);
        
        const lanes = [];
        for(let i = 0; i < asteroidsCount; i++) {
            lanes.push(15 + (70 / (asteroidsCount - 1)) * i);
        }
        
        for (let i = lanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
        }

        const correctIndex = Math.floor(Math.random() * asteroidsCount);
        
        for(let i = 0; i < asteroidsCount; i++) {
            let val = '';
            const isCorrect = i === correctIndex;
            
            if(isCorrect) {
                val = q.answer;
            } else {
                let offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 10) + 1);
                let fake = toBase(q.value + offset, currentBase);
                if(fake === q.answer) fake = toBase(q.value + 20, currentBase);
                val = fake;
            }
            
            const speedVariation = 0.7 + Math.random() * 0.6;
            const sizeVariation = 0.8 + Math.random() * 0.4;
            
            newAsteroids.push({
                id: Date.now() + i + Math.random(),
                x: lanes[i],
                y: -20 - (Math.random() * 40),
                val,
                isCorrect,
                speed: speedVariation,
                size: sizeVariation
            });
        }

        stateRef.current.asteroids.push(...newAsteroids);
        setGameState(prev => ({ ...prev, question: q }));
    }, [currentBase, selectedDifficulty]);

    // --- Game Loop ---
    const gameLoop = useCallback((time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        const state = stateRef.current;

        // 1. Spawn Wave
        state.spawnTimer += deltaTime;
        if (state.asteroids.length === 0 && state.spawnTimer > SPAWN_RATE) {
            spawnWave(); 
            state.spawnTimer = 0;
        }

        // 2. Move Asteroids
        const asteroidSpeed = 0.08 * diffConfig.speedMod * (deltaTime / 16);
        state.asteroids.forEach(a => a.y += asteroidSpeed * a.speed);

        // 3. Move Bullets
        const bulletSpeed = 2 * (deltaTime / 16);
        state.bullets.forEach(b => b.y -= bulletSpeed);

        // 4. Move Particles
        state.particles.forEach(p => {
            p.x += p.vx * (deltaTime / 16);
            p.y += p.vy * (deltaTime / 16);
            p.life -= 0.015 * (deltaTime / 16);
        });
        state.particles = state.particles.filter(p => p.life > 0);

        // 5. Collision: Bullet vs Asteroid
        for (let bIndex = state.bullets.length - 1; bIndex >= 0; bIndex--) {
            const bullet = state.bullets[bIndex];
            let hit = false;

            for (let aIndex = state.asteroids.length - 1; aIndex >= 0; aIndex--) {
                const ast = state.asteroids[aIndex];
                const hitRadius = (ASTEROID_BASE_SIZE * ast.size) / 1.5;
                
                if (
                    Math.abs(bullet.x - ast.x) < hitRadius && 
                    Math.abs(bullet.y - ast.y) < hitRadius
                ) {
                    hit = true;
                    state.bullets.splice(bIndex, 1);

                    if (ast.isCorrect) {
                        // ✅ ถูก - เปลี่ยนสี Particle เป็นชมพู/ทอง
                        addScore(1 * diffConfig.scoreMod);
                        addParticles(ast.x, ast.y, '#f472b6', 25); 
                        
                        confetti({
                            particleCount: 40,
                            spread: 70,
                            origin: { x: ast.x / 100, y: ast.y / 100 },
                            colors: ['#ec4899', '#d946ef', '#fcd34d'] // Pink, Fuchsia, Gold
                        });

                        state.wave++;
                        state.asteroids = []; 
                    } else {
                        // ❌ ผิด - สีม่วงเข้ม/แดง
                        state.health--;
                        addParticles(ast.x, ast.y, '#9333ea', 20);
                        
                        if(state.health <= 0) {
                            setGameState(prev => ({ ...prev, isGameOver: true }));
                            return;
                        }
                        
                        state.asteroids = []; 
                    }
                    break; 
                }
            }
            
            if (!hit && bullet.y < 0) {
                state.bullets.splice(bIndex, 1);
            }
        }

        // 6. Collision: Ship vs Asteroid
        const shipHit = state.asteroids.find(a => 
            Math.abs(a.x - state.shipX) < (SHIP_WIDTH/1.5) && 
            a.y > 80 && a.y < 95
        );
        
        if(shipHit) {
            state.health--;
            addParticles(state.shipX, 85, '#ec4899', 30);
            state.asteroids = []; 
            
            if(state.health <= 0) {
                setGameState(prev => ({ ...prev, isGameOver: true }));
                return;
            }
        }

        // 7. Cleanup
        state.asteroids = state.asteroids.filter(a => a.y <= 100);

        // Sync Render
        setGameState(prev => ({
            ...prev,
            asteroids: [...state.asteroids],
            bullets: [...state.bullets],
            particles: [...state.particles],
            shipX: state.shipX,
            health: state.health,
            wave: state.wave
        }));

        requestRef.current = requestAnimationFrame(gameLoop);
    }, [diffConfig.speedMod, diffConfig.scoreMod, addScore, spawnWave, SPAWN_RATE]);

    // --- Inputs ---
    const handlePointerMove = (e: React.PointerEvent) => {
        if (gameState.isGameOver) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        stateRef.current.shipX = Math.max(5, Math.min(95, x)); 
    };

    const handleShoot = () => {
        if (gameState.isGameOver) return;
        const now = Date.now();
        
        if (now - stateRef.current.lastShotTime > 300) { 
            stateRef.current.bullets.push({
                id: now + Math.random(),
                x: stateRef.current.shipX,
                y: 80
            });
            stateRef.current.lastShotTime = now;
        }
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (gameState.isGameOver) return;
            if (e.key === 'ArrowLeft') stateRef.current.shipX = Math.max(5, stateRef.current.shipX - 5);
            if (e.key === 'ArrowRight') stateRef.current.shipX = Math.min(95, stateRef.current.shipX + 5);
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                handleShoot();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState.isGameOver]);

    // Init
    const startGame = () => {
        resetScore();
        hasSaved.current = false;
        stateRef.current = {
            asteroids: [],
            bullets: [],
            particles: [],
            shipX: 50,
            lastShotTime: 0,
            spawnTimer: 1000,
            health: 3,
            wave: 1
        };
        setGameState({
            question: null,
            shipX: 50,
            isGameOver: false,
            asteroids: [],
            bullets: [],
            particles: [],
            health: 3,
            wave: 1
        });
        
        spawnWave();
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        startGame();
        return () => { if(requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, []);

    useEffect(() => {
        if (gameState.isGameOver && !hasSaved.current && currentScore > 0) {
            hasSaved.current = true;
            saveHighScore({ mode: 'space-shooter', stats: { wave: gameState.wave } });
        }
    }, [gameState.isGameOver, currentScore, saveHighScore]);

    if (gameState.isGameOver) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-in zoom-in bg-[#1a051a] z-50">
                <AlertTriangle size={80} className="text-pink-500 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]" />
                <h2 className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(236,72,153,0.6)] tracking-wider">GAME OVER</h2>
                <div className="text-fuchsia-300 text-xl mt-4">WAVE: <span className="text-white font-bold">{gameState.wave}</span></div>
                <div className="text-fuchsia-300 text-xl">SCORE: <span className="text-yellow-400 font-bold">{currentScore}</span></div>
                <button onClick={startGame} className="mt-8 px-10 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold text-xl shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-transform active:scale-95 flex items-center gap-2">
                    <RotateCcw size={24} /> RETRY MISSION
                </button>
            </div>
        );
    }

    return (
        <div 
            className="relative w-full h-full bg-[#1a0520] overflow-hidden flex flex-col font-sans cursor-crosshair touch-none"
            onPointerMove={handlePointerMove}
            onPointerDown={handleShoot}
        >
            {/* Retro Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom opacity-30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0015] via-transparent to-[#2a0a30] opacity-80 pointer-events-none" />
            
            {/* Top HUD */}
            <div className="absolute top-4 left-0 right-0 flex justify-between items-start px-4 z-30 pointer-events-none">
                <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                        <Heart 
                            key={i} 
                            size={40} 
                            className={`transition-all duration-300 ${
                                i < gameState.health 
                                    ? 'text-pink-500 fill-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]' 
                                    : 'text-purple-900 opacity-50'
                            }`}
                        />
                    ))}
                </div>

                <div className="bg-purple-900/80 border-2 border-pink-500/50 px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.3)] backdrop-blur-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-pink-500/10 animate-pulse" />
                    <div className="relative z-10">
                        <div className="text-pink-300 text-xs font-bold uppercase tracking-widest text-center mb-1 flex items-center justify-center gap-2">
                             <Sparkles size={12} /> TARGET CODE <Sparkles size={12} />
                        </div>
                        <div className="text-4xl md:text-5xl font-black text-white font-mono whitespace-nowrap drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                            {gameState.question?.display}
                        </div>
                    </div>
                </div>

                <div className="bg-fuchsia-900/80 border-2 border-fuchsia-500 px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(217,70,239,0.4)]">
                    <div className="text-fuchsia-200 text-xs font-bold uppercase tracking-wider">WAVE</div>
                    <div className="text-white text-3xl font-black text-center">{gameState.wave}</div>
                </div>
            </div>

            {/* Particles */}
            {gameState.particles.map(p => (
                <div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-full will-change-transform"
                    style={{ 
                        left: `${p.x}%`, 
                        top: `${p.y}%`,
                        backgroundColor: p.color,
                        opacity: p.life,
                        boxShadow: `0 0 10px ${p.color}`,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            ))}

            {/* Asteroids (Neon Purple/Pink Rocks) */}
            {gameState.asteroids.map(ast => {
                const size = 70 * ast.size;
                return (
                    <div
                        key={ast.id}
                        className="absolute will-change-transform"
                        style={{ 
                            left: `${ast.x}%`, 
                            top: `${ast.y}%`, 
                            width: `${size}px`, 
                            height: `${size}px`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <div className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden 
                            bg-gradient-to-br from-fuchsia-900/80 to-purple-950/90 
                            border-[3px] border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]
                            animate-pulse" // เพิ่ม animate-pulse เบาๆ ให้ดูเรืองแสง
                        >
                            
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30" />
                            
                            <span className="relative z-10 text-white font-mono font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                                  style={{ fontSize: `${Math.max(18, 20 * ast.size)}px` }}>
                                {ast.val}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* Bullets (Pink Lasers) */}
            {gameState.bullets.map(b => (
                <div
                    key={b.id}
                    className="absolute w-2 h-12 rounded-full will-change-transform"
                    style={{ 
                        left: `${b.x}%`, 
                        top: `${b.y}%`,
                        transform: 'translate(-50%, -50%)',
                        background: 'linear-gradient(to bottom, #f472b6, #db2777)', // Pink Gradient
                        boxShadow: '0 0 10px #ec4899, 0 0 20px #db2777' // Neon Glow
                    }}
                />
            ))}

            {/* Ship (Pastel Pink) */}
            <div 
                className="absolute bottom-[10%] flex flex-col items-center pointer-events-none will-change-transform"
                style={{ 
                    left: `${gameState.shipX}%`,
                    transform: 'translateX(-50%)',
                    transition: 'left 75ms ease-out'
                }}
            >
                <div className="relative">
                    {/* เปลี่ยนสียานเป็นชมพู */}
                    <Rocket size={64} className="text-pink-400 fill-fuchsia-900 drop-shadow-[0_0_30px_rgba(236,72,153,0.8)]" />
                    
                    {/* Engine Trail */}
                    <div className="absolute top-[80%] left-1/2 -translate-x-1/2 w-4 h-12 bg-gradient-to-b from-fuchsia-400 via-purple-500 to-transparent blur-md opacity-80" 
                         style={{ animation: 'pulse 0.2s ease-in-out infinite alternate' }} />
                </div>
            </div>

            <div className="absolute bottom-4 w-full text-center text-pink-300/50 text-sm font-mono tracking-widest pointer-events-none">
                SYNTHWAVE DEFENSE SYSTEM // READY
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.7; transform: translateX(-50%) scaleY(0.9); }
                    100% { opacity: 1; transform: translateX(-50%) scaleY(1.2); }
                }
            `}</style>
        </div>
    );
};