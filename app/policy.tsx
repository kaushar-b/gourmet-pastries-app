import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';

export default function PrivacyPolicy() {
  const router = useRouter();
  const updated = 'June 2025';

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1a1612" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.updated}>Last updated: {updated}</Text>

        <Text style={s.intro}>
          Gourmet Fine Pastries ("we", "us", or "our") operates the Gourmet Fine Pastries mobile application (the "App"). This Privacy Policy explains how we collect, use, and protect your personal information when you use our App to browse our menu and place custom cake orders.
        </Text>

        <Text style={s.heading}>1. Information We Collect</Text>
        <Text style={s.body}>When you place an order through the App, we collect the following information you provide directly:</Text>
        <Text style={s.bullet}>• Your full name</Text>
        <Text style={s.bullet}>• Your Botswana phone number</Text>
        <Text style={s.bullet}>• Your delivery address (for delivery orders)</Text>
        <Text style={s.bullet}>• Your order details (cake selections, quantities, totals)</Text>
        <Text style={s.bullet}>• Your payment method choice (Pay on Delivery or Online)</Text>
        <Text style={s.body}>We also collect your device's push notification token automatically when you use the App, solely to send you order status updates (such as "Your order is being prepared").</Text>
        <Text style={s.body}>If you create an account, we collect your email address and a securely hashed password via Firebase Authentication.</Text>

        <Text style={s.heading}>2. How We Use Your Information</Text>
        <Text style={s.body}>We use the information we collect only to:</Text>
        <Text style={s.bullet}>• Process and fulfil your cake and pastry orders</Text>
        <Text style={s.bullet}>• Contact you about your order if needed</Text>
        <Text style={s.bullet}>• Send you push notifications about your order status</Text>
        <Text style={s.bullet}>• Allow our bakery and delivery staff to manage orders</Text>
        <Text style={s.body}>We do not use your personal data for advertising, profiling, or any purpose unrelated to your order.</Text>

        <Text style={s.heading}>3. Deposits & Payments</Text>
        <Text style={s.body}>Custom event cakes require a 50% deposit to confirm your order. The remaining balance is due on collection or delivery. Deposits are processed to secure your order and reserve our preparation time.</Text>

        <Text style={s.heading}>4. How We Store Your Information</Text>
        <Text style={s.body}>Your order data is stored securely in Google Firebase Realtime Database, hosted on Google's servers. Firebase is compliant with international data protection standards including GDPR. Your data is protected by Firebase's security rules and is only accessible to authorised Gourmet Fine Pastries staff.</Text>
        <Text style={s.body}>We retain your order information for a period of up to 12 months for operational and record-keeping purposes, after which it may be deleted.</Text>

        <Text style={s.heading}>5. Sharing Your Information</Text>
        <Text style={s.body}>We do not sell, trade, or rent your personal information to any third party. Your information is shared only with:</Text>
        <Text style={s.bullet}>• Our bakery and delivery staff, solely to fulfil your order</Text>
        <Text style={s.bullet}>• Google Firebase (our database and authentication provider)</Text>
        <Text style={s.bullet}>• Expo (our push notification delivery service)</Text>
        <Text style={s.body}>All third-party services we use are bound by their own privacy policies and data protection obligations.</Text>

        <Text style={s.heading}>6. Push Notifications</Text>
        <Text style={s.body}>The App requests permission to send you push notifications. These notifications are used exclusively for order updates (e.g. "Order Received", "Being Prepared", "Ready for Pickup", "Delivered"). You can disable push notifications at any time through your device's notification settings. Disabling notifications will not affect your ability to place orders.</Text>

        <Text style={s.heading}>7. Your Rights</Text>
        <Text style={s.body}>You have the right to:</Text>
        <Text style={s.bullet}>• Request access to the personal data we hold about you</Text>
        <Text style={s.bullet}>• Request correction or deletion of your personal data</Text>
        <Text style={s.bullet}>• Withdraw consent to data processing at any time</Text>
        <Text style={s.body}>To exercise any of these rights, please contact us using the details below.</Text>

        <Text style={s.heading}>8. Children's Privacy</Text>
        <Text style={s.body}>Our App is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.</Text>

        <Text style={s.heading}>9. Changes to This Policy</Text>
        <Text style={s.body}>We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last updated" date above. Continued use of the App after changes are posted constitutes your acceptance of the updated policy.</Text>

        <Text style={s.heading}>10. Contact Us</Text>
        <Text style={s.body}>If you have any questions about this Privacy Policy or how we handle your data, please contact us:</Text>
        <Text style={s.bullet}>• Email: gourmetpastries.bw@gmail.com</Text>
        <Text style={s.bullet}>• Location: Mowana Park Mall, Phakalane, Botswana</Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff' },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, width: 70 },
  backText:    { fontSize: 15, fontWeight: '700', color: '#1a1612' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#1a1612', textAlign: 'center' },
  content:     { padding: 20 },
  updated:     { fontSize: 11, color: '#aaa', marginBottom: 16 },
  intro:       { fontSize: 13, color: '#333', lineHeight: 22, marginBottom: 20 },
  heading:     { fontSize: 14, fontWeight: '800', color: PINK_DARK, marginTop: 20, marginBottom: 8 },
  body:        { fontSize: 13, color: '#333', lineHeight: 22, marginBottom: 8 },
  bullet:      { fontSize: 13, color: '#333', lineHeight: 22, marginLeft: 8, marginBottom: 4 },
});
