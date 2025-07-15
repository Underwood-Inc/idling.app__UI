'use client';

import React from 'react';
import { NAV_PATHS } from 'src/lib/routes';
import { useOverlay } from '../../../lib/context/OverlayContext';
import { LinkTooltip } from '../tooltip/LinkTooltip';
import { InstantLink } from '../ui/InstantLink';
import './GalaxyLink.css';

// Galaxy modal content component
const GalaxyModalContent = ({ onClose }: { onClose?: () => void }) => {
  return (
    <div style={{ width: '90vw', height: '80vh', maxWidth: '1200px' }}>
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--brand-tertiary--dark)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--dark-background--secondary)'
        }}
      >
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>🌌 Galaxy</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '24px',
            cursor: 'pointer'
          }}
          aria-label="Close Galaxy modal"
        >
          ×
        </button>
      </div>
      <iframe
        src={NAV_PATHS.GALAXY}
        style={{
          width: '100%',
          height: 'calc(100% - 60px)',
          border: 'none'
        }}
        title="Galaxy App"
      />
    </div>
  );
};

export const GalaxyLink = () => {
  const { openOverlay, closeOverlay } = useOverlay();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    const modalId = 'galaxy-modal';

    openOverlay({
      id: modalId,
      type: 'modal',
      component: GalaxyModalContent,
      props: {
        className: 'galaxy-modal',
        onClose: () => closeOverlay(modalId)
      }
    });
  };

  return (
    <LinkTooltip
      url={NAV_PATHS.GALAXY}
      enableExtendedPreview
      enableCtrlClick
      isInsideParagraph
    >
      <InstantLink
        target="_blank"
        href={NAV_PATHS.GALAXY}
        onClick={handleClick}
      >
        Galaxy
      </InstantLink>
    </LinkTooltip>
  );
};
