'use client';

import { useSimpleUrlFilters } from '@lib/state/submissions/useSimpleUrlFilters';
import { useMemo } from 'react';
import { LogicToggle } from './LogicToggle';

interface TagLogicToggleProps {
  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;
  /**
   * Custom title for ALL button
   */
  allTitle?: string;
  /**
   * Custom title for ANY button
   */
  anyTitle?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Shared TagLogicToggle component that properly handles URL state updates
 * for tag logic. Can be used by FilterBar, RecentTagsClient, and other components
 * that need to control tag filtering logic.
 */
export function TagLogicToggle({
  disabled = false,
  allTitle = 'Must have ALL selected tags',
  anyTitle = 'Must have ANY selected tags',
  className
}: TagLogicToggleProps) {
  const { filters, updateFilter } = useSimpleUrlFilters();

  // Get current tag logic from URL state
  const currentTagLogic = useMemo(() => {
    const tagLogicFilter = filters.find((f) => f.name === 'tagLogic');
    return (tagLogicFilter?.value as 'AND' | 'OR') || 'OR';
  }, [filters]);

  // Check if we have multiple tags to determine if toggle should be shown
  const hasMultipleTags = useMemo(() => {
    const tagFilters = filters.filter((f) => f.name === 'tags');
    return tagFilters.length > 1;
  }, [filters]);

  // Don't render if we don't have multiple tags
  if (!hasMultipleTags) {
    return null;
  }

  const handleToggle = (logic: 'AND' | 'OR') => {
    // Use the same URL update mechanism as FilterBar
    updateFilter('tagLogic', logic);
  };

  return (
    <div className={className}>
      <LogicToggle
        currentLogic={currentTagLogic}
        onToggle={handleToggle}
        disabled={disabled}
        allTitle={allTitle}
        anyTitle={anyTitle}
      />
    </div>
  );
}
