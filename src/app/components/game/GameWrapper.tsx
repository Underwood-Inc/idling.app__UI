'use client';
import Script from 'next/script';
import React from 'react';
import { GAME_WRAPPER_SELECTORS } from 'src/lib/test-selectors/components/game-wrapper.selectors';
import './styles.css';

export const GameWrapper: React.FC = () => {
  return (
    <div>
      <div className="gm4html5_div_class" id="gm4html5_div_id">
        <canvas
          id="canvas"
          width="864"
          height="648"
          data-testid={GAME_WRAPPER_SELECTORS.CANVAS}
        >
          <p>Your browser doesn&apos;t support HTML5 canvas.</p>
        </canvas>
      </div>

      <Script
        data-testid={GAME_WRAPPER_SELECTORS.SCRIPT}
        src="idling.app.js?cachebust=968111397"
      />
    </div>
  );
};
