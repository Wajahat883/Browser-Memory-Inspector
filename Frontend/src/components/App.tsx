import { useEffect } from 'react';
import { useStorageStore } from '../store/storageStore';
import { storageReader } from '../services/storageReader';
import { riskAnalyzer } from '../services/riskAnalyzer';
import Dashboard from './Dashboard';

function App() {
  const setEntries = useStorageStore((state) => state.setEntries);
  const setAlerts = useStorageStore((state) => state.setAlerts);
  const setError = useStorageStore((state) => state.setError);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = () => {
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
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Dashboard onRefresh={loadStorageData} />
    </div>
  );
}

export default App;
