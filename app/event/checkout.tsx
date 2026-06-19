import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../context/CartContext';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';
const VAT_RATE = 0.14;

// ─────────────────────────────────────────────────────────────
// CAKE BASE PRICES — vary by type and flavour.
// Update these values to match your actual pricing.
const CAKE_TYPE_PRICES: Record<string, number> = {
  round: 350, tall_round: 420, tall_flat: 400, square_flat: 380,
  tiered: 650, sheet: 320, heart: 390, number: 410,
  cupcake_tower: 500, sculpted: 700, none: 350,
};
const FLAVOUR_SURCHARGES: Record<string, number> = {
  Chocolate: 30, Vanilla: 0, Coffee: 20, Fruit: 40,
  Lemon: 20, Other: 50, 'None / Skip': 0,
};
// ─────────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function EventCheckout() {
  const router = useRouter();
  const { addToCart } = useCart();
  const params = useLocalSearchParams<{ eventData: string }>();
  const eventData = params.eventData ? JSON.parse(params.eventData) : null;

  const [orderType, setOrderType] = useState<'pickup' | 'delivery' | null>(null);
  const [tip, setTip]             = useState<number | null>(null);
  const [placing, setPlacing]     = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (!eventData) {
    return (
      <View style={s.confirmContainer}>
        <Text style={s.confirmSub}>No order data found. Please start again from the Event page.</Text>
        <TouchableOpacity style={s.confirmBtn} onPress={() => router.replace('/event/event')}>
          <Text style={s.confirmBtnText}>Back to Event Builder</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cakeName = `Custom ${eventData.occasion && eventData.occasion !== 'None / Skip' ? eventData.occasion + ' ' : ''}Cake`;
  const basePrice = CAKE_TYPE_PRICES[eventData.cakeType ?? 'none'] ?? 350;
  const flavourExtra = FLAVOUR_SURCHARGES[eventData.flavour ?? 'None / Skip'] ?? 0;
  const total = basePrice + flavourExtra;
  const deposit = Math.round(total * 0.5);
  const remaining = total - deposit;
  const vatAmount = Math.round(total * VAT_RATE);
  const grandTotal = total + vatAmount + (tip ?? 0);
  const depositDue = deposit + vatAmount + (tip ?? 0);

  const buildCartItem = () => ({
    id: `event-${Date.now()}`,
    name: cakeName,
    price: grandTotal,
    icon: 'gift',
    cakeOrder: {
      ...eventData,
      orderType,
      tip: tip ?? 0,
      total,
      deposit,
      remaining,
      vatAmount,
      grandTotal,
    },
  });

  const handleAddToCart = () => {
    if (!orderType) { Alert.alert('Select an option', 'Please choose Pickup or Delivery.'); return; }
    const item = buildCartItem();
    addToCart(item.id, item);
    router.replace('/tabs/cart');
  };

  const handlePayNow = () => {
    if (!orderType) { Alert.alert('Select an option', 'Please choose Pickup or Delivery.'); return; }
    setPlacing(true);
    // Stub: behaves like a real order placement for now.
    // TODO: integrate Absa payment gateway here — replace this stub with
    // the actual payment redirect/confirmation flow once Absa merchant
    // ecommerce account + API credentials are set up.
    setTimeout(() => {
      setPlacing(false);
      setOrderPlaced(true);
    }, 800);
  };

  if (orderPlaced) {
    return (
      <View style={s.confirmContainer}>
        <View style={s.confirmBox}>
          <Ionicons name="checkmark-circle" size={72} color={PINK_DARK} />
          <Text style={s.confirmTitle}>Order Placed!</Text>
          <Text style={s.confirmSub}>Your deposit has been received. We'll be in touch to confirm details.</Text>
          <TouchableOpacity style={s.confirmBtn} onPress={() => router.replace('/tabs')}>
            <Text style={s.confirmBtnText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ordersBtn} onPress={() => router.replace('/tabs/orders')}>
            <Ionicons name="navigate" size={16} color={PINK_DARK} />
            <Text style={s.ordersBtnText}>Track Your Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1612" />
        </TouchableOpacity>
        <Text style={s.title}>Event Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 130 }}>

        <View style={s.depositNote}>
          <Ionicons name="information-circle" size={20} color={PINK_DARK} />
          <Text style={s.depositNoteText}>50% Down Payment required to confirm your order</Text>
        </View>

        <Text style={s.sectionLabel}>How would you like your order?</Text>
        <View style={s.toggleRow}>
          <TouchableOpacity style={[s.toggleBtn, orderType === 'delivery' && s.toggleActive]} onPress={() => setOrderType('delivery')}>
            <Ionicons name="car-sport" size={28} color={orderType === 'delivery' ? '#fff' : PINK_DARK} />
            <Text style={[s.toggleTitle, orderType === 'delivery' && s.toggleTitleActive]}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toggleBtn, orderType === 'pickup' && s.toggleActive]} onPress={() => setOrderType('pickup')}>
            <Ionicons name="storefront" size={28} color={orderType === 'pickup' ? '#fff' : PINK_DARK} />
            <Text style={[s.toggleTitle, orderType === 'pickup' && s.toggleTitleActive]}>Pickup</Text>
          </TouchableOpacity>
        </View>

        {orderType === 'delivery' && (
          <>
            <Text style={s.sectionLabel}>Driver Tip</Text>
            <View style={s.tipRow}>
              <TouchableOpacity style={[s.tipBtn, tip === null && s.tipBtnActive]} onPress={() => setTip(null)}>
                <Ionicons name="remove-circle-outline" size={22} color={tip === null ? '#fff' : PINK_DARK} />
              </TouchableOpacity>
              {[5, 10, 20].map(amt => (
                <TouchableOpacity key={amt} style={[s.tipBtn, tip === amt && s.tipBtnActive]} onPress={() => setTip(amt)}>
                  <Text style={[s.tipBtnText, tip === amt && s.tipBtnTextActive]}>P{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={s.sectionLabel}>Order Summary</Text>
        <View style={s.summaryBox}>
          <View style={s.summaryRow}><Text style={s.summaryItem}>{cakeName}</Text><Text style={s.summaryPrice}>P {total}.00</Text></View>
          <View style={s.summaryDivider} />
          <View style={s.summaryRow}><Text style={s.summaryItem}>Total</Text><Text style={s.summaryPrice}>P {total}.00</Text></View>
          <View style={s.summaryRow}><Text style={s.summaryItem}>50% Deposit</Text><Text style={s.summaryPrice}>P {deposit}.00</Text></View>
          <View style={s.summaryRow}><Text style={s.summaryItem}>Remaining</Text><Text style={s.summaryPrice}>P {remaining}.00</Text></View>
          <View style={s.summaryRow}><Text style={s.summaryItem}>VAT (14%)</Text><Text style={s.summaryPrice}>P {vatAmount}.00</Text></View>
          {tip ? <View style={s.summaryRow}><Text style={s.summaryItem}>Driver Tip</Text><Text style={s.summaryPrice}>P {tip}.00</Text></View> : null}
          <View style={s.summaryDivider} />
          <View style={s.summaryRow}><Text style={s.summaryTotal}>Due Now</Text><Text style={s.summaryTotalAmt}>P {depositDue}.00</Text></View>
        </View>

      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.payBtn, placing && { opacity: 0.6 }]} onPress={handlePayNow} disabled={placing}>
          <Ionicons name="card" size={20} color="#fff" />
          <Text style={s.payBtnText}>{placing ? 'Processing...' : `Pay Now — P ${depositDue}.00`}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.addCartBtn} onPress={handleAddToCart}>
          <Ionicons name="cart" size={20} color={PINK_DARK} />
          <Text style={s.addCartBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f9f9f9' },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, gap: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  backBtn:          { width: 44, height: 44, borderRadius: 22, backgroundColor: PINK_LIGHT, alignItems: 'center', justifyContent: 'center' },
  title:            { fontSize: 22, fontWeight: '800', color: '#1a1612' },
  depositNote:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: PINK_LIGHT, borderRadius: 14, padding: 14, marginBottom: 20 },
  depositNoteText:  { fontSize: 13, fontWeight: '700', color: '#1a1612', flex: 1 },
  sectionLabel:     { fontSize: 15, fontWeight: '700', color: '#1a1612', marginBottom: 8, marginTop: 8 },
  toggleRow:        { flexDirection: 'row', gap: 12, marginBottom: 24 },
  toggleBtn:        { flex: 1, alignItems: 'center', padding: 18, borderRadius: 16, backgroundColor: '#fff', borderWidth: 2, borderColor: PINK_MID, gap: 6, elevation: 1 },
  toggleActive:     { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  toggleTitle:      { fontSize: 16, fontWeight: '800', color: PINK_DARK },
  toggleTitleActive:{ color: '#fff' },
  tipRow:           { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tipBtn:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: PINK_MID, elevation: 1 },
  tipBtnActive:     { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  tipBtnText:       { fontSize: 15, fontWeight: '800', color: '#1a1612' },
  tipBtnTextActive: { color: '#fff' },
  summaryBox:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: PINK_MID, elevation: 1 },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryItem:      { fontSize: 14, color: '#6b6b6b', flex: 1, paddingRight: 8 },
  summaryPrice:     { fontSize: 14, fontWeight: '600', color: '#1a1612' },
  summaryDivider:   { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 6 },
  summaryTotal:     { fontSize: 16, fontWeight: '800', color: '#1a1612' },
  summaryTotalAmt:  { fontSize: 16, fontWeight: '800', color: PINK_DARK },
  footer:           { padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: PINK_LIGHT, backgroundColor: '#fff', gap: 10 },
  payBtn:           { backgroundColor: PINK_DARK, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnText:       { fontSize: 16, fontWeight: '700', color: '#fff' },
  addCartBtn:       { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: PINK_DARK },
  addCartBtnText:   { fontSize: 15, fontWeight: '700', color: PINK_DARK },
  confirmContainer: { flex: 1, backgroundColor: PINK_LIGHT, alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmBox:       { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', elevation: 4, gap: 12 },
  confirmTitle:     { fontSize: 28, fontWeight: '900', color: '#1a1612', textAlign: 'center' },
  confirmSub:       { fontSize: 15, color: '#6b6b6b', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  confirmBtn:       { backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  confirmBtnText:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  ordersBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: PINK_DARK, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, width: '100%' },
  ordersBtnText:    { fontSize: 15, fontWeight: '700', color: PINK_DARK },
});
