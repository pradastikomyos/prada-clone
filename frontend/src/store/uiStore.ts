import { create } from 'zustand';

interface UIState {
  menuOpen: boolean;
  searchOpen: boolean;
  scrolled: boolean;
  cartDrawerOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setScrolled: (scrolled: boolean) => void;
  setCartDrawerOpen: (open: boolean) => void;
  toggleMenu: () => void;
  toggleSearch: () => void;
  toggleCartDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  searchOpen: false,
  scrolled: false,
  cartDrawerOpen: false,
  setMenuOpen: (open) => set({ menuOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setScrolled: (scrolled) => set({ scrolled }),
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  toggleMenu: () => set((state) => ({ menuOpen: !state.menuOpen })),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  toggleCartDrawer: () => set((state) => ({ cartDrawerOpen: !state.cartDrawerOpen })),
}));
