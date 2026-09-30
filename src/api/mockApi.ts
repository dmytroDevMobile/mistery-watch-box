import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { BOXES, WATCHES, findBox } from '../data/catalog';
import type { BoxDefinition, OwnedWatch } from '../types';

/**
 * Stand-in for a backend. Every call is asynchronous with simulated latency,
 * validates on the "server" side, and returns copies so callers can't mutate
 * server state. The server's balance and collection are persisted to device
 * storage, so they survive app restarts.
 */

export type ApiErrorCode = 'INSUFFICIENT_FUNDS' | 'UNKNOWN_BOX' | 'NETWORK';

export class ApiError extends Error {
  constructor(public readonly code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export type Profile = {
  balance: number;
  collection: OwnedWatch[];
};

export type PurchaseResult = {
  balance: number;
  item: OwnedWatch;
};

export type ApiConfig = {
  latencyMs: [min: number, max: number];
  /** Probability (0–1) that a request fails with a NETWORK error. */
  failureRate: number;
};

const config: ApiConfig = {
  latencyMs: [350, 900],
  failureRate: 0.04,
};

export const configureApi = (next: Partial<ApiConfig>) => {
  Object.assign(config, next);
};

let uidCounter = 0;
const nextUid = () => `w_${Date.now().toString(36)}_${(uidCounter++).toString(36)}`;

const INITIAL_BALANCE = 2000;
const STORAGE_KEY = 'profile.v1';
const storage = createAsyncStorage('mistybox');

let server: Profile = { balance: INITIAL_BALANCE, collection: [] };
let hydration: Promise<void> | undefined;

const isProfile = (value: unknown): value is Profile => {
  const candidate = value as Profile | null;
  return (
    typeof candidate?.balance === 'number' &&
    Array.isArray(candidate.collection) &&
    candidate.collection.every((item) => typeof item?.uid === 'string' && WATCHES[item.watchId] != null)
  );
};

/** Loads the persisted profile once; corrupt or missing data starts fresh. */
const hydrate = () => {
  hydration ??= storage
    .getItem(STORAGE_KEY)
    .then((raw) => {
      const saved: unknown = raw ? JSON.parse(raw) : null;
      if (isProfile(saved)) {
        server = saved;
      }
    })
    .catch((error) => console.warn('Failed to load saved profile', error));
  return hydration;
};

/** Writes first, then commits, so a failed write leaves the server unchanged. */
const commit = async (next: Profile) => {
  await storage.setItem(STORAGE_KEY, JSON.stringify(next));
  server = next;
};

const simulateNetwork = async () => {
  await hydrate();
  const [min, max] = config.latencyMs;
  await new Promise<void>((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
  if (Math.random() < config.failureRate) {
    throw new ApiError('NETWORK', 'Connection lost. Please try again.');
  }
};

const rollWatch = (box: BoxDefinition): string => {
  let roll = Math.random() * 100;
  for (const { watchId, chance } of box.odds) {
    roll -= chance;
    if (roll < 0) {
      return watchId;
    }
  }
  return box.odds[box.odds.length - 1].watchId;
};

export const api = {
  async fetchCatalogue(): Promise<BoxDefinition[]> {
    await simulateNetwork();
    return BOXES.map((box) => ({ ...box, odds: box.odds.map((o) => ({ ...o })) }));
  },

  async fetchProfile(): Promise<Profile> {
    await simulateNetwork();
    return { balance: server.balance, collection: [...server.collection] };
  },

  async purchaseBox(boxId: string): Promise<PurchaseResult> {
    await simulateNetwork();

    const box = findBox(boxId);
    if (!box) {
      throw new ApiError('UNKNOWN_BOX', 'This box is no longer available.');
    }
    if (server.balance < box.price) {
      throw new ApiError('INSUFFICIENT_FUNDS', 'Not enough balance for this box.');
    }

    const watchId = rollWatch(box);
    if (!WATCHES[watchId]) {
      throw new ApiError('UNKNOWN_BOX', 'This box has invalid contents.');
    }

    const item: OwnedWatch = { uid: nextUid(), watchId, boxId, acquiredAt: Date.now() };
    await commit({ balance: server.balance - box.price, collection: [item, ...server.collection] });
    return { balance: server.balance, item };
  },

  async topUp(amount: number): Promise<number> {
    await simulateNetwork();
    await commit({ ...server, balance: server.balance + amount });
    return server.balance;
  },
};
