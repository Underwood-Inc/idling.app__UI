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
  },
  enabled: false
});

export type SpacingTheme = 'cozy' | 'compact';
export type PaginationMode = 'traditional' | 'infinite';
export type EmojiPanelBehavior = 'close_after_select' | 'stay_open';
export type FontOption = 'monospace' | 'default';
export type ProfileVisibility = 'public' | 'private';

interface UserPreferencesContextType {
  // Spacing theme
  spacingTheme: SpacingTheme;
  setSpacingTheme: (theme: SpacingTheme) => Promise<void>;

  // Pagination mode
  paginationMode: PaginationMode;
  setPaginationMode: (mode: PaginationMode) => Promise<void>;

  // Emoji panel behavior
  emojiPanelBehavior: EmojiPanelBehavior;
  setEmojiPanelBehavior: (behavior: EmojiPanelBehavior) => Promise<void>;

  // Font preference
  fontPreference: FontOption;
  setFontPreference: (font: FontOption) => Promise<void>;

  // Profile visibility
  profileVisibility: ProfileVisibility;
  setProfileVisibility: (visibility: ProfileVisibility) => Promise<void>;

  // Loading states
  isUpdatingSpacingTheme: boolean;
  isUpdatingPaginationMode: boolean;
  isUpdatingEmojiPanelBehavior: boolean;
  isUpdatingFontPreference: boolean;
  isUpdatingProfileVisibility: boolean;

  // Error states
  spacingThemeError: string | null;
  paginationModeError: string | null;
  emojiPanelBehaviorError: string | null;
  fontPreferenceError: string | null;
  profileVisibilityError: string | null;
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
  const [emojiPanelBehavior, setEmojiPanelBehaviorState] =
    useState<EmojiPanelBehavior>('close_after_select');
  const [fontPreference, setFontPreferenceState] =
    useState<FontOption>('default');
  const [profileVisibility, setProfileVisibilityState] =
    useState<ProfileVisibility>('public');

  // Loading states
  const [isUpdatingSpacingTheme, setIsUpdatingSpacingTheme] = useState(false);
  const [isUpdatingPaginationMode, setIsUpdatingPaginationMode] =
    useState(false);
  const [isUpdatingEmojiPanelBehavior, setIsUpdatingEmojiPanelBehavior] =
    useState(false);
  const [isUpdatingFontPreference, setIsUpdatingFontPreference] =
    useState(false);
  const [isUpdatingProfileVisibility, setIsUpdatingProfileVisibility] =
    useState(false);

  // Error states
  const [spacingThemeError, setSpacingThemeError] = useState<string | null>(
    null
  );
  const [paginationModeError, setPaginationModeError] = useState<string | null>(
    null
  );
  const [emojiPanelBehaviorError, setEmojiPanelBehaviorError] = useState<
    string | null
  >(null);
  const [fontPreferenceError, setFontPreferenceError] = useState<string | null>(
    null
  );
  const [profileVisibilityError, setProfileVisibilityError] = useState<
    string | null
  >(null);

  // Apply font preference to document
  const applyFont = useCallback((font: FontOption) => {
    if (typeof window === 'undefined') return;

    try {
      const root = document.documentElement;

      if (font === 'monospace') {
        root.style.setProperty(
          '--app-font-family',
          "'Fira Code', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', monospace"
        );
      } else {
        root.style.setProperty(
          '--app-font-family',
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
        );
      }

      logger.debug('Applied font preference', { font });
    } catch (error) {
      logger.error('Failed to apply font preference', error as Error, { font });
    }
  }, []);

  // Apply font preference whenever it changes
  useEffect(() => {
    applyFont(fontPreference);
  }, [fontPreference, applyFont]);

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

      if (userProfile.emoji_panel_behavior) {
        setEmojiPanelBehaviorState(userProfile.emoji_panel_behavior);
      }

      if (userProfile.font_preference) {
        setFontPreferenceState(userProfile.font_preference);
      }

      if (userProfile.profile_public !== undefined) {
        setProfileVisibilityState(
          userProfile.profile_public ? 'public' : 'private'
        );
      }

      logger.debug('Loaded user preferences from profile', {
        userId: session.user.id,
        spacingTheme: userProfile.spacing_theme || 'cozy',
        paginationMode: userProfile.pagination_mode || 'traditional',
        emojiPanelBehavior:
          userProfile.emoji_panel_behavior || 'close_after_select',
        fontPreference: userProfile.font_preference || 'default',
        profileVisibility: userProfile.profile_public ? 'public' : 'private'
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

        const savedEmojiPanelBehavior = localStorage.getItem(
          'emoji-panel-behavior-global'
        );
        if (
          savedEmojiPanelBehavior === 'stay_open' ||
          savedEmojiPanelBehavior === 'close_after_select'
        ) {
          setEmojiPanelBehaviorState(savedEmojiPanelBehavior);
        }

        const savedFontPreference = localStorage.getItem(
          'font-preference-global'
        );
        if (
          savedFontPreference === 'monospace' ||
          savedFontPreference === 'default'
        ) {
          setFontPreferenceState(savedFontPreference);
        }

        logger.debug('Loaded preferences from localStorage', {
          spacingTheme: savedSpacingTheme || 'cozy',
          paginationMode: savedPaginationMode || 'traditional',
          emojiPanelBehavior: savedEmojiPanelBehavior || 'close_after_select',
          fontPreference: savedFontPreference || 'default'
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

  // Function to update emoji panel behavior
  const setEmojiPanelBehavior = useCallback(
    async (newBehavior: EmojiPanelBehavior) => {
      setIsUpdatingEmojiPanelBehavior(true);
      setEmojiPanelBehaviorError(null);

      try {
        if (session?.user?.id) {
          // Update in database for authenticated user
          const result = await updateUserPreferencesAction(session.user.id, {
            emoji_panel_behavior: newBehavior
          });

          if (!result.success) {
            throw new Error(
              result.error || 'Failed to update emoji panel behavior'
            );
          }

          logger.debug('Updated emoji panel behavior in database', {
            userId: session.user.id,
            newBehavior
          });
        } else {
          // Update in localStorage for anonymous user
          if (typeof window !== 'undefined') {
            localStorage.setItem('emoji-panel-behavior-global', newBehavior);

            logger.debug('Updated emoji panel behavior in localStorage', {
              newBehavior
            });
          }
        }

        setEmojiPanelBehaviorState(newBehavior);
      } catch (error) {
        logger.error('Failed to update emoji panel behavior', error as Error, {
          userId: session?.user?.id,
          newBehavior
        });
        setEmojiPanelBehaviorError(
          error instanceof Error
            ? error.message
            : 'Failed to update emoji panel behavior'
        );
      } finally {
        setIsUpdatingEmojiPanelBehavior(false);
      }
    },
    [session]
  );

  // Function to update font preference
  const setFontPreference = useCallback(
    async (newFont: FontOption) => {
      setIsUpdatingFontPreference(true);
      setFontPreferenceError(null);

      try {
        if (session?.user?.id) {
          // Update in database for authenticated user
          const result = await updateUserPreferencesAction(session.user.id, {
            font_preference: newFont
          });

          if (!result.success) {
            throw new Error(result.error || 'Failed to update font preference');
          }

          logger.debug('Updated font preference in database', {
            userId: session.user.id,
            newFont
          });
        } else {
          // Update in localStorage for anonymous user
          if (typeof window !== 'undefined') {
            localStorage.setItem('font-preference-global', newFont);

            logger.debug('Updated font preference in localStorage', {
              newFont
            });
          }
        }

        setFontPreferenceState(newFont);
      } catch (error) {
        logger.error('Failed to update font preference', error as Error, {
          userId: session?.user?.id,
          newFont
        });
        setFontPreferenceError(
          error instanceof Error
            ? error.message
            : 'Failed to update font preference'
        );
      } finally {
        setIsUpdatingFontPreference(false);
      }
    },
    [session]
  );

  // Function to update profile visibility
  const setProfileVisibility = useCallback(
    async (newVisibility: ProfileVisibility) => {
      setIsUpdatingProfileVisibility(true);
      setProfileVisibilityError(null);

      try {
        if (session?.user?.id) {
          // Update in database for authenticated user
          const result = await updateUserPreferencesAction(session.user.id, {
            profile_public: newVisibility === 'public'
          });

          if (!result.success) {
            throw new Error(
              result.error || 'Failed to update profile visibility'
            );
          }

          logger.debug('Updated profile visibility in database', {
            userId: session.user.id,
            newVisibility
          });
        }

        setProfileVisibilityState(newVisibility);
      } catch (error) {
        logger.error('Failed to update profile visibility', error as Error, {
          userId: session?.user?.id,
          newVisibility
        });
        setProfileVisibilityError(
          error instanceof Error
            ? error.message
            : 'Failed to update profile visibility'
        );
      } finally {
        setIsUpdatingProfileVisibility(false);
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
        emojiPanelBehavior,
        setEmojiPanelBehavior,
        fontPreference,
        setFontPreference,
        profileVisibility,
        setProfileVisibility,
        isUpdatingSpacingTheme,
        isUpdatingPaginationMode,
        isUpdatingEmojiPanelBehavior,
        isUpdatingFontPreference,
        isUpdatingProfileVisibility,
        spacingThemeError,
        paginationModeError,
        emojiPanelBehaviorError,
        fontPreferenceError,
        profileVisibilityError
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

export function useEmojiPanelBehavior() {
  const {
    emojiPanelBehavior,
    setEmojiPanelBehavior,
    isUpdatingEmojiPanelBehavior,
    emojiPanelBehaviorError
  } = useUserPreferences();
  return {
    behavior: emojiPanelBehavior,
    setBehavior: setEmojiPanelBehavior,
    isUpdating: isUpdatingEmojiPanelBehavior,
    error: emojiPanelBehaviorError
  };
}

export function useFontPreference() {
  const {
    fontPreference,
    setFontPreference,
    isUpdatingFontPreference,
    fontPreferenceError
  } = useUserPreferences();
  return {
    preference: fontPreference,
    setPreference: setFontPreference,
    isUpdating: isUpdatingFontPreference,
    error: fontPreferenceError
  };
}

export function useProfileVisibility() {
  const {
    profileVisibility,
    setProfileVisibility,
    isUpdatingProfileVisibility,
    profileVisibilityError
  } = useUserPreferences();
  return {
    visibility: profileVisibility,
    setVisibility: setProfileVisibility,
    isUpdating: isUpdatingProfileVisibility,
    error: profileVisibilityError
  };
}
