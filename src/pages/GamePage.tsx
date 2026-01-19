import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Timer, ArrowRight, CheckCircle2, XCircle, Home } from 'lucide-react';
import { getGameModeInfo } from '../utils/gameConfig'; // ✅ Import Map กลาง

export const GamePage = () => {
  const { history, currentQIndex, submitAnswer, nextQuestion, timeLeft, decrementTime, config, currentAnswerStatus, selectedOption, resetGame } = useGameStore();
  const currentQ = history[currentQIndex];

  useEffect(() => {
    const timer = setInterval(decrementTime, 1000);
    return () => clearInterval(timer);
  }, [decrementTime]);

  const maxTime = config.difficulty === 'hard' ? 20 : config.difficulty === 'medium' ? 40 : 60;
  const progress = (timeLeft / maxTime) * 100;
  const timerColor = timeLeft <= 5 ? 'bg-rose-500' : 'bg-cyan-400';

  // ✅ ใช้ข้อมูลจาก Map กลาง
  const { label: modeLabel, icon: ModeIcon, color: modeColor } = getGameModeInfo(config.mode);

  if (!currentQ) return null;

  const getBtnClass = (opt: string) => {
    if (currentAnswerStatus === 'unanswered') return "bg-[#0f172a] border-slate-700 text-slate-200 hover:border-cyan-400 hover:bg-[#1e293b]";
    if (opt === currentQ.correctAnswer) return "bg-emerald-900/80 border-emerald-500 text-emerald-400";
    if (opt === selectedOption && currentAnswerStatus === 'wrong') return "bg-rose-900/80 border-rose-500 text-rose-400";
    return "bg-[#0f172a]/50 border-slate-800 text-slate-600 opacity-50";
  };

  return (
    <div className="w-full max-w-3xl px-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6 text-slate-300">
        <button onClick={resetGame} className="p-2 hover:bg-slate-800 rounded-full flex gap-2 items-center text-sm font-bold"><Home size={20} /> ออกจากเกม</button>
        <div className="flex gap-3">
          <span className="bg-slate-800 px-3 py-1 rounded text-cyan-400 font-bold uppercase text-xs tracking-wider border border-slate-700">ฐาน {config.base}</span>
          {/* ✅ แสดง Icon + ชื่อโหมด */}
          <span className={`bg-slate-800 px-3 py-1 rounded ${modeColor} font-bold uppercase text-xs tracking-wider border border-slate-700 flex items-center gap-2`}>
            <ModeIcon size={14} /> {modeLabel}
          </span>
        </div>
      </div>

      <div className="bg-[#1e293b]/90 backdrop-blur-md border border-slate-600 p-8 rounded-[2rem] shadow-2xl w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
          <div className={`h-full transition-all duration-1000 ease-linear ${timerColor}`} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-center mb-8 mt-2">
            <div className="font-mono text-slate-400 text-sm absolute top-4 right-6">{currentQIndex + 1}/10</div>
            <div className={`flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900 border ${timeLeft <= 5 ? 'border-rose-500 text-rose-500' : 'border-cyan-500 text-cyan-400'}`}>
                <Timer size={18} /> <span className="font-mono font-bold text-xl">{timeLeft} วินาที</span>
            </div>
        </div>
        <div className="mb-10 flex flex-col items-center justify-center min-h-[120px]">
          <div className="text-4xl md:text-5xl font-bold text-white tracking-wide text-center drop-shadow-lg leading-tight">{currentQ.display}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ.options.map((opt, idx) => (
            <button key={idx} onClick={() => submitAnswer(opt)} disabled={currentAnswerStatus !== 'unanswered'}
              className={`relative h-20 rounded-xl font-bold text-2xl border-2 transition-all ${getBtnClass(opt)}`}>
              <span className="flex items-center justify-center gap-3">
                 {opt} {currentAnswerStatus !== 'unanswered' && opt === currentQ.correctAnswer && <CheckCircle2 />}
                 {currentAnswerStatus === 'wrong' && opt === selectedOption && <XCircle />}
              </span>
            </button>
          ))}
        </div>
      </div>
      {currentAnswerStatus !== 'unanswered' && (
        <button onClick={nextQuestion} className="mt-8 px-12 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-xl rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          {currentQIndex >= 9 ? "สรุปผล" : "ข้อต่อไป"} <ArrowRight />
        </button>
      )}
    </div>
  );
};