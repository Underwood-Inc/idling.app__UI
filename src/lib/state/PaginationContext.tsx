'use client';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';

type TPaginationContext = PaginationPageActionPayload &
  PaginationTotalPagesActionPayload &
  PaginationPageSizeActionPayload;

type PaginationState = {
  [x: string]: TPaginationContext | undefined;
};

export enum PageSize {
  TEN = 10,
  TWENTY = 20,
  THIRTY = 30,
  FORTY = 40,
  FIFTY = 50
}

type PaginationPageActionPayload = {
  id: string;
  currentPage?: number;
};
type PaginationTotalPagesActionPayload = {
  id: string;
  totalPages?: number;
};
type PaginationPageSizeActionPayload = {
  id: string;
  pageSize?: PageSize;
};

type PaginationAction =
  | { type: 'RESET_STATE' }
  | { type: 'SET_CURRENT_PAGE'; payload: PaginationPageActionPayload }
  | { type: 'SET_TOTAL_PAGES'; payload: PaginationTotalPagesActionPayload }
  | { type: 'SET_PAGE_SIZE'; payload: PaginationPageSizeActionPayload };

const initialState: PaginationState = {
  default: {
    id: 'default',
    currentPage: 1,
    totalPages: 1,
    pageSize: PageSize.TEN
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
  // custom getters to ensure requested page and totalPages are never less than 1
  const getCurrentPage = (currentPage?: number) =>
    Math.max(currentPage ?? 1, 1);
  const getTotalPages = (totalPages?: number) => Math.max(totalPages ?? 1, 1);

  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          id: action.payload.id,
          currentPage: getCurrentPage(action.payload.currentPage)
        }
      };
    case 'SET_TOTAL_PAGES':
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          id: action.payload.id,
          totalPages: getTotalPages(action.payload.totalPages)
        }
      };
    case 'SET_PAGE_SIZE':
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          id: action.payload.id,
          pageSize:
            action.payload.pageSize ||
            state[action.payload.id]?.pageSize ||
            PageSize.TEN
        }
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

export const PaginationProvider: React.FC<{
  children: ReactNode;
  value?: PaginationState;
}> = ({ children, value = initialState }) => {
  const [state, dispatch] = useReducer(paginationReducer, value);

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
