import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, getDifficultyConfig, toBase } from './gameUtils';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flame } from 'lucide-react';

// Configuration
const GRID_SIZE = 20; // 20x20
const TICK_RATE = 100; 

type Point = { x: number, y: number };
type Food = Point & { val: string, isCorrect: boolean, id: number };

export const MathSnakeGame = () => {
    const { currentBase, selectedDifficulty, addScore, saveHighScore, currentScore, resetScore } = useGameStore();
    
    // --- State (Render) ---
    const [gameState, setGameState] = useState({
        snake: [{ x: 10, y: 10 }] as Point[],
        foods: [] as Food[],
        question: null as any,
        isGameOver: false
    });

    // --- Refs (Logic) ---
    const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
    const dirRef = useRef<Point>({ x: 0, y: -1 });
    const nextDirRef = useRef<Point>({ x: 0, y: -1 });
    const foodsRef = useRef<Food[]>([]);
    const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasSaved = useRef(false);

    const diffConfig = getDifficultyConfig(selectedDifficulty);

    // --- Helper ---
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
        
        // 1. อาหารถูก
        const correctPos = getRandomPos(currentSnake);
        newFoods.push({ ...correctPos, val: q.answer, isCorrect: true, id: Date.now() });

        // 2. อาหารหลอก
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
        const dir = dirRef.current;
        
        head.x += dir.x;
        head.y += dir.y;

        // 1. Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            gameOver();
            return;
        }

        // 2. Self Collision
        if (snakeRef.current.some((s, index) => index !== snakeRef.current.length - 1 && s.x === head.x && s.y === head.y)) {
            gameOver();
            return;
        }

        const newSnake = [head, ...snakeRef.current];

        // 3. Food Collision
        const ateFoodIndex = foodsRef.current.findIndex(f => f.x === head.x && f.y === head.y);
        
        if (ateFoodIndex !== -1) {
            const eaten = foodsRef.current[ateFoodIndex];
            if (eaten.isCorrect) {
                // ✅ กินถูก
                addScore(1 * diffConfig.scoreMod);
                snakeRef.current = newSnake; 
                spawnLevel(newSnake); 
                setGameState(prev => ({ ...prev, snake: newSnake }));
                return;
            } else {
                // ❌ กินผิด
                gameOver();
                return;
            }
        } else {
            newSnake.pop();
        }

        snakeRef.current = newSnake;
        setGameState(prev => ({ ...prev, snake: newSnake }));

    }, [addScore, diffConfig.scoreMod, gameOver, spawnLevel]);

    const startGame = useCallback(() => {
        resetScore();
        hasSaved.current = false;
        
        const startSnake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
        snakeRef.current = startSnake;
        dirRef.current = { x: 0, y: -1 };
        nextDirRef.current = { x: 0, y: -1 };
        foodsRef.current = [];

        setGameState({
            snake: startSnake,
            foods: [],
            question: null,
            isGameOver: false
        });

        spawnLevel(startSnake);

        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        const speed = TICK_RATE / (selectedDifficulty === 'hard' ? 1.5 : 1);
        gameLoopRef.current = setInterval(runGameStep, speed);

    }, [resetScore, selectedDifficulty, runGameStep, spawnLevel]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const currentDir = dirRef.current;
            let newDir = currentDir;

            if (e.key === 'ArrowUp' && currentDir.y !== 1) newDir = { x: 0, y: -1 };
            if (e.key === 'ArrowDown' && currentDir.y !== -1) newDir = { x: 0, y: 1 };
            if (e.key === 'ArrowLeft' && currentDir.x !== 1) newDir = { x: -1, y: 0 };
            if (e.key === 'ArrowRight' && currentDir.x !== -1) newDir = { x: 1, y: 0 };

            nextDirRef.current = newDir;
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

    if (gameState.isGameOver) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-in zoom-in bg-[#1a0505] z-50 overflow-hidden relative">
                {/* Background Lava */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.2)_0%,transparent_70%)] pointer-events-none" />
                
                <Flame size={80} className="text-orange-500 mb-4 animate-bounce drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]" />
                <h2 className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">BURNED OUT!</h2>
                <div className="text-orange-300 text-xl mt-4">SCORE: <span className="text-white font-bold">{currentScore}</span></div>
                <button onClick={startGame} className="mt-8 px-10 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-bold text-xl shadow-[0_0_20px_rgba(234,88,12,0.5)] transition-transform active:scale-95 flex items-center gap-2">
                    <RotateCcw size={24} /> REIGNITE
                </button>
            </div>
        );
    }

    const CELL_SIZE = 100 / GRID_SIZE;

    const getFoodStyle = (val: string) => {
        const len = val.length;
        if (len <= 2) return "text-xs font-black"; 
        if (len <= 4) return "text-[10px] font-bold"; 
        return "text-[8px] font-bold tracking-tighter scale-90"; 
    };

    return (
        <div className="relative w-full h-full bg-[#1a0505] flex flex-col items-center justify-center font-sans overflow-hidden">
            
            {/* Magma Cracks Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cracked-ground.png')] opacity-30 pointer-events-none mix-blend-color-dodge" />
            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/50 via-transparent to-transparent pointer-events-none" />

            {/* HUD */}
            <div className="relative z-20 bg-black/60 border-2 border-orange-600/50 px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(234,88,12,0.3)] backdrop-blur-md mb-6">
                <div className="text-orange-400 text-xs font-bold uppercase tracking-widest text-center mb-1 flex items-center justify-center gap-2">
                    <Flame size={12} className="animate-pulse" /> TARGET <Flame size={12} className="animate-pulse" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-white font-mono whitespace-nowrap drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">
                    {gameState.question?.display}
                </div>
            </div>

            {/* Board */}
            <div 
                className="relative bg-black/80 border-4 border-[#431407] rounded-xl shadow-[0_0_50px_rgba(234,88,12,0.2)] overflow-hidden z-10"
                style={{
                    width: 'min(90vw, 600px)',
                    height: 'min(90vw, 600px)',
                }}
            >
                {/* Lava Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.1)_1px,transparent_1px)] bg-[size:5%_5%] pointer-events-none" />

                {/* Snake (Magma Style) */}
                {gameState.snake.map((part, i) => (
                    <div
                        key={i}
                        className="absolute rounded-sm transition-all duration-75 border border-orange-900/50"
                        style={{
                            left: `${part.x * CELL_SIZE}%`,
                            top: `${part.y * CELL_SIZE}%`,
                            width: `${CELL_SIZE}%`,
                            height: `${CELL_SIZE}%`,
                            // Head: Bright Orange | Body: Darker Orange -> Red
                            backgroundColor: i === 0 ? '#fbbf24' : '#ea580c', 
                            boxShadow: i === 0 ? '0 0 15px #f59e0b' : 'none',
                            zIndex: i === 0 ? 20 : 10
                        }}
                    >
                        {i === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center gap-[10%]">
                                <div className="w-[20%] h-[20%] bg-black rounded-full opacity-80" />
                                <div className="w-[20%] h-[20%] bg-black rounded-full opacity-80" />
                            </div>
                        )}
                    </div>
                ))}

                {/* 🧊 Foods (Ice Crystals - Contrast Color) */}
                {gameState.foods.map((food) => (
                    <div
                        key={food.id}
                        className="absolute flex items-center justify-center z-10"
                        style={{
                            left: `${food.x * CELL_SIZE}%`,
                            top: `${food.y * CELL_SIZE}%`,
                            width: `${CELL_SIZE}%`,
                            height: `${CELL_SIZE}%`,
                        }}
                    >
                        <div className={`w-[90%] h-[90%] rounded-md flex items-center justify-center shadow-lg animate-pulse 
                            bg-cyan-300 text-black shadow-cyan-400/50 border border-white/50
                            whitespace-nowrap overflow-hidden ${getFoodStyle(food.val)}`}
                            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} // Hexagon Crystal
                        >
                            {food.val}
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile Controls */}
            <div className="absolute bottom-6 md:hidden flex flex-col items-center gap-2 opacity-80 z-30">
                <ArrowUp 
                    className="w-14 h-14 bg-orange-900/80 border border-orange-500 rounded-lg p-3 text-white active:bg-orange-700" 
                    onClick={() => { if (dirRef.current.y !== 1) nextDirRef.current = { x: 0, y: -1 }; }}
                />
                <div className="flex gap-4">
                    <ArrowLeft 
                        className="w-14 h-14 bg-orange-900/80 border border-orange-500 rounded-lg p-3 text-white active:bg-orange-700" 
                        onClick={() => { if (dirRef.current.x !== 1) nextDirRef.current = { x: -1, y: 0 }; }}
                    />
                    <ArrowDown 
                        className="w-14 h-14 bg-orange-900/80 border border-orange-500 rounded-lg p-3 text-white active:bg-orange-700" 
                        onClick={() => { if (dirRef.current.y !== -1) nextDirRef.current = { x: 0, y: 1 }; }}
                    />
                    <ArrowRight 
                        className="w-14 h-14 bg-orange-900/80 border border-orange-500 rounded-lg p-3 text-white active:bg-orange-700" 
                        onClick={() => { if (dirRef.current.x !== -1) nextDirRef.current = { x: 1, y: 0 }; }}
                    />
                </div>
            </div>
        </div>
    );
}