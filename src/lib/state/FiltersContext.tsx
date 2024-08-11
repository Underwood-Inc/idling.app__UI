'use client';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';
import { Filter } from '../../app/components/filter-bar/FilterBar';

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

type FiltersAction = {
  type: 'SET_CURRENT_FILTERS';
  payload: FiltersActionPayload;
};

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
  switch (action.type) {
    case 'SET_CURRENT_FILTERS':
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          id: action.payload.id,
          filters: action.payload.filters
        }
      };
    default:
      return state;
  }
};

export const FiltersProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [state, dispatch] = useReducer(filtersReducer, initialState);

  return (
    <FiltersContext.Provider value={{ state, dispatch }}>
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
};
