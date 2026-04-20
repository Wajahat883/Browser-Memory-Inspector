import { create } from 'zustand';
import { StorageStore, StorageEntry, RiskAlert, SecurityReport, FilterOptions } from '../types';

const initialFilters: FilterOptions = {
  searchQuery: '',
  storageType: 'all',
  riskLevel: 'all',
  showSensitiveOnly: false,
};

export const useStorageStore = create<StorageStore>((set) => ({
  entries: [],
  alerts: [],
  report: null,
  isLoading: false,
  error: null,
  filters: initialFilters,

  setEntries: (entries: StorageEntry[]) =>
    set({ entries }),

  setAlerts: (alerts: RiskAlert[]) =>
    set({ alerts }),

  setReport: (report: SecurityReport | null) =>
    set({ report }),

  setLoading: (isLoading: boolean) =>
    set({ isLoading }),

  setError: (error: string | null) =>
    set({ error }),

  setFilters: (newFilters: Partial<FilterOptions>) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...newFilters,
      },
    })),

  reset: () =>
    set({
      entries: [],
      alerts: [],
      report: null,
      isLoading: false,
      error: null,
      filters: initialFilters,
    }),
}));

/**
 * Hook to get filtered entries based on current filters
 */
export function useFilteredEntries() {
  const entries = useStorageStore((state) => state.entries);
  const alerts = useStorageStore((state) => state.alerts);
  const filters = useStorageStore((state) => state.filters);

  return entries.filter((entry) => {
    // Filter by storage type
    if (
      filters.storageType !== 'all' &&
      entry.type !== filters.storageType
    ) {
      return false;
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesKey = entry.key.toLowerCase().includes(query);
      const matchesValue = entry.value.toLowerCase().includes(query);
      if (!matchesKey && !matchesValue) {
        return false;
      }
    }

    // Filter by risk level
    if (filters.riskLevel !== 'all') {
      const alert = alerts.find((a) => a.entry.id === entry.id);
      if (!alert || alert.riskLevel !== filters.riskLevel) {
        return false;
      }
    }

    // Filter by sensitive only
    if (filters.showSensitiveOnly) {
      const alert = alerts.find((a) => a.entry.id === entry.id);
      if (!alert || alert.riskLevel === 'low') {
        return false;
      }
    }

    return true;
  });
}

/**
 * Hook to get alert for a specific entry
 */
export function useAlertForEntry(entryId: string) {
  const alerts = useStorageStore((state) => state.alerts);
  return alerts.find((alert) => alert.entry.id === entryId);
}
