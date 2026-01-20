import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Loader2, LogIn, UserPlus, Calculator } from 'lucide-react';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      window.location.reload(); 
    } catch (error: any) {
      setMsg(error.message || 'เกิดข้อผิดพลาด โปรดลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-[#0f172a] to-[#172554] flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Blobs hidden on small screens to prevent overflow/distraction */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none hidden md:block" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none hidden md:block" />

      <div className="bg-[#1e293b]/90 border border-slate-600 p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-sm md:max-w-md backdrop-blur-xl relative z-10 animate-in fade-in zoom-in duration-300">
        
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg mb-3">
             <Calculator className="text-white" size={28} />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight text-center">
            MATH<span className="text-cyan-400">_Q</span>
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1">เกมตอบคำถามคณิตศาสตร์และเลขฐาน</p>
        </div>

        <p className="text-slate-300 text-center mb-6 text-xs md:text-sm bg-slate-800/50 py-2 rounded-lg border border-slate-700">
          {isLogin ? 'เข้าสู่ระบบเพื่อเริ่มเล่น' : 'สมัครสมาชิกใหม่ (เข้าเล่นได้ทันที)'}
        </p>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="text-slate-300 text-xs font-bold ml-1 mb-1 block uppercase">อีเมล</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 md:p-4 text-white focus:border-cyan-400 outline-none transition-all focus:ring-2 focus:ring-cyan-500/20 text-base" 
              placeholder="name@example.com"
            />
          </div>
          
          <div>
            <label className="text-slate-300 text-xs font-bold ml-1 mb-1 block uppercase">รหัสผ่าน</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 md:p-4 text-white focus:border-cyan-400 outline-none transition-all focus:ring-2 focus:ring-cyan-500/20 text-base"
              placeholder="••••••••"
            />
          </div>

          {msg && (
            <div className="text-xs md:text-sm text-center p-3 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {msg}
            </div>
          )}

          <button 
            disabled={loading}
            className="mt-2 py-3 md:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? <LogIn size={20}/> : <UserPlus size={20}/>)}
            {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก & เข้าเล่น'}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-400 text-sm">
          {isLogin ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?"}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setMsg(''); }}
            className="ml-2 text-cyan-400 font-bold hover:underline hover:text-cyan-300 transition-colors p-2"
          >
            {isLogin ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </button>
        </div>
      </div>
    </div>
  );
};