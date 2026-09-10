import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Globe,
  Users,
  Shield,
  Briefcase,
  Check,
  X,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '../theme';
import {
  useLanguage,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../context/LanguageContext';
import { useAuth, UserRole } from '../context/AuthContext';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { role, switchRole, user } = useAuth();
  const [langModalVisible, setLangModalVisible] = useState<boolean>(false);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <View style={styles.headerWrapper}>
      {/* Top Banner: Govt & Cooperative Federation */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Shield size={12} color="#065F46" />
          <Text style={styles.topBarText}>
            Smart India Hackathon 2026 | Labour Cooperative Societies Federation
          </Text>
        </View>

        {/* Language button */}
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLangModalVisible(true)}
          activeOpacity={0.7}
        >
          <Globe size={13} color={theme.colors.primaryDark} />
          <Text style={styles.langButtonText}>
            {currentLang.flag} {currentLang.nativeName}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Header Row */}
      <View style={styles.mainHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Users size={22} color={theme.colors.white} />
          </View>
          <View>
            <Text style={styles.appName}>{t('appName')}</Text>
            <Text style={styles.appTagline}>{t('appTagline')}</Text>
          </View>
        </View>

        {/* User Pill */}
        <View style={styles.userProfilePill}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.userRoleText}>
              {role === 'CUSTOMER' ? 'Household User' : role === 'WORKER' ? 'Society Worker' : 'Federation Registrar'}
            </Text>
          </View>
        </View>
      </View>

      {/* Role / Portal Switcher Pills (Essential for Hackathon Judging & Testing) */}
      <View style={styles.portalSwitcherBar}>
        <Text style={styles.portalLabel}>{t('switchPortal')}:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.portalPillsContainer}
        >
          <TouchableOpacity
            style={[styles.portalPill, role === 'CUSTOMER' && styles.activePortalPill]}
            onPress={() => switchRole('CUSTOMER')}
          >
            <Users
              size={14}
              color={role === 'CUSTOMER' ? theme.colors.white : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.portalPillText,
                role === 'CUSTOMER' && styles.activePortalPillText,
              ]}
            >
              {t('portalCustomer')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.portalPill,
              styles.workerPill,
              role === 'WORKER' && styles.activeWorkerPill,
            ]}
            onPress={() => switchRole('WORKER')}
          >
            <Briefcase
              size={14}
              color={role === 'WORKER' ? theme.colors.white : theme.colors.accent}
            />
            <Text
              style={[
                styles.portalPillText,
                role === 'WORKER' && styles.activePortalPillText,
              ]}
            >
              {t('portalWorker')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.portalPill,
              styles.adminPill,
              role === 'ADMIN' && styles.activeAdminPill,
            ]}
            onPress={() => switchRole('ADMIN')}
          >
            <Shield
              size={14}
              color={role === 'ADMIN' ? theme.colors.white : theme.colors.secondary}
            />
            <Text
              style={[
                styles.portalPillText,
                role === 'ADMIN' && styles.activePortalPillText,
              ]}
            >
              {t('portalAdmin')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Language Picker Modal */}
      <Modal visible={langModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.langModalCard}>
            <View style={styles.langModalHeader}>
              <View style={styles.langModalTitleRow}>
                <Globe size={20} color={theme.colors.primary} />
                <Text style={styles.langModalTitle}>Select Preferred Language</Text>
              </View>
              <TouchableOpacity
                onPress={() => setLangModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.langModalSubtitle}>
              Voice recognition & text throughout all three portals will automatically adapt to your chosen language.
            </Text>

            <View style={styles.langList}>
              {SUPPORTED_LANGUAGES.map((item) => {
                const isSelected = item.code === language;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.langOption,
                      isSelected && styles.selectedLangOption,
                    ]}
                    onPress={() => {
                      setLanguage(item.code);
                      setLangModalVisible(false);
                    }}
                  >
                    <View style={styles.langOptionLeft}>
                      <Text style={styles.langFlag}>{item.flag}</Text>
                      <View>
                        <Text
                          style={[
                            styles.langNativeName,
                            isSelected && styles.selectedLangText,
                          ]}
                        >
                          {item.nativeName}
                        </Text>
                        <Text style={styles.langEngName}>{item.name}</Text>
                      </View>
                    </View>
                    {isSelected && <Check size={18} color={theme.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.card,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EDF7EE',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  topBarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.2,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 5,
  },
  langButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  appName: {
    fontSize: 19,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: -0.3,
  },
  appTagline: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  userProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.full,
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
    gap: 8,
    maxWidth: 160,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  userRoleText: {
    fontSize: 9,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  portalSwitcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    gap: 8,
  },
  portalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  portalPillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  portalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  activePortalPill: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  workerPill: {
    borderColor: '#FDE68A',
  },
  activeWorkerPill: {
    backgroundColor: theme.colors.accent,
    borderColor: '#B45309',
  },
  adminPill: {
    borderColor: '#BFDBFE',
  },
  activeAdminPill: {
    backgroundColor: theme.colors.secondary,
    borderColor: '#1E40AF',
  },
  portalPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  activePortalPillText: {
    color: theme.colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  langModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.modal,
  },
  langModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  langModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langModalSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    lineHeight: 16,
  },
  langList: {
    gap: 8,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8FAFC',
  },
  selectedLangOption: {
    backgroundColor: '#EDF7EE',
    borderColor: theme.colors.primary,
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langFlag: {
    fontSize: 22,
  },
  langNativeName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  selectedLangText: {
    color: theme.colors.primaryDark,
  },
  langEngName: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});
