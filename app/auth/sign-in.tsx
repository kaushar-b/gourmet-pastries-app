import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const PINK_DARK = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_BORDER = '#F3C3C5';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2500);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      router.push('/ManageMyApp');
    }
  };

  const onSignIn = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect email or password.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity onPress={handleLogoTap} activeOpacity={1}>
        <Image source={require('../../assets/icon.png')} style={s.logo} resizeMode="contain" />
      </TouchableOpacity>
      <View style={s.card}>
        <Text style={s.title}>Welcome back</Text>
        <Text style={s.subtitle}>Sign in to your account</Text>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <TextInput style={s.input} placeholder="Email address" placeholderTextColor="#b58a8d" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#b58a8d" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={s.btn} onPress={onSignIn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={s.linkWrap} onPress={() => router.push('/auth/sign-up')}>
          <Text style={s.linkText}>Don't have an account? <Text style={s.link}>Sign up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PINK_LIGHT, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo:      { width: 200, height: 200, marginBottom: 28, borderRadius: 24 },
  card:      { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: PINK_DARK, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 },
  title:     { fontSize: 24, fontWeight: '700', color: '#1a1612', marginBottom: 4 },
  subtitle:  { fontSize: 14, color: '#6b6b6b', marginBottom: 24 },
  error:     { backgroundColor: '#fff0f0', color: '#C65C69', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 },
  input:     { borderWidth: 1, borderColor: PINK_BORDER, borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1612', marginBottom: 14, backgroundColor: PINK_LIGHT },
  btn:       { backgroundColor: PINK_DARK, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  linkWrap:  { marginTop: 20, alignItems: 'center' },
  linkText:  { color: '#6b6b6b', fontSize: 14 },
  link:      { color: PINK_DARK, fontWeight: '600' },
});
