'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { HomeHubTileVisual as HomeHubTileVisualAsset } from './productMarketing.types';
import styles from './marketing-dashboard.module.css';

interface HomeHubTileVisualProps {
  visual: HomeHubTileVisualAsset;
}

export function HomeHubTileVisual({ visual }: HomeHubTileVisualProps) {
  const fit = visual.fit ?? 'cover';
  const imgClassName =
    fit === 'contain'
      ? `${styles.hub__visualImg} ${styles['hub__visualImg--contain']}`
      : styles.hub__visualImg;
  const frameRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLSpanElement>(null);
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

    const applyTransforms = (x: number, y: number) => {
      const liftY = y * 4;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${x * 6}px, ${liftY}px, 0)`;
      }
      if (midRef.current) {
        midRef.current.style.transform = `translate3d(${x * 12}px, ${liftY * 0.5}px, 0)`;
      }
      if (shineRef.current) {
        shineRef.current.style.transform = `translate3d(${x * 20}px, ${liftY * 0.25}px, 0)`;
      }
    };

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
      applyTransforms(currentX, currentY);
      frameId = window.requestAnimationFrame(animate);
    };

    const frame = frameRef.current;
    frame?.addEventListener('pointermove', onMove);
    frame?.addEventListener('pointerleave', onLeave);
    applyTransforms(0, 0);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      frame?.removeEventListener('pointermove', onMove);
      frame?.removeEventListener('pointerleave', onLeave);
      window.cancelAnimationFrame(frameId);
    };
  }, [reduceMotion]);

  return (
    <div ref={frameRef} className={styles.hub__visualFrame}>
      <span ref={glowRef} className={styles.hub__visualGlow} />
      <div ref={midRef} className={styles.hub__visualMid}>
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
      <span ref={shineRef} className={styles.hub__visualShine} />
    </div>
  );
}