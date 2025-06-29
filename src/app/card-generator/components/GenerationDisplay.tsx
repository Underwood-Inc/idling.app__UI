'use client';

import { Card } from '../../components/card/Card';
import styles from '../page.module.css';

interface GenerationDisplayProps {
  generationId: string;
  svgContent: string;
  onCopyId: () => void;
}

export function GenerationDisplay({
  generationId,
  svgContent,
  onCopyId
}: GenerationDisplayProps) {
  // Only require svgContent - generationId can be empty in local development
  if (!svgContent) {
    return null;
  }

  return (
    <Card width="full" className={styles.generation__display__container}>
      <div className={styles.generation__header}>
        <h4 className={styles.generation__title}>🎨 Generated Image</h4>
        {generationId && (
          <div className={styles.generation__id}>
            <span className={styles.id__label}>ID:</span>
            <code className={styles.id__value}>{generationId}</code>
            <button
              onClick={onCopyId}
              className={styles.copy__button}
              title="Copy Generation ID"
            >
              📋 Copy
            </button>
          </div>
        )}
      </div>

      <div className={styles.image__wrapper}>
        <div
          className={styles.og__image}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </Card>
  );
}
