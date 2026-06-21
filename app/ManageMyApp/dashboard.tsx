import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ref, onValue, update, set, remove, get } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { registerForPushToken, sendPushNotification, CHANNELS } from '../../lib/notifications';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TYPE_LABELS: Record<string, string> = {
  round: 'Round', tall_round: 'Tall Round', tall_flat: 'Tall Flat', square_flat: 'Square Flat',
  tiered: 'Tiered', sheet: 'Sheet Cake', heart: 'Heart Shaped', number: 'Number/Alphabet',
  cupcake_tower: 'Cupcake Tower', sculpted: 'Sculpted',
};
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
  subtotal?: number; total: number; vatAmount?: number; cakeRemaining?: number;
  paid?: boolean; status: string; assignedToDriver?: boolean;
  driverStatus?: string | null; customerPushToken?: string | null;
  userId?: string; createdAt: number;
};

function CakeBlock({ cake }: { cake: any }) {
  const Row = ({ l, v }: { l: string; v: string }) => (
    <View style={c.sumRow}><Text style={c.sumLabel}>{l}</Text><Text style={c.sumValue}>{v}</Text></View>
  );
  return (
    <View style={c.cakeBox}>
      <Text style={c.cakeBoxTitle}>Custom Cake</Text>
      <Row l="Occasion" v={cake.occasion === 'Other' ? cake.occasionOther : (cake.occasion || '—')} />
      <Row l="Cake Parts" v={String(cake.cakeParts ?? '—')} />
      <Row l="Flavour" v={cake.flavour === 'Other' ? cake.flavourOther : (cake.flavour || '—')} />
      <Row l="Type" v={cake.cakeType === 'number' ? cake.cakeTypeOther : (TYPE_LABELS[cake.cakeType] || '—')} />
      <Row l="Allergies" v={cake.allergies?.length ? cake.allergies.join(', ') + (cake.allergyOther ? ` (${cake.allergyOther})` : '') : 'None'} />
      <Row l="Date" v={fmtDate(cake.date)} />
      <Row l="Time" v={fmtHour(cake.hour)} />
      {cake.tip ? <Row l="Driver Tip" v={`P ${cake.tip}.00`} /> : null}
      <Row l="Full Price" v={`P ${cake.total}.00`} />
      <Row l="Deposit Paid" v={`P ${cake.deposit}.00`} />
      <Row l="Balance Due" v={`P ${cake.remaining}.00`} />
    </View>
  );
}

function OrderCard({ order, role }: { order: Order; role: 'live' | 'ready' | 'driver' | 'completed' }) {
  const [open, setOpen] = useState(false);
  const remaining = order.cakeRemaining ?? 0;

  const notifyCustomer = (title: string, body: string) => {
    if (order.customerPushToken) sendPushNotification(order.customerPushToken, title, body, CHANNELS.CUSTOMER);
  };

  const markPreparing = async () => {
    await update(ref(db, `orders/${order.id}`), { status: 'preparing' });
    notifyCustomer('Order Update', 'Your order is being prepared!');
  };
  const markReadyPickup = async () => {
    await update(ref(db, `orders/${order.id}`), { status: 'ready' });
    notifyCustomer('Order Ready', 'Your order is ready for pickup!');
  };
  const assignDriver = async () => {
    const driverSnap = await get(ref(db, 'staffTokens/driver'));
    await update(ref(db, `orders/${order.id}`), { assignedToDriver: true, driverStatus: null });
    if (driverSnap.val()) sendPushNotification(driverSnap.val(), 'New Delivery', `New order for ${order.name}`, CHANNELS.DRIVER);
    notifyCustomer('Order Update', 'Your order has been assigned to a driver!');
  };
  const markPaid = async () => {
    await update(ref(db, `orders/${order.id}`), { paid: true });
    notifyCustomer('Payment Confirmed', 'Your remaining balance is marked as paid. Thank you!');
  };
  const markCompleted = () => {
    Alert.alert('Complete Order', 'Mark this order as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        await update(ref(db, `orders/${order.id}`), { status: 'completed' });
        notifyCustomer('Order Complete', 'Thank you! Enjoy!');
      }},
    ]);
  };
  const deleteOrder = () => {
    Alert.alert('Delete Order', 'Permanently delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(ref(db, `orders/${order.id}`)); }},
    ]);
  };

  return (
    <View style={c.card}>
      <View style={c.cardHeader}>
        <Text style={c.cardDate}>{order.date}</Text>
        <View style={c.typeBadge}><Text style={c.typeBadgeText}>{order.orderType.toUpperCase()}</Text></View>
      </View>
      <Text style={c.cardName}>{order.name}</Text>
      <Text style={c.totalTxt}>Paid Now: P {order.total}.00</Text>

      {remaining > 0 && (
        order.paid ? (
          <View style={c.paidBadge}>
            <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
            <Text style={c.paidBadgeText}>Balance Paid</Text>
          </View>
        ) : (
          <Text style={c.balanceTxt}>Remaining Balance: P {remaining}.00</Text>
        )
      )}

      <TouchableOpacity style={c.dropToggle} onPress={() => setOpen(o => !o)}>
        <Text style={c.dropToggleText}>{open ? 'Hide' : 'View'} order details</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={PINK_DARK} />
      </TouchableOpacity>

      {open && (
        <View>
          {order.phone ? <View style={c.infoRow}><Ionicons name="call-outline" size={14} color="#6b6b6b" /><Text style={c.infoTxt}>{order.phone}</Text></View> : null}
          {order.address ? <View style={c.infoRow}><Ionicons name="location-outline" size={14} color="#6b6b6b" /><Text style={c.infoTxt}>{order.address}{order.address2 ? `, ${order.address2}` : ''}</Text></View> : null}
          {order.paymentMethod ? <View style={c.infoRow}><Ionicons name="card-outline" size={14} color="#6b6b6b" /><Text style={c.infoTxt}>{order.paymentMethod === 'online' ? 'Pay Online' : 'Pay on Delivery'}</Text></View> : null}
          {order.tip ? <View style={c.infoRow}><Ionicons name="gift-outline" size={14} color={PINK_DARK} /><Text style={[c.infoTxt, { color: PINK_DARK, fontWeight: '800' }]}>Driver Tip: P{order.tip}.00</Text></View> : null}
          <View style={c.divider} />
          {order.items?.map((item, i) => (
            <View key={i}>
              <View style={c.itemRow}>
                <Text style={c.itemName}>{item.quantity}× {item.name}</Text>
                <Text style={c.itemPrice}>P {item.price * item.quantity}.00</Text>
              </View>
              {item.cakeOrder && <CakeBlock cake={item.cakeOrder} />}
            </View>
          ))}
          <View style={c.divider} />
          <Text style={c.totalTxt}>Order Total: P {order.total}.00</Text>
        </View>
      )}

      {/* Actions */}
      {role === 'live' && (
        <View style={c.actionRow}>
          <TouchableOpacity style={c.actionBtn} onPress={markPreparing}><Text style={c.actionBtnTxt}>Preparing</Text></TouchableOpacity>
          {order.orderType === 'pickup'
            ? <TouchableOpacity style={[c.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={markReadyPickup}><Text style={c.actionBtnTxt}>Ready for Pickup</Text></TouchableOpacity>
            : <TouchableOpacity style={[c.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={assignDriver}><Text style={c.actionBtnTxt}>Assign to Driver</Text></TouchableOpacity>}
        </View>
      )}

      {role === 'ready' && (
        <View style={c.actionRow}>
          {!order.paid && remaining > 0 ? (
            <TouchableOpacity style={[c.actionBtn, { backgroundColor: '#22c55e' }]} onPress={markPaid}><Text style={c.actionBtnTxt}>Paid</Text></TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[c.actionBtn, (!order.paid && remaining > 0) && c.actionBtnDisabled]}
            disabled={!order.paid && remaining > 0}
            onPress={markCompleted}
          ><Text style={c.actionBtnTxt}>Completed</Text></TouchableOpacity>
        </View>
      )}

      {role === 'driver' && (
        <View style={c.actionRow}>
          {!order.paid && remaining > 0 && (
            <TouchableOpacity style={[c.actionBtn, { backgroundColor: '#22c55e' }]} onPress={markPaid}><Text style={c.actionBtnTxt}>Paid</Text></TouchableOpacity>
          )}
          <View style={[c.sentNote, { flex: 1 }]}>
            <Ionicons name="car-outline" size={15} color="#3b82f6" />
            <Text style={c.sentNoteTxt}>{order.driverStatus === 'on_the_way' ? 'On the way' : order.driverStatus === 'picked_up' ? 'Picked up' : 'With driver'}</Text>
          </View>
        </View>
      )}

      {role === 'completed' && (
        <TouchableOpacity style={c.deleteBtn} onPress={deleteOrder}>
          <Ionicons name="trash-outline" size={16} color="#fff" /><Text style={c.deleteBtnTxt}>Delete Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'live' | 'ready' | 'driver' | 'completed'>('live');

  useEffect(() => {
    (async () => {
      const token = await registerForPushToken();
      if (token) await set(ref(db, 'staffTokens/manager'), token);
    })();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, 'orders'), snap => {
      const all: Order[] = [];
      snap.forEach(child => { all.push({ id: child.key!, ...child.val() }); });
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

  const liveOrders      = orders.filter(o => o.status !== 'completed' && o.status !== 'ready' && !o.assignedToDriver);
  const readyOrders     = orders.filter(o => o.orderType === 'pickup' && o.status === 'ready');
  const driverOrders    = orders.filter(o => o.assignedToDriver && o.driverStatus !== 'delivered' && o.status !== 'completed');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.driverStatus === 'delivered');

  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: 'live',      label: 'Live Orders',   count: liveOrders.length },
    { key: 'ready',     label: 'Ready Pickups', count: readyOrders.length },
    { key: 'driver',    label: 'With Driver',   count: driverOrders.length },
    { key: 'completed', label: 'Completed',     count: completedOrders.length },
  ];

  const shown = tab === 'live' ? liveOrders : tab === 'ready' ? readyOrders : tab === 'driver' ? driverOrders : completedOrders;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Manager Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
          <Ionicons name="log-out-outline" size={22} color={PINK_DARK} />
        </TouchableOpacity>
      </View>

      <View style={s.tabGrid}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.tabCell, tab === t.key && s.tabCellActive]} onPress={() => setTab(t.key)}>
            <Text style={[s.tabCellText, tab === t.key && s.tabCellTextActive]}>{t.label}</Text>
            {t.count > 0 && <View style={s.tabBadge}><Text style={s.tabBadgeText}>{t.count}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      {shown.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="receipt-outline" size={56} color={PINK_MID} />
          <Text style={s.emptyTxt}>No orders here</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {shown.map(o => <OrderCard key={o.id} order={o} role={tab} />)}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: PINK_LIGHT },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  title:            { fontSize: 20, fontWeight: '800', color: '#1a1612' },
  signOutBtn:       { padding: 8 },
  tabGrid:          { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  tabCell:          { width: '47%', flexGrow: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 12, borderWidth: 2, borderColor: PINK_MID, backgroundColor: '#fff', position: 'relative' },
  tabCellActive:    { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  tabCellText:      { fontSize: 13, fontWeight: '800', color: PINK_DARK },
  tabCellTextActive:{ color: '#fff' },
  tabBadge:         { position: 'absolute', top: 8, right: 10, backgroundColor: '#C65C69', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText:     { fontSize: 10, fontWeight: '900', color: '#fff' },
  empty:            { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTxt:         { fontSize: 16, fontWeight: '700', color: '#1a1612' },
});

const c = StyleSheet.create({
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardDate:     { fontSize: 12, color: '#6b6b6b' },
  typeBadge:    { backgroundColor: PINK_LIGHT, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText:{ fontSize: 10, fontWeight: '900', color: PINK_DARK },
  cardName:     { fontSize: 16, fontWeight: '800', color: '#1a1612', marginBottom: 4 },
  totalTxt:     { fontSize: 15, fontWeight: '800', color: PINK_DARK, marginTop: 4 },
  balanceTxt:   { fontSize: 13, fontWeight: '800', color: '#C65C69', marginTop: 6 },
  paidBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  paidBadgeText:{ fontSize: 13, fontWeight: '800', color: '#22c55e' },
  dropToggle:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: PINK_LIGHT },
  dropToggleText:{ fontSize: 13, fontWeight: '700', color: PINK_DARK },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoTxt:      { fontSize: 13, color: '#6b6b6b' },
  divider:      { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 10 },
  itemRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName:     { fontSize: 13, color: '#1a1612' },
  itemPrice:    { fontSize: 13, fontWeight: '600', color: '#1a1612' },
  cakeBox:      { backgroundColor: PINK_LIGHT, borderRadius: 10, padding: 12, marginTop: 6, marginBottom: 6 },
  cakeBoxTitle: { fontSize: 12, fontWeight: '800', color: PINK_DARK, marginBottom: 6 },
  sumRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sumLabel:     { fontSize: 12, color: '#6b6b6b', fontWeight: '600' },
  sumValue:     { fontSize: 12, color: '#1a1612', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 },
  actionRow:    { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  actionBtn:    { flex: 1, minWidth: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: PINK_DARK, borderRadius: 12, paddingVertical: 12 },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
  sentNote:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderRadius: 10, padding: 10 },
  sentNoteTxt:  { fontSize: 12, color: '#1d4ed8', flex: 1 },
  deleteBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#6b6b6b' },
  deleteBtnTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
