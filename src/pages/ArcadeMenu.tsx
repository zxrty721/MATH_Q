import { useState } from 'react';
import { useGameStore, type GameId, type GameDifficulty } from '../store/gameStore';
import { 
  Zap, CloudRain, Shield, Gamepad2, Grid, Rocket, Clock, Spade, Layers, X, Play, Sword, Footprints, History
} from 'lucide-react';

export const ArcadeMenu = () => {
  // ✅ ดึง navigateTo มาใช้
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
    <div className="w-full max-w-6xl p-4 flex flex-col gap-6 h-[85vh] animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-slate-900/95 p-6 rounded-3xl border border-slate-700 shadow-lg shrink-0 gap-6">
        <div>
           <h2 className="text-4xl font-black text-white italic tracking-tighter drop-shadow-md">
             ARCADE <span className="text-cyan-400">ZONE</span>
           </h2>
           <p className="text-slate-400 text-sm mt-1">เลือกฐานและเกมที่ต้องการท้าทาย</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* ✅ ปุ่ม HISTORY */}
            <button 
                onClick={() => navigateTo('HISTORY')}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all active:scale-95 shadow-md"
            >
                <History size={20} className="text-cyan-400" />
                <span className="font-bold">ประวัติการเล่น</span>
            </button>

            <div className="h-8 w-[1px] bg-slate-700 hidden md:block" />

            {/* ปุ่มเลือกฐาน */}
            <div className="flex gap-2 p-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto max-w-full">
            {[2, 8, 10, 16].map((base) => (
                <button
                key={base}
                onClick={() => setBase(base)}
                className={`relative px-6 py-3 rounded-xl font-black text-lg transition-transform duration-200 active:scale-95 flex items-center gap-2 flex-shrink-0 ${
                    currentBase === base 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md ring-1 ring-white/20' 
                    : 'text-slate-500 hover:text-white hover:bg-slate-800'
                }`}
                >
                <Layers size={18} />
                ฐาน {base}
                </button>
            ))}
            </div>
        </div>
      </div>

      {/* Grid of Games */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar p-2 pb-20">
        {GAMES.filter(game => {
            if (currentBase === 2 && (game.id === 'math-snake')) {
                return false;
            }
            return true;
        }).map((game) => (
          <button 
            key={game.id} 
            onClick={() => setSelectedGame(game)}
            className="group relative h-56 rounded-[2rem] overflow-hidden border border-slate-700 bg-slate-800 hover:border-cyan-500/50 transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex flex-col items-center justify-center p-4 text-center will-change-transform"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            
            <div className={`p-5 rounded-3xl bg-slate-900 mb-4 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-300 shadow-md ring-1 ring-white/5 relative z-10`}>
                <game.icon size={40} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white leading-tight mb-2 group-hover:text-cyan-300 transition-colors">
                {game.name}
              </h3>
              <p className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors line-clamp-2">
                {game.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Difficulty Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-[2rem] w-full max-w-md relative shadow-2xl">
            <button onClick={() => setSelectedGame(null)} className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-rose-500 transition-all">
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className={`inline-flex p-6 rounded-3xl bg-gradient-to-br ${selectedGame.color} mb-4 shadow-lg`}>
                <selectedGame.icon size={56} className="text-white" />
              </div>
              <h2 className="text-4xl font-black text-white mb-2">{selectedGame.name}</h2>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-cyan-400 text-sm font-bold">
                โหมด: ฐาน {currentBase}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => handleStart('easy')} className="bg-slate-800 hover:bg-emerald-900/30 border-slate-700 border hover:border-emerald-500 p-4 rounded-xl flex items-center gap-4 transition-colors active:scale-95">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><Shield size={24} /></div>
                <div className="text-left"><div className="font-bold text-white text-lg">EASY</div><div className="text-xs text-slate-400">เลขน้อย, ช้าๆ</div></div>
              </button>

              <button onClick={() => handleStart('medium')} className="bg-slate-800 hover:bg-yellow-900/30 border-slate-700 border hover:border-yellow-500 p-4 rounded-xl flex items-center gap-4 transition-colors active:scale-95">
                <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg"><Play size={24} /></div>
                <div className="text-left"><div className="font-bold text-white text-lg">MEDIUM</div><div className="text-xs text-slate-400">ความเร็วปกติ, มีคูณ</div></div>
              </button>

              <button onClick={() => handleStart('hard')} className="bg-slate-800 hover:bg-rose-900/30 border-slate-700 border hover:border-rose-500 p-4 rounded-xl flex items-center gap-4 transition-colors active:scale-95">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-lg"><Zap size={24} /></div>
                <div className="text-left"><div className="font-bold text-white text-lg">HARD</div><div className="text-xs text-slate-400">เร็วมาก, เลขเยอะ</div></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};