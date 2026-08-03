import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { ref, set, push, get, runTransaction } from 'firebase/database';
import { db, auth } from '../lib/firebase';
import { sendPushNotification, CHANNELS } from '../lib/notifications';
import { VAT_RATE } from '../constants/eventPricing';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';

export default function Checkout() {
  const router = useRouter();
  const { items, clearCart } = useCart();

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

  // Cake items (have cakeOrder): charged 50% deposit now, 50% remaining on collection.
  // Regular items (no cakeOrder): charged 100% now.
  const cakeFull    = items.reduce((sm, i) => sm + (i.cakeOrder ? (i.cakeOrder.total ?? 0) : 0), 0);
  const regularFull = items.reduce((sm, i) => sm + (i.cakeOrder ? 0 : (i.price ?? 0) * (i.quantity ?? 1)), 0);
  const orderTotal  = cakeFull + regularFull;

  const cakeDeposit   = Math.round(cakeFull * 0.5);
  const cakeRemaining = cakeFull - cakeDeposit;
  const vatAmount     = Math.round(orderTotal - orderTotal / (1 + VAT_RATE));
  const grandTotal    = cakeDeposit + regularFull + tip;

  const validate = () => {
    const e: Record<string, string> = {};
    const missing: string[] = [];
    if (!orderType) { e.orderType = 'Please select Pickup or Delivery'; missing.push('Select Pickup or Delivery'); }
    if (!name.trim()) { e.name = 'Full name is required'; missing.push('Enter your full name'); }
    if (!phone.trim()) { e.phone = 'Phone number is required'; missing.push('Enter your phone number'); }
    else if (phone.trim().length !== 8) { e.phone = 'Phone number must be 8 digits'; missing.push('Enter a valid 8-digit phone number'); }
    if (orderType === 'delivery' && !address1.trim()) { e.address1 = 'Address is required'; missing.push('Enter your delivery address'); }
    setErrors(e);
    if (missing.length > 0) {
      Alert.alert('Almost there!', 'Please complete the following:\n\n\u2022 ' + missing.join('\n\u2022 '));
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    try {
      const user = auth.currentUser;
      const customerToken = user ? (await get(ref(db, `userTokens/${user.uid}`))).val() : null;

      // atomic global order number (never block the order if this fails)
      let orderNumber: number | null = null;
      try {
        const txn = await runTransaction(ref(db, 'orderCounter'), (curr) => (curr || 0) + 1);
        orderNumber = txn.snapshot.val();
      } catch (ctrErr) {
        orderNumber = null;
      }

      const enrichedItems = items.map(i => {
        if (!i.cakeOrder) return { name: i.name, price: i.price, quantity: i.quantity, cakeOrder: null };
        const t = i.cakeOrder.total ?? 0;
        const dep = Math.round(t * 0.5);
        return {
          name: i.name, price: i.price, quantity: i.quantity,
          cakeOrder: { ...i.cakeOrder, total: t, deposit: dep, remaining: t - dep, orderType, tip },
        };
      });

      const orderData = {
        orderNumber,
        name: name.trim(),
        phone: '+267' + phone.trim(),
        orderType,
        address: address1.trim(),
        address2: address2.trim(),
        paymentMethod,
        tip,
        items: enrichedItems,
        subtotal: orderTotal,
        total: grandTotal,
        vatAmount,
        cakeRemaining,
        amountPaid: grandTotal,
        status: 'received',
        assignedToDriver: false,
        driverStatus: null,
        paid: false,
        userId: user?.uid ?? null,
        customerPushToken: customerToken,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
      };

      const newOrderRef = push(ref(db, 'orders'));
      await set(newOrderRef, orderData);

      const managerSnap = await get(ref(db, 'staffTokens/manager'));
      if (managerSnap.val()) {
        await sendPushNotification(managerSnap.val(), 'New Order!', `Order from ${name.trim()}`, CHANNELS.MANAGER);
      }

      clearCart();
      setOrderPlaced(true);
    } catch (err: any) {
      Alert.alert('Error', 'Could not place order: ' + (err?.message || 'Please try again'));
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
          <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/event/event')}>
            <Text style={s.shopBtnText}>Build a Cake</Text>
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
          <Text style={s.confirmSub}>We've received your order. We'll start preparing it shortly.</Text>
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

  const hasCake = cakeFull > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1a1612" />
          </TouchableOpacity>
          <Text style={s.title}>Checkout</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 160 }}>

          {hasCake && (
            <View style={s.depositNote}>
              <Ionicons name="information-circle" size={20} color={PINK_DARK} />
              <Text style={s.depositNoteText}>Custom cakes require a 50% deposit to confirm. Menu items are paid in full.</Text>
            </View>
          )}

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
              <Text style={[s.toggleSub, orderType === 'delivery' && s.toggleTitleActive]}>Free</Text>
            </TouchableOpacity>
          </View>

          {orderType === 'delivery' && (
            <>
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
              <TextInput style={[s.input, s.inputFixed]} value="Phakalane" editable={false} />
            </>
          )}

          <Text style={s.sectionLabel}>Contact Details</Text>
          {errors.name ? <Text style={s.errTxt}>{errors.name}</Text> : null}
          <TextInput style={s.input} placeholder="Full name" placeholderTextColor="#b58a8d" value={name} onChangeText={setName} />
          {errors.phone ? <Text style={s.errTxt}>{errors.phone}</Text> : null}
          <View style={s.phoneRow}>
            <View style={s.phonePrefix}><Text style={s.phoneFlag}>🇧🇼</Text><Text style={s.phonePrefixText}>+267</Text></View>
            <TextInput style={s.phoneInput} placeholder="71234567" placeholderTextColor="#b58a8d" value={phone} onChangeText={t => setPhone(t.replace(/[^0-9]/g, '').slice(0, 8))} keyboardType="number-pad" maxLength={8} />
          </View>

          <Text style={s.sectionLabel}>Payment Summary</Text>
          <View style={s.summaryBox}>
            {items.map(item => (
              <View key={item.id} style={s.summaryRow}>
                <Text style={s.summaryItem}>{item.name}{!item.cakeOrder && (item.quantity ?? 1) > 1 ? ` x${item.quantity}` : ''}</Text>
                <Text style={s.summaryPrice}>P {item.cakeOrder ? (item.cakeOrder.total ?? 0) : (item.price ?? 0) * (item.quantity ?? 1)}.00</Text>
              </View>
            ))}
            <View style={s.summaryDivider} />
            <View style={s.summaryRow}><Text style={s.summaryItem}>Total</Text><Text style={s.summaryPrice}>P {orderTotal}.00</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryItem}>VAT incl. (14%)</Text><Text style={s.summaryPrice}>P {vatAmount}.00</Text></View>
            <View style={s.summaryDivider} />
            {hasCake && <View style={s.summaryRow}><Text style={s.summaryItem}>Cake Deposit (50%)</Text><Text style={s.summaryPrice}>P {cakeDeposit}.00</Text></View>}
            {regularFull > 0 && <View style={s.summaryRow}><Text style={s.summaryItem}>Items (paid in full)</Text><Text style={s.summaryPrice}>P {regularFull}.00</Text></View>}
            {orderType === 'delivery' && <View style={s.summaryRow}><Text style={s.summaryItem}>Delivery</Text><Text style={[s.summaryPrice, { color: '#22c55e' }]}>Free</Text></View>}
            {tip > 0 && <View style={s.summaryRow}><Text style={s.summaryItem}>Driver Tip</Text><Text style={s.summaryPrice}>P {tip}.00</Text></View>}
            <View style={s.summaryDivider} />
            <View style={s.summaryRow}><Text style={s.grandLabel}>Pay Now</Text><Text style={s.grandVal}>P {grandTotal}.00</Text></View>
            {hasCake && <View style={s.summaryRow}><Text style={s.summaryItem}>Remaining {orderType === 'delivery' ? '(on delivery)' : '(on collection)'}</Text><Text style={s.summaryPrice}>P {cakeRemaining}.00</Text></View>}
          </View>

        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity style={[s.placeBtn, placing && { opacity: 0.6 }]} onPress={handlePlaceOrder} disabled={placing}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
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
  depositNote:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: PINK_LIGHT, borderRadius: 14, padding: 14, marginBottom: 8 },
  depositNoteText: { fontSize: 13, fontWeight: '700', color: '#1a1612', flex: 1 },
  sectionLabel:    { fontSize: 15, fontWeight: '700', color: '#1a1612', marginBottom: 8, marginTop: 16 },
  errTxt:          { fontSize: 12, color: '#C65C69', marginBottom: 6 },
  toggleRow:       { flexDirection: 'row', gap: 12, marginBottom: 8 },
  toggleBtn:       { flex: 1, alignItems: 'center', padding: 18, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: PINK_MID, gap: 4, elevation: 1 },
  toggleSub:       { fontSize: 11, fontWeight: '800', color: '#22c55e' },
  toggleActive:    { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  toggleTitle:     { fontSize: 15, fontWeight: '800', color: PINK_DARK },
  toggleTitleActive:{ color: '#fff' },
  tipRow:          { flexDirection: 'row', gap: 10, marginBottom: 8 },
  tipBtn:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: PINK_MID },
  tipBtnActive:    { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  tipBtnText:      { fontSize: 14, fontWeight: '800', color: '#1a1612' },
  tipBtnTextActive:{ color: '#fff' },
  input:           { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: PINK_MID, padding: 15, fontSize: 15, color: '#1a1612', marginBottom: 10 },
  phoneRow:        { flexDirection: 'row', gap: 8, marginBottom: 10 },
  phonePrefix:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: PINK_MID, paddingHorizontal: 12 },
  phoneFlag:       { fontSize: 18 },
  phonePrefixText: { fontSize: 15, fontWeight: '800', color: '#1a1612' },
  phoneInput:      { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: PINK_MID, padding:15, fontSize: 15, color: '#1a1612' },
  summaryBox:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: PINK_MID, elevation: 1 },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryItem:     { fontSize: 13, color: '#6b6b6b', flex: 1, paddingRight: 8 },
  inputFixed:      { backgroundColor: '#f3f3f3', color: '#1a1612' },
  summaryPrice:    { fontSize: 13, fontWeight: '600', color: '#1a1612' },
  summaryDivider:  { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 6 },
  grandLabel:      { fontSize: 16, fontWeight: '800', color: '#1a1612' },
  grandVal:        { fontSize: 16, fontWeight: '800', color: PINK_DARK },
  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: PINK_LIGHT, elevation: 10 },
  placeBtn:        { backgroundColor: PINK_DARK, borderRadius: 14, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeBtnText:    { fontSize: 17, fontWeight: '800', color: '#fff' },
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