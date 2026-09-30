import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';
import { ApiError, api, type PurchaseResult } from '../api/mockApi';
import type { BoxDefinition, OwnedWatch } from '../types';

type LoadState = 'loading' | 'ready' | 'error';

type State = {
  status: LoadState;
  error?: string;
  boxes: BoxDefinition[];
  balance: number;
  collection: OwnedWatch[];
};

type Action =
  | { type: 'load/start' }
  | { type: 'load/success'; boxes: BoxDefinition[]; balance: number; collection: OwnedWatch[] }
  | { type: 'load/failure'; error: string }
  | { type: 'purchase/success'; result: PurchaseResult }
  | { type: 'balance/set'; balance: number };

const initialState: State = { status: 'loading', boxes: [], balance: 0, collection: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load/start':
      return { ...state, status: 'loading', error: undefined };
    case 'load/success':
      return {
        status: 'ready',
        boxes: action.boxes,
        balance: action.balance,
        collection: action.collection,
      };
    case 'load/failure':
      return { ...state, status: 'error', error: action.error };
    case 'purchase/success':
      return {
        ...state,
        balance: action.result.balance,
        collection: [action.result.item, ...state.collection],
      };
    case 'balance/set':
      return { ...state, balance: action.balance };
  }
}

type Store = State & {
  reload: () => void;
  purchase: (boxId: string) => Promise<PurchaseResult>;
  topUp: (amount: number) => Promise<void>;
};

const StoreContext = createContext<Store | undefined>(undefined);

export const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';

export function StoreProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const reload = useCallback(async () => {
    dispatch({ type: 'load/start' });
    try {
      const [boxes, profile] = await Promise.all([api.fetchCatalogue(), api.fetchProfile()]);
      dispatch({ type: 'load/success', boxes, ...profile });
    } catch (error) {
      dispatch({ type: 'load/failure', error: errorMessage(error) });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const purchase = useCallback(async (boxId: string) => {
    const result = await api.purchaseBox(boxId);
    dispatch({ type: 'purchase/success', result });
    return result;
  }, []);

  const topUp = useCallback(async (amount: number) => {
    const balance = await api.topUp(amount);
    dispatch({ type: 'balance/set', balance });
  }, []);

  const value = useMemo<Store>(
    () => ({ ...state, reload, purchase, topUp }),
    [state, reload, purchase, topUp],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return store;
}
