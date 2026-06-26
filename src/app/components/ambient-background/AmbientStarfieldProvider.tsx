'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  createAmbientStarfield,
  getAmbientStarfieldCounts,
  type AmbientStarfield,
} from './ambientBackground.utils';

const EMPTY_STARFIELD: AmbientStarfield = {
  dustBoxShadow: '',
  mediumBoxShadow: '',
  animatedStars: [],
};

const AmbientStarfieldContext = createContext<AmbientStarfield>(EMPTY_STARFIELD);

export interface AmbientStarfieldProviderProps {
  children: ReactNode;
}

/** One starfield instance for the site background and clipped sky overlays (e.g. starry horizon). */
export function AmbientStarfieldProvider({ children }: AmbientStarfieldProviderProps) {
  const [starfield, setStarfield] = useState<AmbientStarfield>(EMPTY_STARFIELD);
  const starfieldKeyRef = useRef('');

  useEffect(() => {
    const updateStarfield = () => {
      const counts = getAmbientStarfieldCounts(window.innerWidth);
      const nextKey = `${counts.dust}-${counts.medium}-${counts.twinkle}-${counts.cross}-${counts.spark}`;

      if (nextKey === starfieldKeyRef.current) {
        return;
      }

      starfieldKeyRef.current = nextKey;
      setStarfield(createAmbientStarfield(counts));
    };

    updateStarfield();
    window.addEventListener('resize', updateStarfield);

    return () => {
      window.removeEventListener('resize', updateStarfield);
    };
  }, []);

  return (
    <AmbientStarfieldContext.Provider value={starfield}>{children}</AmbientStarfieldContext.Provider>
  );
}

export function useAmbientStarfield(): AmbientStarfield {
  return useContext(AmbientStarfieldContext);
}
