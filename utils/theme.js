import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTheme, setTheme as persistTheme } from './storage';
import { THEMES, DEFAULT_THEME } from '../constants/themes';

const ThemeContext = createContext({
  theme: THEMES[DEFAULT_THEME],
  themeId: DEFAULT_THEME,
  changeTheme: () => {},
  ready: false,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getTheme().then((id) => {
      if (alive && id && THEMES[id]) setThemeId(id);
      if (alive) setReady(true);
    }).catch(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  const changeTheme = useCallback(async (id) => {
    if (!THEMES[id]) return;
    setThemeId(id);
    try { await persistTheme(id); } catch (_) {}
  }, []);

  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];

  return (
    <ThemeContext.Provider value={{ theme, themeId, changeTheme, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}
