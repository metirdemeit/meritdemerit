import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from "../store/authStore";
import { routes, defaultRoutes } from "../routes/routes.jsx";
import BottomNavbar from "../components/BottomNavbar";
import AuthWrapper from "../components/AuthWrapper";
import GuideTour from "../components/guide/GuideTour";

/**
 * App shell. Works both inside the Telegram Mini App and in a regular browser:
 * in Telegram the user is signed in automatically by initData, in a browser
 * they get the username/password login page.
 *
 * Safe areas (notch, Telegram fullscreen header, home indicator) come from the
 * --app-safe-top / --app-safe-bottom CSS variables defined in index.html.
 */
export function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <>
      <Toaster
        position="top-center"
        containerStyle={{ top: 'calc(var(--app-safe-top, 16px) - 8px)' }}
        toastOptions={{ duration: 3000 }}
      />

      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Box sx={styles.container}>
          <AuthWrapper>
            <Box component="main" sx={user ? styles.mainWithNav : styles.main}>
              <Suspense fallback={<PageSpinner />}>
              <Routes>
                {routes.map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
                {defaultRoutes.map((route) => (
                  <Route key={`default-${route.path}`} path={route.path} element={route.element} />
                ))}
              </Routes>
              </Suspense>
            </Box>
            {user && <BottomNavbar />}
            {user && <GuideTour />}
          </AuthWrapper>
        </Box>
      </Router>
    </>
  );
}

function PageSpinner() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60dvh' }}>
      <CircularProgress sx={{ color: '#9266FF' }} />
    </Box>
  );
}

const styles = {
  container: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
  },
  main: {
    flexGrow: 1,
    minHeight: '100dvh',
  },
  mainWithNav: {
    flexGrow: 1,
    minHeight: '100dvh',
    // Keep the last items of every page above the fixed bottom navbar.
    pb: 'calc(var(--app-nav-height) + var(--app-safe-bottom) + 16px)',
  },
};
