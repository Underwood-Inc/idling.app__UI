'use client';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';
import { Filter } from '../../app/components/filter-bar/FilterBar';
import { dedupeStringArray } from '../utils/array/dedupe-string-array';

type FiltersState = {
  [x: string]:
    | {
        id: string;
        filters: Filter[];
      }
    | undefined;
};

type FiltersActionPayload = {
  id: string;
  filters: Filter[];
};

type FiltersAction =
  | {
      type: 'SET_CURRENT_FILTERS';
      payload: FiltersActionPayload;
    }
  | { type: 'RESET_STATE' };

const initialState: FiltersState = {
  default: {
    id: 'default',
    filters: []
  }
};

const FiltersContext = createContext<
  | {
      state: FiltersState;
      dispatch: React.Dispatch<FiltersAction>;
    }
  | undefined
>(undefined);

const filtersReducer = (
  state: FiltersState,
  action: FiltersAction
): FiltersState => {
  const dedupedFilters: Filter<string>[] | undefined =
    action.type === 'SET_CURRENT_FILTERS'
      ? action.payload.filters.map(({ name, value }) => {
          return {
            name,
            value: dedupeStringArray(value.split(',')).join(',')
          };
        })
      : undefined;

  switch (action.type) {
    case 'SET_CURRENT_FILTERS':
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          id: action.payload.id,
          filters: dedupedFilters || action.payload.filters
        }
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

export const FiltersProvider: React.FC<{
  children: ReactNode;
  value?: FiltersState;
}> = ({ children, value = initialState }) => {
  const [state, dispatch] = useReducer(filtersReducer, value);

  return (
    <FiltersContext.Provider value={{ state, dispatch }}>
      {children}
    </FiltersContext.Provider>
  );
};

/**
 * Upon dispatching a new and different filter payload, `<SubmissionsList />` will refetch
 */
export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
};
