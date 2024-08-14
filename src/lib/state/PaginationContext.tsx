'use client';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';

type PaginationState = {
  [x: string]:
    | {
        id: string;
        currentPage: number;
        totalPages: number;
      }
    | undefined;
};

type PaginationActionPayload = {
  id: string;
  page: number;
};

type PaginationAction =
  | { type: 'RESET_STATE' }
  | { type: 'SET_CURRENT_PAGE'; payload: PaginationActionPayload }
  | { type: 'SET_TOTAL_PAGES'; payload: PaginationActionPayload };

const initialState: PaginationState = {
  default: {
    id: 'default',
    currentPage: 1,
    totalPages: 1
  }
};

const PaginationContext = createContext<
  | {
      state: PaginationState;
      dispatch: React.Dispatch<PaginationAction>;
    }
  | undefined
>(undefined);

const paginationReducer = (
  state: PaginationState,
  action: PaginationAction
): PaginationState => {
  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        [action.payload.id]: {
          totalPages: 1,
          ...state[action.payload.id],
          id: action.payload.id,
          currentPage: action.payload.page
        }
      };
    case 'SET_TOTAL_PAGES':
      return {
        ...state,
        [action.payload.id]: {
          currentPage: 1,
          ...state[action.payload.id],
          id: action.payload.id,
          totalPages: action.payload.page
        }
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

export const PaginationProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [state, dispatch] = useReducer(paginationReducer, initialState);

  return (
    <PaginationContext.Provider value={{ state, dispatch }}>
      {children}
    </PaginationContext.Provider>
  );
};

export const usePagination = () => {
  const context = useContext(PaginationContext);
  if (!context) {
    throw new Error('usePagination must be used within a PaginationProvider');
  }
  return context;
};
