import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { useDisasterReady } from '@/application/app-context';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { colors, radii, spacing } from '@/constants/tokens';

export default function AccessibilityScreen() {
  const { preferences, updatePreferences } = useDisasterReady();
  const [draft, setDraft] = useState<Partial<Pick<typeof preferences, 'plainLanguage' | 'highContrast' | 'reducedMotion'>>>({});
  const plainLanguage = draft.plainLanguage ?? preferences.plainLanguage;
  const highContrast = draft.highContrast ?? preferences.highContrast;
  const reducedMotion = draft.reducedMotion ?? preferences.reducedMotion;

  const finishSetup = async () => {
    await updatePreferences({ ...preferences, plainLanguage, highContrast, reducedMotion });
    router.replace('/(tabs)/home' as Href);
  };

  return (
    <Screen footer={<PrimaryButton accessibilityLabel="Finish setup and open home" onPress={() => void finishSetup()}>Finish setup</PrimaryButton>}>
      <AppHeader title="Make it work for you" subtitle="Step 3 of 3" back />
      <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
      <View style={styles.copy}>
        <AppText variant="heading">Language & accessibility</AppText>
        <AppText color={colors.inkMuted}>Choose a comfortable starting point. You can change these later.</AppText>
      </View>
      <Card>
        <AppText variant="eyebrow" color={colors.inkMuted}>Language</AppText>
        <View style={styles.languageRow}>
          <View style={[styles.languageOption, styles.languageActive]}><AppText variant="caption" color={colors.primary}>English</AppText></View>
          <View style={styles.languageOption}><AppText variant="caption" color={colors.inkMuted}>Español</AppText></View>
        </View>
      </Card>
      <Card style={styles.settingsCard}>
        <SettingRow label="Plain language" detail="Prefer shorter, more direct wording" value={plainLanguage} onValueChange={(value) => setDraft((current) => ({ ...current, plainLanguage: value }))} />
        <SettingRow label="High contrast" detail="Increase separation between text and controls" value={highContrast} onValueChange={(value) => setDraft((current) => ({ ...current, highContrast: value }))} />
        <SettingRow label="Reduce motion" detail="Minimize non-essential movement" value={reducedMotion} onValueChange={(value) => setDraft((current) => ({ ...current, reducedMotion: value }))} />
      </Card>
      <Card tone="safe">
        <AppText variant="bodyStrong" color={colors.safeStrong}>Readable by default</AppText>
        <AppText variant="caption" color={colors.safeStrong}>Large touch targets, screen-reader labels, and text scaling are built in.</AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { width: '100%', height: '100%', backgroundColor: colors.primary },
  copy: { gap: spacing.sm },
  languageRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  languageOption: { flex: 1, minHeight: 44, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  languageActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  settingsCard: { paddingTop: 0, paddingBottom: 0 },
});
