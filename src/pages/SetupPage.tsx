import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { 
  Binary, Calculator, Signal, ArrowRight,
  Plus, Minus, X, Divide, Square, Variable, Equal, Radius, TrendingUp, Dices
} from 'lucide-react';
import type { GameMode, Difficulty } from '../types';

export const SetupPage = () => {
  const { setBase, setMode, setDifficulty } = useGameStore();
  const [step, setStep] = useState(0);

  const BASES = [
    { val: 2, label: 'ฐาน 2', sub: 'Binary', color: 'bg-emerald-600' },
    { val: 8, label: 'ฐาน 8', sub: 'Octal', color: 'bg-amber-600' },
    { val: 10, label: 'ฐาน 10', sub: 'Decimal', color: 'bg-blue-600' },
    { val: 16, label: 'ฐาน 16', sub: 'Hex', color: 'bg-purple-600' },
  ];

  const MODES: { id: GameMode; label: string; icon: any }[] = [
    { id: 'addition', label: 'การบวก (+)', icon: Plus },
    { id: 'subtraction', label: 'การลบ (-)', icon: Minus },
    { id: 'multiplication', label: 'การคูณ (×)', icon: X },
    { id: 'division', label: 'การหาร (÷)', icon: Divide },
    { id: 'equation', label: 'สมการ', icon: Equal },
    { id: 'area', label: 'หาพื้นที่', icon: Square },
    { id: 'linear', label: 'สมการเชิงเส้น', icon: TrendingUp },
    { id: 'quadratic', label: 'สมการกำลังสอง', icon: Radius },
    { id: 'variable', label: 'หาค่าตัวแปร', icon: Variable },
    { id: 'probability', label: 'ความน่าจะเป็น', icon: Dices },
  ];

  const DIFFS: { id: Difficulty; label: string; desc: string }[] = [
    { id: 'easy', label: 'ง่าย (Easy)', desc: 'เลขน้อย คิดในใจได้' },
    { id: 'medium', label: 'ปานกลาง (Medium)', desc: 'เลขหลักสิบ เริ่มต้องทด' },
    { id: 'hard', label: 'ยาก (Hard)', desc: 'เลขเยอะ ท้าทายสุดๆ' },
  ];

  return (
    <div className="bg-[#1e293b]/90 backdrop-blur-xl border border-slate-600 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-4xl min-h-[500px] flex flex-col relative overflow-hidden transition-all duration-500">
      
      {/* Progress */}
      <div className="flex gap-2 mb-8 justify-center">
        {[0, 1, 2].map(i => <div key={i} className={`h-2 w-12 rounded-full transition-colors ${i <= step ? 'bg-cyan-400' : 'bg-slate-700'}`} />)}
      </div>

      {/* STEP 0: Base */}
      {step === 0 && (
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Binary className="text-cyan-400" /> เลือกฐานของตัวเลข</h2>
          <div className="grid grid-cols-2 gap-6 w-full max-w-xl">
            {BASES.map(b => (
              <button key={b.val} onClick={() => { setBase(b.val); setStep(1); }}
                className={`p-6 rounded-2xl border-2 border-slate-700 hover:border-cyan-400 transition-all hover:scale-105 ${b.color} bg-opacity-20 hover:bg-opacity-30`}>
                <div className="text-3xl font-black text-white mb-1">{b.label}</div>
                <div className="text-slate-300 text-sm font-bold uppercase tracking-wider">{b.sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: Mode */}
      {step === 1 && (
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300 w-full">
          <button onClick={() => setStep(0)} className="absolute top-8 left-8 text-slate-400 hover:text-white font-bold text-sm">← ย้อนกลับ</button>
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><Calculator className="text-cyan-400" /> เลือกโหมดเกม</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
            {MODES.map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setStep(2); }}
                className="bg-[#0f172a] hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 p-4 rounded-xl flex flex-col items-center gap-3 transition-all">
                <m.icon className="text-cyan-400" size={32} />
                <span className="text-white font-bold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Difficulty */}
      {step === 2 && (
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300 w-full">
          <button onClick={() => setStep(1)} className="absolute top-8 left-8 text-slate-400 hover:text-white font-bold text-sm">← ย้อนกลับ</button>
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Signal className="text-cyan-400" /> เลือกระดับความยาก</h2>
          <div className="flex flex-col gap-4 w-full max-w-md">
            {DIFFS.map(d => (
              <button key={d.id} onClick={() => setDifficulty(d.id)}
                className="flex items-center justify-between p-6 rounded-2xl bg-[#0f172a] border border-slate-700 hover:border-cyan-400 hover:bg-slate-800 transition-all group">
                <div className="text-left">
                  <div className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">{d.label}</div>
                  <div className="text-slate-400 text-sm">{d.desc}</div>
                </div>
                <ArrowRight className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};