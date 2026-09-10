import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { theme } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface CooperativeBadgeProps {
  societyName?: string;
  membershipId?: string;
  size?: 'small' | 'medium';
}

export const CooperativeBadge: React.FC<CooperativeBadgeProps> = ({
  societyName = 'Maharashtra Shramik Labour Cooperative Federation',
  membershipId,
  size = 'medium',
}) => {
  const { t } = useLanguage();

  if (size === 'small') {
    return (
      <View style={styles.smallContainer}>
        <ShieldCheck size={14} color={theme.colors.primary} />
        <Text style={styles.smallText}>{t('verifiedBadge')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <ShieldCheck size={20} color={theme.colors.white} />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.row}>
          <Text style={styles.title}>{t('verifiedBadge')}</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Govt. Registered</Text>
          </View>
        </View>
        <Text style={styles.societyName} numberOfLines={1}>
          {societyName}
        </Text>
        {membershipId && (
          <Text style={styles.memberId}>
            Reg No: <Text style={styles.idBold}>{membershipId}</Text>
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF7EE',
    borderColor: '#C6E7C9',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  smallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF7EE',
    borderColor: '#C6E7C9',
    borderWidth: 1,
    borderRadius: theme.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    alignSelf: 'flex-start',
  },
  smallText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pill: {
    backgroundColor: '#C6E7C9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  societyName: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  memberId: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  idBold: {
    fontWeight: '700',
    color: theme.colors.text,
  },
});
