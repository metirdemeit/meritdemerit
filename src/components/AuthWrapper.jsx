// src/components/AuthWrapper.jsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { SimpleLoadingScreen } from './screens/SimpleLoadingScreen';

export default function AuthWrapper({ children }) {
  const initialize = useAuthStore(state => state.initialize);
  const logout = useAuthStore(state => state.logout);
  const loading = useAuthStore(state => state.loading);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setReady(true);
    };

    init();

    const onUnauthorized = () => logout();
    window.addEventListener('unauthorized', onUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', onUnauthorized);
    };
  }, [initialize, logout]);

  if (!ready || loading) {
    return <SimpleLoadingScreen message="Loading..." />;
  }

  return <>{children}</>;
}
