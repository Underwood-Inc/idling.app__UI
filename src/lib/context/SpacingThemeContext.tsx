'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

export type SpacingTheme = 'cozy' | 'compact';

interface SpacingThemeContextType {
  theme: SpacingTheme;
  setTheme: (theme: SpacingTheme) => void;
}

const SpacingThemeContext = createContext<SpacingThemeContextType | undefined>(
  undefined
);

export function SpacingThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SpacingTheme>('cozy');

  return (
    <SpacingThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`spacing-theme-${theme}`}>{children}</div>
    </SpacingThemeContext.Provider>
  );
}

export function useSpacingTheme() {
  const context = useContext(SpacingThemeContext);
  if (context === undefined) {
    throw new Error(
      'useSpacingTheme must be used within a SpacingThemeProvider'
    );
  }
  return context;
}
