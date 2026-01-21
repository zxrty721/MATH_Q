import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { AboutPage } from './pages/AboutPage';
import { ArcadeMenu } from './pages/ArcadeMenu';
import { GameContainer } from './pages/GameContainer';
import { HistoryPage } from './pages/HistoryPage'; // ✅ ต้องมั่นใจว่ามีไฟล์นี้
import { Loader2 } from 'lucide-react';

function App() {
  const { currentView, status } = useGameStore(); // ดึง state มาใช้
  const { user, checkUser, isAuthLoading } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, []);

  // 1. Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <h2 className="text-xl font-bold tracking-widest uppercase">MATH_Q Loading...</h2>
        </div>
      </div>
    );
  }

  // 2. Auth Check
  if (!user) {
    return <AuthPage />;
  }

  // 3. Routing Views (Full Screen)
  // ถ้า currentView เป็น 'GAME' -> แสดงหน้าเกม
  if (currentView === 'GAME') {
    return <GameContainer />;
  }

  // ✅ ถ้า currentView เป็น 'HISTORY' -> แสดงหน้าประวัติ
  if (currentView === 'HISTORY') {
    return <HistoryPage />;
  }

  // 4. Default Layout (Menu / About)
  return (
    <Layout>
      {/* สลับเนื้อหาตาม status ('home' หรือ 'about') */}
      {status === 'about' ? <AboutPage /> : <ArcadeMenu />}
    </Layout>
  );
}

export default App;