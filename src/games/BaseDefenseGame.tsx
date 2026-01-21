import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, type ArcadeQuestion } from './gameUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar } from 'lucide-react'; 
import confetti from 'canvas-confetti';

type Enemy = ArcadeQuestion & { id: number; x: number; y: number; isDying: boolean; laneId: number; };
type Projectile = { id: number; targetX: number; targetY: number; laneId: number; };

const LANES = [15, 32, 50, 68, 85]; 

const EnemyDrone = memo(({ x, y, data, isDying }: { x: number, y: number, data: ArcadeQuestion, isDying: boolean }) => (
  <div className={`absolute -translate-y-1/2 flex flex-col items-center will-change-transform z-20 ${isDying ? 'scale-125 brightness-150' : ''}`}
    style={{ left: `${x}%`, top: `${y}%`, opacity: isDying ? 0 : 1 }}>
    <div className="bg-slate-900/90 border border-red-500/50 px-2 py-2 min-w-[90px] md:min-w-[120px]" style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }}>
        <span className="font-mono font-black text-lg md:text-2xl text-white tracking-tighter">{data.display.split('=')[0]}</span>
    </div>
  </div>
));

const PlasmaBeam = memo(({ targetX, targetY, onHit }: { targetX: number, targetY: number, onHit: () => void }) => (
    <motion.div initial={{ left: '5%', top: `${targetY}%`, width: 0, opacity: 1 }} animate={{ width: `${targetX}%`, opacity: 0 }} 
        transition={{ duration: 0.15, ease: "linear" }} onAnimationComplete={onHit} className="absolute h-1.5 z-30 bg-cyan-400 origin-left -translate-y-1/2" style={{ top: `${targetY}%` }} />
));

export const BaseDefenseGame = () => {
    const { currentBase, addScore, selectedDifficulty, currentScore, resetScore } = useGameStore(); // ✅ FIXED: Removed unused
    
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [projectiles, setProjectiles] = useState<Projectile[]>([]); 
    const [input, setInput] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);
    const [shake, setShake] = useState(false);
    const [proximityAlert, setProximityAlert] = useState(false);

    const enemiesRef = useRef<Enemy[]>([]);
    const requestRef = useRef<number | undefined>(undefined);
    const lastSpawnTime = useRef<number>(0);
    
    const diffConfig = getDifficultyConfig(selectedDifficulty);
    const SPAWN_RATE = 2800 / diffConfig.speedMod;

    const spawnEnemy = useCallback(() => {
        const busyLanes = enemiesRef.current.filter(e => e.x > 80).map(e => e.y);
        const availableLanes = LANES.filter(laneY => !busyLanes.includes(laneY));
        if (availableLanes.length === 0) return;

        const q = generateQuestion(currentBase, selectedDifficulty);
        enemiesRef.current.push({ id: Date.now(), ...q, x: 105, y: availableLanes[Math.floor(Math.random() * availableLanes.length)], isDying: false, laneId: 0 });
    }, [currentBase, selectedDifficulty]);

    const gameLoop = useCallback((time: number) => {
        if (!lastSpawnTime.current) lastSpawnTime.current = time;
        if (time - lastSpawnTime.current > SPAWN_RATE) { spawnEnemy(); lastSpawnTime.current = time; }

        let danger = false;
        enemiesRef.current = enemiesRef.current.map(e => {
            if (e.isDying) return e; 
            if (e.x < 35) danger = true;
            return { ...e, x: e.x - (0.05 * diffConfig.speedMod) };
        });

        setProximityAlert(danger);
        if (enemiesRef.current.some(e => !e.isDying && e.x <= 5)) { setIsGameOver(true); return; }

        setEnemies([...enemiesRef.current]);
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [SPAWN_RATE, diffConfig.speedMod, spawnEnemy]);

    const restartGame = useCallback(() => {
        resetScore(); setIsGameOver(false); enemiesRef.current = []; setEnemies([]); setProjectiles([]); setInput('');
        lastSpawnTime.current = 0;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [resetScore, gameLoop]);

    useEffect(() => { restartGame(); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }; }, [restartGame]);

    const handleShoot = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const idx = enemiesRef.current.findIndex(en => en.answer === input.toUpperCase() && !en.isDying);
            if (idx !== -1) {
                const target = enemiesRef.current[idx];
                enemiesRef.current[idx].isDying = true;
                setProjectiles(prev => [...prev, { id: Date.now(), targetX: target.x, targetY: target.y, laneId: 0 }]);
                setInput('');
            } else { setInput(''); setShake(true); setTimeout(() => setShake(false), 200); }
        }
    }

    const onHit = useCallback((projId: number, x: number, y: number) => {
        setProjectiles(prev => prev.filter(p => p.id !== projId));
        confetti({ particleCount: 15, origin: { x: x / 100, y: y / 100 } });
        const hitIdx = enemiesRef.current.findIndex(e => e.isDying && Math.abs(e.x - x) < 5);
        if (hitIdx !== -1) { enemiesRef.current.splice(hitIdx, 1); addScore(1 * diffConfig.scoreMod); }
        setEnemies([...enemiesRef.current]);
    }, [addScore, diffConfig.scoreMod]);

    if(isGameOver) return <div className="h-full flex items-center justify-center bg-black text-white"><button onClick={restartGame}>RESTART</button></div>;

    return (
        <div className={`relative w-full h-full bg-[#05050a] flex flex-col overflow-hidden ${shake ? 'animate-shake' : ''}`}>
            <div className="absolute left-0 w-12 h-full bg-[#0b1120] border-r border-cyan-800 z-20" />
            <div className="flex-1 relative z-10 ml-12">
                {enemies.map(e => <EnemyDrone key={e.id} x={e.x} y={e.y} data={e} isDying={e.isDying} />)}
                <AnimatePresence>{projectiles.map(p => <PlasmaBeam key={p.id} targetX={p.targetX} targetY={p.targetY} onHit={() => onHit(p.id, p.targetX, p.targetY)} />)}</AnimatePresence>
            </div>
            <div className="h-24 bg-[#0f172a] border-t border-cyan-900 flex items-center justify-between px-4 z-30">
                <Radar className={proximityAlert ? "text-red-500 animate-spin" : "text-cyan-600"} />
                <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleShoot} className="bg-black border border-cyan-600 px-4 py-2 text-white text-center w-1/2" placeholder="TARGET" />
                <div className="text-white font-black text-2xl">{currentScore}</div>
            </div>
        </div>
    );
}