import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const initial = (user?.email?.[0] || 'U').toUpperCase();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileEmail}>{user?.email ?? '—'}</Text>
            <Text style={s.profileSub}>Customer Account</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>

          <TouchableOpacity style={s.row} onPress={() => router.push('/auth/change-password')}>
            <View style={s.rowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={PINK_DARK} />
              <Text style={s.rowText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#aaa" />
          </TouchableOpacity>

          <TouchableOpacity style={s.row} onPress={() => router.push('/tabs/orders')}>
            <View style={s.rowLeft}>
              <Ionicons name="receipt-outline" size={20} color={PINK_DARK} />
              <Text style={s.rowText}>My Orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#aaa" />
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Info</Text>

          <TouchableOpacity style={s.row} onPress={() => router.push('/tabs')}>
            <View style={s.rowLeft}>
              <Ionicons name="home-outline" size={20} color={PINK_DARK} />
              <Text style={s.rowText}>Home</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#aaa" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#C65C69" />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: PINK_LIGHT },
  header:       { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  title:        { fontSize: 22, fontWeight: '800', color: '#1a1612' },
  profileCard:  { backgroundColor: '#fff', borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20, elevation: 2 },
  avatar:       { width: 56, height: 56, borderRadius: 28, backgroundColor: PINK_DARK, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 24, fontWeight: '900', color: '#fff' },
  profileInfo:  { flex: 1 },
  profileEmail: { fontSize: 15, fontWeight: '700', color: '#1a1612', marginBottom: 2 },
  profileSub:   { fontSize: 12, color: '#6b6b6b' },
  section:      { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#6b6b6b', letterSpacing: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, textTransform: 'uppercase' },
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: PINK_LIGHT },
  rowLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText:      { fontSize: 15, fontWeight: '600', color: '#1a1612' },
  signOutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#C65C69', marginTop: 8 },
  signOutText:  { fontSize: 15, fontWeight: '700', color: '#C65C69' },
});
