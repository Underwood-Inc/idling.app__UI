'use client';

import { useCallback } from 'react';
import { useOverlay } from '../../lib/context/OverlayContext';
import { PostModal } from '../components/ui/PostModal';

export interface UsePostModalOptions {
  onClose?: () => void;
}

export const usePostModal = (options: UsePostModalOptions = {}) => {
  const { openOverlay, closeOverlay } = useOverlay();

  const openCreateModal = useCallback(() => {
    const modalId = 'create-post-modal';

    openOverlay({
      id: modalId,
      type: 'modal',
      component: PostModal,
      props: {
        mode: 'create',
        onClose: () => {
          closeOverlay(modalId);
          options.onClose?.();
        }
      }
    });
  }, [openOverlay, closeOverlay, options]);

  const openViewModal = useCallback(
    (postId: string, title?: string, content?: React.ReactNode) => {
      const modalId = `view-post-modal-${postId}`;

      openOverlay({
        id: modalId,
        type: 'modal',
        component: PostModal,
        props: {
          mode: 'view',
          postId,
          title,
          content,
          onClose: () => {
            closeOverlay(modalId);
            options.onClose?.();
          }
        }
      });
    },
    [openOverlay, closeOverlay, options]
  );

  const openEditModal = useCallback(
    (postId: string) => {
      const modalId = `edit-post-modal-${postId}`;

      openOverlay({
        id: modalId,
        type: 'modal',
        component: PostModal,
        props: {
          mode: 'edit',
          postId,
          onClose: () => {
            closeOverlay(modalId);
            options.onClose?.();
          }
        }
      });
    },
    [openOverlay, closeOverlay, options]
  );

  const closeAllPostModals = useCallback(() => {
    // Close all post-related modals
    closeOverlay('create-post-modal');
    // Note: view and edit modals have dynamic IDs, so they need to be closed individually
    // or the overlay system should provide a way to close by pattern
  }, [closeOverlay]);

  return {
    openCreateModal,
    openViewModal,
    openEditModal,
    closeAllPostModals
  };
};
