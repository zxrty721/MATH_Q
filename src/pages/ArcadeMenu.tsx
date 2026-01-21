import { useState } from 'react';
import { useGameStore, type GameId, type GameDifficulty } from '../store/gameStore';
import { 
  Zap, CloudRain, Shield, Gamepad2, Grid, Rocket, Clock, Spade, X, Play, Sword, Footprints, History
} from 'lucide-react';

export const ArcadeMenu = () => {
  const { setBase, startGame, currentBase, navigateTo } = useGameStore();
  const [selectedGame, setSelectedGame] = useState<any | null>(null);

  const GAMES = [
    { id: 'falling-numbers', name: 'ฝนตัวเลข', desc: 'พิมพ์คำตอบก่อนตกถึงพื้น', icon: CloudRain, color: 'from-blue-500 to-cyan-500' },
    { id: 'quick-math', name: 'คณิตสายฟ้า', desc: 'ตอบให้ไวที่สุดใน 60 วิ', icon: Zap, color: 'from-yellow-500 to-orange-500' },
    { id: 'base-defense', name: 'ป้อมปราการ', desc: 'ยิงศัตรูด้วยคำตอบที่ถูก', icon: Shield, color: 'from-emerald-500 to-green-500' },
    { id: 'math-snake', name: 'งูเลขฐาน', desc: 'กินตัวเลขที่ถูกต้อง', icon: Gamepad2, color: 'from-purple-500 to-pink-500' },
    { id: 'puzzle-2048', name: 'Base 2048', desc: 'รวมเลขฐานให้ถึงเป้าหมาย', icon: Grid, color: 'from-indigo-500 to-blue-500' },
    { id: 'space-shooter', name: 'ยานอวกาศ', desc: 'ยิงอุกกาบาตเลขฐาน', icon: Rocket, color: 'from-red-500 to-rose-500' },
    { id: 'time-bomb', name: 'กู้ระเบิด', desc: 'ตัดสายไฟให้ถูกก่อนระเบิด', icon: Clock, color: 'from-gray-500 to-slate-500' },
    { id: 'monster-slayer', name: 'นักล่ามอนสเตอร์', desc: 'ต่อสู้แบบ RPG ด้วยคณิตศาสตร์', icon: Sword, color: 'from-orange-600 to-red-600' },
    { id: 'dungeon-crawler', name: 'ดันเจี้ยนอาถรรพ์', desc: 'ผจญภัยเลือกเส้นทางและไขปริศนา', icon: Footprints, color: 'from-pink-500 to-rose-500'},
    { id: 'memory-card', name: 'เจ้ามือเลขฐาน', desc: 'คำนวณไพ่และตอบในฐานที่กำหนด', icon: Spade, color: 'from-teal-500 to-emerald-500' },
  ];

  const handleStart = (difficulty: GameDifficulty) => {
    if (selectedGame) {
      startGame(selectedGame.id as GameId, difficulty);
      setSelectedGame(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 flex flex-col gap-4 md:gap-6 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-slate-900/95 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-700 shadow-lg shrink-0 gap-4">
        <div className="text-center lg:text-left">
           <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter drop-shadow-md">
             ARCADE <span className="text-cyan-400">ZONE</span>
           </h2>
           <p className="text-slate-400 text-xs md:text-sm mt-1">เลือกฐานและเกมที่ต้องการท้าทาย</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
            <button 
                onClick={() => navigateTo('HISTORY')}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all active:scale-95 shadow-md"
            >
                <History size={18} className="text-cyan-400" />
                <span className="font-bold text-sm md:text-base">ประวัติ</span>
            </button>

            <div className="h-8 w-[1px] bg-slate-700 hidden sm:block" />

            {/* Base Selection Buttons */}
            <div className="flex gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
            {[2, 8, 10, 16].map((base) => (
                <button
                key={base}
                onClick={() => setBase(base)}
                className={`flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-lg font-black text-sm md:text-lg transition-all ${
                    currentBase === base 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-white'
                }`}
                >
                ฐาน {base}
                </button>
            ))}
            </div>
        </div>
      </div>

      {/* Grid of Games */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 overflow-y-auto custom-scrollbar p-1 pb-24">
        {GAMES.filter(game => !(currentBase === 2 && (game.id === 'math-snake' || game.id === 'memory-card')))
          .map((game) => (
          <button 
            key={game.id} 
            onClick={() => setSelectedGame(game)}
            className="group relative aspect-[4/5] md:h-56 rounded-2xl md:rounded-[2rem] overflow-hidden border border-slate-700 bg-slate-800 hover:border-cyan-500/50 transition-all active:scale-95 shadow-lg flex flex-col items-center justify-center p-3 md:p-4 text-center"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
            
            <div className={`p-3 md:p-5 rounded-xl md:rounded-3xl bg-slate-900 mb-2 md:mb-4 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-300`}>
                <game.icon className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm md:text-lg font-black text-white leading-tight mb-1 group-hover:text-cyan-300">
                {game.name}
              </h3>
              <p className="hidden md:block text-[10px] text-slate-400 group-hover:text-slate-200 line-clamp-2">
                {game.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Difficulty Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-3xl w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedGame(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full">
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className={`inline-flex p-5 rounded-2xl bg-gradient-to-br ${selectedGame.color} mb-4`}>
                <selectedGame.icon size={48} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-1">{selectedGame.name}</h2>
              <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest">ฐาน {currentBase}</p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { id: 'easy', label: 'EASY', color: 'emerald', desc: 'เลขน้อย เน้นความเข้าใจ', icon: Shield },
                { id: 'medium', label: 'MEDIUM', color: 'yellow', desc: 'ความเร็วปกติ มีคูณหาร', icon: Play },
                { id: 'hard', label: 'HARD', color: 'rose', desc: 'ท้าทายความเร็วและแม่นยำ', icon: Zap }
              ].map((diff) => (
                <button 
                  key={diff.id}
                  onClick={() => handleStart(diff.id as GameDifficulty)}
                  className={`bg-slate-800 hover:bg-${diff.color}-900/20 border-slate-700 border hover:border-${diff.color}-500 p-4 rounded-xl flex items-center gap-4 transition-all active:scale-95`}
                >
                  <div className={`p-2 bg-${diff.color}-500/10 text-${diff.color}-500 rounded-lg`}><diff.icon size={20} /></div>
                  <div className="text-left">
                    <div className="font-bold text-white">{diff.label}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{diff.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};