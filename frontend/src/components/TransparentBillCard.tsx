import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HeartHandshake, Shield, Sparkles, AlertCircle } from 'lucide-react-native';
import { theme } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface TransparentBillCardProps {
  totalAmount: number;
}

export const TransparentBillCard: React.FC<TransparentBillCardProps> = ({ totalAmount }) => {
  const { t } = useLanguage();

  const workerShare = Math.round(totalAmount * 0.88);
  const welfareShare = Math.round(totalAmount * 0.07);
  const platformShare = totalAmount - workerShare - welfareShare;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <HeartHandshake size={20} color={theme.colors.primary} />
        <Text style={styles.headerTitle}>{t('transparentBill')}</Text>
      </View>

      <View style={styles.meterContainer}>
        <View style={[styles.meterSegment, { flex: 88, backgroundColor: theme.colors.primary }]} />
        <View style={[styles.meterSegment, { flex: 7, backgroundColor: theme.colors.welfare }]} />
        <View style={[styles.meterSegment, { flex: 5, backgroundColor: theme.colors.secondary }]} />
      </View>

      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.labelText}>{t('workerEarningsShare')}</Text>
        </View>
        <Text style={styles.valueText}>₹{workerShare}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <View style={[styles.dot, { backgroundColor: theme.colors.welfare }]} />
          <Text style={styles.labelText}>{t('cooperativeWelfare')}</Text>
        </View>
        <Text style={styles.valueText}>₹{welfareShare}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <View style={[styles.dot, { backgroundColor: theme.colors.secondary }]} />
          <Text style={styles.labelText}>{t('platformMaintenance')}</Text>
        </View>
        <Text style={styles.valueText}>₹{platformShare}</Text>
      </View>

      <View style={styles.divider} />

      <View style={[styles.row, { marginTop: 4 }]}>
        <Text style={styles.totalLabel}>Total Fair Price</Text>
        <Text style={styles.totalValue}>₹{totalAmount}</Text>
      </View>

      <View style={styles.infoBanner}>
        <Sparkles size={16} color="#065F46" />
        <Text style={styles.infoText}>{t('commercialComparison')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
    marginVertical: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  meterContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    gap: 2,
  },
  meterSegment: {
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  labelText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    gap: 8,
    marginTop: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
});
