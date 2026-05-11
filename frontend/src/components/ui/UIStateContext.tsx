import { createContext, useContext } from 'react';

export type UIState = {
  skeletonMode: boolean;
};

export const UIStateContext = createContext<UIState | null>(null);

export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) throw new Error('useUIState must be used within UIStateContext');
  return context;
}
