import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/buttons';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { colors, radii, spacing } from '@/constants/tokens';
import { hazardLabels } from '@/data/mock-repositories';
import type { HazardType } from '@/domain/models';
import { useState } from 'react';

const hazards = Object.entries(hazardLabels) as [HazardType, string][];

export default function HazardSelectionScreen() {
  const [selected, setSelected] = useState<HazardType[]>(['flood', 'tornado', 'hurricane']);

  function toggleHazard(hazard: HazardType) {
    setSelected((current) =>
      current.includes(hazard) ? current.filter((item) => item !== hazard) : [...current, hazard],
    );
  }

  return (
    <Screen
      footer={<PrimaryButton accessibilityLabel="Continue to location and permissions" onPress={() => router.push('/onboarding/permissions' as Href)}>Continue</PrimaryButton>}>
      <AppHeader title="Choose hazards" subtitle="Step 1 of 3" back />
      <View style={styles.progressTrack}><View style={[styles.progressFill, styles.oneThird]} /></View>
      <View style={styles.copy}>
        <AppText variant="heading">What should we help you prepare for?</AppText>
        <AppText color={colors.inkMuted}>Choose any that matter to you. You can change this later.</AppText>
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
              <View style={[styles.check, active && styles.checkActive]}>
                {active ? <Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} color={colors.surface} size={14} /> : null}
              </View>
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
  grid: { gap: spacing.md },
  hazard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  hazardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  hazardIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  hazardIconActive: { backgroundColor: colors.surface },
  label: { flex: 1 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.68 },
});
