'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react';

export type SpacingTheme = 'cozy' | 'compact';

interface SpacingThemeContextType {
  theme: SpacingTheme;
  setTheme: (theme: SpacingTheme) => void;
}

const SpacingThemeContext = createContext<SpacingThemeContextType | undefined>(
  undefined
);

export function SpacingThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Initialize theme with per-route persistence
  const [theme, setThemeState] = useState<SpacingTheme>(() => {
    // Default to 'cozy' on server side to avoid hydration mismatch
    if (typeof window === 'undefined') {
      return 'cozy';
    }

    // Get route-specific theme from localStorage
    const routeKey = `spacing-theme-${pathname}`;
    const routeTheme = localStorage.getItem(routeKey);

    if (routeTheme === 'cozy' || routeTheme === 'compact') {
      return routeTheme;
    }

    // Fallback to global theme if no route-specific setting
    const globalTheme = localStorage.getItem('spacing-theme-global');
    if (globalTheme === 'cozy' || globalTheme === 'compact') {
      return globalTheme;
    }

    // Default to cozy
    return 'cozy';
  });

  // Load theme when route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const routeKey = `spacing-theme-${pathname}`;
    const routeTheme = localStorage.getItem(routeKey);

    if (routeTheme === 'cozy' || routeTheme === 'compact') {
      setThemeState(routeTheme);
    } else {
      // Use global theme as fallback
      const globalTheme = localStorage.getItem('spacing-theme-global');
      if (globalTheme === 'cozy' || globalTheme === 'compact') {
        setThemeState(globalTheme);
      }
    }
  }, [pathname]);

  const setTheme = (newTheme: SpacingTheme) => {
    setThemeState(newTheme);

    if (typeof window !== 'undefined') {
      // Save theme for current route
      const routeKey = `spacing-theme-${pathname}`;
      localStorage.setItem(routeKey, newTheme);

      // Also update global theme as fallback for new routes
      localStorage.setItem('spacing-theme-global', newTheme);
    }
  };

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
