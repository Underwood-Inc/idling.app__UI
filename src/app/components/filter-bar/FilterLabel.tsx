'use client';
import './FilterBar.css';

export function FilterLabel({
  name,
  label,
  filterId,
  onRemoveTag
}: {
  name: string;
  label: string;
  filterId: string;
  onRemoveTag: (tagToRemove: string) => void;
}) {
  const onClick = () => {
    // eslint-disable-next-line no-console
    console.log('🏷️ [FILTER_LABEL] Filter label clicked:', {
      name,
      label,
      filterId
    });

    // Remove the specific tag, not the entire filter
    onRemoveTag(label);
  };

  return (
    <button
      className="filter-bar__filter-value"
      onClick={onClick}
      aria-label={`Remove ${label} filter`}
    >
      {label}
      <span className="filter-bar__filter-remove" aria-hidden="true">
        ×
      </span>
    </button>
  );
}
