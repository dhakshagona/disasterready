import { Tabs } from 'expo-router';
import { use, type PropsWithChildren } from 'react';
import { Platform, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { colors, layout } from '@/constants/tokens';

const tabIcons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  alerts: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
} as const;

export default function TabsLayout() {
  const insets = use(SafeAreaInsetsContext) ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const tabBarBottom = Platform.select({
    ios: Math.max(insets.bottom - 8, 18),
    android: Math.max(insets.bottom, 12),
    web: 20,
  });

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', paddingBottom: Platform.OS === 'android' ? 8 : 0 },
        tabBarStyle: {
          position: 'absolute',
          bottom: tabBarBottom,
          left: '50%',
          transform: [{ translateX: -124 }],
          height: 62,
          width: 248,
          maxWidth: layout.maxContentWidth - 32,
          alignSelf: 'center',
          paddingTop: 4,
          paddingBottom: 4,
          paddingHorizontal: 4,
          backgroundColor: colors.surface,
          borderTopColor: 'transparent',
          borderRadius: 32,
          borderWidth: 1,
          borderColor: colors.border,
          ...(Platform.OS === 'web' ? { boxShadow: '0 8px 24px rgba(38, 58, 88, 0.16)' } : {
            shadowColor: '#263A58',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.16,
            shadowRadius: 18,
            elevation: 8,
          }),
        },
        tabBarItemStyle: { borderRadius: 26, overflow: 'hidden' },
        tabBarButton: ({ children, accessibilityState, onPress }) => (
          <TabButton selected={Boolean(accessibilityState?.selected)} onPress={onPress}>{children}</TabButton>
        ),
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

function TabButton({ children, onPress, selected }: PropsWithChildren<{ onPress?: PressableProps['onPress']; selected: boolean }>) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.tabButton, selected && styles.tabSelected, pressed && styles.tabPressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 26 },
  tabSelected: { backgroundColor: colors.primarySoft },
  tabPressed: { opacity: 0.68 },
});
