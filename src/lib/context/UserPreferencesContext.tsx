'use client';

import { useSession } from 'next-auth/react';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import { updateUserPreferencesAction } from '../actions/profile.actions';
import { createLogger } from '../logging';

// Create logger for user preferences
const logger = createLogger({
  context: {
    module: 'UserPreferencesContext'
  }
});

export type SpacingTheme = 'cozy' | 'compact';
export type PaginationMode = 'traditional' | 'infinite';

interface UserPreferencesContextType {
  // Spacing theme
  spacingTheme: SpacingTheme;
  setSpacingTheme: (theme: SpacingTheme) => Promise<void>;

  // Pagination mode
  paginationMode: PaginationMode;
  setPaginationMode: (mode: PaginationMode) => Promise<void>;

  // Loading states
  isUpdatingSpacingTheme: boolean;
  isUpdatingPaginationMode: boolean;

  // Error states
  spacingThemeError: string | null;
  paginationModeError: string | null;
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  // State for preferences
  const [spacingTheme, setSpacingThemeState] = useState<SpacingTheme>('cozy');
  const [paginationMode, setPaginationModeState] =
    useState<PaginationMode>('traditional');

  // Loading states
  const [isUpdatingSpacingTheme, setIsUpdatingSpacingTheme] = useState(false);
  const [isUpdatingPaginationMode, setIsUpdatingPaginationMode] =
    useState(false);

  // Error states
  const [spacingThemeError, setSpacingThemeError] = useState<string | null>(
    null
  );
  const [paginationModeError, setPaginationModeError] = useState<string | null>(
    null
  );

  // Initialize preferences from user profile or localStorage
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user?.id) {
      // User is authenticated - use their profile preferences
      const userProfile = session.user as any; // Type assertion for extended user object

      if (userProfile.spacing_theme) {
        setSpacingThemeState(userProfile.spacing_theme);
      }

      if (userProfile.pagination_mode) {
        setPaginationModeState(userProfile.pagination_mode);
      }

      logger.debug('Loaded user preferences from profile', {
        userId: session.user.id,
        spacingTheme: userProfile.spacing_theme || 'cozy',
        paginationMode: userProfile.pagination_mode || 'traditional'
      });
    } else {
      // User is not authenticated - use localStorage
      if (typeof window !== 'undefined') {
        const savedSpacingTheme = localStorage.getItem('spacing-theme-global');
        const savedPaginationMode = localStorage.getItem(
          'pagination-mode-global'
        );

        if (savedSpacingTheme === 'cozy' || savedSpacingTheme === 'compact') {
          setSpacingThemeState(savedSpacingTheme);
        }

        if (savedPaginationMode === 'infinite') {
          setPaginationModeState('infinite');
        } else if (savedPaginationMode === 'traditional') {
          setPaginationModeState('traditional');
        }

        logger.debug('Loaded preferences from localStorage', {
          spacingTheme: savedSpacingTheme || 'cozy',
          paginationMode: savedPaginationMode || 'traditional'
        });
      }
    }
  }, [session, status]);

  // Function to update spacing theme
  const setSpacingTheme = useCallback(
    async (newTheme: SpacingTheme) => {
      setIsUpdatingSpacingTheme(true);
      setSpacingThemeError(null);

      try {
        if (session?.user?.id) {
          // Update in database for authenticated user
          const result = await updateUserPreferencesAction(session.user.id, {
            spacing_theme: newTheme
          });

          if (!result.success) {
            throw new Error(result.error || 'Failed to update spacing theme');
          }

          logger.debug('Updated spacing theme in database', {
            userId: session.user.id,
            newTheme
          });
        } else {
          // Update in localStorage for anonymous user
          if (typeof window !== 'undefined') {
            localStorage.setItem('spacing-theme-global', newTheme);

            // Clean up old per-route storage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('spacing-theme-/')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key));

            logger.debug('Updated spacing theme in localStorage', {
              newTheme,
              cleanedUpKeys: keysToRemove.length
            });
          }
        }

        setSpacingThemeState(newTheme);
      } catch (error) {
        logger.error('Failed to update spacing theme', error as Error, {
          userId: session?.user?.id,
          newTheme
        });
        setSpacingThemeError(
          error instanceof Error
            ? error.message
            : 'Failed to update spacing theme'
        );
      } finally {
        setIsUpdatingSpacingTheme(false);
      }
    },
    [session]
  );

  // Function to update pagination mode
  const setPaginationMode = useCallback(
    async (newMode: PaginationMode) => {
      setIsUpdatingPaginationMode(true);
      setPaginationModeError(null);

      try {
        if (session?.user?.id) {
          // Update in database for authenticated user
          const result = await updateUserPreferencesAction(session.user.id, {
            pagination_mode: newMode
          });

          if (!result.success) {
            throw new Error(result.error || 'Failed to update pagination mode');
          }

          logger.debug('Updated pagination mode in database', {
            userId: session.user.id,
            newMode
          });
        } else {
          // Update in localStorage for anonymous user
          if (typeof window !== 'undefined') {
            localStorage.setItem('pagination-mode-global', newMode);

            // Clean up old per-route storage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('pagination-mode-/')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key));

            logger.debug('Updated pagination mode in localStorage', {
              newMode,
              cleanedUpKeys: keysToRemove.length
            });
          }
        }

        setPaginationModeState(newMode);
      } catch (error) {
        logger.error('Failed to update pagination mode', error as Error, {
          userId: session?.user?.id,
          newMode
        });
        setPaginationModeError(
          error instanceof Error
            ? error.message
            : 'Failed to update pagination mode'
        );
      } finally {
        setIsUpdatingPaginationMode(false);
      }
    },
    [session]
  );

  return (
    <UserPreferencesContext.Provider
      value={{
        spacingTheme,
        setSpacingTheme,
        paginationMode,
        setPaginationMode,
        isUpdatingSpacingTheme,
        isUpdatingPaginationMode,
        spacingThemeError,
        paginationModeError
      }}
    >
      <div className={`spacing-theme-${spacingTheme}`}>{children}</div>
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      'useUserPreferences must be used within a UserPreferencesProvider'
    );
  }
  return context;
}

// Backward compatibility hooks
export function useSpacingTheme() {
  const {
    spacingTheme,
    setSpacingTheme,
    isUpdatingSpacingTheme,
    spacingThemeError
  } = useUserPreferences();
  return {
    theme: spacingTheme,
    setTheme: setSpacingTheme,
    isUpdating: isUpdatingSpacingTheme,
    error: spacingThemeError
  };
}

export function usePaginationMode() {
  const {
    paginationMode,
    setPaginationMode,
    isUpdatingPaginationMode,
    paginationModeError
  } = useUserPreferences();
  return {
    mode: paginationMode,
    setMode: setPaginationMode,
    isUpdating: isUpdatingPaginationMode,
    error: paginationModeError
  };
}
