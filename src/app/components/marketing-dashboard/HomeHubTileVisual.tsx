'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { HomeHubTileVisual as HomeHubTileVisualAsset } from './productMarketing.types';
import styles from './marketing-dashboard.module.css';

interface HomeHubTileVisualProps {
  visual: HomeHubTileVisualAsset;
}

interface PointerOffset {
  x: number;
  y: number;
}

export function HomeHubTileVisual({ visual }: HomeHubTileVisualProps) {
  const fit = visual.fit ?? 'cover';
  const imgClassName =
    fit === 'contain'
      ? `${styles.hub__visualImg} ${styles['hub__visualImg--contain']}`
      : styles.hub__visualImg;
  const frameRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<PointerOffset>({ x: 0, y: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frameId = 0;

    const onMove = (event: PointerEvent) => {
      const frame = frameRef.current;
      if (!frame) {
        return;
      }

      const rect = frame.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      targetX = Math.max(-1, Math.min(1, nx));
      targetY = Math.max(-1, Math.min(1, ny));
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setOffset({ x: currentX, y: currentY });
      frameId = window.requestAnimationFrame(animate);
    };

    const frame = frameRef.current;
    frame?.addEventListener('pointermove', onMove);
    frame?.addEventListener('pointerleave', onLeave);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      frame?.removeEventListener('pointermove', onMove);
      frame?.removeEventListener('pointerleave', onLeave);
      window.cancelAnimationFrame(frameId);
    };
  }, [reduceMotion]);

  const depthBack = reduceMotion ? 0 : offset.x * 6;
  const depthMid = reduceMotion ? 0 : offset.x * 12;
  const depthFront = reduceMotion ? 0 : offset.x * 20;
  const liftY = reduceMotion ? 0 : offset.y * 4;

  return (
    <div ref={frameRef} className={styles.hub__visualFrame}>
      <span
        className={styles.hub__visualGlow}
        style={{
          transform: `translate3d(${depthBack}px, ${liftY}px, 0)`,
        }}
      />
      <div
        className={styles.hub__visualMid}
        style={{
          transform: `translate3d(${depthMid}px, ${liftY * 0.5}px, 0)`,
        }}
      >
        <Image
          src={visual.src}
          alt={visual.alt}
          fill
          sizes="(max-width: 640px) 28vw, 11rem"
          className={imgClassName}
          unoptimized={
            visual.src.endsWith('.gif') ||
            visual.src.endsWith('.webp') ||
            visual.src.endsWith('.svg') ||
            visual.src.endsWith('.jpg') ||
            visual.src.endsWith('.jpeg') ||
            visual.src.endsWith('.png')
          }
        />
      </div>
      <span
        className={styles.hub__visualShine}
        style={{
          transform: `translate3d(${depthFront}px, ${liftY * 0.25}px, 0)`,
        }}
      />
    </div>
  );
}