import { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ContentCard } from "../components/ContentCard";
import { GameModeBadge } from "../components/GameModeBadge";
import { Trophy, Filter, Crown, RefreshCcw, Eye, X, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const LeaderboardPage = () => {
  const { leaderboardCache, fetchLeaderboard, isLeaderboardLoading, fetchGameDetail } = useGameStore();

  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterDiff, setFilterDiff] = useState<string>("all");
  const [filterBase, setFilterBase] = useState<string>("all");

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [modalDetails, setModalDetails] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard(filterMode, filterDiff, filterBase);
  }, [filterMode, filterDiff, filterBase]);

  const handleRefresh = () => {
    fetchLeaderboard(filterMode, filterDiff, filterBase, true);
  };

  const handleViewDetail = async (log: any) => {
    setSelectedLog(log);
    setIsDetailLoading(true);
    setModalDetails([]);
    const details = await fetchGameDetail(log.id);
    setModalDetails(details || []);
    setIsDetailLoading(false);
  };

  const handleCloseDetail = () => {
    setSelectedLog(null);
  };

  return (
    <div className="w-full max-w-4xl h-[85vh] flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 p-2 md:p-0">
      <div className="text-center mt-2 shrink-0">
        <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 flex justify-center items-center gap-2 drop-shadow-sm">
          <Crown size={32} className="text-yellow-400 drop-shadow-lg md:w-10 md:h-10" /> ตารางอันดับ
        </h2>
        <p className="text-slate-400 mt-1 text-xs md:text-sm font-medium">ทำเนียบ 10 ยอดฝีมือสูงสุด</p>
      </div>

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
            {/* ... other options same as HistoryPage ... */}
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
        <button onClick={handleRefresh} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white shadow-md active:scale-95 flex justify-center h-10 items-center w-full sm:w-auto" title="รีเฟรช">
          <RefreshCcw size={14} className={isLeaderboardLoading ? "animate-spin" : ""} />
        </button>
      </ContentCard>

      <ContentCard variant="table" className="flex-1 min-h-0 flex flex-col w-full">
        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          {isLeaderboardLoading && leaderboardCache.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
              <p>กำลังโหลด...</p>
            </div>
          ) : leaderboardCache.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Trophy size={48} className="opacity-20 mb-2" />
              <p>ไม่พบข้อมูล</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="sticky top-0 bg-slate-900 z-10 shadow-md">
                <tr className="text-slate-500 uppercase border-b border-slate-700">
                  <th className="p-3 text-center w-12 md:w-16">#</th>
                  <th className="p-3 whitespace-nowrap">ผู้เล่น</th>
                  <th className="p-3 whitespace-nowrap">รายละเอียด</th>
                  <th className="p-3 text-center whitespace-nowrap">คะแนน</th>
                  <th className="p-3 text-right whitespace-nowrap">ดู</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardCache.map((player: any, idx: number) => (
                  <tr key={idx} className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${idx === 0 ? "bg-yellow-500/10" : idx === 1 ? "bg-slate-400/10" : idx === 2 ? "bg-orange-700/10" : ""}`}>
                    <td className="p-3 text-center font-black text-base md:text-lg">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : <span className="text-slate-600">{idx + 1}</span>}
                    </td>
                    <td className="p-3">
                      <div className={`font-bold text-xs md:text-sm truncate max-w-[100px] md:max-w-none ${idx < 3 ? "text-white" : "text-slate-300"}`}>
                        {player.player_name || "Anonymous"}
                      </div>
                      <div className="text-[10px] text-slate-500 opacity-60 font-mono hidden sm:block">
                        {new Date(player.created_at).toLocaleDateString("th-TH")}
                      </div>
                    </td>
                    <td className="p-3 min-w-[100px]">
                      <GameModeBadge mode={player.mode} base={player.base_config?.base} difficulty={player.difficulty} />
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full font-bold text-xs md:text-sm border ${idx === 0 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" : player.score === 10 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-slate-800 text-slate-300 border-slate-700"}`}>
                        {player.score}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleViewDetail(player)} className="p-2 bg-slate-800 hover:bg-cyan-500 hover:text-slate-900 rounded-lg text-slate-400 transition-all shadow-sm active:scale-95">
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

      {/* Modal is identical to HistoryPage, skipping repetition for brevity but reuse the exact code block from HistoryPage */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-300">
           {/* ... Paste Modal Code from HistoryPage here (line 217-268) ... */}
           <ContentCard variant="table" className="w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 bg-[#1e293b]!">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-700/50 rounded-xl hidden sm:block"><Trophy className="text-yellow-400" size={24} /></div>
                  <div><h3 className="text-lg font-bold text-white">คะแนน: <span className="text-cyan-400 text-xl">{selectedLog.score}</span>/10</h3>
                  <div className="mt-1"><GameModeBadge mode={selectedLog.mode} base={selectedLog.base_config?.base} difficulty={selectedLog.difficulty} /></div></div>
               </div>
               <button onClick={handleCloseDetail} className="p-2 bg-slate-700/50 hover:bg-rose-500 rounded-full text-slate-300 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            {/* ... Content ... */}
             <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-slate-900/50 custom-scrollbar">
               {/* Use Same Modal Content Logic as HistoryPage */}
               {isDetailLoading ? <div className="text-center py-12 text-slate-400 animate-pulse">กำลังโหลด...</div> : modalDetails.length > 0 ? (
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
                           {/* Answers Grid */}
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className={`p-2 rounded-lg border ${q.isCorrect ? "bg-emerald-900/20 border-emerald-500/20" : "bg-rose-900/20 border-rose-500/20"}`}>
                                 <span className="block text-[10px] text-slate-400 uppercase font-bold">ตอบ</span><span className={`font-bold ${q.isCorrect ? "text-emerald-400" : "text-rose-400"}`}>{q.userAnswer}</span>
                              </div>
                              {!q.isCorrect && <div className="p-2 rounded-lg border bg-slate-800/50 border-slate-600/30"><span className="block text-[10px] text-slate-400 uppercase font-bold">เฉลย</span><span className="font-bold text-emerald-400">{q.correctAnswer}</span></div>}
                           </div>
                        </div>
                      </div>
                   ))}
                 </div>
               ) : <div className="text-center py-12 text-slate-500"><AlertTriangle className="mx-auto mb-2 opacity-50"/>ไม่พบรายละเอียด</div>}
             </div>
          </ContentCard>
        </div>
      )}
    </div>
  );
};