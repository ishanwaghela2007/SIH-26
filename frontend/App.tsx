import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Header } from './src/components/Header';
import { CustomerPortal } from './src/screens/customer/CustomerPortal';
import { WorkerPortal } from './src/screens/worker/WorkerPortal';
import { AdminPortal } from './src/screens/admin/AdminPortal';
import { theme } from './src/theme';

const MainAppContent: React.FC = () => {
  const { role } = useAuth();

  return (
    <View style={styles.appContainer}>
      <Header />
      <View style={styles.portalContent}>
        {role === 'CUSTOMER' && <CustomerPortal />}
        {role === 'WORKER' && <WorkerPortal />}
        {role === 'ADMIN' && <AdminPortal />}
      </View>
    </View>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SafeAreaView style={styles.rootSafe}>
          <StatusBar barStyle="dark-content" backgroundColor="#EDF7EE" />
          <View style={styles.webWrapper}>
            <MainAppContent />
          </View>
        </SafeAreaView>
      </AuthProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  rootSafe: {
    flex: 1,
    backgroundColor: '#EDF7EE',
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 580,
    backgroundColor: theme.colors.bg,
    ...Platform.select({
      web: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 10,
      },
      default: {},
    }),
  },
  portalContent: {
    flex: 1,
  },
});
