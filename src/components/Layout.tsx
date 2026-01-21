import type { ReactNode } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { Home, Users, LogOut, Calculator, Cpu, Gamepad2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const Layout = ({ children }: { children: ReactNode }) => {
  // ✅ FIX: ดึง setStatus และ navigateTo มาใช้แทน goToHome/goToAbout
  const { status, setStatus, navigateTo } = useGameStore();
  const { signOut, user } = useAuthStore();

  // ✅ Function เปลี่ยนหน้า
  const handleGoHome = () => {
    setStatus('home');
    navigateTo('MENU'); // บังคับให้กลับมาหน้าเมนูหลัก
  };

  const handleGoAbout = () => {
    setStatus('about');
    // ไม่ต้อง navigateTo เพราะ App.tsx จะ render About ใน Layout อัตโนมัติถ้า status === 'about'
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-100 overflow-hidden relative bg-[#050b14]">
      
      {/* ==============================
          🌌 ส่วนพื้นหลัง (คงเดิม)
      ============================== */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[50vw] h-[50vw] bg-cyan-900/20 rounded-full mix-blend-screen opacity-50" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full mix-blend-screen opacity-50" />
      </div>

      <div className="fixed inset-0 z-50 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] opacity-10" />

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-20">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-slate-700 font-bold font-mono text-6xl select-none will-change-transform"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              rotate: 0,
              opacity: 0 
            }}
            animate={{ 
              y: [null, Math.random() * -200], 
              rotate: [0, 45],
              opacity: [0, 0.4, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 15, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * 2 
            }}
          >
            {['+', '-', '×', '÷', '∑', 'π', '√', '%'][i % 8]}
          </motion.div>
        ))}
      </div>


      {/* ==============================
          🖥️ ส่วนหัว (Header)
      ============================== */}
      <header className="relative z-50 w-full h-16 md:h-20 bg-slate-900/95 border-b border-white/5 shadow-md flex items-center justify-between px-4 md:px-8">
        
        {/* ซ้าย: โลโก้เกม -> กลับหน้าแรก */}
        <button onClick={handleGoHome} className="flex items-center gap-3 group relative">
          <div className="relative p-2 bg-slate-800 rounded-lg border border-slate-700 group-hover:border-cyan-500/50 transition-colors duration-200">
            <Calculator className="text-cyan-400" size={24} />
          </div>
          <div className="flex flex-col items-start">
             <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter leading-none flex items-center gap-1">
               MATH<span className="text-cyan-400">_Q</span>
               <span className="flex h-1.5 w-1.5 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                </span>
             </h1>
             <span className="text-[10px] text-slate-500 font-bold tracking-[0.1em] uppercase">ระบบเกมอาเขต</span>
          </div>
        </button>

        {/* กลาง: เมนูหลัก (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/5">
          <NavButton 
            active={status === 'home'} 
            onClick={handleGoHome} 
            icon={Home} 
            label="หน้าหลัก" 
          />
          <NavButton 
            active={status === 'about'} 
            onClick={handleGoAbout} 
            icon={Users} 
            label="ผู้พัฒนา" 
          />
        </nav>

        {/* ขวา: สถานะผู้เล่น */}
        <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-800 rounded-md border border-slate-700">
               <div className="flex flex-col items-end leading-tight">
                  <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Activity size={8} className="text-green-500" /> ออนไลน์
                  </span>
                  <span className="text-xs font-bold text-white font-mono">{user?.email?.split('@')[0] || 'ผู้เยี่ยมชม'}</span>
               </div>
               <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-inner border border-white/10">
                  <Gamepad2 size={14} className="text-white" />
               </div>
            </div>

            <div className="h-6 w-[1px] bg-slate-700 mx-1 hidden md:block" />
            
            <button 
              onClick={signOut} 
              className="p-2 bg-rose-900/20 hover:bg-rose-600 text-rose-500 hover:text-white rounded-lg border border-rose-500/20 transition-colors duration-200"
              title="ออกจากระบบ"
            >
              <LogOut size={18} />
            </button>
        </div>
      </header>

      {/* เมนูมือถือ (Mobile Nav) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-slate-700 rounded-full p-2 flex gap-4 shadow-xl">
         <NavButtonMobile active={status === 'home'} onClick={handleGoHome} icon={Home} />
         <NavButtonMobile active={status === 'about'} onClick={handleGoAbout} icon={Users} />
      </div>

      {/* ==============================
          🎮 พื้นที่แสดงผล (Children: ArcadeMenu / AboutPage)
      ============================== */}
      <main className="relative z-10 flex-grow w-full flex flex-col items-center p-4 md:p-6 overflow-y-auto custom-scrollbar">
        {children}
      </main>

      {/* ==============================
          📟 ส่วนท้าย (Footer)
      ============================== */}
      <footer className="relative z-20 py-2 bg-slate-950 border-t border-slate-800 text-center flex justify-between px-6 items-center text-[10px] font-mono text-slate-600 uppercase tracking-wider">
         <span>เวอร์ชัน 1.0.5</span>
         <span className="flex items-center gap-2 opacity-50">
            <Cpu size={12} />
            <span>เซิร์ฟเวอร์ปกติ</span>
         </span>
         <span className="hidden md:inline">© 2026 คณิตศาสตร์คอมพิวเตอร์</span>
      </footer>
    </div>
  );
};

// --- ปุ่มเมนู Helper Components ---

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold transition-all duration-200 ${
      active 
      ? 'text-cyan-950 bg-cyan-500 shadow-md' 
      : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    <Icon size={14} /> {label}
  </button>
);

const NavButtonMobile = ({ active, onClick, icon: Icon }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-full transition-colors ${
      active ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 bg-slate-800'
    }`}
  >
    <Icon size={22} />
  </button>
);