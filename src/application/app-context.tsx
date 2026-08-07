import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import type { AlertFeed } from '@/application/alerts/live-alert-service';
import { defaultPreferences } from '@/data/mock-repositories';
import type { Alert, UserPreferences } from '@/domain/models';

export interface PreferencesRepositoryPort {
  get(): Promise<UserPreferences | null>;
  save(preferences: UserPreferences): Promise<void>;
}

export interface ChecklistRepositoryPort {
  getCompleted(planId: string): Promise<Set<string>>;
  setCompleted(planId: string, completedIds: Set<string>): Promise<void>;
}

export type AppRuntime = {
  alertService: { getFeed(preferences: UserPreferences): Promise<AlertFeed> };
  preferencesRepository: PreferencesRepositoryPort;
  checklistRepository: ChecklistRepositoryPort;
};

type AppContextValue = {
  feed: AlertFeed;
  preferences: UserPreferences;
  isLoading: boolean;
  isRefreshing: boolean;
  refreshAlerts(): Promise<void>;
  updatePreferences(preferences: UserPreferences): Promise<void>;
  getAlertById(id: string): Alert | null;
  checklistRepository: ChecklistRepositoryPort;
};

const initialFeed: AlertFeed = {
  active: [],
  recent: [],
  source: 'unavailable',
  isOffline: false,
  retrievedAt: null,
};

const AppContext = createContext<AppContextValue | null>(null);

export function DisasterReadyProvider({ children, runtime }: PropsWithChildren<{ runtime: AppRuntime }>) {
  const runtimeRef = useRef(runtime);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const preferencesRef = useRef(preferences);
  const [feed, setFeed] = useState<AlertFeed>(initialFeed);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function initialize() {
      try {
        const saved = (await runtimeRef.current.preferencesRepository.get().catch(() => null)) ?? defaultPreferences;
        if (!mounted) return;
        preferencesRef.current = saved;
        setPreferences(saved);
        const nextFeed = await runtimeRef.current.alertService.getFeed(saved);
        if (mounted) setFeed(nextFeed);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void initialize();
    return () => { mounted = false; };
  }, []);

  const refreshAlerts = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setFeed(await runtimeRef.current.alertService.getFeed(preferencesRef.current));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const updatePreferences = useCallback(async (nextPreferences: UserPreferences) => {
    preferencesRef.current = nextPreferences;
    setPreferences(nextPreferences);
    await runtimeRef.current.preferencesRepository.save(nextPreferences);
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    feed,
    preferences,
    isLoading,
    isRefreshing,
    refreshAlerts,
    updatePreferences,
    getAlertById: (id) => [...feed.active, ...feed.recent].find((alert) => alert.id === id) ?? null,
    checklistRepository: runtime.checklistRepository,
  }), [feed, isLoading, isRefreshing, preferences, refreshAlerts, runtime.checklistRepository, updatePreferences]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useDisasterReady(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useDisasterReady must be used within DisasterReadyProvider');
  return value;
}
