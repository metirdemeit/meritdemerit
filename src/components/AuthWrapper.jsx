// src/components/AuthWrapper.jsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { SimpleLoadingScreen } from './screens/SimpleLoadingScreen';

// One session check per page load, even under StrictMode's double effects.
let initPromise = null;

export default function AuthWrapper({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    initPromise ||= useAuthStore.getState().initialize();
    initPromise.finally(() => {
      if (active) setReady(true);
    });

    let handling = false;
    const onUnauthorized = async () => {
      if (handling) return; // several requests can fail with 401 at once
      handling = true;
      try {
        const relogged = await useAuthStore.getState().tryAutoRelogin();
        if (!relogged) useAuthStore.getState().logout();
      } finally {
        handling = false;
      }
    };
    window.addEventListener('unauthorized', onUnauthorized);

    return () => {
      active = false;
      window.removeEventListener('unauthorized', onUnauthorized);
    };
  }, []);

  if (!ready) {
    return <SimpleLoadingScreen message="Loading..." />;
  }

  return <>{children}</>;
}
