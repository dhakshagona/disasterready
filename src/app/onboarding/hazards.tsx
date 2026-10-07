import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { useDisasterReady } from '@/application/app-context';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/buttons';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { colors, radii, spacing } from '@/constants/tokens';
import { hazardLabels } from '@/data/mock-repositories';
import type { HazardType } from '@/domain/models';
import { useState } from 'react';

const hazards = (Object.entries(hazardLabels) as [HazardType, string][]).filter(([hazard]) => hazard !== 'other');

export default function HazardSelectionScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { preferences, updatePreferences } = useDisasterReady();
  const [selected, setSelected] = useState<HazardType[]>(preferences.hazards);

  function toggleHazard(hazard: HazardType) {
    setSelected((current) =>
      current.includes(hazard) ? current.filter((item) => item !== hazard) : [...current, hazard],
    );
  }

  async function saveHazards() {
    await updatePreferences({ ...preferences, hazards: selected });
    if (returnTo === 'settings') {
      router.replace('/(tabs)/settings' as Href);
      return;
    }
    router.push('/onboarding/permissions' as Href);
  }

  return (
    <Screen
      footer={<PrimaryButton accessibilityLabel={returnTo === 'settings' ? 'Save selected hazards' : 'Continue to location and permissions'} disabled={selected.length === 0} onPress={() => void saveHazards()}>{returnTo === 'settings' ? 'Save hazards' : 'Continue'}</PrimaryButton>}>
      <AppHeader title="Choose hazards" subtitle={returnTo === 'settings' ? 'Alert preferences' : 'Step 1 of 3'} back />
      <View style={styles.progressTrack}><View style={[styles.progressFill, styles.oneThird]} /></View>
      <View style={styles.copy}>
        <AppText variant="heading">What should we help you prepare for?</AppText>
        <AppText color={colors.inkMuted}>Choose one or more hazards. You can update this list from Settings.</AppText>
      </View>
      <View style={styles.grid}>
        {hazards.map(([hazard, label]) => {
          const active = selected.includes(hazard);
          return (
            <Pressable
              key={hazard}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={label}
              onPress={() => toggleHazard(hazard)}
              style={({ pressed }) => [styles.hazard, active && styles.hazardActive, pressed && styles.pressed]}>
              <View style={[styles.hazardIcon, active && styles.hazardIconActive]}>
                <Icon
                  name={{ ios: 'shield.fill', android: 'shield', web: 'shield' }}
                  color={active ? colors.primary : colors.inkMuted}
                  size={22}
                />
              </View>
              <AppText variant="bodyStrong" style={styles.label}>{label}</AppText>
              <Switch
                accessible={false}
                style={styles.switchNoPointer}
                value={active}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  oneThird: { width: '33%' },
  copy: { gap: spacing.sm },
  grid: { gap: spacing.sm },
  hazard: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  hazardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  hazardIcon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  hazardIconActive: { backgroundColor: colors.surface },
  label: { flex: 1 },
  switchNoPointer: { pointerEvents: 'none' },
  pressed: { opacity: 0.68 },
});
