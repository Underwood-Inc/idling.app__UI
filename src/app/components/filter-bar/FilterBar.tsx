'use client';
import { useFilters } from '../../../lib/state/FiltersContext';
import { dedupeStringArray } from '../../../lib/utils/array/dedupe-string-array';
import './FilterBar.css';
import { FilterLabel } from './FilterLabel';
import { getTagsFromSearchParams } from './utils/get-tags';
export interface Filter<T extends string = string> {
  name: T;
  value: string;
}

type DefaultSearchParamFilters = Record<string, string>;
/**
 * Primary use is to define component props.
 * @example type PostSearchParams = Filters<{ tags?: string; }>;
 */
export type Filters<
  F extends
    Partial<DefaultSearchParamFilters> = Partial<DefaultSearchParamFilters>
> = Partial<F>;

export default function FilterBar() {
  const { state } = useFilters();
  const filters = state.default?.filters || [];

  if (!filters?.length) {
    return null;
  }

  return (
    <article className="filter-bar__container">
      {filters.map(({ name, value }) => {
        if (!value) {
          return null;
        }

        const values = dedupeStringArray(getTagsFromSearchParams(value));

        const renderValues = () =>
          values.map((value) => {
            return (
              <div key={value} className="filter-bar__filter-value-container">
                <FilterLabel label={value} />
              </div>
            );
          });

        return (
          <div key={name} className="filter-bar__filter">
            <div className="filter-bar__filter-name-container">
              <p className="capitalize filter-bar__filter-name">{name}:</p>
              &nbsp;
              {renderValues()}
            </div>
          </div>
        );
      })}
    </article>
  );
}
