import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { colors, layout } from '@/constants/tokens';

const tabIcons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  alerts: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', paddingBottom: Platform.OS === 'android' ? 8 : 0 },
        tabBarStyle: {
          height: Platform.select({ ios: 84, android: 72, web: 70 }),
          width: '100%',
          maxWidth: layout.maxContentWidth,
          alignSelf: 'center',
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color }) => (
          <Icon name={tabIcons[route.name as keyof typeof tabIcons]} color={color} size={22} />
        ),
      })}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
