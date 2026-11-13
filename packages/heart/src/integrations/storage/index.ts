import 'server-only';

// Object storage interface (R2 in the integrations phase, TL-INT-R2). The
// mock keeps bytes in this process only — enough for tests and local
// demos; uploads are labelled "Demo upload — not stored" in the UI.

export interface ObjectStore {
  slug: string;
  put(key: string, bytes: Uint8Array, contentType: string): Promise<{ key: string; size: number }>;
  get(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null>;
  delete(key: string): Promise<void>;
}

const SAFE_KEY = /^[a-z0-9][a-z0-9/_.-]{0,250}$/;

export function createMemoryStore(maxBytes = 10 * 1024 * 1024): ObjectStore {
  const objects = new Map<string, { bytes: Uint8Array; contentType: string }>();
  return {
    slug: 'mock_storage',
    async put(key, bytes, contentType) {
      if (!SAFE_KEY.test(key) || key.includes('..')) throw new RangeError(`Unsafe object key: ${key}`);
      if (bytes.byteLength > maxBytes) throw new RangeError(`Object larger than ${maxBytes} bytes`);
      objects.set(key, { bytes: bytes.slice(), contentType });
      return { key, size: bytes.byteLength };
    },
    async get(key) {
      return objects.get(key) ?? null;
    },
    async delete(key) {
      objects.delete(key);
    },
  };
}

const globalStore = globalThis as unknown as { __tuwObjectStore?: ObjectStore };
export const getObjectStore = (): ObjectStore => (globalStore.__tuwObjectStore ??= createMemoryStore());
