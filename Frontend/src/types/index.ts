// Storage Types
export interface StorageEntry {
  id: string;
  type: 'cookie' | 'localStorage' | 'sessionStorage';
  key: string;
  value: string;
  metadata?: {
    domain?: string;
    path?: string;
    expires?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: string;
    size?: number;
  };
  timestamp: number;
}

// Risk Analysis Types
export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskAlert {
  id: string;
  entry: StorageEntry;
  riskLevel: RiskLevel;
  reasons: string[];
  recommendation: string;
  detectedPatterns: string[];
}

// Report Types
export interface SecurityReport {
  timestamp: string;
  summary: {
    totalItems: number;
    riskLevels: {
      low: number;
      medium: number;
      high: number;
    };
    storageBreakdown: {
      cookies: number;
      localStorage: number;
      sessionStorage: number;
    };
  };
  findings: RiskAlert[];
  recommendations: string[];
}

// Filter Types
export interface FilterOptions {
  searchQuery: string;
  storageType: 'all' | 'cookie' | 'localStorage' | 'sessionStorage';
  riskLevel: 'all' | 'low' | 'medium' | 'high';
  showSensitiveOnly: boolean;
}

// Store Types
export interface StorageStore {
  entries: StorageEntry[];
  alerts: RiskAlert[];
  report: SecurityReport | null;
  isLoading: boolean;
  error: string | null;
  filters: FilterOptions;

  // Actions
  setEntries: (entries: StorageEntry[]) => void;
  setAlerts: (alerts: RiskAlert[]) => void;
  setReport: (report: SecurityReport | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  reset: () => void;
}
