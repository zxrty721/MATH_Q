import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, type ArcadeQuestion } from './gameUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Zap, Radar, AlertOctagon, Cpu } from 'lucide-react'; // 🗑️ ลบ Shield, Target, Triangle ออก
import confetti from 'canvas-confetti';

// --- Type Definitions ---
type Enemy = ArcadeQuestion & { 
    id: number; 
    x: number; 
    y: number; 
    isDying: boolean;
    laneId: number;
};

type Projectile = {
    id: number;
    targetX: number;
    targetY: number;
    laneId: number;
};

// --- Constants ---
const LANES = [15, 32, 50, 68, 85]; 

// 🛸 Enemy Drone Component
const EnemyDrone = memo(({ x, y, data, isDying }: { x: number, y: number, data: ArcadeQuestion, isDying: boolean }) => (
  <div
    className={`absolute -translate-y-1/2 flex flex-col items-center will-change-transform z-20 transition-transform duration-75 ${isDying ? 'scale-125 brightness-150' : ''}`}
    style={{ 
      left: `${x}%`,
      top: `${y}%`,
      transition: isDying ? 'all 0.1s' : 'none', 
      opacity: isDying ? 0 : 1
    }}
  >
    {/* Health Bar / Threat Level */}
    <div className="w-16 h-1 bg-slate-800 rounded-full mb-1 overflow-hidden">
        <div className="h-full bg-red-500 w-full animate-pulse" />
    </div>

    {/* Drone Body */}
    <div className="relative group">
       {/* Targeting Reticle */}
       <div className="absolute -inset-4 border border-red-500/30 rounded-full animate-ping opacity-50" />
       
       <div className={`relative flex items-center justify-center
           ${isDying ? 'bg-orange-500 shadow-[0_0_50px_orange]' : 'bg-slate-900/80 backdrop-blur-md border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'} 
           px-4 py-3 min-w-[120px] clip-path-hexagon transition-all`}
           style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }}
       >
          <div className="flex flex-col items-end w-full">
             <div className="flex items-center gap-2 mb-1">
                <AlertOctagon size={14} className="text-red-500 animate-spin-slow" />
                <span className="text-[9px] font-bold tracking-widest text-red-400">HOSTILE</span>
             </div>
             <span className="font-mono font-black text-2xl text-white drop-shadow-md tracking-wider">
                {data.display.split('=')[0]}
             </span>
          </div>
          
          {/* Tech Deco */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
       </div>
    </div>
  </div>
));

// 🔫 Laser Beam Component
const PlasmaBeam = memo(({ targetX, targetY, onHit }: { targetX: number, targetY: number, onHit: () => void }) => {
    return (
        <motion.div
            initial={{ left: '10%', top: `${targetY}%`, width: 0, opacity: 1 }} 
            animate={{ width: `${targetX}%`, opacity: 0 }} 
            transition={{ duration: 0.2, ease: "linear" }} 
            onAnimationComplete={onHit} 
            className="absolute h-2 z-30 pointer-events-none origin-left -translate-y-1/2"
            style={{ top: `${targetY}%` }}
        >
            {/* Core Beam */}
            <div className="absolute inset-0 bg-cyan-400 shadow-[0_0_20px_#22d3ee] rounded-r-full" />
            {/* White Hot Core */}
            <div className="absolute inset-y-0.5 left-0 right-0 bg-white rounded-r-full opacity-80" />
        </motion.div>
    );
});

export const BaseDefenseGame = () => {
    const { currentBase, addScore, saveHighScore, selectedDifficulty, currentScore, resetScore, quitGame } = useGameStore();
    
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [projectiles, setProjectiles] = useState<Projectile[]>([]); 
    const [input, setInput] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);
    const [shake, setShake] = useState(false);
    const [proximityAlert, setProximityAlert] = useState(false);

    const enemiesRef = useRef<Enemy[]>([]);
    const requestRef = useRef<number | undefined>(undefined);
    const lastSpawnTime = useRef<number>(0);
    const hasSaved = useRef(false);
    
    const diffConfig = getDifficultyConfig(selectedDifficulty);
    const SPAWN_RATE = 3000 / diffConfig.speedMod;

    // --- Spawn Logic ---
    const spawnEnemy = useCallback(() => {
        const busyLanes = enemiesRef.current
            .filter(e => e.x > 85)
            .map(e => e.y);
        
        const availableLanes = LANES.filter(laneY => !busyLanes.includes(laneY));
        if (availableLanes.length === 0) return;

        const selectedLaneY = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        const q = generateQuestion(currentBase, selectedDifficulty);
        
        const newEnemy: Enemy = { 
            id: Date.now(), 
            ...q, 
            x: 110,
            y: selectedLaneY, 
            isDying: false,
            laneId: LANES.indexOf(selectedLaneY)
        };
        enemiesRef.current.push(newEnemy);
    }, [currentBase, selectedDifficulty]);

    // --- Game Loop ---
    const gameLoop = useCallback((time: number) => {
        if (!lastSpawnTime.current) lastSpawnTime.current = time;
        const deltaTime = time - lastSpawnTime.current;

        if (deltaTime > SPAWN_RATE) {
            spawnEnemy();
            lastSpawnTime.current = time;
        }

        const moveSpeed = 0.04 * diffConfig.speedMod;
        let danger = false;

        enemiesRef.current = enemiesRef.current.map(e => {
            if (e.isDying) return e; 
            
            if (e.x < 30) danger = true;

            return { ...e, x: e.x - moveSpeed };
        });

        setProximityAlert(danger);

        if (enemiesRef.current.some(e => !e.isDying && e.x <= 8)) {
            setIsGameOver(true);
            return;
        }

        setEnemies([...enemiesRef.current]);
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [SPAWN_RATE, diffConfig.speedMod, spawnEnemy]);

    const restartGame = () => {
        resetScore();
        setIsGameOver(false);
        hasSaved.current = false;
        enemiesRef.current = [];
        setEnemies([]);
        setProjectiles([]);
        setInput('');
        setProximityAlert(false);
        lastSpawnTime.current = 0;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        restartGame();
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Shooting Logic ---
    const handleShoot = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const targetIndex = enemiesRef.current.findIndex(
                en => en.answer === input.toUpperCase() && !en.isDying
            );
            
            if (targetIndex !== -1) {
                const target = enemiesRef.current[targetIndex];
                
                enemiesRef.current[targetIndex].isDying = true;
                setEnemies([...enemiesRef.current]);

                const newProj: Projectile = {
                    id: Date.now(),
                    targetX: target.x,
                    targetY: target.y,
                    laneId: target.laneId
                };
                setProjectiles(prev => [...prev, newProj]);
                setInput('');

            } else {
                setInput('');
                setShake(true);
                setTimeout(() => setShake(false), 200);
            }
        }
    }

    const handleProjectileHit = useCallback((projId: number, targetX: number, targetY: number) => {
        setProjectiles(prev => prev.filter(p => p.id !== projId));

        confetti({ 
            particleCount: 30, 
            spread: 60, 
            origin: { x: targetX / 100, y: targetY / 100 }, 
            colors: ['#ef4444', '#f97316', '#ffffff'],
            startVelocity: 20,
            ticks: 100,
            scalar: 0.8
        });

        const hitIndex = enemiesRef.current.findIndex(e => e.isDying && Math.abs(e.x - targetX) < 5 && Math.abs(e.y - targetY) < 5);
        
        if (hitIndex !== -1) {
            enemiesRef.current.splice(hitIndex, 1);
            addScore(1 * diffConfig.scoreMod);
        }
        setEnemies([...enemiesRef.current]);

    }, [addScore, diffConfig.scoreMod]);

    useEffect(() => {
        if (isGameOver && !hasSaved.current && currentScore > 0) {
            hasSaved.current = true;
            saveHighScore({ mode: 'base-defense' }); 
        }
    }, [isGameOver, currentScore, saveHighScore]);

    if(isGameOver) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-in zoom-in duration-300 bg-black z-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-red-900/20 animate-pulse pointer-events-none" />
                <AlertOctagon size={100} className="text-red-500 mb-6 animate-ping" />
                <h2 className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(220,38,38,0.8)] tracking-tighter">PERIMETER BREACHED</h2>
                <div className="bg-slate-900/80 px-8 py-4 rounded-xl border border-red-500/50 mt-4 backdrop-blur-md">
                    <div className="text-red-400 text-xl tracking-widest uppercase">Casualties (Score)</div>
                    <div className="text-white font-bold text-5xl text-center">{currentScore}</div>
                </div>
                <div className="flex gap-4 mt-10 relative z-10">
                    <button onClick={restartGame} className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-sm font-bold text-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 flex items-center gap-2 uppercase tracking-widest clip-path-slant">
                        <Zap size={20} /> Re-Initialize
                    </button>
                    <button onClick={quitGame} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-sm font-bold text-xl border border-slate-600 active:scale-95 uppercase tracking-widest">
                        Abort
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full bg-[#05050a] overflow-hidden flex flex-col font-sans select-none ${shake ? 'animate-shake' : ''}`}>
            
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none perspective-grid" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,#0c4a6e_0%,#000000_60%)] opacity-40 pointer-events-none" />
            
            <div className={`absolute inset-0 bg-gradient-to-r from-red-500/0 via-transparent to-transparent pointer-events-none transition-opacity duration-300 z-0 ${proximityAlert ? 'from-red-500/20 opacity-100' : 'opacity-0'}`} />

            <div className="absolute left-0 bottom-0 top-0 w-24 md:w-32 bg-[#0b1120] border-r-2 border-cyan-800 z-20 flex flex-col items-center shadow-[20px_0_50px_rgba(0,0,0,0.8)]">
                <div className={`absolute inset-y-0 -right-1 w-2 blur-sm transition-all duration-300 ${proximityAlert ? 'bg-red-500 shadow-[0_0_20px_red]' : 'bg-cyan-400 shadow-[0_0_20px_cyan]'}`} />
                
                <div className="flex-1 flex flex-col justify-around py-10 w-full items-center">
                    {/* ✅ FIX 2: เปลี่ยน (lane, i) เป็น (_, i) เพื่อแก้ unused variable */}
                    {LANES.map((_, i) => (
                        <div key={i} className="relative group">
                            <div className="w-8 h-8 rounded-full border border-cyan-700 bg-slate-900 flex items-center justify-center">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                            </div>
                            <div className="absolute left-full top-1/2 w-4 h-[1px] bg-cyan-800" />
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-4 -rotate-90 text-cyan-700 text-[10px] tracking-[0.5em] font-bold whitespace-nowrap">
                    SECTOR DEFENSE
                </div>
            </div>

            <div className="flex-1 relative z-10">
                {LANES.map((y, i) => (
                    <div key={i} className="absolute left-32 right-0 h-[1px] bg-cyan-900/30" style={{ top: `${y}%` }} />
                ))}

                {enemies.map(e => (
                   <EnemyDrone key={e.id} x={e.x} y={e.y} data={e} isDying={e.isDying} />
                ))}

                <AnimatePresence>
                    {projectiles.map(p => (
                        <PlasmaBeam 
                            key={p.id} 
                            targetX={p.targetX} 
                            targetY={p.targetY} 
                            onHit={() => handleProjectileHit(p.id, p.targetX, p.targetY)} 
                        />
                    ))}
                </AnimatePresence>
            </div>

            <div className="h-32 bg-[#0f172a] border-t border-cyan-900 flex items-center justify-between px-8 z-30 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4 w-1/3">
                    <div className="relative w-20 h-20 rounded-full border border-cyan-700 bg-black overflow-hidden shadow-[inset_0_0_10px_rgba(6,182,212,0.3)]">
                         <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.3)_60deg,transparent_60deg)] animate-spin-slow w-full h-full rounded-full opacity-50" />
                         <div className="absolute inset-0 flex items-center justify-center">
                            <Radar size={16} className="text-cyan-600" />
                         </div>
                         {enemies.length > 0 && <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-cyan-500 text-xs font-bold uppercase tracking-widest">Sys.Status</span>
                        <span className={`text-xl font-black ${proximityAlert ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                            {proximityAlert ? 'CRITICAL' : 'OPTIMAL'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center w-1/3 -mt-8">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur opacity-25 group-focus-within:opacity-75 transition duration-200" />
                        <div className="relative flex items-center bg-black border-2 border-cyan-600 rounded-lg overflow-hidden">
                            <div className="bg-cyan-950/30 p-3 border-r border-cyan-800">
                                <Crosshair className={`text-cyan-400 ${input ? 'animate-spin' : ''}`} size={24} />
                            </div>
                            <input 
                                autoFocus
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleShoot}
                                className="bg-transparent px-6 py-2 text-white font-mono text-3xl w-64 outline-none uppercase text-center tracking-widest placeholder-cyan-900/50"
                                placeholder="TARGET"
                            />
                        </div>
                        <div className="absolute -bottom-6 w-full text-center">
                             <span className="text-[10px] text-cyan-600 uppercase tracking-[0.5em] animate-pulse">Weapon Ready</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end w-1/3">
                    <div className="flex items-center gap-2 text-cyan-400 mb-1">
                        <Cpu size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Kills Confirmed</span>
                    </div>
                    <div className="text-4xl font-black text-white font-mono tabular-nums text-shadow-cyan">
                        {currentScore.toString().padStart(4, '0')}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px) rotate(-1deg); }
                    75% { transform: translateX(5px) rotate(1deg); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out; }
                .animate-spin-slow { animation: spin 4s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .text-shadow-cyan { text-shadow: 0 0 10px rgba(34,211,238,0.5); }
            `}</style>
        </div>
    );
}