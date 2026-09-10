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
  Briefcase,
  TrendingUp,
  Heart,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Navigation,
  FileCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { MultilingualChat } from '../../components/MultilingualChat';
import { VoiceActionButton } from '../../components/VoiceActionButton';

interface NearbyJob {
  id: string;
  title: string;
  domain: string;
  distance: string;
  address: string;
  payout: number;
  urgency: 'IMMEDIATE' | 'SCHEDULED';
  fairAllocationReason: string;
  customerName: string;
  customerLanguage: string;
  description: string;
}

const SAMPLE_NEARBY_JOBS: NearbyJob[] = [
  {
    id: 'JOB-901',
    title: 'Urgent PVC Pipe Replacement',
    domain: 'Plumbing',
    distance: '1.2 km away',
    address: 'B-203, Vardhman Enclave, Karve Road, Pune',
    payout: 422,
    urgency: 'IMMEDIATE',
    fairAllocationReason: 'High priority: You completed fewer than 2 jobs today to balance federation hours.',
    customerName: 'Anil Deshmukh',
    customerLanguage: 'English & Marathi',
    description: 'Main bathroom inlet pipe joint has cracked and leaking continuously.',
  },
  {
    id: 'JOB-902',
    title: 'Solar Water Heater Line Servicing',
    domain: 'Plumbing',
    distance: '2.5 km away',
    address: 'Row House 14, Nisarg Park, Kothrud',
    payout: 550,
    urgency: 'SCHEDULED',
    fairAllocationReason: 'Matched to your Master Skill Certification in Solar Heaters.',
    customerName: 'Sunita Joshi',
    customerLanguage: 'हिन्दी (Hindi)',
    description: 'Scheduled maintenance for 200L roof solar water heater line.',
  },
];

export const WorkerPortal: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>(SAMPLE_NEARBY_JOBS);
  const [activeJob, setActiveJob] = useState<NearbyJob | null>(null);
  const [jobStep, setJobStep] = useState<'ACCEPTED' | 'AT_LOCATION' | 'COMPLETED'>('ACCEPTED');
  const [chatVisible, setChatVisible] = useState<boolean>(false);
  const [welfareClaimModal, setWelfareClaimModal] = useState<boolean>(false);
  const [onboardingModal, setOnboardingModal] = useState<boolean>(false);

  const handleAcceptJob = (job: NearbyJob) => {
    setActiveJob(job);
    setJobStep('ACCEPTED');
    setNearbyJobs((prev) => prev.filter((j) => j.id !== job.id));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Cooperative Identity Card */}
      <View style={styles.workerIdCard}>
        <View style={styles.idCardTop}>
          <View style={styles.federationHeader}>
            <Text style={styles.federationTitle}>
              LABOUR COOPERATIVE FEDERATION OF INDIA
            </Text>
            <Text style={styles.federationSubtitle}>
              Government Registered Cooperative Society Worker ID
            </Text>
          </View>
          <View style={styles.verifiedStamp}>
            <ShieldCheck size={26} color="#047857" />
          </View>
        </View>

        <View style={styles.idCardBody}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarLetter}>{user.name.charAt(0)}</Text>
          </View>
          <View style={styles.idDetails}>
            <Text style={styles.workerName}>{user.name}</Text>
            <Text style={styles.membershipNum}>
              Reg ID: <Text style={styles.boldText}>{user.membershipId || 'MSLCF-2024-8842'}</Text>
            </Text>
            <Text style={styles.societyName} numberOfLines={1}>
              {user.cooperativeSociety || 'Maharashtra Shramik Labour Cooperative Federation'}
            </Text>
            <View style={styles.skillBadgesRow}>
              {(user.skills || ['Plumbing Master', 'Solar Line Fit']).map((s, idx) => (
                <View key={idx} style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.idCardFooter}>
          <View style={styles.insuranceActiveRow}>
            <CheckCircle2 size={13} color="#065F46" />
            <Text style={styles.insuranceText}>
              Ayushman Bharat & Cooperative Group Life Cover: <Text style={styles.boldText}>₹5,00,000 Active</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Voice Assistant Narration Button (Crucial for Low-Literacy Workers) */}
      <VoiceActionButton
        mode="listen"
        label="🔊 Tap here to listen to your job updates in your language"
      />

      {/* Earnings & Cooperative Dividend Wallet */}
      <View style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>Worker Cooperative Wallet & Welfare</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('todaysEarnings')}</Text>
            <Text style={styles.statAmount}>₹{user.balance || 3850}</Text>
            <Text style={styles.statSub}>Direct bank payout</Text>
          </View>

          <View style={[styles.statBox, styles.statBoxPurple]}>
            <View style={styles.statIconRow}>
              <Heart size={14} color={theme.colors.welfare} />
              <Text style={[styles.statLabel, { color: theme.colors.welfare }]}>
                {t('welfareFundAccrued')}
              </Text>
            </View>
            <Text style={[styles.statAmount, { color: theme.colors.welfare }]}>
              ₹{user.welfareAccrued || 620}
            </Text>
            <Text style={styles.statSub}>Year-end society dividend</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.claimWelfareBtn}
          onPress={() => setWelfareClaimModal(true)}
        >
          <Text style={styles.claimWelfareText}>
            Medical Emergency & Accident Claim Desk
          </Text>
          <ChevronRight size={16} color={theme.colors.welfare} />
        </TouchableOpacity>
      </View>

      {/* Active Job Tracker for Worker */}
      {activeJob && (
        <View style={styles.activeJobSection}>
          <View style={styles.activeJobCardHeader}>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE ENGAGEMENT</Text>
            </View>
            <Text style={styles.activeJobPayout}>Payout: ₹{activeJob.payout}</Text>
          </View>

          <Text style={styles.activeJobTitle}>{activeJob.title}</Text>
          <Text style={styles.activeJobDesc}>{activeJob.description}</Text>

          <View style={styles.locationBar}>
            <MapPin size={18} color={theme.colors.primary} />
            <Text style={styles.locationText}>{activeJob.address}</Text>
          </View>

          {/* Multilingual customer banner */}
          <View style={styles.langAlertBox}>
            <Sparkles size={16} color="#B45309" />
            <Text style={styles.langAlertText}>
              Customer speaks <Text style={styles.boldText}>{activeJob.customerLanguage}</Text>. Live speech translation is active.
            </Text>
          </View>

          {/* Job steps workflow */}
          <View style={styles.jobWorkflowSteps}>
            <TouchableOpacity
              style={[
                styles.workflowBtn,
                jobStep === 'ACCEPTED' && styles.workflowBtnCurrent,
              ]}
              onPress={() => setJobStep('AT_LOCATION')}
            >
              <Navigation size={18} color={theme.colors.white} />
              <Text style={styles.workflowBtnText}>
                {jobStep === 'ACCEPTED' ? 'Mark: Arrived at Location' : '✓ Arrived at Site'}
              </Text>
            </TouchableOpacity>

            {jobStep === 'AT_LOCATION' && (
              <TouchableOpacity
                style={[styles.workflowBtn, styles.completeBtn]}
                onPress={() => {
                  alert('Work verified! Direct payout of ₹422 credited to cooperative account.');
                  setActiveJob(null);
                }}
              >
                <FileCheck size={18} color={theme.colors.white} />
                <Text style={styles.workflowBtnText}>
                  Complete Work & Upload Photo Proof
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.chatCustomerBtn}
                onPress={() => setChatVisible(true)}
              >
                <MessageSquare size={16} color={theme.colors.primaryDark} />
                <Text style={styles.chatCustomerBtnText}>Translate & Chat with Customer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callCustomerBtn}
                onPress={() => alert(`Dialing customer: ${activeJob.customerName}`)}
              >
                <Phone size={16} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Fair Allocation Job Radar Feed */}
      <View style={styles.radarHeader}>
        <Briefcase size={20} color={theme.colors.accent} />
        <View>
          <Text style={styles.radarTitle}>{t('newJobRequests')}</Text>
          <Text style={styles.radarSub}>
            Distributed fairly based on cooperative rotation principles
          </Text>
        </View>
      </View>

      {nearbyJobs.length === 0 ? (
        <View style={styles.emptyJobsCard}>
          <Text style={styles.emptyJobsTitle}>All current nearby jobs accepted!</Text>
          <Text style={styles.emptyJobsSub}>
            You will be notified with a loud audio tone when a new household request enters your cooperative radius.
          </Text>
        </View>
      ) : (
        nearbyJobs.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.jobCardTop}>
              <View style={styles.jobDomainBadge}>
                <Text style={styles.jobDomainText}>{job.domain}</Text>
              </View>
              <View style={styles.urgencyBadge}>
                <Clock size={12} color="#DC2626" />
                <Text style={styles.urgencyBadgeText}>{job.urgency}</Text>
              </View>
              <Text style={styles.jobPayout}>₹{job.payout}</Text>
            </View>

            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobDesc}>{job.description}</Text>

            <View style={styles.jobMetaRow}>
              <View style={styles.metaItem}>
                <MapPin size={14} color={theme.colors.textMuted} />
                <Text style={styles.metaText}>{job.distance}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>👤 {job.customerName}</Text>
              </View>
            </View>

            {/* Fair Allocation Notice */}
            <View style={styles.fairAllocationPill}>
              <Sparkles size={14} color="#047857" />
              <Text style={styles.fairAllocationText}>
                {job.fairAllocationReason}
              </Text>
            </View>

            {/* Big Accept & Decline Buttons (Designed for fast, large touch interaction) */}
            <View style={styles.buttonActionRow}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => {
                  setNearbyJobs((prev) => prev.filter((j) => j.id !== job.id));
                }}
              >
                <Text style={styles.declineBtnText}>{t('declineJob')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAcceptJob(job)}
              >
                <Text style={styles.acceptBtnText}>{t('acceptJob')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Multilingual Chat Modal */}
      <MultilingualChat
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
      />

      {/* Welfare & Insurance Claim Modal */}
      <Modal visible={welfareClaimModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.welfareModalCard}>
            <Text style={styles.welfareModalTitle}>Cooperative Emergency Welfare</Text>
            <Text style={styles.welfareModalSub}>
              As an active member of Maharashtra Shramik Labour Cooperative Federation, you and your family are covered under:
            </Text>
            <View style={styles.benefitList}>
              <Text style={styles.benefitItem}>• ₹5,00,000 Accidental Disability & Life Cover</Text>
              <Text style={styles.benefitItem}>• ₹25,000 Immediate Tool & Equipment Loss Loan (0% Interest)</Text>
              <Text style={styles.benefitItem}>• Maternity & Dependent Child Education Assistance</Text>
            </View>
            <TouchableOpacity
              style={styles.welfareActionBtn}
              onPress={() => {
                alert('Claim registered with Federation Officer. You will receive a call within 2 hours.');
                setWelfareClaimModal(false);
              }}
            >
              <Text style={styles.welfareActionText}>Request Emergency Disbursement</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.welfareCancelBtn}
              onPress={() => setWelfareClaimModal(false)}
            >
              <Text style={styles.welfareCancelText}>Close</Text>
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
  workerIdCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#C6E7C9',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  idCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  federationHeader: {
    flex: 1,
  },
  federationTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    letterSpacing: 0.5,
  },
  federationSubtitle: {
    fontSize: 9,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  verifiedStamp: {
    padding: 4,
    backgroundColor: '#EDF7EE',
    borderRadius: theme.radii.full,
  },
  idCardBody: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    ...theme.shadows.card,
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.white,
  },
  idDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  membershipNum: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  societyName: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  skillBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  skillBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  skillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text,
  },
  idCardFooter: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  insuranceActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insuranceText: {
    fontSize: 11,
    color: '#065F46',
  },
  statsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  statsCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  statBoxPurple: {
    backgroundColor: '#FAF5FF',
    borderColor: '#F3E8FF',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  statAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    marginVertical: 4,
  },
  statSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  claimWelfareBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  claimWelfareText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.welfare,
  },
  activeJobSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#F59E0B',
    marginVertical: theme.spacing.md,
    ...theme.shadows.card,
  },
  activeJobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.white,
  },
  activeJobPayout: {
    fontSize: 16,
    fontWeight: '900',
    color: '#92400E',
  },
  activeJobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
  },
  activeJobDesc: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
    lineHeight: 16,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 8,
    borderRadius: theme.radii.md,
    marginVertical: 8,
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
  },
  langAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: theme.radii.sm,
    marginBottom: 10,
  },
  langAlertText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  jobWorkflowSteps: {
    gap: 8,
    marginTop: 6,
  },
  workflowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    gap: 8,
  },
  workflowBtnCurrent: {
    backgroundColor: '#D97706',
  },
  completeBtn: {
    backgroundColor: theme.colors.success,
  },
  workflowBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.white,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatCustomerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  chatCustomerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  callCustomerBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  radarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  radarSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  emptyJobsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyJobsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyJobsSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  jobCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  jobCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobDomainBadge: {
    backgroundColor: '#EDF7EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  jobDomainText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgencyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  jobPayout: {
    fontSize: 17,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
  },
  jobDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  jobMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  fairAllocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: theme.radii.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    marginBottom: 12,
  },
  fairAllocationText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  buttonActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.button,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  welfareModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.modal,
  },
  welfareModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  welfareModalSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 17,
    marginBottom: theme.spacing.md,
  },
  benefitList: {
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.lg,
  },
  benefitItem: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 18,
  },
  welfareActionBtn: {
    backgroundColor: theme.colors.welfare,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    marginBottom: 8,
  },
  welfareActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.white,
  },
  welfareCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  welfareCancelText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});
