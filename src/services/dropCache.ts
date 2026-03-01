import { Drop } from '@/types';

const DB_NAME = 'PlooppCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'nearby_drops_cache';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // We'll store lists of drops with geohash7 as the key
        db.createObjectStore(STORE_NAME, { keyPath: 'geohash' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getCachedDrops(geohash: string): Promise<Drop[] | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return null;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(geohash);

      request.onsuccess = () => {
        if (request.result) {
          // Check expiration? If cache is older than 5 minutes we can invalidate.
          // Let's implement a simple TTL (time-to-live)
          const now = Date.now();
          if (now - request.result.timestamp > 5 * 60 * 1000) { // 5 minutes TTL
            resolve(null);
          } else {
            resolve(request.result.drops);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB Error:', error);
    return null;
  }
}

export async function cacheDrops(geohash: string, drops: Drop[]): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record = {
        geohash,
        drops,
        timestamp: Date.now(),
      };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB Error:', error);
  }
}
