import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, toBase } from './gameUtils';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flame, Trophy } from 'lucide-react';

const GRID_SIZE = 20; 
const TICK_RATE = 110; 

type Point = { x: number, y: number };
type Food = Point & { val: string, isCorrect: boolean, id: number };

export const MathSnakeGame = () => {
    const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
    
    const [gameState, setGameState] = useState({
        snake: [{ x: 10, y: 10 }] as Point[],
        foods: [] as Food[],
        question: null as any,
        isGameOver: false
    });

    const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
    const dirRef = useRef<Point>({ x: 0, y: -1 });
    const nextDirRef = useRef<Point>({ x: 0, y: -1 });
    const foodsRef = useRef<Food[]>([]);
    const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasSaved = useRef(false);

    const diffConfig = getDifficultyConfig(selectedDifficulty);

    // --- Logic ส่วนการสุ่มตำแหน่งและอาหาร ---
    const getRandomPos = (currentSnake: Point[]): Point => {
        let newPos: Point;
        let safety = 0;
        while (safety < 100) {
            newPos = { 
                x: Math.floor(Math.random() * GRID_SIZE), 
                y: Math.floor(Math.random() * GRID_SIZE) 
            };
            const collision = currentSnake.some(s => s.x === newPos.x && s.y === newPos.y) ||
                              foodsRef.current.some(f => f.x === newPos.x && f.y === newPos.y);
            if (!collision) return newPos;
            safety++;
        }
        return { x: 0, y: 0 };
    };

    const spawnLevel = useCallback((currentSnake: Point[]) => {
        const q = generateQuestion(currentBase, selectedDifficulty);
        const newFoods: Food[] = [];
        const correctPos = getRandomPos(currentSnake);
        newFoods.push({ ...correctPos, val: q.answer, isCorrect: true, id: Date.now() });

        for (let i = 0; i < 2; i++) {
            let fakeVal = toBase(q.value + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1), currentBase);
            if (fakeVal === q.answer) fakeVal = toBase(q.value + 10, currentBase);
            const fakePos = getRandomPos([...currentSnake, ...newFoods]); 
            newFoods.push({ ...fakePos, val: fakeVal, isCorrect: false, id: Date.now() + i + 1 });
        }
        foodsRef.current = newFoods;
        setGameState(prev => ({ ...prev, question: q, foods: newFoods }));
    }, [currentBase, selectedDifficulty]);

    const gameOver = useCallback(() => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        setGameState(prev => ({ ...prev, isGameOver: true }));
    }, []);

    const runGameStep = useCallback(() => {
        const head = { ...snakeRef.current[0] };
        dirRef.current = nextDirRef.current;
        head.x += dirRef.current.x;
        head.y += dirRef.current.y;

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) { gameOver(); return; }
        if (snakeRef.current.some((s, index) => index !== snakeRef.current.length - 1 && s.x === head.x && s.y === head.y)) { gameOver(); return; }

        const newSnake = [head, ...snakeRef.current];
        const ateFoodIndex = foodsRef.current.findIndex(f => f.x === head.x && f.y === head.y);
        
        if (ateFoodIndex !== -1) {
            if (foodsRef.current[ateFoodIndex].isCorrect) {
                addScore(1 * diffConfig.scoreMod);
                snakeRef.current = newSnake; 
                spawnLevel(newSnake); 
                setGameState(prev => ({ ...prev, snake: newSnake }));
                return;
            } else { gameOver(); return; }
        } else { newSnake.pop(); }
        snakeRef.current = newSnake;
        setGameState(prev => ({ ...prev, snake: newSnake }));
    }, [addScore, diffConfig.scoreMod, gameOver, spawnLevel]);

    const startGame = useCallback(() => {
        resetScore(); hasSaved.current = false;
        const startSnake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
        snakeRef.current = startSnake;
        dirRef.current = { x: 0, y: -1 }; nextDirRef.current = { x: 0, y: -1 };
        foodsRef.current = [];
        setGameState({ snake: startSnake, foods: [], question: null, isGameOver: false });
        spawnLevel(startSnake);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        const speed = TICK_RATE / (selectedDifficulty === 'hard' ? 1.4 : 1);
        gameLoopRef.current = setInterval(runGameStep, speed);
    }, [resetScore, selectedDifficulty, runGameStep, spawnLevel]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' && dirRef.current.y !== 1) nextDirRef.current = { x: 0, y: -1 };
            if (e.key === 'ArrowDown' && dirRef.current.y !== -1) nextDirRef.current = { x: 0, y: 1 };
            if (e.key === 'ArrowLeft' && dirRef.current.x !== 1) nextDirRef.current = { x: -1, y: 0 };
            if (e.key === 'ArrowRight' && dirRef.current.x !== -1) nextDirRef.current = { x: 1, y: 0 };
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => {
        startGame();
        return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
    }, [startGame]);

    useEffect(() => {
        if (gameState.isGameOver && !hasSaved.current && currentScore > 0) {
            hasSaved.current = true;
            saveHighScore({ mode: 'math-snake' });
        }
    }, [gameState.isGameOver, currentScore, saveHighScore]);

    const CELL_SIZE = 100 / GRID_SIZE;

    // ✅ ฟังก์ชันปรับขนาดตัวอักษรในแอปเปิล (Fix visibility)
    const getFoodFontSize = (val: string) => {
        const len = val.length;
        if (len <= 2) return "text-[12px] md:text-[14px] font-black"; 
        if (len <= 4) return "text-[10px] md:text-[12px] font-bold"; 
        return "text-[8px] md:text-[10px] font-bold tracking-tight scale-110"; 
    };

    if (gameState.isGameOver) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#1a0505] z-50 text-center p-6">
                <Flame size={64} className="text-orange-500 mb-4 animate-bounce" />
                <h2 className="text-5xl font-black text-white mb-2">SYSTEM MELTED</h2>
                <p className="text-orange-400 mb-8 uppercase tracking-widest">Final Score: {currentScore}</p>
                <button onClick={startGame} className="px-10 py-4 bg-orange-600 text-white rounded-xl font-bold flex items-center gap-2 active:scale-95 shadow-lg shadow-orange-900/50">
                    <RotateCcw size={24} /> REIGNITE
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-[#0a0202] flex flex-col items-center select-none overflow-hidden">
            
            {/* 1. TOP SECTION: HUD & SCORE (แยกออกมาไม่ให้ทับจอ) */}
            <div className="w-full bg-[#1a0505] border-b border-orange-900/50 p-3 md:p-4 flex justify-between items-center z-20 shadow-lg">
                <div className="flex flex-col">
                    <span className="text-[10px] text-orange-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                        <Trophy size={10} /> Score
                    </span>
                    <span className="text-2xl font-black text-white font-mono">{currentScore}</span>
                </div>

                <div className="bg-black/60 border border-orange-600/30 px-6 py-2 rounded-xl text-center min-w-[140px]">
                    <span className="block text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-0.5">Target</span>
                    <span className="text-2xl font-black text-white font-mono">{gameState.question?.display}</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-orange-500 font-bold uppercase tracking-tighter">Base</span>
                    <span className="text-xl font-black text-orange-400">{currentBase}</span>
                </div>
            </div>

            {/* 2. MIDDLE SECTION: GAME BOARD (ปรับ Responsive) */}
            <div className="flex-1 w-full flex items-center justify-center p-2">
                <div 
                    className="relative bg-black border-4 border-[#3a1005] rounded-lg overflow-hidden shadow-[0_0_40px_rgba(0,0,0,1)]"
                    style={{
                        width: 'min(85vw, 450px)',
                        aspectRatio: '1/1',
                    }}
                >
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.05)_1px,transparent_1px)] bg-[size:5%_5%]" />

                    {/* Snake Body */}
                    {gameState.snake.map((part, i) => (
                        <div key={i} className="absolute rounded-sm border border-orange-900/30"
                            style={{
                                left: `${part.x * CELL_SIZE}%`, top: `${part.y * CELL_SIZE}%`,
                                width: `${CELL_SIZE}%`, height: `${CELL_SIZE}%`,
                                backgroundColor: i === 0 ? '#fbbf24' : '#ea580c',
                                zIndex: i === 0 ? 10 : 5
                            }}
                        />
                    ))}

                    {/* ✅ Food (แอปเปิล) - ปรับขนาดไอเทมให้ใหญ่ขึ้นและตัวหนังสือชัดขึ้น */}
                    {gameState.foods.map((food) => (
                        <div key={food.id} className="absolute flex items-center justify-center z-10"
                            style={{ left: `${food.x * CELL_SIZE}%`, top: `${food.y * CELL_SIZE}%`, width: `${CELL_SIZE}%`, height: `${CELL_SIZE}%` }}
                        >
                            <div className={`w-[95%] h-[95%] bg-cyan-400 text-black rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.6)] animate-pulse
                                 ${getFoodFontSize(food.val)}`}
                                 style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                {food.val}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. BOTTOM SECTION: MOBILE D-PAD (แยกขาดจากบอร์ด ไม่บังจอ) */}
            <div className="w-full bg-[#140505] p-6 pb-10 flex flex-col items-center gap-2 shrink-0 md:hidden border-t border-orange-900/30">
                <div className="flex justify-center">
                    <button className="w-16 h-16 bg-orange-900/40 border-2 border-orange-600/50 rounded-2xl flex items-center justify-center active:bg-orange-600 active:scale-90 transition-all"
                        onPointerDown={() => { if (dirRef.current.y !== 1) nextDirRef.current = { x: 0, y: -1 }; }}>
                        <ArrowUp className="text-white" size={32} />
                    </button>
                </div>
                <div className="flex gap-4">
                    <button className="w-16 h-16 bg-orange-900/40 border-2 border-orange-600/50 rounded-2xl flex items-center justify-center active:bg-orange-600 active:scale-90 transition-all"
                        onPointerDown={() => { if (dirRef.current.x !== 1) nextDirRef.current = { x: -1, y: 0 }; }}>
                        <ArrowLeft className="text-white" size={32} />
                    </button>
                    <button className="w-16 h-16 bg-orange-900/40 border-2 border-orange-600/50 rounded-2xl flex items-center justify-center active:bg-orange-600 active:scale-90 transition-all"
                        onPointerDown={() => { if (dirRef.current.y !== -1) nextDirRef.current = { x: 0, y: 1 }; }}>
                        <ArrowDown className="text-white" size={32} />
                    </button>
                    <button className="w-16 h-16 bg-orange-900/40 border-2 border-orange-600/50 rounded-2xl flex items-center justify-center active:bg-orange-600 active:scale-90 transition-all"
                        onPointerDown={() => { if (dirRef.current.x !== -1) nextDirRef.current = { x: 1, y: 0 }; }}>
                        <ArrowRight className="text-white" size={32} />
                    </button>
                </div>
            </div>
        </div>
    );
}