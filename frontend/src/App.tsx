import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { UIStateContext } from './components/ui/UIStateContext';
import { AuthGate } from './components/AuthGate';
import { router } from './app/router';

/**
 * App — top-level providers + router mount.
 *
 * Only providers that do NOT need RouterContext live here:
 *   - UIStateContext (skeletonMode from URL, read once on mount)
 *   - AuthGate (waits for Supabase session before rendering)
 *
 * Everything that needs <Link> or useNavigate (HomepageMenu, SearchOverlay,
 * CartDrawer) lives inside RootLayout, which is rendered as the root route
 * element inside RouterProvider.
 */
export function App() {
  const skeletonMode = useMemo(
    () => new URLSearchParams(window.location.search).has('skeleton'),
    [],
  );
  const uiState = useMemo(() => ({ skeletonMode }), [skeletonMode]);

  return (
    <AuthGate>
      <UIStateContext.Provider value={uiState}>
        <RouterProvider router={router} />
      </UIStateContext.Provider>
    </AuthGate>
  );
}
