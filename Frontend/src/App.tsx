import { useCallback, useEffect } from 'react';
import { useStorageStore } from './store/storageStore';
import { storageReader } from './services/storageReader';
import { riskAnalyzer } from './services/riskAnalyzer';
import Dashboard from './components/Dashboard';

function App() {
  const setEntries = useStorageStore((state) => state.setEntries);
  const setAlerts = useStorageStore((state) => state.setAlerts);
  const setError = useStorageStore((state) => state.setError);

  const loadStorageData = useCallback(() => {
    try {
      const entries = storageReader.readAll();
      const alerts = riskAnalyzer.analyze(entries);

      setEntries(entries);
      setAlerts(alerts);
      setError(null);
    } catch (error) {
      setError('Failed to load storage data');
      console.error('Error loading storage:', error);
    }
  }, [setAlerts, setEntries, setError]);

  useEffect(() => {
    loadStorageData();

    const handleFocus = () => loadStorageData();
    const handleStorage = () => loadStorageData();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadStorageData();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);

    // Keep vulnerability status dynamic even when storage events do not fire.
    const intervalId = window.setInterval(() => {
      loadStorageData();
    }, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [loadStorageData]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Dashboard onRefresh={loadStorageData} />
    </div>
  );
}

export default App;
