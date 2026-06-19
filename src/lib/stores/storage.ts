import { createJSONStorage, type StateStorage } from "zustand/middleware";

const MAX_MEMORY_ENTRIES = 50;

// LRU (least-recently-used) tracking via Map insertion order. Maps preserve
// insertion order; `get` and `set` re-insert the key to move it to the most
// recent position, so the oldest entry is always at the head of the iteration.
const memory = new Map<string, string>();

function touch(name: string, value?: string) {
  if (memory.has(name)) memory.delete(name);
  else if (memory.size >= MAX_MEMORY_ENTRIES) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  if (value !== undefined) memory.set(name, value);
}

const memoryStorage: StateStorage = {
  getItem: (name) => {
    const value = memory.get(name);
    if (value !== undefined) {
      // Promote to most-recently-used.
      memory.delete(name);
      memory.set(name, value);
    }
    return value ?? null;
  },
  setItem: (name, value) => {
    touch(name, value);
  },
  removeItem: (name) => {
    memory.delete(name);
  }
};

function getStorage(): StateStorage {
  if (typeof window === "undefined" || !window.localStorage) {
    return memoryStorage;
  }

  return window.localStorage;
}

export function createSafeJsonStorage() {
  return createJSONStorage(getStorage);
}

