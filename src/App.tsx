import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { SetupPage } from './pages/SetupPage';
import { GamePage } from './pages/GamePage';
import { HistoryPage } from './pages/HistoryPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AboutPage } from './pages/AboutPage'; // ✅ Import
import { AuthPage } from './pages/AuthPage';
import { Loader2 } from 'lucide-react';

function App() {
  const { status } = useGameStore();
  const { user, checkUser, isAuthLoading } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="p-4 bg-slate-900 rounded-full border border-slate-700 shadow-xl">
             <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-400 tracking-widest uppercase">กำลังโหลด...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Layout>
      {status === 'setup' && <SetupPage />}
      {status === 'playing' && <GamePage />}
      {status === 'summary' && <HistoryPage />}
      {status === 'leaderboard' && <LeaderboardPage />}
      {status === 'about' && <AboutPage />} {/* ✅ เพิ่มหน้านี้ */}
    </Layout>
  );
}

export default App;