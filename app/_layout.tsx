import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { CartProvider } from '../context/CartContext';
import { Appearance } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

Appearance.setColorScheme('light');

// ─── STAFF ACCOUNTS ───────────────────────────────────────────
// Manager email is set. Replace DRIVER_EMAIL below with the actual
// driver account email once you create it in Firebase Authentication.
// Passwords are managed in Firebase Authentication console.
const MANAGER_EMAIL = 'gourmetpastries.bw@gmail.com';
const DRIVER_EMAIL  = 'web.expert.remote@gmail.com';
// ──────────────────────────────────────────────────────────────

// ─── BACKGROUND NOTIFICATION TASK ─────────────────────────────
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

if (!TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK)) {
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ error }: any) => {
    if (error) {
      console.error('BG notification task error:', error);
    }
  });
}
// ──────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

function AuthGate() {
  const [user, setUser]     = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const segments            = useSegments();
  const router              = useRouter();

  useEffect(() => {
    Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoaded(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const inAuth   = segments[0] === 'auth';
    const inManage = segments[0] === 'ManageMyApp';

    if (!user && !inAuth && !inManage) {
      router.replace('/auth/sign-in');
      return;
    }

    if (user && inAuth) {
      const email = user.email ?? '';
      if (email === MANAGER_EMAIL) {
        router.replace('/ManageMyApp/dashboard');
      } else if (email === DRIVER_EMAIL) {
        router.replace('/ManageMyApp/driver');
      } else {
        router.replace('/tabs');
      }
      return;
    }

    if (user && segments[0] === 'tabs') {
      const email = user.email ?? '';
      if (email === MANAGER_EMAIL) {
        router.replace('/ManageMyApp/dashboard');
      } else if (email === DRIVER_EMAIL) {
        router.replace('/ManageMyApp/driver');
      }
    }
  }, [loaded, user, segments]);

  if (!loaded) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FADAD9' }}>
      <ActivityIndicator size="large" color="#CE6F79" />
    </View>
  );
  return <Slot />;
}

import { Component, ReactNode } from 'react';
import { ref as dbRef, set as dbSet } from 'firebase/database';
import { db } from '../lib/firebase';
import { Text } from 'react-native';

class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message ?? String(error) };
  }
  componentDidCatch(error: any, info: any) {
    try {
      dbSet(dbRef(db, 'debug/rootCrash'), {
        message: error?.message ?? String(error),
        stack: error?.stack ? String(error.stack).slice(0, 1500) : 'no stack',
        componentStack: info?.componentStack ? String(info.componentStack).slice(0, 1500) : 'no component stack',
        timestamp: Date.now(),
      }).catch(() => {});
    } catch {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FADAD9', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#C65C69', textAlign: 'center', marginBottom: 12 }}>
            Something went wrong starting the app
          </Text>
          <Text style={{ fontSize: 12, color: '#1a1612', textAlign: 'center' }}>{this.state.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <CartProvider>
        <AuthGate />
      </CartProvider>
    </RootErrorBoundary>
  );
}
