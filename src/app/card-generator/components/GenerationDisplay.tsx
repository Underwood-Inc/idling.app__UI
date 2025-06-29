'use client';

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
  if (!generationId || !svgContent) {
    return null;
  }

  return (
    <div className={styles.generation__display}>
      <div className={styles.generation__id}>
        <span className={styles.id__label}>Generation ID:</span>
        <code className={styles.id__value}>{generationId}</code>
        <button
          onClick={onCopyId}
          className={styles.copy__button}
          title="Copy Generation ID"
        >
          📋
        </button>
      </div>

      <div className={styles.image__wrapper}>
        <div
          className={styles.og__image}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  );
}
