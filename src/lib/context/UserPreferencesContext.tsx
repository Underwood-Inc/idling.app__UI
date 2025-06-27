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
export type AccessibilityFocusMode = 'disabled' | 'enabled';

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

  // Accessibility focus mode
  accessibilityFocusMode: AccessibilityFocusMode;
  setAccessibilityFocusMode: (mode: AccessibilityFocusMode) => Promise<void>;

  // Loading states
  isUpdatingSpacingTheme: boolean;
  isUpdatingPaginationMode: boolean;
  isUpdatingEmojiPanelBehavior: boolean;
  isUpdatingFontPreference: boolean;
  isUpdatingProfileVisibility: boolean;
  isUpdatingAccessibilityFocusMode: boolean;

  // Error states
  spacingThemeError: string | null;
  paginationModeError: string | null;
  emojiPanelBehaviorError: string | null;
  fontPreferenceError: string | null;
  profileVisibilityError: string | null;
  accessibilityFocusModeError: string | null;
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
  const [accessibilityFocusMode, setAccessibilityFocusModeState] =
    useState<AccessibilityFocusMode>('disabled');

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
  const [
    isUpdatingAccessibilityFocusMode,
    setIsUpdatingAccessibilityFocusMode
  ] = useState(false);

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
  const [accessibilityFocusModeError, setAccessibilityFocusModeError] =
    useState<string | null>(null);

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

  // Apply accessibility focus mode whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    if (accessibilityFocusMode === 'enabled') {
      root.classList.add('accessibility-focus-enabled');
    } else {
      root.classList.remove('accessibility-focus-enabled');
    }

    logger.debug('Applied accessibility focus mode', {
      accessibilityFocusMode
    });
  }, [accessibilityFocusMode]);

  // Initialize preferences from user profile and localStorage
  useEffect(() => {
    if (status === 'loading') return;

    if (typeof window !== 'undefined') {
      // Always load from localStorage first for immediate UI update
      const savedSpacingTheme = localStorage.getItem('spacing-theme-global');
      const savedPaginationMode = localStorage.getItem(
        'pagination-mode-global'
      );
      const savedEmojiPanelBehavior = localStorage.getItem(
        'emoji-panel-behavior-global'
      );
      const savedFontPreference = localStorage.getItem(
        'font-preference-global'
      );
      const savedAccessibilityFocusMode = localStorage.getItem(
        'accessibility-focus-mode-global'
      );

      // Set from localStorage immediately
      if (savedSpacingTheme === 'cozy' || savedSpacingTheme === 'compact') {
        setSpacingThemeState(savedSpacingTheme);
      }
      if (
        savedPaginationMode === 'infinite' ||
        savedPaginationMode === 'traditional'
      ) {
        setPaginationModeState(savedPaginationMode);
      }
      if (
        savedEmojiPanelBehavior === 'stay_open' ||
        savedEmojiPanelBehavior === 'close_after_select'
      ) {
        setEmojiPanelBehaviorState(savedEmojiPanelBehavior);
      }
      if (
        savedFontPreference === 'monospace' ||
        savedFontPreference === 'default'
      ) {
        setFontPreferenceState(savedFontPreference);
      }
      if (
        savedAccessibilityFocusMode === 'enabled' ||
        savedAccessibilityFocusMode === 'disabled'
      ) {
        setAccessibilityFocusModeState(savedAccessibilityFocusMode);
      }
    }

    if (session?.user?.id) {
      // User is authenticated - sync with their profile preferences if different from localStorage
      const userProfile = session.user as any; // Type assertion for extended user object

      // Check and sync each preference
      if (
        userProfile.spacing_theme &&
        userProfile.spacing_theme !== spacingTheme
      ) {
        setSpacingThemeState(userProfile.spacing_theme);
        // Update localStorage to match server
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'spacing-theme-global',
            userProfile.spacing_theme
          );
        }
      }

      if (
        userProfile.pagination_mode &&
        userProfile.pagination_mode !== paginationMode
      ) {
        setPaginationModeState(userProfile.pagination_mode);
        // Update localStorage to match server
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'pagination-mode-global',
            userProfile.pagination_mode
          );
        }
      }

      if (
        userProfile.emoji_panel_behavior &&
        userProfile.emoji_panel_behavior !== emojiPanelBehavior
      ) {
        setEmojiPanelBehaviorState(userProfile.emoji_panel_behavior);
        // Update localStorage to match server
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'emoji-panel-behavior-global',
            userProfile.emoji_panel_behavior
          );
        }
      }

      if (
        userProfile.font_preference &&
        userProfile.font_preference !== fontPreference
      ) {
        setFontPreferenceState(userProfile.font_preference);
        // Update localStorage to match server
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'font-preference-global',
            userProfile.font_preference
          );
        }
      }

      if (userProfile.profile_public !== undefined) {
        const serverVisibility = userProfile.profile_public
          ? 'public'
          : 'private';
        setProfileVisibilityState(serverVisibility);
      }

      logger.debug('Loaded and synced user preferences from profile', {
        userId: session.user.id,
        spacingTheme: userProfile.spacing_theme || spacingTheme,
        paginationMode: userProfile.pagination_mode || paginationMode,
        emojiPanelBehavior:
          userProfile.emoji_panel_behavior || emojiPanelBehavior,
        fontPreference: userProfile.font_preference || fontPreference,
        profileVisibility: userProfile.profile_public ? 'public' : 'private'
      });
    }
  }, [session, status]);

  // Function to update spacing theme
  const setSpacingTheme = useCallback(
    async (newTheme: SpacingTheme) => {
      setIsUpdatingSpacingTheme(true);
      setSpacingThemeError(null);

      try {
        // Always update localStorage first for immediate UI response
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

        // Update state immediately
        setSpacingThemeState(newTheme);

        // If authenticated, also update database
        if (session?.user?.id) {
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
        }
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
        // Always update localStorage first for immediate UI response
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

        // Update state immediately
        setPaginationModeState(newMode);

        // If authenticated, also update database
        if (session?.user?.id) {
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
        }
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
        // Always update localStorage first for immediate UI response
        if (typeof window !== 'undefined') {
          localStorage.setItem('emoji-panel-behavior-global', newBehavior);

          logger.debug('Updated emoji panel behavior in localStorage', {
            newBehavior
          });
        }

        // Update state immediately
        setEmojiPanelBehaviorState(newBehavior);

        // If authenticated, also update database
        if (session?.user?.id) {
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
        }
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
        // Always update localStorage first for immediate UI response
        if (typeof window !== 'undefined') {
          localStorage.setItem('font-preference-global', newFont);

          logger.debug('Updated font preference in localStorage', {
            newFont
          });
        }

        // Update state immediately
        setFontPreferenceState(newFont);

        // If authenticated, also update database
        if (session?.user?.id) {
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
        }
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

  // Function to update accessibility focus mode
  const setAccessibilityFocusMode = useCallback(
    async (newMode: AccessibilityFocusMode) => {
      setIsUpdatingAccessibilityFocusMode(true);
      setAccessibilityFocusModeError(null);

      try {
        if (session?.user?.id) {
          // TODO: Update database action to support accessibility_focus_mode
          // For now, just store in localStorage for authenticated users too
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessibility-focus-mode-global', newMode);
          }

          logger.debug(
            'Updated accessibility focus mode in localStorage (authenticated)',
            {
              userId: session.user.id,
              newMode
            }
          );
        } else {
          // Update in localStorage for anonymous user
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessibility-focus-mode-global', newMode);

            logger.debug('Updated accessibility focus mode in localStorage', {
              newMode
            });
          }
        }

        setAccessibilityFocusModeState(newMode);

        // Apply accessibility focus mode to document
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          if (newMode === 'enabled') {
            root.classList.add('accessibility-focus-enabled');
          } else {
            root.classList.remove('accessibility-focus-enabled');
          }
        }
      } catch (error) {
        logger.error(
          'Failed to update accessibility focus mode',
          error as Error,
          {
            userId: session?.user?.id,
            newMode
          }
        );
        setAccessibilityFocusModeError(
          error instanceof Error
            ? error.message
            : 'Failed to update accessibility focus mode'
        );
      } finally {
        setIsUpdatingAccessibilityFocusMode(false);
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
        accessibilityFocusMode,
        setAccessibilityFocusMode,
        isUpdatingSpacingTheme,
        isUpdatingPaginationMode,
        isUpdatingEmojiPanelBehavior,
        isUpdatingFontPreference,
        isUpdatingProfileVisibility,
        isUpdatingAccessibilityFocusMode,
        spacingThemeError,
        paginationModeError,
        emojiPanelBehaviorError,
        fontPreferenceError,
        profileVisibilityError,
        accessibilityFocusModeError
      }}
    >
      <div
        className={`spacing-theme-${spacingTheme} ${accessibilityFocusMode === 'enabled' ? 'accessibility-focus-enabled' : ''}`}
      >
        {children}
      </div>
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

export function useAccessibilityFocusMode() {
  const {
    accessibilityFocusMode,
    setAccessibilityFocusMode,
    isUpdatingAccessibilityFocusMode,
    accessibilityFocusModeError
  } = useUserPreferences();
  return {
    mode: accessibilityFocusMode,
    setMode: setAccessibilityFocusMode,
    isUpdating: isUpdatingAccessibilityFocusMode,
    error: accessibilityFocusModeError
  };
}
