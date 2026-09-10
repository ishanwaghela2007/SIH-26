import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  CreditCard,
  Star,
  CheckCircle,
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Cpu,
  Leaf,
  Car,
  Heart,
  Calendar,
  X,
} from 'lucide-react-native';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { SERVICE_DOMAINS, ServiceDomain, INITIAL_BOOKINGS, ActiveBooking } from '../../api/client';
import { CooperativeBadge } from '../../components/CooperativeBadge';
import { TransparentBillCard } from '../../components/TransparentBillCard';
import { VoiceActionButton } from '../../components/VoiceActionButton';
import { MultilingualChat } from '../../components/MultilingualChat';

export const CustomerPortal: React.FC = () => {
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState<ActiveBooking[]>(INITIAL_BOOKINGS);
  const [selectedDomain, setSelectedDomain] = useState<ServiceDomain | null>(null);
  const [bookingModalVisible, setBookingModalVisible] = useState<boolean>(false);
  const [chatModalVisible, setChatModalVisible] = useState<boolean>(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState<boolean>(false);
  const [ratingModalVisible, setRatingModalVisible] = useState<boolean>(false);
  
  // Booking Form State
  const [urgency, setUrgency] = useState<'IMMEDIATE' | 'SCHEDULED'>('IMMEDIATE');
  const [problemDesc, setProblemDesc] = useState<string>('');
  const [serviceAddress, setServiceAddress] = useState<string>('Flat 402, Shanti Kunj, Pune');
  const [userRating, setUserRating] = useState<number>(5);
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');

  const getDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'wrench': return <Wrench size={22} color={theme.colors.primary} />;
      case 'zap': return <Zap size={22} color="#EAB308" />;
      case 'hammer': return <Hammer size={22} color="#B45309" />;
      case 'paint-brush': return <Paintbrush size={22} color="#0284C7" />;
      case 'sparkles': return <Sparkles size={22} color="#9333EA" />;
      case 'cpu': return <Cpu size={22} color="#2563EB" />;
      case 'leaf': return <Leaf size={22} color="#16A34A" />;
      case 'car': return <Car size={22} color="#DC2626" />;
      case 'heart': return <Heart size={22} color="#E11D48" />;
      default: return <Wrench size={22} color={theme.colors.primary} />;
    }
  };

  const handleCreateBooking = () => {
    if (!selectedDomain) return;
    const newBooking: ActiveBooking = {
      id: `BK-${Date.now().toString().slice(-4)}`,
      serviceDomain: selectedDomain.id,
      serviceTitle: `${t(selectedDomain.nameKey)} Assistance`,
      problemDescription: problemDesc || 'Emergency repair required at home address.',
      address: serviceAddress,
      urgency,
      scheduledTime: urgency === 'IMMEDIATE' ? 'Today, within 25-30 mins' : 'Tomorrow at 10:00 AM',
      estimatedAmount: selectedDomain.baseRate + (urgency === 'IMMEDIATE' ? 80 : 0),
      status: 'MATCHED',
      worker: {
        name: 'Santosh Kamble',
        phone: '+91 98234 11990',
        society: 'Pune District Labour Cooperative Union',
        membershipId: 'PDLCU-9021',
        rating: 4.8,
        distance: '0.9 km',
        etaMinutes: 15,
      },
      fairAllocationBreakdown: {
        workerShare: Math.round((selectedDomain.baseRate + (urgency === 'IMMEDIATE' ? 80 : 0)) * 0.88),
        welfareFundShare: Math.round((selectedDomain.baseRate + (urgency === 'IMMEDIATE' ? 80 : 0)) * 0.07),
        platformFee: Math.round((selectedDomain.baseRate + (urgency === 'IMMEDIATE' ? 80 : 0)) * 0.05),
        total: selectedDomain.baseRate + (urgency === 'IMMEDIATE' ? 80 : 0),
      },
      createdAt: 'Just now',
    };

    setBookings((prev) => [newBooking, ...prev]);
    setBookingModalVisible(false);
    setProblemDesc('');
  };

  const currentActiveBooking = bookings[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Cooperative Guarantee Pill */}
      <View style={styles.guaranteeBanner}>
        <CooperativeBadge
          societyName="National Labour Cooperative Federation of India (NLCF)"
          membershipId="SIH-26089"
          size="medium"
        />
      </View>

      {/* Emergency On-Demand Banner */}
      <TouchableOpacity
        style={styles.emergencyCard}
        onPress={() => {
          setSelectedDomain(SERVICE_DOMAINS[0]);
          setUrgency('IMMEDIATE');
          setBookingModalVisible(true);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.emergencyLeft}>
          <View style={styles.emergencyIconCircle}>
            <AlertTriangle size={22} color={theme.colors.white} />
          </View>
          <View style={styles.emergencyTextWrap}>
            <View style={styles.emergencyTagRow}>
              <Text style={styles.emergencyTag}>PRIORITY 30 MIN DISPATCH</Text>
            </View>
            <Text style={styles.emergencyTitle}>{t('emergencyAssistance')}</Text>
            <Text style={styles.emergencySub}>{t('emergencySubtitle')}</Text>
          </View>
        </View>
        <View style={styles.emergencyBtn}>
          <Text style={styles.emergencyBtnText}>{t('bookNow')}</Text>
        </View>
      </TouchableOpacity>

      {/* Active Service Tracking Card (if any) */}
      {currentActiveBooking && (
        <View style={styles.activeJobCard}>
          <View style={styles.activeJobHeader}>
            <View>
              <View style={styles.liveIndicatorRow}>
                <View style={styles.pulsingDot} />
                <Text style={styles.liveText}>LIVE JOB IN PROGRESS</Text>
              </View>
              <Text style={styles.activeJobTitle}>{currentActiveBooking.serviceTitle}</Text>
              <Text style={styles.activeJobAddress}>{currentActiveBooking.address}</Text>
            </View>
            <View style={styles.etaPill}>
              <Clock size={12} color={theme.colors.primaryDark} />
              <Text style={styles.etaText}>{currentActiveBooking.worker.etaMinutes} mins away</Text>
            </View>
          </View>

          {/* Status Pipeline Progress */}
          <View style={styles.pipelineContainer}>
            <View style={styles.pipelineStep}>
              <View style={[styles.pipelineDot, styles.pipelineDotActive]}>
                <CheckCircle size={12} color={theme.colors.white} />
              </View>
              <Text style={styles.pipelineLabel}>Requested</Text>
            </View>
            <View style={[styles.pipelineLine, styles.pipelineLineActive]} />

            <View style={styles.pipelineStep}>
              <View style={[styles.pipelineDot, styles.pipelineDotActive]}>
                <CheckCircle size={12} color={theme.colors.white} />
              </View>
              <Text style={styles.pipelineLabel}>Matched</Text>
            </View>
            <View style={[styles.pipelineLine, styles.pipelineLineActive]} />

            <View style={styles.pipelineStep}>
              <View style={[styles.pipelineDot, styles.pipelineDotActive]}>
                <CheckCircle size={12} color={theme.colors.white} />
              </View>
              <Text style={styles.pipelineLabel}>Accepted</Text>
            </View>
            <View style={styles.pipelineLine} />

            <View style={styles.pipelineStep}>
              <View style={styles.pipelineDot}>
                <Text style={styles.pipelineNumber}>4</Text>
              </View>
              <Text style={styles.pipelineLabel}>Working</Text>
            </View>
          </View>

          {/* Worker Details Card */}
          <View style={styles.workerProfileRow}>
            <View style={styles.workerAvatar}>
              <Text style={styles.workerAvatarText}>
                {currentActiveBooking.worker.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{currentActiveBooking.worker.name}</Text>
              <Text style={styles.workerSociety} numberOfLines={1}>
                {currentActiveBooking.worker.society}
              </Text>
              <View style={styles.workerRatingRow}>
                <Star size={13} color="#EAB308" fill="#EAB308" />
                <Text style={styles.ratingText}>{currentActiveBooking.worker.rating} / 5.0</Text>
                <Text style={styles.societyIdPill}>{currentActiveBooking.worker.membershipId}</Text>
              </View>
            </View>
            <View style={styles.workerActionBtns}>
              <TouchableOpacity
                style={styles.chatActionBtn}
                onPress={() => setChatModalVisible(true)}
              >
                <MessageSquare size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.callActionBtn}
                onPress={() => alert(`Calling verified worker: ${currentActiveBooking.worker.phone}`)}
              >
                <Phone size={18} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Pay / Review triggers */}
          <View style={styles.activeJobFooter}>
            <TouchableOpacity
              style={styles.viewBillBtn}
              onPress={() => setPaymentModalVisible(true)}
            >
              <CreditCard size={15} color={theme.colors.primary} />
              <Text style={styles.viewBillText}>Transparent Bill (₹{currentActiveBooking.estimatedAmount})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => setRatingModalVisible(true)}
            >
              <Star size={15} color="#D97706" />
              <Text style={styles.rateBtnText}>{t('rateService')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Service Domains Catalog */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>{t('allCategories')}</Text>
        <Text style={styles.sectionSubHeading}>100% Police & Cooperative Verified</Text>
      </View>

      <View style={styles.domainsGrid}>
        {SERVICE_DOMAINS.map((domain) => (
          <TouchableOpacity
            key={domain.id}
            style={styles.domainCard}
            onPress={() => {
              setSelectedDomain(domain);
              setBookingModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.domainIconContainer}>{getDomainIcon(domain.icon)}</View>
            <Text style={styles.domainTitle}>{t(domain.nameKey)}</Text>
            <Text style={styles.domainRate}>From ₹{domain.baseRate}</Text>
            {domain.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Cooperative Philosophy Card */}
      <View style={styles.philosophyCard}>
        <Text style={styles.philosophyTitle}>The Cooperative Difference</Text>
        <Text style={styles.philosophyBody}>
          Unlike corporate apps that deduct 25-30% in venture profit, SahakariSeva is co-owned by registered Labour Cooperative Federations. 88% goes directly to skilled workers, and 7% funds their accidental medical insurance and family welfare.
        </Text>
      </View>

      {/* Booking Modal */}
      <Modal visible={bookingModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.bookingModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedDomain ? t(selectedDomain.nameKey) : 'Request Service'}
                </Text>
                <Text style={styles.modalSubtitle}>Fair cooperative allocation in your neighbourhood</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBookingModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll}>
              {/* Urgency Selector */}
              <Text style={styles.inputLabel}>{t('scheduleTime')}</Text>
              <View style={styles.urgencyToggleRow}>
                <TouchableOpacity
                  style={[styles.urgencyOption, urgency === 'IMMEDIATE' && styles.urgencyOptionActive]}
                  onPress={() => setUrgency('IMMEDIATE')}
                >
                  <AlertTriangle size={16} color={urgency === 'IMMEDIATE' ? theme.colors.white : theme.colors.accent} />
                  <Text style={[styles.urgencyText, urgency === 'IMMEDIATE' && styles.urgencyTextActive]}>
                    {t('immediate')} (30 Mins)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.urgencyOption, urgency === 'SCHEDULED' && styles.urgencyOptionActive]}
                  onPress={() => setUrgency('SCHEDULED')}
                >
                  <Calendar size={16} color={urgency === 'SCHEDULED' ? theme.colors.white : theme.colors.secondary} />
                  <Text style={[styles.urgencyText, urgency === 'SCHEDULED' && styles.urgencyTextActive]}>
                    {t('scheduled')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Voice Problem Input */}
              <Text style={styles.inputLabel}>{t('problemDescription')}</Text>
              <VoiceActionButton
                onSpeechResult={(transcript) => setProblemDesc(transcript)}
                label="Tap to speak in your language..."
                mode="mic"
              />

              <TextInput
                style={styles.textArea}
                placeholder="Or type specifics here (e.g. leaking pipe, main switch spark)..."
                placeholderTextColor={theme.colors.textLight}
                value={problemDesc}
                onChangeText={setProblemDesc}
                multiline
                numberOfLines={3}
              />

              {/* Service Address */}
              <Text style={styles.inputLabel}>{t('serviceAddress')}</Text>
              <View style={styles.addressInputRow}>
                <MapPin size={18} color={theme.colors.primary} />
                <TextInput
                  style={styles.addressInput}
                  value={serviceAddress}
                  onChangeText={setServiceAddress}
                />
              </View>

              {/* Transparent Bill Card */}
              {selectedDomain && (
                <TransparentBillCard
                  totalAmount={selectedDomain.baseRate + (urgency === 'IMMEDIATE' ? 80 : 0)}
                />
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.confirmBookingBtn}
                onPress={handleCreateBooking}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBookingText}>
                  {t('requestService')} • ₹{selectedDomain ? selectedDomain.baseRate + (urgency === 'IMMEDIATE' ? 80 : 0) : 350}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Multilingual Live Chat Modal */}
      <MultilingualChat
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        workerName={currentActiveBooking?.worker.name}
      />

      {/* Transparent Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.paymentModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cooperative Payment Gateway</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <TransparentBillCard totalAmount={currentActiveBooking?.estimatedAmount || 480} />

            <Text style={styles.inputLabel}>Select Payment Method</Text>
            <View style={styles.paymentMethodList}>
              <TouchableOpacity
                style={styles.payMethodCard}
                onPress={() => {
                  alert('Payment of ₹480 processed successfully via UPI!');
                  setPaymentModalVisible(false);
                }}
              >
                <Text style={styles.payMethodIcon}>📱</Text>
                <View style={styles.payMethodInfo}>
                  <Text style={styles.payMethodTitle}>UPI (PhonePe, GooglePay, BHIM)</Text>
                  <Text style={styles.payMethodSub}>Instant settlement to worker society account</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.payMethodCard}
                onPress={() => {
                  alert('Cash payment confirmed. Pay directly to worker.');
                  setPaymentModalVisible(false);
                }}
              >
                <Text style={styles.payMethodIcon}>💵</Text>
                <View style={styles.payMethodInfo}>
                  <Text style={styles.payMethodTitle}>Cash on Completion</Text>
                  <Text style={styles.payMethodSub}>Verified digital receipt issued via SMS</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating & Cooperative Review Modal */}
      <Modal visible={ratingModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.ratingModalCard}>
            <Text style={styles.ratingModalTitle}>Cooperative Worker Rating</Text>
            <Text style={styles.ratingModalSub}>
              Your feedback directly impacts worker cooperative dividend and fair allocation priority!
            </Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                  <Star
                    size={32}
                    color="#EAB308"
                    fill={star <= userRating ? '#EAB308' : 'none'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.ratingInput}
              placeholder="Leave feedback on punctuality, skill, and professionalism..."
              placeholderTextColor={theme.colors.textLight}
              value={feedbackNotes}
              onChangeText={setFeedbackNotes}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={() => {
                alert('Thank you! Feedback recorded in Cooperative Federation Ledger.');
                setRatingModalVisible(false);
              }}
            >
              <Text style={styles.submitReviewText}>Submit Review</Text>
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
  guaranteeBanner: {
    marginBottom: theme.spacing.md,
  },
  emergencyCard: {
    backgroundColor: '#DC2626',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emergencyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyTextWrap: {
    flex: 1,
  },
  emergencyTagRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  emergencyTag: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.white,
  },
  emergencySub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  emergencyBtn: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    marginLeft: 8,
  },
  emergencyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  activeJobCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    ...theme.shadows.card,
  },
  activeJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.success,
    letterSpacing: 0.5,
  },
  activeJobTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  activeJobAddress: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF7EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  pipelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.md,
    paddingHorizontal: 4,
  },
  pipelineStep: {
    alignItems: 'center',
    gap: 4,
  },
  pipelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineDotActive: {
    backgroundColor: theme.colors.primary,
  },
  pipelineNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  pipelineLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  pipelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  pipelineLineActive: {
    backgroundColor: theme.colors.primary,
  },
  workerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    gap: 12,
  },
  workerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.white,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  workerSociety: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  workerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
  },
  societyIdPill: {
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
  workerActionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  chatActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6E7C9',
  },
  callActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeJobFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: theme.spacing.md,
  },
  viewBillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    gap: 6,
  },
  viewBillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    gap: 6,
  },
  rateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  sectionHeaderRow: {
    marginBottom: theme.spacing.md,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sectionSubHeading: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  domainsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing.xl,
  },
  domainCard: {
    width: '31%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
    position: 'relative',
  },
  domainIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  domainTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    minHeight: 30,
  },
  domainRate: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  popularText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#92400E',
  },
  philosophyCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
    marginBottom: theme.spacing.xl,
  },
  philosophyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  philosophyBody: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  bookingModalContent: {
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '90%',
    padding: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFormScroll: {
    maxHeight: 520,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: 6,
  },
  urgencyToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  urgencyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: 8,
  },
  urgencyOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  urgencyTextActive: {
    color: theme.colors.white,
  },
  textArea: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    fontSize: 13,
    color: theme.colors.text,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  addressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  addressInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
  },
  confirmBookingBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
    ...theme.shadows.button,
  },
  confirmBookingText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
  paymentModalCard: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.lg,
  },
  paymentMethodList: {
    gap: 10,
    marginTop: 8,
    marginBottom: theme.spacing.xl,
  },
  payMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  payMethodIcon: {
    fontSize: 24,
  },
  payMethodInfo: {
    flex: 1,
  },
  payMethodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  payMethodSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  ratingModalCard: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    alignSelf: 'center',
    marginVertical: 'auto',
    alignItems: 'center',
    ...theme.shadows.modal,
  },
  ratingModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  ratingModalSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: theme.spacing.md,
  },
  starRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: theme.spacing.md,
  },
  ratingInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    fontSize: 13,
    color: theme.colors.text,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.lg,
  },
  submitReviewBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitReviewText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
