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
 * @param {boolean} telegramReady - Флаг успешной инициализации Telegram SDK
 * 
 * Senior pattern:
 * - Если telegramReady === false → показываем fallback UI (TelegramOnly)
 * - Это происходит при reload в Telegram (initData пропадает)
 * - Пользователь должен закрыть и открыть mini app заново
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


  // Если Telegram SDK не инициализирован → fallback режим
  // Это происходит при reload в Telegram WebApp
  if (!telegramReady) {
    return <TelegramOnly isReload={true} />;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#9266FF' }} />
      </Box>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

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
  },
  main: {
    flexGrow: 1,
    pt: 10,
    pb: 8,
    minHeight: '100vh',
  },
};
