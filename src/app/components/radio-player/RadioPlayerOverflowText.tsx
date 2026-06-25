'use client';

import { useEffect, useRef, useState, type CSSProperties, type ElementType } from 'react';
import styles from './RadioPlayerBar.module.css';

export interface RadioPlayerOverflowTextProps {
  text: string;
  className?: string;
  as?: 'span' | 'p';
  title?: string;
  suppressNativeTitle?: boolean;
  pauseScroll?: boolean;
  marqueeEnabled?: boolean;
}

interface RadioPlayerOverflowTextInnerStyle extends CSSProperties {
  '--overflow-distance'?: string;
  '--overflow-duration'?: string;
}

const SCROLL_SPEED_PX_PER_SEC = 28;
const MIN_SCROLL_DURATION_SEC = 4;

export function RadioPlayerOverflowText({
  text,
  className,
  as = 'span',
  title,
  suppressNativeTitle = false,
  pauseScroll = false,
  marqueeEnabled = true,
}: RadioPlayerOverflowTextProps) {
  const containerRef = useRef<HTMLSpanElement & HTMLParagraphElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [scrollDuration, setScrollDuration] = useState(`${MIN_SCROLL_DURATION_SEC}s`);

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) {
      return undefined;
    }

    const syncOverflow = () => {
      if (container.clientWidth < 8) {
        return;
      }

      const distance = Math.max(0, measure.offsetWidth - container.clientWidth);
      const nextOverflowing = marqueeEnabled && distance > 1;
      setOverflowing(nextOverflowing);
      setScrollDistance(distance);
      setScrollDuration(`${Math.max(MIN_SCROLL_DURATION_SEC, distance / SCROLL_SPEED_PX_PER_SEC)}s`);
    };

    syncOverflow();
    const observer = new ResizeObserver(syncOverflow);
    observer.observe(container);
    observer.observe(measure);
    return () => {
      observer.disconnect();
    };
  }, [marqueeEnabled, text]);

  const Tag = as as ElementType;
  const innerStyle: RadioPlayerOverflowTextInnerStyle | undefined = overflowing
    ? {
      '--overflow-distance': `${scrollDistance}px`,
      '--overflow-duration': scrollDuration,
    }
    : undefined;

  return (
    <Tag
      ref={containerRef}
      className={[styles.overflowText, className].filter(Boolean).join(' ')}
      data-overflow={overflowing ? 'true' : 'false'}
      data-paused={pauseScroll ? 'true' : 'false'}
      title={suppressNativeTitle ? undefined : (title ?? text)}
    >
      <span ref={measureRef} className={styles.overflowText__measure} aria-hidden="true">
        {text}
      </span>
      <span className={styles.overflowText__inner} style={innerStyle}>
        {text}
      </span>
    </Tag>
  );
}
