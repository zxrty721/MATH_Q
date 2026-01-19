import type { ReactNode } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { Trophy, Home, Calculator, LogOut, Medal, Users } from 'lucide-react';

export const Layout = ({ children }: { children: ReactNode }) => {
  // ✅ ดึง goToAbout มาใช้
  const { resetGame, goToSummary, goToLeaderboard, goToAbout, status, isDetailViewOpen } = useGameStore();
  const { signOut, user } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-100 overflow-hidden relative bg-slate-950">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-950 via-[#0f172a] to-[#172554]">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      {/* HEADER */}
      {!isDetailViewOpen && (
        <header className="relative z-50 w-full h-20 bg-slate-900 border-b border-slate-700 shadow-xl flex items-center justify-between px-4 md:px-12 animate-in slide-in-from-top-4 duration-300">
          
          {/* ✅ Logo เปลี่ยนเป็น MATH_Q */}
          <button onClick={resetGame} className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg group-hover:scale-105 transition-transform">
              <Calculator className="text-white" size={24} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white tracking-tight">
                MATH<span className="text-cyan-400">_Q</span>
              </h1>
            </div>
          </button>

          <div className="flex items-center gap-2 md:gap-4">
            <nav className="flex bg-slate-800/50 rounded-full p-1 border border-slate-700 overflow-x-auto max-w-[200px] md:max-w-none custom-scrollbar">
              <button 
                onClick={resetGame}
                className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                  status === 'setup' ? 'bg-cyan-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Home size={16} /> <span className="hidden md:inline">หน้าหลัก</span>
              </button>

              <button 
                onClick={goToLeaderboard}
                className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                  status === 'leaderboard' ? 'bg-yellow-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Medal size={16} /> <span className="hidden md:inline">อันดับ</span>
              </button>

              <button 
                onClick={goToSummary}
                className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                  status === 'summary' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy size={16} /> <span className="hidden md:inline">ประวัติ</span>
              </button>

              {/* ✅ ปุ่มผู้จัดทำ (About) */}
              <button 
                onClick={goToAbout}
                className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                  status === 'about' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={16} /> <span className="hidden md:inline">ผู้จัดทำ</span>
              </button>
            </nav>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
               <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">ผู้เล่น</span>
                  <span className="text-xs font-bold text-cyan-400 truncate max-w-[80px]">{user?.email?.split('@')[0]}</span>
               </div>
               <button onClick={signOut} className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-full transition-all" title="ออกจากระบบ">
                  <LogOut size={18} />
               </button>
            </div>
          </div>
        </header>
      )}

      <main className="relative z-10 flex-grow w-full flex flex-col items-center justify-center p-4">
        {children}
      </main>

      {!isDetailViewOpen && (
        <footer className="relative z-50 py-4 bg-slate-900 border-t border-slate-800 text-center text-slate-500 text-xs animate-in slide-in-from-bottom-4 duration-300">
           โครงงาน MATH_Q © 2026 | พัฒนาโดยนักเรียนไทย
        </footer>
      )}
    </div>
  );
};