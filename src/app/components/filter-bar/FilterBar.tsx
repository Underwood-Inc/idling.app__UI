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
  const { state, dispatch } = useFilters();
  const filters = state.default?.filters || [];

  if (!filters?.length) {
    return null;
  }

  const onClear = (event: React.MouseEvent<HTMLElement>, name: string) => {
    dispatch({
      payload: {
        filters: [
          {
            name,
            value: ''
          }
        ],
        id: 'default'
      },
      type: 'SET_CURRENT_FILTERS'
    });
  };

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
                <FilterLabel name={name} label={value} />
              </div>
            );
          });

        return (
          <div key={name} className="filter-bar__filter">
            <div className="filter-bar__filter-name-container">
              <button
                className="filter-bar__clear"
                onClick={(e) => onClear(e, name)}
              >
                Clear
              </button>
              &nbsp;
              <p className="uppercase filter-bar__filter-name">{name}:</p>
              &nbsp;
              {renderValues()}
            </div>
          </div>
        );
      })}
    </article>
  );
}
