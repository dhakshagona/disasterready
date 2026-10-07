import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import type { AlertFeed } from '@/application/alerts/live-alert-service';
import type { AnalyticsEventName, AnalyticsService, AnalyticsTrackOptions } from '@/application/analytics/analytics-service';
import type { NotificationPermissionService, NotificationPermissionState } from '@/application/notifications/notification-permission-service';
import type { PlainLanguageResult, PlainLanguageService } from '@/application/plain-language/plain-language-service';
import type { ShelterFeed } from '@/application/safety-resources/safety-resource-service';
import { defaultPreferences } from '@/data/mock-repositories';
import type { Alert, Shelter, UserPreferences } from '@/domain/models';

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
  safetyResourceService: { getFeed(location: UserPreferences['location']): Promise<ShelterFeed> };
  mapRoutingService: { openDestination(destination: { latitude: number; longitude: number; label: string }): Promise<void> };
  notificationPermissionService: Pick<NotificationPermissionService, 'getStatus' | 'request'>;
  analyticsService: Pick<AnalyticsService, 'track'>;
  plainLanguageService: Pick<PlainLanguageService, 'simplify'>;
  preferencesRepository: PreferencesRepositoryPort;
  checklistRepository: ChecklistRepositoryPort;
};

type AppContextValue = {
  feed: AlertFeed;
  preferences: UserPreferences;
  isLoading: boolean;
  isRefreshing: boolean;
  shelterFeed: ShelterFeed | null;
  isShelterLoading: boolean;
  notificationPermissionState: NotificationPermissionState | null;
  isNotificationPermissionLoading: boolean;
  plainLanguageResults: Record<string, PlainLanguageResult>;
  refreshAlerts(): Promise<void>;
  loadSafetyResources(): Promise<void>;
  openShelterMap(shelter: Shelter): Promise<void>;
  requestNotificationPermission(): Promise<void>;
  loadPlainLanguageSummary(alert: Alert): Promise<void>;
  trackEvent<Name extends AnalyticsEventName>(name: Name, options: AnalyticsTrackOptions<Name>): Promise<void>;
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
  const [shelterFeed, setShelterFeed] = useState<ShelterFeed | null>(null);
  const [isShelterLoading, setIsShelterLoading] = useState(false);
  const [notificationPermissionState, setNotificationPermissionState] = useState<NotificationPermissionState | null>(null);
  const [isNotificationPermissionLoading, setIsNotificationPermissionLoading] = useState(true);
  const [plainLanguageResults, setPlainLanguageResults] = useState<Record<string, PlainLanguageResult>>({});
  const plainLanguageResultsRef = useRef<Record<string, PlainLanguageResult>>({});
  const plainLanguageRequestsRef = useRef(new Set<string>());

  useEffect(() => {
    let mounted = true;
    async function initialize() {
      try {
        const saved = (await runtimeRef.current.preferencesRepository.get().catch(() => null)) ?? defaultPreferences;
        if (!mounted) return;
        preferencesRef.current = saved;
        setPreferences(saved);
        const nextFeed = await runtimeRef.current.alertService.getFeed(saved);
        if (mounted) {
          setFeed(nextFeed);
          void runtimeRef.current.analyticsService.track('alerts_fetched', {
            mode: 'real',
            properties: {
              source: nextFeed.source,
              activeCount: nextFeed.active.length,
              recentCount: nextFeed.recent.length,
              hazards: [...new Set([...nextFeed.active, ...nextFeed.recent].map((alert) => alert.hazard))].sort(),
            },
          }).catch(() => undefined);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    async function initializeNotificationPermission() {
      try {
        const status = await runtimeRef.current.notificationPermissionService.getStatus();
        if (mounted) setNotificationPermissionState(status);
      } finally {
        if (mounted) setIsNotificationPermissionLoading(false);
      }
    }
    void initialize();
    void initializeNotificationPermission();
    return () => { mounted = false; };
  }, []);

  const refreshAlerts = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const nextFeed = await runtimeRef.current.alertService.getFeed(preferencesRef.current);
      setFeed(nextFeed);
      void runtimeRef.current.analyticsService.track('alerts_fetched', {
        mode: 'real',
        properties: {
          source: nextFeed.source,
          activeCount: nextFeed.active.length,
          recentCount: nextFeed.recent.length,
          hazards: [...new Set([...nextFeed.active, ...nextFeed.recent].map((alert) => alert.hazard))].sort(),
        },
      }).catch(() => undefined);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const updatePreferences = useCallback(async (nextPreferences: UserPreferences) => {
    if (preferencesRef.current.location.id !== nextPreferences.location.id) setShelterFeed(null);
    preferencesRef.current = nextPreferences;
    setPreferences(nextPreferences);
    await runtimeRef.current.preferencesRepository.save(nextPreferences);
  }, []);

  const loadSafetyResources = useCallback(async () => {
    setIsShelterLoading(true);
    try {
      const nextFeed = await runtimeRef.current.safetyResourceService.getFeed(preferencesRef.current.location);
      setShelterFeed(nextFeed);
      void runtimeRef.current.analyticsService.track('shelter_lookup', {
        mode: 'real',
        properties: { source: nextFeed.source, count: nextFeed.shelters.length, stale: nextFeed.isStale },
      }).catch(() => undefined);
    } finally {
      setIsShelterLoading(false);
    }
  }, []);

  const openShelterMap = useCallback(async (shelter: Shelter) => {
    await runtimeRef.current.mapRoutingService.openDestination({
      latitude: shelter.latitude,
      longitude: shelter.longitude,
      label: shelter.name,
    });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    setIsNotificationPermissionLoading(true);
    try {
      const status = await runtimeRef.current.notificationPermissionService.request();
      setNotificationPermissionState(status);
      const enabled = status === 'granted' || status === 'provisional' || status === 'ephemeral';
      if (preferencesRef.current.notificationsEnabled !== enabled) {
        await updatePreferences({ ...preferencesRef.current, notificationsEnabled: enabled });
      }
    } finally {
      setIsNotificationPermissionLoading(false);
    }
  }, [updatePreferences]);

  const trackEvent = useCallback(async <Name extends AnalyticsEventName,>(name: Name, options: AnalyticsTrackOptions<Name>) => {
    await runtimeRef.current.analyticsService.track(name, options).catch(() => undefined);
  }, []);

  const loadPlainLanguageSummary = useCallback(async (alert: Alert) => {
    if (plainLanguageResultsRef.current[alert.id] || plainLanguageRequestsRef.current.has(alert.id)) return;
    plainLanguageRequestsRef.current.add(alert.id);
    const mode = alert.isDemo ? 'demo' : 'real';
    await trackEvent('ai_simplification_requested', { mode, properties: { hazard: alert.hazard } });
    try {
      const result = await runtimeRef.current.plainLanguageService.simplify(alert);
      plainLanguageResultsRef.current = { ...plainLanguageResultsRef.current, [alert.id]: result };
      setPlainLanguageResults(plainLanguageResultsRef.current);
      await trackEvent(result.source === 'ai' ? 'ai_simplification_used' : 'ai_simplification_fallback', {
        mode,
        properties: { hazard: alert.hazard, ...(result.source === 'deterministic' ? { reason: result.reason } : {}) },
      });
    } finally {
      plainLanguageRequestsRef.current.delete(alert.id);
    }
  }, [trackEvent]);

  const value = useMemo<AppContextValue>(() => ({
    feed,
    preferences,
    isLoading,
    isRefreshing,
    shelterFeed,
    isShelterLoading,
    notificationPermissionState,
    isNotificationPermissionLoading,
    plainLanguageResults,
    refreshAlerts,
    loadSafetyResources,
    openShelterMap,
    requestNotificationPermission,
    loadPlainLanguageSummary,
    trackEvent,
    updatePreferences,
    getAlertById: (id) => [...feed.active, ...feed.recent].find((alert) => alert.id === id) ?? null,
    checklistRepository: runtime.checklistRepository,
  }), [feed, isLoading, isNotificationPermissionLoading, isRefreshing, isShelterLoading, loadPlainLanguageSummary, loadSafetyResources, notificationPermissionState, openShelterMap, plainLanguageResults, preferences, refreshAlerts, requestNotificationPermission, runtime.checklistRepository, shelterFeed, trackEvent, updatePreferences]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useDisasterReady(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useDisasterReady must be used within DisasterReadyProvider');
  return value;
}
