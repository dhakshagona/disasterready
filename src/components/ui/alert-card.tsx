import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/ui/status-badge';
import { colors, radii, spacing } from '@/constants/tokens';
import type { Alert } from '@/domain/models';

type AlertCardProps = {
  alert: Alert;
  onPress?: () => void;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function AlertCard({ alert, onPress }: AlertCardProps) {
  return (
    <Pressable
      accessibilityHint={onPress ? 'Opens alert details' : undefined}
      accessibilityLabel={`${alert.isDemo ? 'Demo alert. ' : ''}${alert.headline}. ${alert.summary}`}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
      testID={`alert-card-${alert.id}`}>
      <Card style={styles.card}>
        <View style={[styles.iconBox, alert.status === 'active' ? styles.iconDanger : styles.iconMuted]}>
          <Icon
            name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
            color={alert.status === 'active' ? colors.danger : colors.inkMuted}
            size={24}
          />
        </View>
        <View style={styles.content}>
          <View style={styles.badges}>
            <StatusBadge label={alert.status === 'active' ? alert.severity : 'Expired'} tone={alert.status === 'active' ? 'danger' : 'info'} />
            {alert.isDemo ? <StatusBadge label="Demo" tone="demo" /> : null}
          </View>
          <AppText variant="heading">{alert.headline}</AppText>
          <AppText variant="caption" color={colors.inkMuted}>{alert.areaDescription}</AppText>
          <AppText variant="caption" color={colors.inkMuted} numberOfLines={2}>{alert.summary}</AppText>
          <AppText variant="caption" color={colors.inkSubtle}>
            {alert.status === 'active' ? 'Expires' : 'Ended'} {formatTime(alert.expiresAt)}
          </AppText>
        </View>
        {onPress ? <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.inkSubtle} /> : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: { width: 42, height: 42, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  iconDanger: { backgroundColor: colors.dangerSoft },
  iconMuted: { backgroundColor: colors.surfaceMuted },
  content: { flex: 1, gap: 5 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
