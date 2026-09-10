import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  ShieldCheck,
  Users,
  Briefcase,
  TrendingUp,
  FileCheck,
  CheckCircle,
  XCircle,
  Sparkles,
  Eye,
  Building,
  Scale,
  DollarSign,
  AlertCircle,
} from 'lucide-react-native';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';

interface PendingWorker {
  id: string;
  name: string;
  phone: string;
  domain: string;
  experienceYears: number;
  society: string;
  documents: {
    name: string;
    status: 'VERIFIED' | 'PENDING';
  }[];
  appliedDate: string;
}

const SAMPLE_PENDING_WORKERS: PendingWorker[] = [
  {
    id: 'pw-1',
    name: 'Gajanan Shinde',
    phone: '+91 97654 32100',
    domain: 'Electrical (Grade A Wireman)',
    experienceYears: 7,
    society: 'Pune District Labour Cooperative Union',
    documents: [
      { name: 'Govt. Wireman License (PWD)', status: 'VERIFIED' },
      { name: 'Aadhaar e-KYC', status: 'VERIFIED' },
      { name: 'Cooperative Society Passbook', status: 'PENDING' },
    ],
    appliedDate: 'Yesterday, 4:15 PM',
  },
  {
    id: 'pw-2',
    name: 'Meena Tai Thorat',
    phone: '+91 98901 23456',
    domain: 'Elder & Patient Care',
    experienceYears: 5,
    society: 'Mahila Shramik Seva Sahakari Sanstha Ltd.',
    documents: [
      { name: 'ANM / Nursing Care Certificate', status: 'VERIFIED' },
      { name: 'Police Verification Clearance', status: 'VERIFIED' },
      { name: 'Aadhaar e-KYC', status: 'VERIFIED' },
    ],
    appliedDate: 'Today, 9:30 AM',
  },
];

export const AdminPortal: React.FC = () => {
  const { t } = useLanguage();
  const [pendingWorkers, setPendingWorkers] = useState<PendingWorker[]>(SAMPLE_PENDING_WORKERS);
  const [selectedWorkerDoc, setSelectedWorkerDoc] = useState<PendingWorker | null>(null);

  const handleApprove = (id: string) => {
    setPendingWorkers((prev) => prev.filter((w) => w.id !== id));
    alert('Worker approved! Official Cooperative Society ID & QR badge issued.');
  };

  const handleReject = (id: string) => {
    setPendingWorkers((prev) => prev.filter((w) => w.id !== id));
    alert('Worker application returned for clarification.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Federation Title Banner */}
      <View style={styles.adminHeaderCard}>
        <View style={styles.adminHeaderIcon}>
          <Building size={26} color={theme.colors.white} />
        </View>
        <View style={styles.adminHeaderText}>
          <Text style={styles.adminTitle}>Labour Cooperative Federation Administration</Text>
          <Text style={styles.adminSub}>
            Autonomous Governance Desk • Smart India Hackathon PS 26089
          </Text>
        </View>
      </View>

      {/* Key Federation Statistics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconCircle}>
            <Users size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.metricNumber}>1,420</Text>
          <Text style={styles.metricLabel}>{t('totalVerifiedWorkers')}</Text>
          <Text style={styles.metricSub}>Across 18 Cooperatives</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Briefcase size={16} color={theme.colors.secondary} />
          </View>
          <Text style={[styles.metricNumber, { color: theme.colors.secondary }]}>
            38
          </Text>
          <Text style={styles.metricLabel}>{t('activeJobsCount')}</Text>
          <Text style={styles.metricSub}>Live household tasks</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#FAF5FF' }]}>
            <DollarSign size={16} color={theme.colors.welfare} />
          </View>
          <Text style={[styles.metricNumber, { color: theme.colors.welfare }]}>
            ₹14.2L
          </Text>
          <Text style={styles.metricLabel}>{t('welfareDisbursed')}</Text>
          <Text style={styles.metricSub}>Accidental & medical pool</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Scale size={16} color="#059669" />
          </View>
          <Text style={[styles.metricNumber, { color: '#059669' }]}>
            94.8%
          </Text>
          <Text style={styles.metricLabel}>{t('fairAllocationIndex')}</Text>
          <Text style={styles.metricSub}>Equal earning opportunity</Text>
        </View>
      </View>

      {/* Fair Allocation & Algorithmic Equity Banner */}
      <View style={styles.equityBanner}>
        <View style={styles.equityIcon}>
          <Sparkles size={20} color="#065F46" />
        </View>
        <View style={styles.equityContent}>
          <Text style={styles.equityTitle}>Fair Allocation Algorithm Active</Text>
          <Text style={styles.equityText}>
            Unlike private gig algorithms that favor select high-volume workers, our cooperative scheduler caps daily hours per worker and dynamically rotates nearby service requests among all certified society members.
          </Text>
        </View>
      </View>

      {/* Worker Verification & KYC Desk */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>{t('workerVerificationDesk')}</Text>
          <Text style={styles.sectionSub}>
            Inspect skill certificates, society membership & criminal background checks
          </Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>
            {pendingWorkers.length} {t('pendingVerification')}
          </Text>
        </View>
      </View>

      {pendingWorkers.length === 0 ? (
        <View style={styles.emptyCard}>
          <CheckCircle size={36} color={theme.colors.success} />
          <Text style={styles.emptyTitle}>All Worker Applications Reviewed!</Text>
          <Text style={styles.emptySub}>
            Every cooperative member in the queue has been validated and issued verified credentials.
          </Text>
        </View>
      ) : (
        pendingWorkers.map((worker) => (
          <View key={worker.id} style={styles.workerReviewCard}>
            <View style={styles.reviewCardHeader}>
              <View>
                <Text style={styles.reviewWorkerName}>{worker.name}</Text>
                <Text style={styles.reviewDomain}>{worker.domain} • {worker.experienceYears} yrs exp</Text>
                <Text style={styles.reviewSociety}>{worker.society}</Text>
              </View>
              <Text style={styles.appliedDate}>{worker.appliedDate}</Text>
            </View>

            {/* Document checklist */}
            <View style={styles.docList}>
              {worker.documents.map((doc, idx) => (
                <View key={idx} style={styles.docItem}>
                  <FileCheck size={14} color={doc.status === 'VERIFIED' ? theme.colors.success : '#D97706'} />
                  <Text style={styles.docName}>{doc.name}</Text>
                  <View style={[styles.docStatusPill, doc.status === 'VERIFIED' ? styles.docStatusVerified : styles.docStatusPending]}>
                    <Text style={[styles.docStatusText, doc.status === 'VERIFIED' ? styles.docTextVerified : styles.docTextPending]}>
                      {doc.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.reviewActionRow}>
              <TouchableOpacity
                style={styles.inspectBtn}
                onPress={() => setSelectedWorkerDoc(worker)}
              >
                <Eye size={15} color={theme.colors.secondary} />
                <Text style={styles.inspectBtnText}>Inspect KYC</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleReject(worker.id)}
              >
                <XCircle size={15} color="#DC2626" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleApprove(worker.id)}
              >
                <CheckCircle size={15} color={theme.colors.white} />
                <Text style={styles.approveBtnText}>Approve & Issue ID</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Federation Welfare Fund Ledger */}
      <View style={styles.ledgerCard}>
        <Text style={styles.ledgerTitle}>{t('societyFundLedger')}</Text>
        <Text style={styles.ledgerSub}>Automated 7% allocation from completed gigs (Total Pool: ₹14,20,400)</Text>

        <View style={styles.ledgerRow}>
          <View style={styles.ledgerItemLeft}>
            <Text style={styles.ledgerItemTitle}>BK-2024-001 (Plumbing Repair)</Text>
            <Text style={styles.ledgerItemSub}>7% Welfare Cut to Pune District Union</Text>
          </View>
          <Text style={styles.ledgerCredit}>+₹33.60</Text>
        </View>

        <View style={styles.ledgerRow}>
          <View style={styles.ledgerItemLeft}>
            <Text style={styles.ledgerItemTitle}>BK-2024-890 (Deep Cleaning)</Text>
            <Text style={styles.ledgerItemSub}>7% Welfare Cut to Mahila Shramik Sanstha</Text>
          </View>
          <Text style={styles.ledgerCredit}>+₹42.00</Text>
        </View>

        <View style={styles.ledgerRow}>
          <View style={styles.ledgerItemLeft}>
            <Text style={styles.ledgerItemTitle}>Accidental Treatment Claim #CL-41</Text>
            <Text style={styles.ledgerItemSub}>Disbursed to Sanjeevani Hospital for Worker</Text>
          </View>
          <Text style={styles.ledgerDebit}>-₹15,000.00</Text>
        </View>
      </View>

      {/* KYC Inspection Modal */}
      <Modal visible={!!selectedWorkerDoc} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.inspectModalCard}>
            <Text style={styles.inspectTitle}>Cooperative Verification Dossier</Text>
            <Text style={styles.inspectWorker}>{selectedWorkerDoc?.name}</Text>
            <Text style={styles.inspectSociety}>{selectedWorkerDoc?.society}</Text>

            <View style={styles.certPreviewBox}>
              <Text style={styles.certPreviewHeader}>Government Skill Registry Verification</Text>
              <Text style={styles.certPreviewItem}>✓ Aadhaar e-Sign UIDAI Match: 99.4%</Text>
              <Text style={styles.certPreviewItem}>✓ National Skill Development Council (NSDC) Verified</Text>
              <Text style={styles.certPreviewItem}>✓ Police Character Certificate: Clean Record</Text>
              <Text style={styles.certPreviewItem}>✓ Labour Cooperative Society General Body Approved</Text>
            </View>

            <TouchableOpacity
              style={styles.closeInspectBtn}
              onPress={() => setSelectedWorkerDoc(null)}
            >
              <Text style={styles.closeInspectText}>Done Inspection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 60,
  },
  adminHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: 14,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.button,
  },
  adminHeaderIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminHeaderText: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.white,
  },
  adminSub: {
    fontSize: 11,
    color: '#93C5FD',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  metricCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  metricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  equityBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
    marginBottom: theme.spacing.xl,
  },
  equityIcon: {
    paddingTop: 2,
  },
  equityContent: {
    flex: 1,
  },
  equityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  equityText: {
    fontSize: 11,
    color: '#047857',
    marginTop: 3,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sectionSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  emptyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  workerReviewCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  reviewWorkerName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
  },
  reviewDomain: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primaryDark,
    marginTop: 2,
  },
  reviewSociety: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  appliedDate: {
    fontSize: 10,
    color: theme.colors.textLight,
  },
  docList: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docName: {
    fontSize: 12,
    color: theme.colors.text,
    flex: 1,
    marginLeft: 6,
  },
  docStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  docStatusVerified: {
    backgroundColor: '#DCFCE7',
  },
  docStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  docStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  docTextVerified: {
    color: '#15803D',
  },
  docTextPending: {
    color: '#B45309',
  },
  reviewActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  inspectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    gap: 6,
    ...theme.shadows.button,
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.white,
  },
  ledgerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.card,
  },
  ledgerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
  },
  ledgerSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: theme.spacing.md,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ledgerItemLeft: {
    flex: 1,
  },
  ledgerItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  ledgerItemSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  ledgerCredit: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.success,
  },
  ledgerDebit: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.danger,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  inspectModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.modal,
  },
  inspectTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  inspectWorker: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  inspectSociety: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  certPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  certPreviewHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
  },
  certPreviewItem: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    lineHeight: 18,
  },
  closeInspectBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  closeInspectText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
