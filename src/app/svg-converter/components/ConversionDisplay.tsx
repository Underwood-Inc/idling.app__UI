'use client';

import { useEffect, useState } from 'react';
import type { ConversionResult } from '../page';
import styles from './ConversionDisplay.module.css';

interface ConversionDisplayProps {
  result: ConversionResult;
  onNewConversion: () => void;
}

export function ConversionDisplay({
  result,
  onNewConversion
}: ConversionDisplayProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);

  // Create preview URL from blob
  useEffect(() => {
    const url = URL.createObjectURL(result.blob);
    setPreviewUrl(url);

    // Cleanup URL when component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [result.blob]);

  const handleDownload = () => {
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error('Failed to load converted image preview');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={styles.display}>
      <div className={styles.display__header}>
        <h3 className={styles.display__title}>✅ Conversion Complete!</h3>
        <button
          onClick={onNewConversion}
          className={styles.display__new}
          title="Start new conversion"
        >
          🆕 New
        </button>
      </div>

      <div className={styles.display__content}>
        {/* Image Preview Section */}
        <div className={styles.preview__section}>
          <h4 className={styles.preview__title}>🖼️ Preview</h4>
          <div className={styles.preview__container}>
            {previewUrl && (
              <div className={styles.preview__wrapper}>
                {!imageLoaded && (
                  <div className={styles.preview__loading}>
                    <div className={styles.loading__spinner}>⏳</div>
                    <span className={styles.loading__text}>
                      Loading preview...
                    </span>
                  </div>
                )}
                <img
                  src={previewUrl}
                  alt={`Preview of ${result.filename}.png`}
                  className={`${styles.preview__image} ${imageLoaded ? styles['preview__image--loaded'] : ''}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
            )}
          </div>
        </div>

        {/* Conversion Info */}
        <div className={styles.result__info}>
          <div className={styles.info__grid}>
            <div className={styles.info__item}>
              <span className={styles.info__label}>Filename:</span>
              <span className={styles.info__value}>{result.filename}.png</span>
            </div>
            <div className={styles.info__item}>
              <span className={styles.info__label}>Dimensions:</span>
              <span className={styles.info__value}>
                {result.dimensions.width} × {result.dimensions.height}
              </span>
            </div>
            <div className={styles.info__item}>
              <span className={styles.info__label}>Original Size:</span>
              <span className={styles.info__value}>
                {formatFileSize(result.originalSize)}
              </span>
            </div>
            <div className={styles.info__item}>
              <span className={styles.info__label}>PNG Size:</span>
              <span className={styles.info__value}>
                {formatFileSize(result.convertedSize)}
              </span>
            </div>
            <div className={styles.info__item}>
              <span className={styles.info__label}>Conversion Time:</span>
              <span className={styles.info__value}>
                {formatTime(result.conversionTime)}
              </span>
            </div>
            <div className={styles.info__item}>
              <span className={styles.info__label}>Converted:</span>
              <span className={styles.info__value}>
                {result.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.result__actions}>
          <button onClick={handleDownload} className={styles.download__button}>
            <span className={styles.button__icon}>⬇️</span>
            Download PNG
          </button>

          <div className={styles.action__stats}>
            <div className={styles.stat}>
              <span className={styles.stat__label}>Compression:</span>
              <span className={styles.stat__value}>
                {result.convertedSize < result.originalSize ? (
                  <span className={styles.stat__good}>
                    -
                    {Math.round(
                      (1 - result.convertedSize / result.originalSize) * 100
                    )}
                    %
                  </span>
                ) : (
                  <span className={styles.stat__neutral}>
                    +
                    {Math.round(
                      (result.convertedSize / result.originalSize - 1) * 100
                    )}
                    %
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
