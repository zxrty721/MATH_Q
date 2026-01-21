import { useState, useEffect } from 'react';
import { useGameStore, type HistoryItem } from '../store/gameStore';
import { 
  History, ArrowLeft, RefreshCw, Calendar, Trophy, 
  Sword, Rocket, Zap, Shield, Grid, Clock, Ghost, Map, 
  CloudRain, Gamepad2, ChevronDown, ChevronUp, Spade, Layers, Activity
} from 'lucide-react';

const GAME_ICONS: Record<string, any> = {
  'falling-numbers': CloudRain,
  'quick-math': Zap,
  'base-defense': Shield,
  'math-snake': Gamepad2,
  'puzzle-2048': Grid,
  'space-shooter': Rocket,
  'time-bomb': Clock,
  'monster-slayer': Sword,
  'dungeon-crawler': Map,
  'memory-card': Spade,
};

export const HistoryPage = () => {
  const { history, fetchHistory, navigateTo } = useGameStore();
  
  const [filterGame, _setFilterGame] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchHistory(true);
    setIsRefreshing(false);
  };

  const filteredHistory = (history || []).filter((item: HistoryItem) => {
    if (filterGame !== 'ALL' && item.game_id !== filterGame) return false;
    return true;
  });

  const formatDate = (ts: string) => {
    try {
      return new Intl.DateTimeFormat('th-TH', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      }).format(new Date(ts));
    } catch (e) { return '-'; }
  };

  // Helper แปลงชื่อ Key ให้สวยงาม (camelCase -> Title Case)
  const formatKey = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0a0a0a] text-white flex flex-col font-sans overflow-hidden animate-in fade-in slide-in-from-bottom-4 z-[100]">
      
      {/* Header */}
      <div className="p-4 md:p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateTo('MENU')}
            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors active:scale-95 border border-slate-700"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
              <History className="text-cyan-400" />
              HISTORY LOGS
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-mono mt-1">
              RECORDS: {history?.length || 0}
            </p>
          </div>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-cyan-900/30 hover:border-cyan-500/50 transition-all active:scale-95 flex items-center gap-2 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          <span className="hidden md:inline font-bold text-sm">REFRESH</span>
        </button>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 opacity-50">
            <Ghost size={64} />
            <p className="font-mono text-lg">NO DATA FOUND</p>
          </div>
        ) : (
          filteredHistory.map((item: HistoryItem) => {
            const Icon = GAME_ICONS[item.game_id] || Gamepad2;
            const isExpanded = expandedId === item.id;
            const details = item.game_details || {}; // ดึงรายละเอียด

            return (
              <div 
                key={item.id}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className={`bg-slate-900 border border-slate-700 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group hover:border-cyan-500/50 ${isExpanded ? 'shadow-[0_0_20px_rgba(6,182,212,0.15)] border-cyan-500' : ''}`}
              >
                {/* Main Row */}
                <div className="p-4 flex justify-between items-center relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${
                    item.score > 100 ? 'from-yellow-400 to-orange-500' : 'from-slate-500 to-slate-700'
                  }`} />

                  <div className="flex items-center gap-4 pl-2">
                    <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                      <Icon size={24} className="text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{item.game_id?.replace(/-/g, ' ') || 'UNKNOWN'}</div>
                      <div className="text-xs text-slate-600 font-mono flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(item.created_at)}</span>
                        
                        {/* ✅ แสดง Base Mode */}
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            <Layers size={10} /> Base {item.base_mode || '?'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="text-right">
                      <div className="text-xl md:text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">{item.score}</div>
                      <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                        item.difficulty === 'hard' ? 'bg-rose-900/50 text-rose-400' : 
                        item.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-400' : 
                        'bg-emerald-900/50 text-emerald-400'
                      }`}>
                        {item.difficulty}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-500"/> : <ChevronDown size={20} className="text-slate-500"/>}
                  </div>
                </div>

                {/* ✅ Expanded Details (Dynamic Loop) */}
                {isExpanded && (
                  <div className="bg-slate-950/50 p-4 border-t border-slate-800 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Always Show Score */}
                        <StatBox label="TOTAL SCORE" value={item.score} icon={<Trophy size={14} />} color="text-yellow-400" />
                        
                        {/* วนลูปแสดงทุกค่าที่มีใน DB */}
                        {Object.entries(details).map(([key, value]) => (
                            <StatBox 
                                key={key}
                                label={formatKey(key)}
                                value={String(value)}
                                icon={<Activity size={14} />}
                                color="text-cyan-300"
                            />
                        ))}

                        {/* ถ้าไม่มี Detail เลยให้บอก */}
                        {Object.keys(details).length === 0 && (
                            <div className="col-span-full text-center text-xs text-slate-600 font-mono py-2">
                                - NO ADDITIONAL DATA -
                            </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Helper Component
const StatBox = ({ label, value, icon, color }: any) => (
    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
        <div className={`text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1`}>
            {icon} {label}
        </div>
        <div className={`text-lg font-black ${color}`}>{value}</div>
    </div>
);