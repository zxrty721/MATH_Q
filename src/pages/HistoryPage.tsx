import { useEffect, useState, useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import { useAuthStore } from "../store/authStore";
import { ContentCard } from "../components/ContentCard";
import { GameModeBadge } from "../components/GameModeBadge";
import {
  Trophy, RefreshCcw, Calendar, Eye, X, CheckCircle2, XCircle, AlertTriangle, Filter,
} from "lucide-react";

export const HistoryPage = () => {
  const {
    resetGame, score, historyCache, fetchHistoryCache, isHistoryLoading, setDetailViewOpen, fetchGameDetail,
  } = useGameStore();
  const { user } = useAuthStore();

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [modalDetails, setModalDetails] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Filter States
  const [filterBase, setFilterBase] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterDiff, setFilterDiff] = useState<string>("all");

  useEffect(() => {
    if (user?.id) fetchHistoryCache();
  }, [user?.id]);

  const filteredHistory = useMemo(() => {
    return historyCache.filter((log) => {
      const logBase = log.base_config?.base ? String(log.base_config.base) : "all";
      const matchBase = filterBase === "all" || logBase === filterBase;
      const matchMode = filterMode === "all" || log.mode === filterMode;
      const matchDiff = filterDiff === "all" || log.difficulty === filterDiff;
      return matchBase && matchMode && matchDiff;
    });
  }, [historyCache, filterBase, filterMode, filterDiff]);

  const handleViewDetail = async (log: any) => {
    setSelectedLog(log);
    setDetailViewOpen(true);
    setIsDetailLoading(true);
    setModalDetails([]);
    if (log.questions_data) {
      setModalDetails(log.questions_data);
      setIsDetailLoading(false);
    } else {
      const details = await fetchGameDetail(log.id);
      setModalDetails(details || []);
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedLog(null);
    setDetailViewOpen(false);
  };

  return (
    <div className="w-full max-w-5xl h-[85vh] flex flex-col gap-4 md:gap-6 p-2 md:p-0">
      {/* Score Card (Always Visible, Compact on Mobile) */}
      <ContentCard variant="score" className="flex-shrink-0 flex-row items-center p-4 md:p-6 gap-4">
        <div className="flex-1">
          <h2 className="text-slate-400 font-bold text-xs md:text-sm uppercase">คะแนนล่าสุด</h2>
          <div className="text-3xl md:text-5xl font-black text-cyan-400 mt-1">
            {score} <span className="text-base md:text-xl text-slate-500">/ 10</span>
          </div>
        </div>
        <button onClick={resetGame} className="px-4 py-3 md:px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95 text-sm md:text-base whitespace-nowrap">
          <RefreshCcw size={18} /> <span className="hidden sm:inline">เล่นใหม่</span>
        </button>
      </ContentCard>

      {/* Filter Bar (Stacked on Mobile) */}
      <ContentCard variant="filter" className="flex-shrink-0 flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center p-3">
        <div className="flex items-center gap-1 text-cyan-400 font-bold text-xs justify-center mb-1 sm:mb-0">
          <Filter size={14} /> กรอง:
        </div>
        <div className="grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
          <select value={filterBase} onChange={(e) => setFilterBase(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 outline-none focus:border-cyan-400 w-full h-10">
            <option value="all">ทุกฐาน</option>
            <option value="2">ฐาน 2</option>
            <option value="8">ฐาน 8</option>
            <option value="10">ฐาน 10</option>
            <option value="16">ฐาน 16</option>
          </select>
          <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 outline-none focus:border-cyan-400 w-full h-10">
            <option value="all">ทุกโหมด</option>
            <option value="addition">บวก</option>
            <option value="subtraction">ลบ</option>
            <option value="multiplication">คูณ</option>
            <option value="division">หาร</option>
            <option value="equation">สมการ</option>
            <option value="area">พื้นที่</option>
            <option value="linear">กราฟเส้น</option>
            <option value="quadratic">กำลังสอง</option>
            <option value="variable">ตัวแปร</option>
            <option value="probability">ความน่าจะเป็น</option>
          </select>
          <select value={filterDiff} onChange={(e) => setFilterDiff(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 outline-none focus:border-cyan-400 w-full h-10">
            <option value="all">ทุกระดับ</option>
            <option value="easy">ง่าย</option>
            <option value="medium">กลาง</option>
            <option value="hard">ยาก</option>
          </select>
        </div>
        <button onClick={() => fetchHistoryCache(true)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white shadow-md active:scale-95 flex justify-center h-10 items-center w-full sm:w-auto" title="รีเฟรช">
          <RefreshCcw size={14} className={isHistoryLoading ? "animate-spin" : ""} />
        </button>
      </ContentCard>

      {/* History List (Horizontal Scroll on Mobile) */}
      <ContentCard variant="table" className="flex-1 min-h-0 flex flex-col w-full">
        <div className="p-3 md:p-4 border-b border-slate-700 bg-slate-800/50 font-bold text-slate-300 flex items-center gap-2 flex-shrink-0 text-sm md:text-base">
          <Calendar size={18} className="text-cyan-400" /> ประวัติ ({filteredHistory.length})
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          {isHistoryLoading && historyCache.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <p>กำลังโหลด...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="sticky top-0 bg-slate-900 z-10 shadow-sm">
                <tr className="text-slate-500 uppercase border-b border-slate-700">
                  <th className="p-3 w-24 md:w-32 whitespace-nowrap">วันที่</th>
                  <th className="p-3 whitespace-nowrap">รายละเอียด</th>
                  <th className="p-3 text-center whitespace-nowrap">คะแนน</th>
                  <th className="p-3 text-right whitespace-nowrap">ดู</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 && (
                  <tr><td colSpan={4} className="text-center p-8 text-slate-500">ไม่พบข้อมูลตามเงื่อนไข</td></tr>
                )}
                {filteredHistory.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800 last:border-0 group">
                    <td className="p-3 text-slate-400">
                      <div className="font-mono text-slate-300 whitespace-nowrap">{new Date(log.created_at).toLocaleDateString("th-TH")}</div>
                      <div className="opacity-50 text-[10px] mt-0.5">{new Date(log.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="p-3 min-w-[120px]">
                      <GameModeBadge mode={log.mode} base={log.base_config?.base} difficulty={log.difficulty} />
                    </td>
                    <td className="p-3 text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold border ${log.score >= 8 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : log.score >= 5 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                        {log.score}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleViewDetail(log)} className="p-2 bg-slate-800 hover:bg-cyan-500 hover:text-slate-900 rounded-lg text-slate-400 transition-all shadow-sm active:scale-95">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ContentCard>

      {/* Fullscreen Detail Modal (Mobile Friendly) */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-300">
          <ContentCard variant="table" className="w-full max-w-3xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 bg-[#1e293b]!">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700/50 rounded-xl hidden sm:block">
                  <Trophy className="text-yellow-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    คะแนน: <span className="text-cyan-400 text-xl">{selectedLog.score}</span>/10
                  </h3>
                  <div className="mt-1"><GameModeBadge mode={selectedLog.mode} base={selectedLog.base_config?.base} difficulty={selectedLog.difficulty} /></div>
                </div>
              </div>
              <button onClick={handleCloseDetail} className="p-2 bg-slate-700/50 hover:bg-rose-500 rounded-full text-slate-300 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-slate-900/50 custom-scrollbar">
              {isDetailLoading ? (
                <div className="text-center py-12 text-slate-400 animate-pulse">กำลังโหลด...</div>
              ) : modalDetails.length > 0 ? (
                <div className="space-y-3">
                  {modalDetails.map((q: any, idx: number) => (
                    <div key={idx} className={`p-3 md:p-4 rounded-xl border relative overflow-hidden ${q.isCorrect ? "bg-emerald-900/10 border-emerald-500/30" : "bg-rose-900/10 border-rose-500/30"}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${q.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">ข้อ {idx + 1}</span>
                        {q.isCorrect ? <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full"><CheckCircle2 size={12} /> ถูก</div> : <div className="flex items-center gap-1 text-rose-400 text-[10px] font-bold bg-rose-400/10 px-2 py-0.5 rounded-full"><XCircle size={12} /> ผิด</div>}
                      </div>
                      <div className="pl-2">
                        <div className="text-lg font-bold text-white mb-3 font-mono break-words bg-slate-950/30 p-2 rounded-lg border border-slate-700/50 text-center">{q.display}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className={`p-2 rounded-lg border ${q.isCorrect ? "bg-emerald-900/20 border-emerald-500/20" : "bg-rose-900/20 border-rose-500/20"}`}>
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">ตอบ</span>
                            <span className={`font-bold ${q.isCorrect ? "text-emerald-400" : "text-rose-400"}`}>{q.userAnswer}</span>
                          </div>
                          {!q.isCorrect && (
                            <div className="p-2 rounded-lg border bg-slate-800/50 border-slate-600/30">
                              <span className="block text-[10px] text-slate-400 uppercase font-bold">เฉลย</span>
                              <span className="font-bold text-emerald-400">{q.correctAnswer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center"><AlertTriangle size={48} className="mb-4 opacity-50" /><p>ไม่พบรายละเอียด</p></div>
              )}
            </div>
          </ContentCard>
        </div>
      )}
    </div>
  );
};