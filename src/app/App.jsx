import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from "../store/authStore";
import { routes, defaultRoutes } from "../routes/routes.jsx";
import BottomNavbar from "../components/BottomNavbar";
import AuthWrapper from "../components/AuthWrapper";
import { TelegramOnly } from "../components/screens/TelegramOnly.jsx";
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';

/**
 * App component
 *
 * Telegram Mini App viewport уже начинается ниже нативного хедера Telegram.
 * Никаких дополнительных padding-top не нужно — Telegram сам всё смещает.
 */
export function App({ telegramReady = false }) {
  const { user, initialize } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await initialize();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [initialize]);

  // Спиннер пока идёт initialize()
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
      }}>
        <CircularProgress sx={{ color: '#9266FF' }} />
      </Box>
    );
  }

  const hasTelegramInitData = Boolean(
    window.Telegram?.WebApp?.initData ||
    localStorage.getItem('tg_init_data') ||
    sessionStorage.getItem('tg_init_data')
  );

  // Если нет контекста Telegram (initData) И пользователь не авторизован И мы в PROD — блокируем доступ
  if (!hasTelegramInitData && !user && !import.meta.env.DEV) {
    return <TelegramOnly isReload={false} />;
  }

  return (
    <>
      {/* Toasts: позиция top-center, небольшой отступ от верха */}
      <Toaster
        position="top-center"
        containerStyle={{ top: 16 }}
        toastOptions={{ duration: 3000 }}
      />

      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Box sx={styles.container}>
          <AuthWrapper>
            <Box component="main" sx={styles.main}>
              <Routes>
                {routes.map((route, index) => (
                  <Route key={index} path={route.path} element={route.element} />
                ))}
                {defaultRoutes.map((route, index) => (
                  <Route key={`default-${index}`} path={route.path} element={route.element} />
                ))}
              </Routes>
            </Box>
          </AuthWrapper>

          {user && <BottomNavbar />}
        </Box>
      </Router>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
  },
  main: {
    flexGrow: 1,
    // pt: 0 — Telegram сам смещает viewport под свой хедер
    pt: 0,
    pb: 8,
    minHeight: '100vh',
  },
};
