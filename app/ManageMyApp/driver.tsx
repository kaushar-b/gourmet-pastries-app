import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ref, onValue, update, set } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { allergyDisplay, CAKE_TYPE_LABELS } from '../../constants/eventPricing';
import { registerForPushToken, sendPushNotification, CHANNELS } from '../../lib/notifications';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(d: any) { return d ? `${d.day} ${MONTH_NAMES[d.month]} ${d.year}` : '—'; }
function fmtHour(h: any) {
  if (!h) return '—';
  const hr = h.h % 12 === 0 ? 12 : h.h % 12;
  return `${String(hr).padStart(2,'0')}:${String(h.m).padStart(2,'0')} ${h.h >= 12 ? 'PM' : 'AM'}`;
}

type Order = {
  id: string; date: string; name: string; phone: string;
  orderType: 'pickup' | 'delivery'; address?: string; address2?: string;
  paymentMethod?: string | null; tip?: number;
  items: { name: string; price: number; quantity: number; cakeOrder?: any }[];
  total: number; cakeRemaining?: number; paid?: boolean;
  status: string; driverStatus: string | null;
  customerPushToken?: string | null; createdAt: number;
};

function CakeBlock({ cake }: { cake: any }) {
  const Row = ({ l, v }: { l: string; v: string }) => (
    <View style={s.sumRow}><Text style={s.sumLabel}>{l}</Text><Text style={s.sumValue}>{v}</Text></View>
  );
  return (
    <View style={s.cakeBox}>
      <Text style={s.cakeBoxTitle}>Custom Cake</Text>
      <Row l="Occasion" v={cake.occasion === 'Other' ? cake.occasionOther : (cake.occasion || '—')} />
      <Row l="Cake Parts" v={String(cake.cakeParts ?? '—')} />
      <Row l="Flavour" v={(cake.flavours || []).join(', ') || '—'} />
      <Row l="Decoration" v={(cake.decorations || []).join(', ') || '—'} />
      <Row l="Text" v={cake.cakeText?.trim() || 'None'} />
      <Row l="Type" v={CAKE_TYPE_LABELS[cake.cakeType] || '—'} />
      <Row l="Allergies" v={allergyDisplay(cake.allergies, cake.allergyOther)} />
      <Row l="Date" v={fmtDate(cake.date)} />
      <Row l="Time" v={fmtHour(cake.hour)} />
      {cake.tip ? <Row l="Driver Tip" v={`P ${cake.tip}.00`} /> : null}
      <Row l="Balance Due" v={`P ${cake.remaining}.00`} />
    </View>
  );
}

function DriverCard({ order, tab, onPaid }: { order: Order; tab: 'live' | 'completed'; onPaid: () => void }) {
  const [open, setOpen] = useState(false);
  const remaining = order.cakeRemaining ?? 0;
  const notify = (title: string, body: string) => {
    if (order.customerPushToken) sendPushNotification(order.customerPushToken, title, body, CHANNELS.CUSTOMER);
  };
  const markPickedUp = () => Alert.alert('Confirm', 'Mark as picked up from shop?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Yes', onPress: async () => { await update(ref(db, `orders/${order.id}`), { driverStatus: 'picked_up' }); notify('Order Picked Up', 'Your order is on the way!'); }},
  ]);
  const markOnTheWay = () => Alert.alert('Confirm', 'Mark as on the way?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Yes', onPress: async () => { await update(ref(db, `orders/${order.id}`), { driverStatus: 'on_the_way' }); notify('On the Way!', 'Your order is on its way to you!'); }},
  ]);
  const markDelivered = () => Alert.alert('Confirm', 'Mark as delivered?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Yes', onPress: async () => { await update(ref(db, `orders/${order.id}`), { driverStatus: 'delivered', status: 'completed' }); notify('Delivered!', 'Your order has been delivered. Enjoy!'); }},
  ]);

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardDate}>{order.date}</Text>
        <View style={s.typeBadge}><Text style={s.typeBadgeText}>{order.orderType.toUpperCase()}</Text></View>
      </View>
      <Text style={s.cardName}>{order.name}</Text>
      <Text style={s.totalTxt}>Total: P {order.total}.00</Text>
      {remaining > 0 && (
        order.paid
          ? <View style={s.paidBadge}><Ionicons name="checkmark-circle" size={15} color="#22c55e" /><Text style={s.paidBadgeText}>Balance Paid</Text></View>
          : <Text style={s.balanceTxt}>Remaining Balance: P {remaining}.00</Text>
      )}

      <TouchableOpacity style={s.dropToggle} onPress={() => setOpen(o => !o)}>
        <Text style={s.dropToggleText}>{open ? 'Hide' : 'View'} order details</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={PINK_DARK} />
      </TouchableOpacity>

      {open && (
        <View>
          {order.phone ? <View style={s.infoRow}><Ionicons name="call-outline" size={14} color="#6b6b6b" /><Text style={s.infoTxt}>{order.phone}</Text></View> : null}
          {order.address ? <View style={s.infoRow}><Ionicons name="location-outline" size={14} color="#6b6b6b" /><Text style={s.infoTxt}>{order.address}{order.address2 ? `, ${order.address2}` : ''}</Text></View> : null}
          {order.tip ? <View style={s.infoRow}><Ionicons name="gift-outline" size={14} color={PINK_DARK} /><Text style={[s.infoTxt, { color: PINK_DARK, fontWeight: '800' }]}>Driver Tip: P{order.tip}.00</Text></View> : null}
          <View style={s.divider} />
          {order.items?.map((item, i) => (
            <View key={i}>
              <View style={s.itemRow}><Text style={s.itemName}>{item.quantity}× {item.name}</Text><Text style={s.itemPrice}>P {item.price * item.quantity}.00</Text></View>
              {item.cakeOrder && <CakeBlock cake={item.cakeOrder} />}
            </View>
          ))}
        </View>
      )}

      {tab === 'live' && (
        <View style={s.actionCol}>
          {!order.paid && remaining > 0 && (
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#22c55e' }]} onPress={onPaid}><Text style={s.actionBtnTxt}>Mark Balance Paid</Text></TouchableOpacity>
          )}
          {!order.driverStatus && <TouchableOpacity style={s.actionBtn} onPress={markPickedUp}><Text style={s.actionBtnTxt}>Picked Up</Text></TouchableOpacity>}
          {order.driverStatus === 'picked_up' && <TouchableOpacity style={s.actionBtn} onPress={markOnTheWay}><Text style={s.actionBtnTxt}>On the Way</Text></TouchableOpacity>}
          {order.driverStatus === 'on_the_way' && <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#22c55e' }]} onPress={markDelivered}><Text style={s.actionBtnTxt}>Delivered</Text></TouchableOpacity>}
        </View>
      )}
    </View>
  );
}

export default function DriverDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'live' | 'completed'>('live');

  useEffect(() => {
    (async () => { const token = await registerForPushToken(); if (token) await set(ref(db, 'staffTokens/driver'), token); })();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, 'orders'), snap => {
      const all: Order[] = [];
      snap.forEach(child => { const v = child.val(); if (v.assignedToDriver) all.push({ id: child.key!, ...v }); });
      all.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setOrders(all);
    });
    return unsub;
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(auth); router.replace('/auth/sign-in'); } },
    ]);
  };

  const markPaid = async (order: Order) => {
    await update(ref(db, `orders/${order.id}`), { paid: true });
    if (order.customerPushToken) sendPushNotification(order.customerPushToken, 'Payment Confirmed', 'Your remaining balance is marked as paid. Thank you!', CHANNELS.CUSTOMER);
  };

  const liveOrders      = orders.filter(o => o.driverStatus !== 'delivered');
  const completedOrders = orders.filter(o => o.driverStatus === 'delivered');
  const shown = tab === 'live' ? liveOrders : completedOrders;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Driver Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
          <Ionicons name="log-out-outline" size={22} color={PINK_DARK} />
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, tab === 'live' && s.tabBtnActive]} onPress={() => setTab('live')}>
          <Text style={[s.tabBtnText, tab === 'live' && s.tabBtnTextActive]}>Live Orders {liveOrders.length > 0 ? `(${liveOrders.length})` : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'completed' && s.tabBtnActive]} onPress={() => setTab('completed')}>
          <Text style={[s.tabBtnText, tab === 'completed' && s.tabBtnTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {shown.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="car-outline" size={56} color={PINK_MID} />
          <Text style={s.emptyText}>{tab === 'live' ? 'No active deliveries' : 'No completed deliveries'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {shown.map(order => <DriverCard key={order.id} order={order} tab={tab} onPaid={() => markPaid(order)} />)}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: PINK_LIGHT },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  title:            { fontSize: 22, fontWeight: '800', color: '#1a1612' },
  signOutBtn:       { padding: 8 },
  tabRow:           { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  tabBtn:           { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabBtnActive:     { borderBottomWidth: 3, borderBottomColor: PINK_DARK },
  tabBtnText:       { fontSize: 14, fontWeight: '700', color: '#6b6b6b' },
  tabBtnTextActive: { color: PINK_DARK },
  empty:            { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:        { fontSize: 16, fontWeight: '700', color: '#6b6b6b' },
  card:             { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2 },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardDate:         { fontSize: 12, color: '#6b6b6b' },
  typeBadge:        { backgroundColor: PINK_LIGHT, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText:    { fontSize: 10, fontWeight: '900', color: PINK_DARK },
  cardName:         { fontSize: 16, fontWeight: '800', color: '#1a1612', marginBottom: 4 },
  totalTxt:         { fontSize: 15, fontWeight: '800', color: PINK_DARK, marginTop: 4 },
  balanceTxt:       { fontSize: 13, fontWeight: '800', color: '#C65C69', marginTop: 6 },
  paidBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  paidBadgeText:    { fontSize: 13, fontWeight: '800', color: '#22c55e' },
  dropToggle:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: PINK_LIGHT },
  dropToggleText:   { fontSize: 13, fontWeight: '700', color: PINK_DARK },
  infoRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoTxt:          { fontSize: 13, color: '#6b6b6b' },
  divider:          { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 10 },
  itemRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName:         { fontSize: 13, color: '#1a1612' },
  itemPrice:        { fontSize: 13, fontWeight: '600', color: '#1a1612' },
  cakeBox:          { backgroundColor: PINK_LIGHT, borderRadius: 10, padding: 12, marginTop: 6, marginBottom: 6 },
  cakeBoxTitle:     { fontSize: 12, fontWeight: '800', color: PINK_DARK, marginBottom: 6 },
  sumRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sumLabel:         { fontSize: 12, color: '#6b6b6b', fontWeight: '600' },
  sumValue:         { fontSize: 12, color: '#1a1612', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 },
  actionCol:        { gap: 8, marginTop: 12 },
  actionBtn:        { backgroundColor: PINK_DARK, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionBtnTxt:     { fontSize: 14, fontWeight: '800', color: '#fff' },
});
