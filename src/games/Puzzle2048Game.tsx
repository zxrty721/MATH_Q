import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { toBase } from './gameUtils';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const GRID_SIZE = 4;

type Tile = {
  id: number; 
  val: number; 
  x: number;
  y: number;
  isMerged?: boolean; 
};

// --- Helper: สุ่มตำแหน่งว่าง ---
const getEmptyCells = (tiles: Tile[]) => {
  const cells: {x: number, y: number}[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!tiles.some(t => t.x === x && t.y === y)) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
};

// --- ⚡ Tile Component (Memoized) - Theme: Industrial Amber ---
const GameTile = memo(({ tile, base }: { tile: Tile, base: number }) => {
  const getColor = (v: number) => {
    // ไล่สีจาก เหลือง -> ส้ม -> แดง -> ม่วงเข้ม (Hazard Heatmap)
    const colors: Record<number, string> = {
      2: 'bg-[#fbbf24] text-black shadow-[0_0_10px_#fbbf24]',       // Amber-400
      4: 'bg-[#f59e0b] text-black shadow-[0_0_10px_#f59e0b]',       // Amber-500
      8: 'bg-[#d97706] text-white shadow-[0_0_10px_#d97706]',       // Amber-600
      16: 'bg-[#ea580c] text-white shadow-[0_0_15px_#ea580c]',      // Orange-600
      32: 'bg-[#c2410c] text-white shadow-[0_0_15px_#c2410c]',      // Orange-700
      64: 'bg-[#dc2626] text-white shadow-[0_0_15px_#dc2626]',      // Red-600
      128: 'bg-[#b91c1c] text-white shadow-[0_0_20px_#b91c1c]',     // Red-700
      256: 'bg-[#991b1b] text-white shadow-[0_0_20px_#991b1b] border-2 border-yellow-400', // Red-800 + Border
      512: 'bg-[#7f1d1d] text-white shadow-[0_0_25px_#7f1d1d] border-2 border-yellow-400', // Red-900
      1024: 'bg-black text-yellow-400 shadow-[0_0_30px_#facc15] border-2 border-yellow-400', // Black/Yellow
      2048: 'bg-yellow-400 text-black shadow-[0_0_40px_#facc15] border-4 border-black ring-2 ring-yellow-400' // SUPER MODE
    };
    return colors[v] || 'bg-slate-800 text-slate-400 border border-slate-700';
  };

  return (
    <motion.div
      layoutId={`tile-${tile.id}`} 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: tile.isMerged ? [1.2, 1] : 1, 
        opacity: 1,
        x: tile.x * 80, 
        y: tile.y * 80 
      }} 
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`absolute w-[72px] h-[72px] rounded-md flex items-center justify-center font-black text-2xl md:text-3xl z-10 select-none ${getColor(tile.val)}`}
      style={{ left: 4, top: 4 }} 
    >
      {toBase(tile.val, base)}
    </motion.div>
  );
});

export const Puzzle2048Game = () => {
  const { currentBase, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
  
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scoreToAdd, setScoreToAdd] = useState(0); 
  const tileIdCounter = useRef(0);
  const hasSaved = useRef(false);

  // --- Logic การเคลื่อนที่ ---
  const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (isGameOver) return;

    setTiles(prevTiles => {
      let moved = false;
      let newScore = 0;
      const newTiles: Tile[] = prevTiles.map(t => ({ ...t, isMerged: false })); 

      const sorted = [...newTiles].sort((a, b) => {
        if (direction === 'UP') return a.y - b.y;
        if (direction === 'DOWN') return b.y - a.y;
        if (direction === 'LEFT') return a.x - b.x;
        if (direction === 'RIGHT') return b.x - a.x;
        return 0;
      });

      const grid: (Tile | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

      sorted.forEach(tile => {
        let { x, y } = tile;

        while (true) {
          const nextX = direction === 'LEFT' ? x - 1 : direction === 'RIGHT' ? x + 1 : x;
          const nextY = direction === 'UP' ? y - 1 : direction === 'DOWN' ? y + 1 : y;

          if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) break; 

          const occupant = grid[nextY][nextX];
          if (occupant) {
            if (occupant.val === tile.val && !occupant.isMerged) {
              occupant.val *= 2;
              occupant.isMerged = true;
              newScore += occupant.val;
              
              tile.x = nextX; 
              tile.y = nextY;
              tile.val = -1; 
              moved = true;
            }
            break; 
          }

          x = nextX;
          y = nextY;
        }

        if (tile.val !== -1) {
          if (tile.x !== x || tile.y !== y) moved = true;
          tile.x = x;
          tile.y = y;
          grid[y][x] = tile;
        }
      });

      if (moved) {
        const finalTiles = newTiles.filter(t => t.val !== -1);
        
        const empty = getEmptyCells(finalTiles);
        if (empty.length > 0) {
          const { x, y } = empty[Math.floor(Math.random() * empty.length)];
          finalTiles.push({
            id: tileIdCounter.current++,
            val: Math.random() > 0.9 ? 4 : 2,
            x, y,
            isMerged: false 
          });
        }

        if (newScore > 0) {
          addScore(newScore); 
          setScoreToAdd(newScore);
          setTimeout(() => setScoreToAdd(0), 500);
        }

        if (finalTiles.length === GRID_SIZE * GRID_SIZE) {
            let canMove = false;
            for(let t of finalTiles) {
                const neighbors = finalTiles.filter(n => Math.abs(n.x - t.x) + Math.abs(n.y - t.y) === 1);
                if (neighbors.some(n => n.val === t.val)) {
                    canMove = true; break;
                }
            }
            if (!canMove) setIsGameOver(true);
        }

        return finalTiles;
      }

      return prevTiles;
    });
  }, [isGameOver, addScore]);

  // --- Controls ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
      }
      switch(e.key) {
        case 'ArrowUp': move('UP'); break;
        case 'ArrowDown': move('DOWN'); break;
        case 'ArrowLeft': move('LEFT'); break;
        case 'ArrowRight': move('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  // --- Start Game ---
  const initGame = () => {
    resetScore();
    setIsGameOver(false);
    hasSaved.current = false;
    tileIdCounter.current = 0;
    
    const empty1 = getEmptyCells([]);
    const p1 = empty1[Math.floor(Math.random() * empty1.length)];
    const empty2 = empty1.filter(p => p !== p1);
    const p2 = empty2[Math.floor(Math.random() * empty2.length)];

    setTiles([
        { id: tileIdCounter.current++, val: 2, x: p1.x, y: p1.y, isMerged: false },
        { id: tileIdCounter.current++, val: 2, x: p2.x, y: p2.y, isMerged: false }
    ]);
  };

  useEffect(() => { initGame(); }, []);

  // Save Score
  useEffect(() => {
    if (isGameOver && !hasSaved.current && currentScore > 0) {
      hasSaved.current = true;
      saveHighScore({ mode: 'puzzle-2048' });
    }
  }, [isGameOver, currentScore, saveHighScore]);

  return (
    <div className="relative w-full h-full bg-[#1c1917] flex flex-col items-center justify-center font-sans overflow-hidden">
      
      {/* 🚧 Background: Hazard Stripes */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#292524_0,#292524_20px,#1c1917_20px,#1c1917_40px)] opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.1)_0%,transparent_60%)] pointer-events-none" />

      {/* 📟 HUD */}
      <div className="absolute top-6 w-full max-w-md px-6 flex justify-between items-center z-20">
         <div className="flex flex-col">
            <span className="text-[10px] text-yellow-600 font-black uppercase tracking-[0.2em] flex items-center gap-1">
                <AlertTriangle size={12} /> TARGET SYSTEM
            </span>
            <span className="text-3xl font-black text-yellow-500 drop-shadow-[0_2px_0_rgba(0,0,0,1)]">
                {toBase(2048, currentBase)}
            </span>
         </div>
         
         <AnimatePresence>
            {scoreToAdd > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -20, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-12 right-12 text-yellow-400 font-black text-2xl z-50 pointer-events-none drop-shadow-md"
                >
                    +{scoreToAdd}
                </motion.div>
            )}
         </AnimatePresence>

         <div className="flex flex-col items-end">
             <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">SCORE</span>
             <span className="text-2xl font-black text-white">{currentScore}</span>
         </div>
      </div>

      {/* 🎮 Game Board Container */}
      <div className="relative p-2 bg-[#292524] rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#44403c]">
        
        {/* Decorative Screw Heads */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#57534e] rounded-full border-2 border-[#292524] flex items-center justify-center"><div className="w-2 h-0.5 bg-[#292524] rotate-45"/></div>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#57534e] rounded-full border-2 border-[#292524] flex items-center justify-center"><div className="w-2 h-0.5 bg-[#292524] -rotate-45"/></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#57534e] rounded-full border-2 border-[#292524] flex items-center justify-center"><div className="w-2 h-0.5 bg-[#292524] -rotate-45"/></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#57534e] rounded-full border-2 border-[#292524] flex items-center justify-center"><div className="w-2 h-0.5 bg-[#292524] rotate-45"/></div>

        {/* Grid Background */}
        <div 
            className="grid grid-cols-4 gap-2 bg-[#1c1917] rounded-sm p-2 inner-shadow"
            style={{ width: '340px', height: '340px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }} 
        >
            {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="bg-[#292524] rounded-sm w-[72px] h-[72px] border border-[#44403c]/30" />
            ))}
        </div>

        {/* 🧩 Tiles Layer */}
        <div className="absolute top-4 left-4 pointer-events-none">
            <AnimatePresence>
                {tiles.map(tile => (
                    <GameTile key={tile.id} tile={tile} base={currentBase} />
                ))}
            </AnimatePresence>
        </div>

        {/* Game Over Overlay */}
        {isGameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
                <AlertTriangle size={80} className="text-yellow-500 mb-4 animate-bounce" />
                <h2 className="text-5xl font-black text-yellow-500 tracking-tighter mb-2 drop-shadow-lg">SYSTEM HALTED</h2>
                <div className="text-stone-400 font-mono">FINAL SCORE: <span className="text-white font-bold">{currentScore}</span></div>
                <button 
                    onClick={initGame} 
                    className="mt-8 px-10 py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-sm font-black text-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-transform active:scale-95 flex items-center gap-2 uppercase tracking-wider"
                >
                    <Zap size={24} fill="black" /> Reboot System
                </button>
            </div>
        )}
      </div>

      {/* 🕹️ Mobile Controls (Industrial Style) */}
      <div className="mt-10 grid grid-cols-3 gap-2 md:hidden">
         <div />
         <button className="w-16 h-16 bg-[#292524] border-b-4 border-[#1c1917] active:border-b-0 active:translate-y-1 rounded-lg flex items-center justify-center" onClick={() => move('UP')}><ArrowUp className="text-yellow-600"/></button>
         <div />
         <button className="w-16 h-16 bg-[#292524] border-b-4 border-[#1c1917] active:border-b-0 active:translate-y-1 rounded-lg flex items-center justify-center" onClick={() => move('LEFT')}><ArrowLeft className="text-yellow-600"/></button>
         <button className="w-16 h-16 bg-[#292524] border-b-4 border-[#1c1917] active:border-b-0 active:translate-y-1 rounded-lg flex items-center justify-center" onClick={() => move('DOWN')}><ArrowDown className="text-yellow-600"/></button>
         <button className="w-16 h-16 bg-[#292524] border-b-4 border-[#1c1917] active:border-b-0 active:translate-y-1 rounded-lg flex items-center justify-center" onClick={() => move('RIGHT')}><ArrowRight className="text-yellow-600"/></button>
      </div>

      <div className="mt-6 text-[10px] text-stone-600 font-black tracking-[0.3em] uppercase opacity-50">
         // CAUTION: HEAVY MACHINERY //
      </div>
    </div>
  );
};