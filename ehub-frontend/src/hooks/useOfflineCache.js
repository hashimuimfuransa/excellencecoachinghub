import { useState, useEffect } from 'react';

export const useOfflineCache = (key) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from IndexedDB or localStorage
    const loadData = async () => {
      try {
        if ('indexedDB' in window) {
          const db = await openDB();
          const transaction = db.transaction(['cache'], 'readonly');
          const store = transaction.objectStore('cache');
          const result = await store.get(key);
          if (result) {
            setData(result.data);
          }
        } else {
          // Fallback to localStorage
          const cached = localStorage.getItem(`ecoach_cache_${key}`);
          if (cached) {
            setData(JSON.parse(cached));
          }
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key]);

  const saveData = async (newData) => {
    try {
      if ('indexedDB' in window) {
        const db = await openDB();
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await store.put({ key, data: newData, timestamp: Date.now() });
      } else {
        localStorage.setItem(`ecoach_cache_${key}`, JSON.stringify(newData));
      }
      setData(newData);
    } catch (error) {
      console.error('Error saving cached data:', error);
    }
  };

  const clearData = async () => {
    try {
      if ('indexedDB' in window) {
        const db = await openDB();
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await store.delete(key);
      } else {
        localStorage.removeItem(`ecoach_cache_${key}`);
      }
      setData(null);
    } catch (error) {
      console.error('Error clearing cached data:', error);
    }
  };

  return { data, loading, saveData, clearData };
};

// IndexedDB helper
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ecoachCache', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('cache')) {
        const store = db.createObjectStore('cache', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};