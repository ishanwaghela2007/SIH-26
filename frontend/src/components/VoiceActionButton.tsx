import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { Mic, Volume2, Sparkles } from 'lucide-react-native';
import { theme } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface VoiceActionButtonProps {
  onSpeechResult?: (transcript: string) => void;
  label?: string;
  mode?: 'mic' | 'listen';
  textToRead?: string;
}

export const VoiceActionButton: React.FC<VoiceActionButtonProps> = ({
  onSpeechResult,
  label,
  mode = 'mic',
  textToRead,
}) => {
  const { t, language } = useLanguage();
  const [isActive, setIsActive] = useState<boolean>(false);

  const handlePress = () => {
    setIsActive(true);
    if (mode === 'mic') {
      setTimeout(() => {
        setIsActive(false);
        const sampleTranscripts: Record<string, string> = {
          en: 'Water tap leaking heavily under the kitchen sink, need washer replacement immediately.',
          hi: 'रसोई के सिंक के नीचे नल से बहुत तेजी से पानी बह रहा है, तुरंत मरम्मत चाहिए।',
          mr: 'स्वयंपाकघरातील सिंकखालील नळ गळत आहे, ताबडतोब दुरुस्ती हवी आहे.',
          ta: 'சமையலறை தொட்டியின் அடியில் குழாய் கசிகிறது, உடனடி பழுது தேவை.',
          bn: 'রান্নাঘরের সিঙ্কের নিচে কল থেকে জল পড়ছে, এখনই মেরামত দরকার।',
        };
        const recognized = sampleTranscripts[language] || sampleTranscripts.en;
        onSpeechResult?.(recognized);
      }, 1500);
    } else {
      setTimeout(() => {
        setIsActive(false);
      }, 2000);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isActive && styles.activeButton,
        mode === 'listen' && styles.listenButton,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrapper}>
        {mode === 'mic' ? (
          <Mic size={20} color={isActive ? theme.colors.white : theme.colors.primary} />
        ) : (
          <Volume2 size={20} color={isActive ? theme.colors.white : theme.colors.secondary} />
        )}
      </View>
      <View style={styles.textWrapper}>
        <Text
          style={[
            styles.label,
            isActive && styles.activeLabel,
            mode === 'listen' && styles.listenLabel,
          ]}
        >
          {isActive
            ? mode === 'mic'
              ? 'Listening (सुन रहा है...)'
              : 'Speaking Audio...'
            : label || (mode === 'mic' ? t('problemDescription') : t('listenToInstructions'))}
        </Text>
        <Text style={styles.subtext}>
          {mode === 'mic' ? 'Tap & Speak in your language' : 'Audio Narration for workers'}
        </Text>
      </View>
      {isActive && (
        <View style={styles.pulseDot}>
          <Sparkles size={14} color={theme.colors.white} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  listenButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  textWrapper: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  listenLabel: {
    color: theme.colors.secondary,
  },
  activeLabel: {
    color: theme.colors.white,
  },
  subtext: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  pulseDot: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
