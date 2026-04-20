import { StorageEntry } from '../types';

export class StorageReader {
  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Read all cookies from document.cookie
   */
  readCookies(): StorageEntry[] {
    const cookies: StorageEntry[] = [];

    if (!document.cookie) return cookies;

    document.cookie.split(';').forEach((cookieString) => {
      const [name, ...rest] = cookieString.trim().split('=');
      const value = rest.join('=');

      if (name) {
        cookies.push({
          id: this.generateId(),
          type: 'cookie',
          key: name,
          value: value || '',
          metadata: {
            path: '/',
            domain: window.location.hostname,
          },
          timestamp: Date.now(),
        });
      }
    });

    return cookies;
  }

  /**
   * Read all entries from localStorage
   */
  readLocalStorage(): StorageEntry[] {
    const entries: StorageEntry[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          entries.push({
            id: this.generateId(),
            type: 'localStorage',
            key,
            value,
            metadata: {
              size: (key.length + value.length) * 2, // Rough estimate in bytes
            },
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.warn('Error reading localStorage:', error);
    }

    return entries;
  }

  /**
   * Read all entries from sessionStorage
   */
  readSessionStorage(): StorageEntry[] {
    const entries: StorageEntry[] = [];

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key) || '';
          entries.push({
            id: this.generateId(),
            type: 'sessionStorage',
            key,
            value,
            metadata: {
              size: (key.length + value.length) * 2, // Rough estimate in bytes
            },
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.warn('Error reading sessionStorage:', error);
    }

    return entries;
  }

  /**
   * Read all storage data
   */
  readAll(): StorageEntry[] {
    const allEntries = [
      ...this.readCookies(),
      ...this.readLocalStorage(),
      ...this.readSessionStorage(),
    ];

    return allEntries;
  }

  /**
   * Delete an entry from storage
   */
  deleteEntry(entry: StorageEntry): boolean {
    try {
      if (entry.type === 'localStorage') {
        localStorage.removeItem(entry.key);
        return true;
      } else if (entry.type === 'sessionStorage') {
        sessionStorage.removeItem(entry.key);
        return true;
      }
      // Cookies cannot be deleted via JavaScript in a secure way
      return false;
    } catch (error) {
      console.error('Error deleting entry:', error);
      return false;
    }
  }

  /**
   * Clear all entries of a specific type
   */
  clearByType(type: StorageEntry['type']): boolean {
    try {
      if (type === 'localStorage') {
        localStorage.clear();
        return true;
      } else if (type === 'sessionStorage') {
        sessionStorage.clear();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
}

export const storageReader = new StorageReader();
