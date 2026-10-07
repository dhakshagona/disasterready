import { createContext, useContext, type PropsWithChildren } from 'react';

import type { UserPreferences } from '@/domain/models';

export type AccessibilityPreferences = Pick<UserPreferences, 'highContrast' | 'reducedMotion' | 'textSize'>;

const defaultAccessibilityPreferences: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  textSize: 'standard',
};

const AccessibilityPreferencesContext = createContext<AccessibilityPreferences>(defaultAccessibilityPreferences);

export function AccessibilityPreferencesProvider({ children, preferences }: PropsWithChildren<{ preferences: AccessibilityPreferences }>) {
  return (
    <AccessibilityPreferencesContext.Provider value={preferences}>
      {children}
    </AccessibilityPreferencesContext.Provider>
  );
}

export function useAccessibilityPreferences() {
  return useContext(AccessibilityPreferencesContext);
}
