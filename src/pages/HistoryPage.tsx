import { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { localDB } from '../utils/localDB';
import { ContentCard } from '../components/ContentCard';
import { GameModeBadge } from '../components/GameModeBadge';
import { RefreshCcw, Calendar, Eye, X, CheckCircle2, XCircle, AlertTriangle, Filter, Trophy } from 'lucide-react';

export const HistoryPage = () => {
  const { resetGame, score, historyCache, fetchHistoryCache, isHistoryLoading, setDetailViewOpen } = useGameStore(); 
  const { user } = useAuthStore();
  
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [modalDetails, setModalDetails] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Filter States
  const [filterBase, setFilterBase] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterDiff, setFilterDiff] = useState<string>('all');

  useEffect(() => {
    if (user?.id) fetchHistoryCache();
  }, [user?.id]); 

  // ✅ Client-Side Logic: กรองข้อมูลใน RAM
  const filteredHistory = useMemo(() => {
    return historyCache.filter(log => {
      // ⚠️ แก้บั๊กตรงนี้: แปลงเป็น String ก่อนเปรียบเทียบเสมอ
      const logBase = log.base_config?.base ? String(log.base_config.base) : 'all';
      
      const matchBase = filterBase === 'all' || logBase === filterBase;
      const matchMode = filterMode === 'all' || log.mode === filterMode;
      const matchDiff = filterDiff === 'all' || log.difficulty === filterDiff;
      
      return matchBase && matchMode && matchDiff;
    });
  }, [historyCache, filterBase, filterMode, filterDiff]);

  const handleViewDetail = async (log: any) => {
    setSelectedLog(log);
    setDetailViewOpen(true);
    setIsDetailLoading(true);
    setModalDetails([]);
    const details = await localDB.getDetails(log.id);
    setModalDetails(details || []); 
    setIsDetailLoading(false);
  };

  const handleCloseDetail = () => {
      setSelectedLog(null);
      setDetailViewOpen(false);
  };

  return (
    <div className="w-full max-w-5xl h-[85vh] flex flex-col md:flex-row gap-6 p-4 md:p-0">
      
      {/* LEFT SIDE */}
      <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
        
        {/* Score Card */}
        <ContentCard variant="score" className="flex-shrink-0">
           <div>
             <h2 className="text-slate-400 font-bold text-sm uppercase">คะแนนรอบล่าสุด</h2>
             <div className="text-5xl font-black text-cyan-400 mt-1">{score} <span className="text-xl text-slate-500">/ 10</span></div>
           </div>
           <button onClick={resetGame} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/20 hover:scale-105 active:scale-95">
             <RefreshCcw size={20} /> เล่นใหม่
           </button>
        </ContentCard>

        {/* 🟡 Filter Bar (Client-Side Trigger) UI เหมือน Leaderboard เป๊ะ */}
        <ContentCard variant="filter" className="flex-shrink-0">
            <div className="flex items-center gap-1 text-cyan-400 font-bold text-xs mr-1">
                <Filter size={14} /> กรอง:
            </div>
            
            <select value={filterBase} onChange={(e) => setFilterBase(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 outline-none focus:border-cyan-400 hover:border-slate-500 transition-colors">
                <option value="all">ทุกฐาน</option>
                <option value="2">ฐาน 2</option>
                <option value="8">ฐาน 8</option>
                <option value="10">ฐาน 10</option>
                <option value="16">ฐาน 16</option>
            </select>
            
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 outline-none focus:border-cyan-400 hover:border-slate-500 transition-colors">
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
            
            <select value={filterDiff} onChange={(e) => setFilterDiff(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 outline-none focus:border-cyan-400 hover:border-slate-500 transition-colors">
                <option value="all">ทุกระดับ</option>
                <option value="easy">ง่าย</option>
                <option value="medium">กลาง</option>
                <option value="hard">ยาก</option>
            </select>
            
            <button onClick={() => fetchHistoryCache(true)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white shadow-md active:scale-95" title="รีเฟรช">
                <RefreshCcw size={14} className={isHistoryLoading ? "animate-spin" : ""} />
            </button>
        </ContentCard>

        {/* History List */}
        <ContentCard variant="table" className="flex-1 min-h-0 flex flex-col">
           <div className="p-4 border-b border-slate-700 bg-slate-800/50 font-bold text-slate-300 flex items-center gap-2 flex-shrink-0">
              <Calendar size={18} className="text-cyan-400" /> ประวัติการเล่น ({filteredHistory.length})
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
             {isHistoryLoading && historyCache.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                   <p>กำลังโหลด...</p>
               </div>
             ) : (
               <table className="w-full text-left border-collapse text-sm">
                 <thead className="sticky top-0 bg-slate-900 z-10 shadow-sm">
                   <tr className="text-xs text-slate-500 uppercase border-b border-slate-700">
                     <th className="p-3 w-32">วันที่</th>
                     <th className="p-3">รายละเอียดเกม</th>
                     <th className="p-3 text-center">คะแนน</th>
                     <th className="p-3 text-right">ดู</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredHistory.length === 0 && (
                      <tr><td colSpan={4} className="text-center p-8 text-slate-500">ไม่พบข้อมูลตามเงื่อนไข</td></tr>
                   )}
                   {filteredHistory.map((log: any) => (
                     <tr key={log.id} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800 last:border-0 group">
                       <td className="p-3 text-slate-400 text-xs">
                         <div className="font-mono text-slate-300">{new Date(log.created_at).toLocaleDateString('th-TH')}</div>
                         <div className="opacity-50 text-[10px] mt-0.5">{new Date(log.created_at).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}</div>
                       </td>
                       <td className="p-3">
                         <GameModeBadge 
                           mode={log.mode} 
                           base={log.base_config?.base} 
                           difficulty={log.difficulty} 
                         />
                       </td>
                       <td className="p-3 text-center">
                         <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm border 
                            ${log.score >= 8 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                              log.score >= 5 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                           {log.score}
                         </div>
                       </td>
                       <td className="p-3 text-right">
                         <button onClick={() => handleViewDetail(log)} className="p-2 bg-slate-800 hover:bg-cyan-500 hover:text-slate-900 rounded-lg text-slate-400 transition-all shadow-sm group-hover:shadow-md">
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
      </div>

      {/* RIGHT: Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-300">
          <ContentCard variant="table" className="w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 bg-[#1e293b]!">
             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-slate-700/50 rounded-2xl">
                      <Trophy className="text-yellow-400" size={32} />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white">ผลคะแนน: <span className="text-cyan-400 text-2xl">{selectedLog.score}</span>/10</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <GameModeBadge 
                           mode={selectedLog.mode} 
                           base={selectedLog.base_config?.base}
                           difficulty={selectedLog.difficulty}
                        />
                      </div>
                   </div>
                </div>
                <button onClick={handleCloseDetail} className="p-2 hover:bg-rose-500 rounded-full hover:text-white text-slate-400 transition-colors">
                  <X size={24} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50 custom-scrollbar">
                {isDetailLoading ? (
                  <div className="text-center py-12 text-slate-400 animate-pulse">กำลังดึงข้อมูล...</div>
                ) : modalDetails.length > 0 ? (
                  <div className="space-y-4">
                    {modalDetails.map((q: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-xl border relative overflow-hidden ${q.isCorrect ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-rose-900/10 border-rose-500/30'}`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${q.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div className="flex justify-between items-start mb-3 pl-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">ข้อที่ {idx + 1}</span>
                          {q.isCorrect ? 
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-full"><CheckCircle2 size={14} /> ถูกต้อง</div> : 
                            <div className="flex items-center gap-1 text-rose-400 text-xs font-bold bg-rose-400/10 px-2 py-1 rounded-full"><XCircle size={14} /> ผิด</div>
                          }
                        </div>
                        <div className="pl-2">
                            <div className="text-xl font-bold text-white mb-4 font-mono break-words bg-slate-950/30 p-3 rounded-lg border border-slate-700/50 text-center">
                                {q.display}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className={`p-3 rounded-lg border ${q.isCorrect ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-rose-900/20 border-rose-500/20'}`}>
                                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">คำตอบของคุณ</span>
                                <span className={`font-bold text-lg ${q.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>{q.userAnswer}</span>
                            </div>
                            {!q.isCorrect && (
                                <div className="p-3 rounded-lg border bg-slate-800/50 border-slate-600/30">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">เฉลยที่ถูก</span>
                                <span className="font-bold text-lg text-emerald-400">{q.correctAnswer}</span>
                                </div>
                            )}
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                    <AlertTriangle size={48} className="mb-4 opacity-50" />
                    <p>ไม่พบรายละเอียด (ข้อมูลอาจอยู่ในเครื่องอื่น)</p>
                  </div>
                )}
             </div>
          </ContentCard>
        </div>
      )}
    </div>
  );
};