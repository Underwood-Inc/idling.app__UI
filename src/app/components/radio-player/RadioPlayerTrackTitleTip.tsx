'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { RadioPlayerOverflowText } from './RadioPlayerOverflowText';
import {
  resolveRadioPlayerTrackTitleTipMaxSize,
  resolveRadioPlayerTrackTitleTipPosition,
  type RadioPlayerTrackTitleTipPlacement,
} from './radioPlayerTrackTitleTipPosition';
import styles from './RadioPlayerTrackTitleTip.module.css';

export interface RadioPlayerTrackTitleTipProps {
  trackDisplay: string;
  className?: string;
  marqueeEnabled?: boolean;
}

interface RadioPlayerTrackTitleTipStyle extends CSSProperties {
  maxWidth?: number;
  '--radio-track-tip-max-height'?: string;
}

export function RadioPlayerTrackTitleTip({
  trackDisplay,
  className,
  marqueeEnabled = true,
}: RadioPlayerTrackTitleTipProps) {
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [positioned, setPositioned] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<RadioPlayerTrackTitleTipPlacement>('above');
  const [tipSize, setTipSize] = useState({ maxWidth: 416, maxHeight: 192 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const tipId = useId();

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) {
      return;
    }

    const viewport = { width: window.innerWidth, height: window.innerHeight };
    setTipSize(resolveRadioPlayerTrackTitleTipMaxSize(viewport));

    const resolved = resolveRadioPlayerTrackTitleTipPosition({
      trigger: trigger.getBoundingClientRect(),
      tip: tip.getBoundingClientRect(),
      viewport,
    });

    setPosition({ top: resolved.top, left: resolved.left });
    setPlacement(resolved.placement);
    setPositioned(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPositioned(false);
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      updatePosition();
      window.requestAnimationFrame(updatePosition);
    });

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, trackDisplay, updatePosition]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || tipRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const tipStyle: RadioPlayerTrackTitleTipStyle = {
    top: position.top,
    left: position.left,
    maxWidth: tipSize.maxWidth,
    '--radio-track-tip-max-height': `${tipSize.maxHeight}px`,
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} no-glass`}
        aria-expanded={open}
        aria-controls={open ? tipId : undefined}
        aria-label={`Now playing: ${trackDisplay}. Click to show full title.`}
        data-testid="radio-track-title-trigger"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <RadioPlayerOverflowText
          text={trackDisplay}
          className={[className, styles.trigger__label].filter(Boolean).join(' ')}
          as="span"
          suppressNativeTitle
          pauseScroll={open}
          marqueeEnabled={marqueeEnabled}
        />
      </button>
      {portalReady && open
        ? createPortal(
            <div
              ref={tipRef}
              id={tipId}
              role="dialog"
              aria-label="Full track title"
              className={styles.tipWrap}
              data-placement={placement}
              data-positioned={positioned ? 'true' : 'false'}
              style={tipStyle}
              data-testid="radio-track-title-tip"
            >
              <div className={styles.tip}>
                <p className={styles.tip__text}>{trackDisplay}</p>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
