import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const PINK_DARK = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_BORDER = '#F3C3C5';

export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onChange = async () => {
    if (!current || !next || !confirm) { setError('Please fill in all fields.'); return; }
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    if (next.length < 6) { setError('Password must be at least 6 characters.'); return; }
    const user = auth.currentUser;
    if (!user || !user.email) { setError('Not signed in.'); return; }
    setLoading(true);
    setError('');
    try {
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, next);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Current password is incorrect.');
      } else {
        setError('Could not change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <Text style={s.title}>Change Password</Text>
        {success ? (
          <>
            <Text style={s.subtitle}>Your password has been updated.</Text>
            <TouchableOpacity style={s.btn} onPress={() => router.back()}>
              <Text style={s.btnText}>Done</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.subtitle}>Enter your current and new password</Text>
            {error ? <Text style={s.error}>{error}</Text> : null}
            <TextInput style={s.input} placeholder="Current password" placeholderTextColor="#b58a8d" value={current} onChangeText={setCurrent} secureTextEntry />
            <TextInput style={s.input} placeholder="New password" placeholderTextColor="#b58a8d" value={next} onChangeText={setNext} secureTextEntry />
            <TextInput style={s.input} placeholder="Confirm new password" placeholderTextColor="#b58a8d" value={confirm} onChangeText={setConfirm} secureTextEntry />
            <TouchableOpacity style={s.btn} onPress={onChange} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Update Password</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PINK_LIGHT, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:      { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: PINK_DARK, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 },
  title:     { fontSize: 24, fontWeight: '700', color: '#1a1612', marginBottom: 4 },
  subtitle:  { fontSize: 14, color: '#6b6b6b', marginBottom: 24 },
  error:     { backgroundColor: '#fff0f0', color: '#C65C69', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 },
  input:     { borderWidth: 1, borderColor: PINK_BORDER, borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1612', marginBottom: 14, backgroundColor: PINK_LIGHT },
  btn:       { backgroundColor: PINK_DARK, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText:   { fontSize: 16, fontWeight: '700', color: '#fff' },
});
