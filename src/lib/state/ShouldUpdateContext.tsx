'use client';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';

type ShouldUpdateState = boolean;

type ShouldUpdateActionPayload = boolean;

type ShouldUpdateAction = {
  type: 'SET_SHOULD_UPDATE';
  payload: ShouldUpdateActionPayload;
};

const initialState: ShouldUpdateState = false;

const ShouldUpdateContext = createContext<
  | {
      state: ShouldUpdateState;
      dispatch: React.Dispatch<ShouldUpdateAction>;
    }
  | undefined
>(undefined);

const paginationReducer = (
  state: ShouldUpdateState,
  action: ShouldUpdateAction
): ShouldUpdateState => {
  switch (action.type) {
    case 'SET_SHOULD_UPDATE':
      return action.payload;
    default:
      return state;
  }
};

export const ShouldUpdateProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [state, dispatch] = useReducer(paginationReducer, initialState);

  return (
    <ShouldUpdateContext.Provider value={{ state, dispatch }}>
      {children}
    </ShouldUpdateContext.Provider>
  );
};

export const useShouldUpdate = () => {
  const context = useContext(ShouldUpdateContext);
  if (!context) {
    throw new Error(
      'useShouldUpdate must be used within a ShouldUpdateProvider'
    );
  }
  return context;
};
