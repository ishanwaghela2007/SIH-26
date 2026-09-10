import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import {
  X,
  Send,
  Languages,
  Volume2,
  Mic,
  Sparkles,
  CheckCheck,
} from 'lucide-react-native';
import { theme } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface ChatMessage {
  id: string;
  sender: 'CUSTOMER' | 'WORKER';
  senderName: string;
  originalText: string;
  originalLang: string;
  translatedText: string;
  translatedLang: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'CUSTOMER',
    senderName: 'Pooja (Customer)',
    originalText: 'Hello Rameshwar ji, please bring a 1/2 inch PVC stopcock with you.',
    originalLang: 'English',
    translatedText: 'नमस्ते रामेश्वर जी, कृपया अपने साथ 1/2 इंच का पीवीसी स्टॉपकॉक लेकर आएं।',
    translatedLang: 'हिन्दी (Hindi)',
    timestamp: '10:14 AM',
  },
  {
    id: 'm2',
    sender: 'WORKER',
    senderName: 'Rameshwar (Cooperative Plumber)',
    originalText: 'हाँ बहनजी, मेरे पास सरकारी प्रमाणित सहकारी टूलकिट और 1/2 इंच वाल्व उपलब्ध है। 10 मिनट में पहुँच रहा हूँ।',
    originalLang: 'हिन्दी (Hindi)',
    translatedText: 'Yes sister, I have government-certified cooperative toolkit and 1/2 inch valve ready. Reaching in 10 minutes.',
    translatedLang: 'English',
    timestamp: '10:16 AM',
  },
];

interface MultilingualChatProps {
  visible: boolean;
  onClose: () => void;
  workerName?: string;
}

export const MultilingualChat: React.FC<MultilingualChatProps> = ({
  visible,
  onClose,
  workerName = 'Rameshwar Pawar',
}) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [showAutoTranslate, setShowAutoTranslate] = useState<boolean>(true);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'CUSTOMER',
      senderName: 'You (Customer)',
      originalText: inputText.trim(),
      originalLang: 'English',
      translatedText:
        language === 'hi'
          ? `[अनुवादित] ${inputText.trim()} (सहकारी अनुवाद द्वारा)`
          : `[Translated to Hindi] ${inputText.trim()} (via Sahakari AI)`,
      translatedLang: 'हिन्दी (Hindi)',
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulated worker reply after 1.5 seconds
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `m-reply-${Date.now()}`,
        sender: 'WORKER',
        senderName: workerName,
        originalText: 'जी बिल्कुल, मैं समझ गया। मैं लोकेशन पर हूँ।',
        originalLang: 'हिन्दी (Hindi)',
        translatedText: 'Yes understood completely. I am at the location.',
        translatedLang: 'English',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1500);
  };

  const handlePlayAudio = (id: string) => {
    setActiveSpeechId(id);
    setTimeout(() => setActiveSpeechId(null), 1800);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Multilingual Live Chat</Text>
              <View style={styles.translationBadge}>
                <Languages size={13} color={theme.colors.primaryDark} />
                <Text style={styles.translationBadgeText}>
                  Auto-Translating (English ↔ हिन्दी)
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Messages list */}
          <ScrollView style={styles.chatBody} contentContainerStyle={styles.chatScrollContent}>
            <View style={styles.coopNotice}>
              <Sparkles size={14} color={theme.colors.primary} />
              <Text style={styles.coopNoticeText}>
                Cooperative AI Translation Layer active. Speak or type in your native language; both sides understand seamlessly.
              </Text>
            </View>

            {messages.map((item) => {
              const isMe = item.sender === 'CUSTOMER';
              return (
                <View
                  key={item.id}
                  style={[styles.messageBubble, isMe ? styles.myBubble : styles.workerBubble]}
                >
                  <Text style={styles.senderLabel}>{item.senderName}</Text>
                  
                  {/* Original message */}
                  <Text style={styles.originalText}>{item.originalText}</Text>
                  
                  {/* Translated message preview */}
                  {showAutoTranslate && (
                    <View style={styles.translationBox}>
                      <View style={styles.translationHeader}>
                        <Languages size={11} color={theme.colors.primary} />
                        <Text style={styles.translationHeaderLang}>
                          {item.translatedLang}
                        </Text>
                      </View>
                      <Text style={styles.translatedText}>{item.translatedText}</Text>
                    </View>
                  )}

                  <View style={styles.bubbleFooter}>
                    <TouchableOpacity
                      style={styles.audioButton}
                      onPress={() => handlePlayAudio(item.id)}
                    >
                      <Volume2
                        size={14}
                        color={activeSpeechId === item.id ? theme.colors.accent : theme.colors.textMuted}
                      />
                      <Text style={styles.audioButtonText}>
                        {activeSpeechId === item.id ? 'Speaking...' : 'Listen'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Quick Voice suggestions */}
          <View style={styles.quickReplies}>
            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => setInputText('Please call when you reach the gate.')}
            >
              <Text style={styles.quickPillText}>📞 Call at gate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => setInputText('Main water valve has been turned off.')}
            >
              <Text style={styles.quickPillText}>🚰 Valve shut</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => setInputText('What is the estimated time to reach?')}
            >
              <Text style={styles.quickPillText}>⏱️ ETA?</Text>
            </TouchableOpacity>
          </View>

          {/* Input bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type message in your language..."
              placeholderTextColor={theme.colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.disabledSend]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Send size={18} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    height: '85%',
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerInfo: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  translationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDF7EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
  },
  translationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBody: {
    flex: 1,
    padding: theme.spacing.md,
  },
  chatScrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  coopNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  coopNoticeText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 15,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  workerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  originalText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  translationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginTop: 6,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary,
  },
  translationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  translationHeaderLang: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  translatedText: {
    fontSize: 13,
    color: theme.colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  audioButtonText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.textLight,
  },
  quickReplies: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    gap: 8,
    backgroundColor: theme.colors.white,
  },
  quickPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
  },
  quickPillText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  disabledSend: {
    backgroundColor: '#94A3B8',
  },
});
