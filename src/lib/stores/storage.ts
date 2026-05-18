import { createJSONStorage, type StateStorage } from "zustand/middleware";

const MAX_MEMORY_ENTRIES = 50;

const memory = new Map<string, string>();

const memoryStorage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => {
    if (!memory.has(name) && memory.size >= MAX_MEMORY_ENTRIES) {
      const oldest = memory.keys().next().value;
      if (oldest !== undefined) memory.delete(oldest);
    }
    memory.set(name, value);
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

