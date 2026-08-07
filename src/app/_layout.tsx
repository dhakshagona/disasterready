import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { DisasterReadyProvider } from '@/application/app-context';
import { defaultRuntime } from '@/application/default-runtime';
import { colors } from '@/constants/tokens';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      void SystemUI.setBackgroundColorAsync(colors.canvas);
    }
  }, []);

  return (
    <DisasterReadyProvider runtime={defaultRuntime}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} />
    </DisasterReadyProvider>
  );
}
