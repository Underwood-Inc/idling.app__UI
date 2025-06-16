'use client';
import { PostFilters } from '../../../lib/types/filters';
import './FilterBar.css';

export function FilterLabel({
  name,
  label,
  filterId,
  onRemoveFilter
}: {
  name: string;
  label: string;
  filterId: string;
  onRemoveFilter: (filterName: PostFilters) => void;
}) {
  const onClick = () => {
    // eslint-disable-next-line no-console
    console.log('🏷️ [FILTER_LABEL] Filter label clicked:', {
      name,
      label,
      filterId
    });

    // Delegate to parent component
    onRemoveFilter(name as PostFilters);
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
