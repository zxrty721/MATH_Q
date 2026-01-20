import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Timer, ArrowRight, CheckCircle2, XCircle, Home } from 'lucide-react';
import { getGameModeInfo } from '../utils/gameConfig';

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
  const { label: modeLabel, icon: ModeIcon, color: modeColor } = getGameModeInfo(config.mode);

  if (!currentQ) return null;

  const getBtnClass = (opt: string) => {
    if (currentAnswerStatus === 'unanswered') return "bg-[#0f172a] border-slate-700 text-slate-200 hover:border-cyan-400 hover:bg-[#1e293b] active:scale-[0.98]";
    if (opt === currentQ.correctAnswer) return "bg-emerald-900/80 border-emerald-500 text-emerald-400";
    if (opt === selectedOption && currentAnswerStatus === 'wrong') return "bg-rose-900/80 border-rose-500 text-rose-400";
    return "bg-[#0f172a]/50 border-slate-800 text-slate-600 opacity-50";
  };

  return (
    <div className="w-full max-w-3xl px-2 md:px-4 flex flex-col items-center h-full justify-between pb-6">
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center mb-4 text-slate-300 shrink-0">
        <button onClick={resetGame} className="p-2 hover:bg-slate-800 rounded-full flex gap-1 items-center text-xs md:text-sm font-bold active:scale-95"><Home size={18} /> <span className="hidden sm:inline">ออก</span></button>
        <div className="flex gap-2">
          <span className="bg-slate-800 px-2 py-1 rounded text-cyan-400 font-bold uppercase text-[10px] tracking-wider border border-slate-700">ฐาน {config.base}</span>
          <span className={`bg-slate-800 px-2 py-1 rounded ${modeColor} font-bold uppercase text-[10px] tracking-wider border border-slate-700 flex items-center gap-1`}>
            <ModeIcon size={12} /> {modeLabel}
          </span>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="bg-[#1e293b]/90 backdrop-blur-md border border-slate-600 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl w-full relative overflow-hidden flex flex-col flex-grow justify-center max-h-[70vh]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
          <div className={`h-full transition-all duration-1000 ease-linear ${timerColor}`} style={{ width: `${progress}%` }} />
        </div>
        
        <div className="flex justify-center mb-4 md:mb-8 mt-2 shrink-0 relative">
            <div className="font-mono text-slate-400 text-xs absolute top-1 right-0">{currentQIndex + 1}/10</div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border ${timeLeft <= 5 ? 'border-rose-500 text-rose-500' : 'border-cyan-500 text-cyan-400'}`}>
                <Timer size={16} /> <span className="font-mono font-bold text-lg md:text-xl">{timeLeft}</span>
            </div>
        </div>

        <div className="mb-6 md:mb-10 flex flex-col items-center justify-center flex-grow min-h-[80px]">
          <div className="text-3xl md:text-5xl font-bold text-white tracking-wide text-center drop-shadow-lg leading-tight break-all">{currentQ.display}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full shrink-0">
          {currentQ.options.map((opt, idx) => (
            <button key={idx} onClick={() => submitAnswer(opt)} disabled={currentAnswerStatus !== 'unanswered'}
              className={`relative h-16 md:h-20 rounded-xl font-bold text-xl md:text-2xl border-2 transition-all touch-manipulation ${getBtnClass(opt)}`}>
              <span className="flex items-center justify-center gap-3">
                 {opt} {currentAnswerStatus !== 'unanswered' && opt === currentQ.correctAnswer && <CheckCircle2 size={20} />}
                 {currentAnswerStatus === 'wrong' && opt === selectedOption && <XCircle size={20} />}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      {currentAnswerStatus !== 'unanswered' && (
        <button onClick={nextQuestion} className="mt-4 md:mt-8 px-8 md:px-12 py-3 md:py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-lg md:text-xl rounded-full shadow-lg flex items-center gap-2 animate-bounce active:scale-95 touch-manipulation">
          {currentQIndex >= 9 ? "สรุปผล" : "ข้อต่อไป"} <ArrowRight />
        </button>
      )}
    </div>
  );
};