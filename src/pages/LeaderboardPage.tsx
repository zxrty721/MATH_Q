import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ContentCard } from '../components/ContentCard';
import { GameModeBadge } from '../components/GameModeBadge';
import { Trophy, Filter, Crown, RefreshCcw } from 'lucide-react';

export const LeaderboardPage = () => {
  const { 
    leaderboardCache, 
    fetchLeaderboard, 
    isLeaderboardLoading 
  } = useGameStore();

  // State สำหรับ Filter
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterDiff, setFilterDiff] = useState<string>('all');
  const [filterBase, setFilterBase] = useState<string>('all');

  // ✅ Trigger: เมื่อ Filter เปลี่ยน ให้เรียก Store ทันที
  useEffect(() => {
    // ส่งค่าไป Store (Store จะจัดการเรื่อง Cache/Fetch เอง)
    fetchLeaderboard(filterMode, filterDiff, filterBase);
  }, [filterMode, filterDiff, filterBase]);

  // ปุ่มบังคับโหลดใหม่
  const handleRefresh = () => {
    fetchLeaderboard(filterMode, filterDiff, filterBase, true);
  };

  return (
    <div className="w-full max-w-4xl h-[85vh] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 p-4 md:p-0">
      
      {/* Header */}
      <div className="text-center mt-2">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 flex justify-center items-center gap-3 drop-shadow-sm">
           <Crown size={40} className="text-yellow-400 drop-shadow-lg" /> ตารางอันดับ
        </h2>
        <p className="text-slate-400 mt-2 text-sm font-medium">ทำเนียบ 10 ยอดฝีมือสูงสุด</p>
      </div>

      {/* 🟢 Filter Bar (Server-Side Trigger) */}
      <ContentCard variant="filter">
         <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mr-2">
            <Filter size={18} /> กรอง:
         </div>
         
         <select 
            value={filterBase} 
            onChange={(e) => setFilterBase(e.target.value)} 
            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg p-2.5 outline-none focus:border-cyan-400 hover:border-slate-500 transition-colors"
         >
           <option value="all">ทุกเลขฐาน</option>
           <option value="2">ฐาน 2</option>
           <option value="8">ฐาน 8</option>
           <option value="10">ฐาน 10</option>
           <option value="16">ฐาน 16</option>
         </select>

         <select 
            value={filterMode} 
            onChange={(e) => setFilterMode(e.target.value)} 
            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg p-2.5 outline-none focus:border-cyan-400 hover:border-slate-500 transition-colors"
         >
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

         <select 
            value={filterDiff} 
            onChange={(e) => setFilterDiff(e.target.value)} 
            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg p-2.5 outline-none focus:border-cyan-400 hover:border-slate-500 transition-colors"
         >
           <option value="all">ทุกระดับ</option>
           <option value="easy">ง่าย</option>
           <option value="medium">กลาง</option>
           <option value="hard">ยาก</option>
         </select>
         
         <button onClick={handleRefresh} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white ml-2 shadow-md active:scale-95" title="รีเฟรช">
            <RefreshCcw size={18} className={isLeaderboardLoading ? "animate-spin" : ""} />
         </button>
      </ContentCard>

      {/* Table Section */}
      <ContentCard variant="table" className="flex-1 min-h-0 flex flex-col">
         <div className="flex-1 overflow-y-auto custom-scrollbar h-full">
            {isLeaderboardLoading && leaderboardCache.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400"></div>
                   <p>กำลังโหลดอันดับ...</p>
               </div>
            ) : leaderboardCache.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500">
                   <Trophy size={48} className="opacity-20 mb-2" />
                   <p>ไม่พบข้อมูลตามเงื่อนไขที่เลือก</p>
               </div>
            ) : (
               <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-slate-900 z-10 shadow-md">
                     <tr className="text-xs text-slate-500 uppercase border-b border-slate-700">
                        <th className="p-4 text-center w-16">#</th>
                        <th className="p-4">ผู้เล่น</th>
                        <th className="p-4">รายละเอียดเกม</th>
                        <th className="p-4 text-center">คะแนน</th>
                     </tr>
                  </thead>
                  <tbody>
                     {leaderboardCache.map((player: any, idx: number) => (
                        <tr key={idx} className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors 
                           ${idx === 0 ? 'bg-yellow-500/10' : idx === 1 ? 'bg-slate-400/10' : idx === 2 ? 'bg-orange-700/10' : ''}
                        `}>
                           <td className="p-4 text-center font-black text-lg">
                              {idx === 0 ? <span className="text-yellow-400 text-2xl drop-shadow-md">🥇</span> : 
                               idx === 1 ? <span className="text-slate-300 text-xl drop-shadow-md">🥈</span> : 
                               idx === 2 ? <span className="text-orange-400 text-xl drop-shadow-md">🥉</span> : 
                               <span className="text-slate-600 font-mono">{idx + 1}</span>}
                           </td>
                           <td className="p-4">
                              <div className={`font-bold text-sm ${idx < 3 ? 'text-white' : 'text-slate-300'}`}>
                                 {player.player_name || 'Anonymous'}
                              </div>
                              <div className="text-[10px] text-slate-500 opacity-60 font-mono">
                                {new Date(player.created_at).toLocaleDateString('th-TH')}
                              </div>
                           </td>
                           <td className="p-4">
                              <GameModeBadge 
                                mode={player.mode} 
                                base={player.base_config?.base}
                                difficulty={player.difficulty}
                              />
                           </td>
                           <td className="p-4 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border 
                                 ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 
                                   player.score === 10 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 
                                   'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                 {player.score}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}
         </div>
      </ContentCard>
    </div>
  );
};