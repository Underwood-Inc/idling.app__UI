'use client';
import { useSearchParams } from 'next/navigation';
import { useFilters } from '../../../lib/state/FiltersContext';
import BadgeWrapper from '../badge/Badge';
import './FilterBar.css';
import { getTagsFromSearchParams } from './utils/get-tags';

export function FilterLabel({
  label,
  name,
  filterId
}: {
  label: string;
  name: string;
  filterId: string;
}) {
  const searchParams = useSearchParams();
  const tags = getTagsFromSearchParams(searchParams.get(name) || '');
  const { dispatch } = useFilters();

  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const newTags = tags.filter((tag) => tag !== label);
    const newTagsSearchParams = newTags.join(',');

    dispatch({
      payload: {
        filters: [
          {
            name: 'tags',
            value: newTags.length ? newTagsSearchParams : ''
          }
        ],
        id: filterId
      },
      type: 'SET_CURRENT_FILTERS'
    });
  };

  return (
    <BadgeWrapper badgeContent="&#10005;" onClick={onClick} showOnHover>
      <p className="filter-bar__filter-value">{label}</p>
    </BadgeWrapper>
  );
}
