import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SW } = Dimensions.get('window');
const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';

export default function About() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.push('/tabs')}>
          <Ionicons name="arrow-back" size={24} color="#1a1612" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>About</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.logoWrap}>
          <Image source={require('../assets/pink-icon.png')} style={s.logo} resizeMode="contain" />
        </View>

        <Text style={s.title}>Gourmet Fine Pastries</Text>
        <Text style={s.tagline}>Handcrafted Cakes & Pastries</Text>

        <View style={s.card}>
          <Text style={s.body}>
            Welcome to Gourmet Fine Pastries. We specialise in custom celebration
            cakes, fresh daily pastries, and bakes for every occasion!
            birthdays, weddings, parties and corporate events. Every order is made 
            with the finest ingredients.
          </Text>
        </View>

        <View style={s.card}>
          <View style={s.row}>
            <Ionicons name="location" size={20} color={PINK_DARK} />
            <Text style={s.rowTitle}>Location</Text>
          </View>
          <Text style={s.rowText}>Mowana Park Mall, Phakalane</Text>

          <View style={s.divider} />

          <View style={s.row}>
            <Ionicons name="time" size={20} color={PINK_DARK} />
            <Text style={s.rowTitle}>Hours</Text>
          </View>
          <Text style={s.rowText}>Mon–Sun: 7:00 AM – 10:00 PM</Text>

          <View style={s.divider} />

          <View style={s.row}>
            <Ionicons name="mail" size={20} color={PINK_DARK} />
            <Text style={s.rowTitle}>Contact</Text>
          </View>
          <Text style={s.rowText}>gourmetpastries.bw@gmail.com</Text>
        </View>

        <TouchableOpacity style={s.policyBtn} onPress={() => router.push('/policy')}>
          <Ionicons name="document-text-outline" size={20} color={PINK_DARK} />
          <Text style={s.policyBtnText}>Policies</Text>
          <Ionicons name="chevron-forward" size={20} color={PINK_DARK} />
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: PINK_LIGHT },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: '#fff' },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, width: 70 },
  backText:    { fontSize: 16, fontWeight: '700', color: '#1a1612' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#1a1612', textAlign: 'center' },
  content:     { padding: 20 },
  logoWrap:    { alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 8 },
  logo:        { width: SW * 0.5, height: SW * 0.5 },
  title:       { fontSize: 26, fontWeight: '900', color: PINK_DARK, textAlign: 'center', marginBottom: 4 },
  tagline:     { fontSize: 14, color: '#6b6b6b', textAlign: 'center', marginBottom: 20 },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: PINK_MID },
  body:        { fontSize: 14, color: '#1a1612', lineHeight: 22 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rowTitle:    { fontSize: 15, fontWeight: '800', color: '#1a1612' },
  rowText:     { fontSize: 14, color: '#6b6b6b', marginLeft: 28, lineHeight: 21 },
  policyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: PINK_MID, marginTop: 4 },
  policyBtnText: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1a1612' },
  divider:     { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 14 },
});
