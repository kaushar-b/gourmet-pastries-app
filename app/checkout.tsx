import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { ref, set, push } from 'firebase/database';
import { db, auth } from '../lib/firebase';
import { sendPushNotification, CHANNELS } from '../lib/notifications';
import { get } from 'firebase/database';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';
const VAT_RATE   = 0.14;

export default function Checkout() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [orderType, setOrderType]     = useState<'pickup' | 'delivery' | null>(null);
  const [address1, setAddress1]       = useState('');
  const [address2, setAddress2]       = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod' | null>(null);
  const [tip, setTip]                 = useState<number>(0);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [placing, setPlacing]         = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const vatAmount  = Math.round(total * VAT_RATE);
  const grandTotal = total + vatAmount + tip;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!orderType) e.orderType = 'Please select Pickup or Delivery';
    if (orderType === 'delivery' && !paymentMethod) e.paymentMethod = 'Please select a payment method';
    if (!name.trim()) e.name = 'Full name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    if (phone.trim().length !== 8) e.phone = 'Phone number must be 8 digits';
    if (orderType === 'delivery' && !address1.trim()) e.address1 = 'Address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    try {
      const user = auth.currentUser;
      const customerToken = user ? (await get(ref(db, `userTokens/${user.uid}`))).val() : null;

      const orderData = {
        name: name.trim(),
        phone: phone.trim(),
        orderType,
        address: address1.trim(),
        address2: address2.trim(),
        paymentMethod,
        tip,
        items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        subtotal: total,
        total: grandTotal,
        vatAmount,
        status: 'pending',
        assignedToDriver: false,
        driverStatus: null,
        preparingStatus: null,
        paid: false,
        userId: user?.uid ?? null,
        customerPushToken: customerToken,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
      };

      const newOrderRef = push(ref(db, 'orders'));
      await set(newOrderRef, orderData);

      // Notify manager
      const managerSnap = await get(ref(db, 'staffTokens/manager'));
      if (managerSnap.val()) {
        await sendPushNotification(managerSnap.val(), 'New Order!', `Order from ${name.trim()}`, CHANNELS.MANAGER);
      }

      clearCart();
      setOrderPlaced(true);
    } catch (err) {
      Alert.alert('Error', 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0 && !orderPlaced) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1a1612" />
          </TouchableOpacity>
          <Text style={s.title}>Checkout</Text>
        </View>
        <View style={s.empty}>
          <Ionicons name="cart-outline" size={64} color={PINK_MID} />
          <Text style={s.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/menu/menu')}>
            <Text style={s.shopBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (orderPlaced) {
    return (
      <View style={s.confirmContainer}>
        <View style={s.confirmBox}>
          <Ionicons name="checkmark-circle" size={72} color={PINK_DARK} />
          <Text style={s.confirmTitle}>Order Placed!</Text>
          <Text style={s.confirmSub}>We've received your order and will start preparing it shortly.</Text>
          <TouchableOpacity style={s.confirmBtn} onPress={() => router.replace('/tabs')}>
            <Text style={s.confirmBtnText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ordersBtn} onPress={() => router.replace('/tabs/orders')}>
            <Ionicons name="receipt-outline" size={16} color={PINK_DARK} />
            <Text style={s.ordersBtnText}>Track Your Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1a1612" />
          </TouchableOpacity>
          <Text style={s.title}>Checkout</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>

          {/* Order type */}
          <Text style={s.sectionLabel}>How would you like your order?</Text>
          {errors.orderType ? <Text style={s.errTxt}>{errors.orderType}</Text> : null}
          <View style={s.toggleRow}>
            <TouchableOpacity style={[s.toggleBtn, orderType === 'pickup' && s.toggleActive]} onPress={() => setOrderType('pickup')}>
              <Ionicons name="storefront" size={26} color={orderType === 'pickup' ? '#fff' : PINK_DARK} />
              <Text style={[s.toggleTitle, orderType === 'pickup' && s.toggleTitleActive]}>Pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleBtn, orderType === 'delivery' && s.toggleActive]} onPress={() => setOrderType('delivery')}>
              <Ionicons name="car-sport" size={26} color={orderType === 'delivery' ? '#fff' : PINK_DARK} />
              <Text style={[s.toggleTitle, orderType === 'delivery' && s.toggleTitleActive]}>Delivery</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery fields */}
          {orderType === 'delivery' && (
            <>
              <Text style={s.sectionLabel}>Payment Method</Text>
              {errors.paymentMethod ? <Text style={s.errTxt}>{errors.paymentMethod}</Text> : null}
              <View style={s.toggleRow}>
                <TouchableOpacity style={[s.toggleBtn, paymentMethod === 'online' && s.toggleActive]} onPress={() => setPaymentMethod('online')}>
                  <Ionicons name="card" size={22} color={paymentMethod === 'online' ? '#fff' : PINK_DARK} />
                  <Text style={[s.toggleTitle, paymentMethod === 'online' && s.toggleTitleActive]}>Pay Online</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.toggleBtn, paymentMethod === 'cod' && s.toggleActive]} onPress={() => setPaymentMethod('cod')}>
                  <Ionicons name="cash" size={22} color={paymentMethod === 'cod' ? '#fff' : PINK_DARK} />
                  <Text style={[s.toggleTitle, paymentMethod === 'cod' && s.toggleTitleActive]}>Pay on Delivery</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.sectionLabel}>Driver Tip</Text>
              <View style={s.tipRow}>
                {[0, 5, 10, 20].map(amt => (
                  <TouchableOpacity key={amt} style={[s.tipBtn, tip === amt && s.tipBtnActive]} onPress={() => setTip(amt)}>
                    {amt === 0 ? <Ionicons name="remove-circle-outline" size={20} color={tip === 0 ? '#fff' : PINK_DARK} /> : <Text style={[s.tipBtnText, tip === amt && s.tipBtnTextActive]}>P{amt}</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.sectionLabel}>Delivery Address</Text>
              {errors.address1 ? <Text style={s.errTxt}>{errors.address1}</Text> : null}
              <TextInput style={s.input} placeholder="Street / House number" placeholderTextColor="#b58a8d" value={address1} onChangeText={setAddress1} />
              <TextInput style={s.input} placeholder="Area / Suburb" placeholderTextColor="#b58a8d" value={address2} onChangeText={setAddress2} />
            </>
          )}

          {/* Contact */}
          <Text style={s.sectionLabel}>Contact Details</Text>
          {errors.name ? <Text style={s.errTxt}>{errors.name}</Text> : null}
          <TextInput style={s.input} placeholder="Full name" placeholderTextColor="#b58a8d" value={name} onChangeText={setName} />
          {errors.phone ? <Text style={s.errTxt}>{errors.phone}</Text> : null}
          <TextInput style={s.input} placeholder="Phone number (8 digits)" placeholderTextColor="#b58a8d" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={8} />

          {/* Order summary */}
          <Text style={s.sectionLabel}>Order Summary</Text>
          <View style={s.summaryBox}>
            {items.map(item => (
              <View key={item.id} style={s.summaryRow}>
                <Text style={s.summaryItem}>{item.quantity}× {item.name}</Text>
                <Text style={s.summaryPrice}>P {item.price * item.quantity}.00</Text>
              </View>
            ))}
            <View style={s.summaryDivider} />
            <View style={s.summaryRow}><Text style={s.summaryItem}>Subtotal</Text><Text style={s.summaryPrice}>P {total}.00</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryItem}>VAT (14%)</Text><Text style={s.summaryPrice}>P {vatAmount}.00</Text></View>
            {tip > 0 && <View style={s.summaryRow}><Text style={s.summaryItem}>Driver Tip</Text><Text style={s.summaryPrice}>P {tip}.00</Text></View>}
            <View style={s.summaryDivider} />
            <View style={s.summaryRow}><Text style={s.grandLabel}>Total</Text><Text style={s.grandVal}>P {grandTotal}.00</Text></View>
          </View>

        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity style={[s.placeBtn, placing && { opacity: 0.6 }]} onPress={handlePlaceOrder} disabled={placing}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={s.placeBtnText}>{placing ? 'Placing Order...' : `Place Order — P ${grandTotal}.00`}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f9f9f9' },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  backBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: PINK_LIGHT, alignItems: 'center', justifyContent: 'center' },
  title:           { fontSize: 22, fontWeight: '800', color: '#1a1612' },
  sectionLabel:    { fontSize: 15, fontWeight: '700', color: '#1a1612', marginBottom: 8, marginTop: 16 },
  errTxt:          { fontSize: 12, color: '#C65C69', marginBottom: 6 },
  toggleRow:       { flexDirection: 'row', gap: 12, marginBottom: 8 },
  toggleBtn:       { flex: 1, alignItems: 'center', padding: 16, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: PINK_MID, gap: 6, elevation: 1 },
  toggleActive:    { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  toggleTitle:     { fontSize: 14, fontWeight: '800', color: PINK_DARK },
  toggleTitleActive:{ color: '#fff' },
  tipRow:          { flexDirection: 'row', gap: 10, marginBottom: 8 },
  tipBtn:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: PINK_MID },
  tipBtnActive:    { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  tipBtnText:      { fontSize: 14, fontWeight: '800', color: '#1a1612' },
  tipBtnTextActive:{ color: '#fff' },
  input:           { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: PINK_MID, padding: 14, fontSize: 15, color: '#1a1612', marginBottom: 10 },
  summaryBox:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: PINK_MID, elevation: 1 },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryItem:     { fontSize: 13, color: '#6b6b6b', flex: 1, paddingRight: 8 },
  summaryPrice:    { fontSize: 13, fontWeight: '600', color: '#1a1612' },
  summaryDivider:  { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 6 },
  grandLabel:      { fontSize: 16, fontWeight: '800', color: '#1a1612' },
  grandVal:        { fontSize: 16, fontWeight: '800', color: PINK_DARK },
  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: PINK_LIGHT, elevation: 10 },
  placeBtn:        { backgroundColor: PINK_DARK, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeBtnText:    { fontSize: 16, fontWeight: '700', color: '#fff' },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyText:       { fontSize: 17, fontWeight: '700', color: '#6b6b6b' },
  shopBtn:         { backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  shopBtnText:     { fontSize: 15, fontWeight: '700', color: '#fff' },
  confirmContainer:{ flex: 1, backgroundColor: PINK_LIGHT, alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmBox:      { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', elevation: 4, gap: 12 },
  confirmTitle:    { fontSize: 28, fontWeight: '900', color: '#1a1612', textAlign: 'center' },
  confirmSub:      { fontSize: 15, color: '#6b6b6b', textAlign: 'center', lineHeight: 22 },
  confirmBtn:      { backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  confirmBtnText:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  ordersBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: PINK_DARK, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, width: '100%' },
  ordersBtnText:   { fontSize: 15, fontWeight: '700', color: PINK_DARK },
});
