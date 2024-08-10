'use client';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';

interface PaginationState {
  currentPage: number;
  totalPages: number;
}

type PaginationAction =
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_TOTAL_PAGES'; payload: number };

const initialState: PaginationState = {
  currentPage: 1,
  totalPages: 1
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
      return { ...state, currentPage: action.payload };
    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.payload };
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
