import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../../lib/firebase';
import { registerForPushToken } from '../../lib/notifications';

const PINK_DARK = '#CE6F79';

function CartIcon({ size }: { size: number }) {
  const { count } = useCart();
  return (
    <View>
      <Ionicons name="cart" size={size} color={PINK_DARK} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

function AccountIcon({ size }: { size: number }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);
  const initial = (user?.email?.[0] || 'U').toUpperCase();
  return (
    <View style={[styles.accountIconCircle, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 }]}>
      <Text style={[styles.accountIconText, { fontSize: size * 0.6 }]}>{initial}</Text>
    </View>
  );
}

export default function TabsLayout() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const token = await registerForPushToken();
        if (token) await set(ref(db, `userTokens/${user.uid}`), token);
      } catch {}
    });
    return unsub;
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#FADAD9',
          borderTopWidth: 2,
          height: 108,
          paddingBottom: 46,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: PINK_DARK,
        tabBarInactiveTintColor: PINK_DARK,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', color: PINK_DARK },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarLabel: 'Home', tabBarIcon: ({ size }) => <Ionicons name="home" size={size} color={PINK_DARK} /> }} />
      <Tabs.Screen name="cart" options={{ tabBarLabel: 'Cart', tabBarIcon: ({ size }) => <CartIcon size={size} /> }} />
      <Tabs.Screen name="orders" options={{ tabBarLabel: 'My Order', tabBarIcon: ({ size }) => <Ionicons name="receipt" size={size} color={PINK_DARK} /> }} />
      <Tabs.Screen name="account" options={{ tabBarLabel: 'Account', tabBarIcon: ({ size }) => <AccountIcon size={size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge:             { position: 'absolute', top: -4, right: -6, backgroundColor: '#FADAD9', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  badgeText:         { color: '#1a1612', fontSize: 10, fontWeight: '800' },
  accountIconCircle: { backgroundColor: PINK_DARK, alignItems: 'center', justifyContent: 'center' },
  accountIconText:   { color: '#fff', fontWeight: '800' },
});
