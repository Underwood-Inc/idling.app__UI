'use client';

import React from 'react';
import type { ConversionResult } from '../page';
import styles from './ConversionHistory.module.css';

interface ConversionHistoryProps {
  conversions: ConversionResult[];
  onSelectConversion: (conversion: ConversionResult) => void;
  onClearHistory: () => void;
  currentResult: ConversionResult | null;
}

export function ConversionHistory({
  conversions,
  onSelectConversion,
  onClearHistory,
  currentResult
}: ConversionHistoryProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleDownload = (
    conversion: ConversionResult,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const url = URL.createObjectURL(conversion.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${conversion.filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (conversions.length === 0) {
    return null;
  }

  return (
    <div className={styles.history}>
      <div className={styles.history__header}>
        <h3 className={styles.history__title}>📚 History</h3>
        <button
          onClick={onClearHistory}
          className={styles.history__clear}
          title="Clear all history"
        >
          🗑️
        </button>
      </div>

      <div className={styles.history__list}>
        {conversions.map((conversion) => (
          <div
            key={conversion.id}
            className={`${styles.history__item} ${
              currentResult?.id === conversion.id
                ? styles['history__item--active']
                : ''
            }`}
            onClick={() => onSelectConversion(conversion)}
          >
            <div className={styles.item__header}>
              <span className={styles.item__filename}>
                {conversion.filename}
              </span>
              <button
                onClick={(e) => handleDownload(conversion, e)}
                className={styles.item__download}
                title="Download this conversion"
              >
                ⬇️
              </button>
            </div>

            <div className={styles.item__details}>
              <div className={styles.item__size}>
                {formatFileSize(conversion.convertedSize)}
              </div>
              <div className={styles.item__dimensions}>
                {conversion.dimensions.width}×{conversion.dimensions.height}
              </div>
              <div className={styles.item__time}>
                {formatTime(conversion.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.history__footer}>
        <p className={styles.history__note}>Click any item to view details</p>
      </div>
    </div>
  );
}
