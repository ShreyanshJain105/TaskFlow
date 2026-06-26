import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      isDark: false,

      toggleTheme: () =>
        set((state) => {
          const next = !state.isDark;
          document.documentElement.classList.toggle('dark', next);
          return { isDark: next };
        }),

      // Reads persisted isDark on app boot and applies the class to <html>.
      // Intentionally returns unchanged state — we only want the DOM side-effect,
      // not a re-render, so we skip calling set() on the state itself.
      initTheme: () =>
        set((state) => {
          if (state.isDark) document.documentElement.classList.add('dark');
          return state;
        }),
    }),
    { name: 'taskflow_theme' }
  )
);

export default useThemeStore;
