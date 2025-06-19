'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState
} from 'react';

// Types for different overlay elements
export type OverlayType = 'modal' | 'widget' | 'popup';

export interface OverlayConfig {
  id: string;
  type: OverlayType;
  component: React.ComponentType<any>;
  props?: any;
  zIndex?: number;
  allowMultiple?: boolean; // Only for widgets
  isPinned?: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  isResizable?: boolean;
  isDraggable?: boolean;
  removeOriginal?: boolean; // Remove original instance when pinned
}

export interface OverlayState {
  id: string;
  config: OverlayConfig;
  isOpen: boolean;
  element?: HTMLElement;
}

interface OverlayContextType {
  overlays: OverlayState[];
  openOverlay: (config: OverlayConfig) => void;
  closeOverlay: (id: string) => void;
  closeAllModals: () => void;
  closeAllOverlays: () => void;
  togglePin: (id: string, sourceElement?: HTMLElement) => void;
  updateOverlay: (id: string, updates: Partial<OverlayConfig>) => void;
  isOverlayOpen: (id: string) => boolean;
  getActiveModal: () => OverlayState | null;
  getActiveWidgets: () => OverlayState[];
}

const OverlayContext = createContext<OverlayContextType | null>(null);

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within OverlayProvider');
  }
  return context;
};

export const OverlayProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [overlays, setOverlays] = useState<OverlayState[]>([]);
  const nextZIndex = useRef(1000);

  const openOverlay = useCallback((config: OverlayConfig) => {
    setOverlays((prev) => {
      // Close existing modal if opening a new modal (only one modal at a time)
      if (config.type === 'modal') {
        const withoutModals = prev.filter(
          (overlay) => overlay.config.type !== 'modal'
        );
        return [
          ...withoutModals,
          {
            id: config.id,
            config: {
              ...config,
              zIndex: config.zIndex || nextZIndex.current++
            },
            isOpen: true
          }
        ];
      }

      // For widgets, check if multiple instances are allowed
      if (config.type === 'widget' && !config.allowMultiple) {
        const existing = prev.find((overlay) => overlay.id === config.id);
        if (existing) {
          // Update existing widget instead of creating new one
          return prev.map((overlay) =>
            overlay.id === config.id
              ? {
                  ...overlay,
                  config: { ...overlay.config, ...config },
                  isOpen: true
                }
              : overlay
          );
        }
      }

      // Add new overlay
      return [
        ...prev,
        {
          id: config.id,
          config: { ...config, zIndex: config.zIndex || nextZIndex.current++ },
          isOpen: true
        }
      ];
    });

    // Handle original element removal for pinned widgets
    if (config.removeOriginal && config.type === 'widget') {
      const originalElement = document.querySelector(
        `[data-pin-source="${config.id}"]`
      );
      if (originalElement) {
        (originalElement as HTMLElement).style.display = 'none';
      }
    }
  }, []);

  const closeOverlay = useCallback((id: string) => {
    setOverlays((prev) => {
      const overlay = prev.find((o) => o.id === id);

      // Restore original element if it was hidden
      if (overlay?.config.removeOriginal && overlay.config.type === 'widget') {
        const originalElement = document.querySelector(
          `[data-pin-source="${id}"]`
        );
        if (originalElement) {
          (originalElement as HTMLElement).style.display = '';
        }
      }

      return prev.filter((overlay) => overlay.id !== id);
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setOverlays((prev) =>
      prev.filter((overlay) => overlay.config.type !== 'modal')
    );
  }, []);

  const closeAllOverlays = useCallback(() => {
    // Restore all hidden original elements
    overlays.forEach((overlay) => {
      if (overlay.config.removeOriginal && overlay.config.type === 'widget') {
        const originalElement = document.querySelector(
          `[data-pin-source="${overlay.id}"]`
        );
        if (originalElement) {
          (originalElement as HTMLElement).style.display = '';
        }
      }
    });

    setOverlays([]);
  }, [overlays]);

  const togglePin = useCallback((id: string, sourceElement?: HTMLElement) => {
    setOverlays((prev) => {
      const existing = prev.find((overlay) => overlay.id === id);

      if (existing) {
        // Unpin - close the widget
        if (existing.config.removeOriginal) {
          const originalElement = document.querySelector(
            `[data-pin-source="${id}"]`
          );
          if (originalElement) {
            (originalElement as HTMLElement).style.display = '';
          }
        }
        return prev.filter((overlay) => overlay.id !== id);
      } else {
        // Pin - create widget from source element
        if (sourceElement) {
          const rect = sourceElement.getBoundingClientRect();
          return [
            ...prev,
            {
              id,
              config: {
                id,
                type: 'widget',
                component: React.Fragment, // Will be overridden by specific implementation
                position: { x: rect.left, y: rect.top },
                size: { width: rect.width, height: rect.height },
                isResizable: true,
                isDraggable: true,
                removeOriginal: true,
                zIndex: nextZIndex.current++
              },
              isOpen: true
            }
          ];
        }
        return prev;
      }
    });
  }, []);

  const updateOverlay = useCallback(
    (id: string, updates: Partial<OverlayConfig>) => {
      setOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === id
            ? { ...overlay, config: { ...overlay.config, ...updates } }
            : overlay
        )
      );
    },
    []
  );

  const isOverlayOpen = useCallback(
    (id: string) => {
      return overlays.some((overlay) => overlay.id === id && overlay.isOpen);
    },
    [overlays]
  );

  const getActiveModal = useCallback(() => {
    return (
      overlays.find(
        (overlay) => overlay.config.type === 'modal' && overlay.isOpen
      ) || null
    );
  }, [overlays]);

  const getActiveWidgets = useCallback(() => {
    return overlays.filter(
      (overlay) => overlay.config.type === 'widget' && overlay.isOpen
    );
  }, [overlays]);

  const value: OverlayContextType = {
    overlays,
    openOverlay,
    closeOverlay,
    closeAllModals,
    closeAllOverlays,
    togglePin,
    updateOverlay,
    isOverlayOpen,
    getActiveModal,
    getActiveWidgets
  };

  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
};
