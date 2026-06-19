import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ref, onValue, update, set, remove } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { registerForPushToken, sendPushNotification, CHANNELS } from '../../lib/notifications';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';

type Order = {
  id: string;
  date: string;
  name: string;
  phone: string;
  orderType: 'pickup' | 'delivery';
  address?: string;
  address2?: string;
  paymentMethod?: string | null;
  tip?: number;
  items: { name: string; price: number; quantity: number }[];
  subtotal?: number;
  total: number;
  deposit?: number;
  remaining?: number;
  paid?: boolean;
  status: string;
  preparingStatus?: string | null;
  assignedToDriver: boolean;
  driverStatus: string | null;
  customerPushToken?: string | null;
  cakeOrder?: Record<string, any>;
  userId?: string;
  createdAt: number;
};

function OrderCard({ order, role }: { order: Order; role: 'live' | 'pickup' | 'delivery' | 'sent' | 'completed' }) {
  const markPreparing = async () => {
    await update(ref(db, `orders/${order.id}`), { status: 'preparing' });
  };

  const markPickupReady = async () => {
    await update(ref(db, `orders/${order.id}`), { preparingStatus: 'ready' });
    if (order.customerPushToken) {
      sendPushNotification(order.customerPushToken, 'Order Ready', 'Your order is ready for pickup!', CHANNELS.CUSTOMER);
    }
  };

  const markPickedUp = () => {
    Alert.alert('Confirm Pickup', 'Mark this order as picked up and move to completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        await update(ref(db, `orders/${order.id}`), { status: 'completed', preparingStatus: 'pickedup' });
        if (order.customerPushToken) {
          sendPushNotification(order.customerPushToken, 'Order Picked Up', 'Thank you! Enjoy!', CHANNELS.CUSTOMER);
        }
      }},
    ]);
  };

  const assignDriver = async () => {
    const driverSnap = await (await import('firebase/database')).get(ref(db, 'staffTokens/driver'));
    await update(ref(db, `orders/${order.id}`), { assignedToDriver: true, driverStatus: null });
    if (driverSnap.val()) {
      sendPushNotification(driverSnap.val(), 'New Delivery', `New order for ${order.name}`, CHANNELS.DRIVER);
    }
  };

  const markPaid = async () => {
    await update(ref(db, `orders/${order.id}`), { paid: true });
    if (order.customerPushToken) {
      sendPushNotification(order.customerPushToken, 'Payment Confirmed', 'Your remaining balance has been marked as paid. Thank you!', CHANNELS.CUSTOMER);
    }
  };

  const deleteOrder = () => {
    Alert.alert('Delete Order', 'Permanently delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await remove(ref(db, `orders/${order.id}`));
      }},
    ]);
  };

  return (
    <View style={c.card}>
      <View style={c.cardHeader}>
        <Text style={c.cardDate}>{order.date}</Text>
        <View style={c.typeBadge}>
          <Text style={c.typeBadgeText}>{order.orderType.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={c.cardName}>{order.name}</Text>

      {order.phone ? (
        <View style={c.infoRow}>
          <Ionicons name="call-outline" size={14} color="#6b6b6b" />
          <Text style={c.infoTxt}>{order.phone}</Text>
        </View>
      ) : null}
      {order.address ? (
        <View style={c.infoRow}>
          <Ionicons name="location-outline" size={14} color="#6b6b6b" />
          <Text style={c.infoTxt}>{order.address}{order.address2 ? `, ${order.address2}` : ''}</Text>
        </View>
      ) : null}
      {order.paymentMethod ? (
        <View style={c.infoRow}>
          <Ionicons name="card-outline" size={14} color="#6b6b6b" />
          <Text style={c.infoTxt}>{order.paymentMethod === 'online' ? 'Pay Online' : 'Pay on Delivery'}</Text>
        </View>
      ) : null}
      {order.tip ? (
        <View style={c.infoRow}>
          <Ionicons name="gift-outline" size={14} color={PINK_DARK} />
          <Text style={[c.infoTxt, { color: PINK_DARK, fontWeight: '800' }]}>Tip: P{order.tip}.00</Text>
        </View>
      ) : null}

      {order.cakeOrder && (
        <View style={c.cakeTag}>
          <Ionicons name="gift-outline" size={13} color={PINK_DARK} />
          <Text style={c.cakeTagText}>Custom Cake Order</Text>
        </View>
      )}

      <View style={c.divider} />

      {order.items?.map((item, i) => (
        <View key={i} style={c.itemRow}>
          <Text style={c.itemName}>{item.quantity}× {item.name}</Text>
          <Text style={c.itemPrice}>P {item.price * item.quantity}.00</Text>
        </View>
      ))}

      <Text style={c.totalTxt}>Total: P {order.total}.00</Text>
      {order.deposit != null && (
        <Text style={c.depositTxt}>Deposit: P {order.deposit}.00 · Remaining: P {order.remaining ?? 0}.00</Text>
      )}

      {order.paid ? (
        <View style={c.paidBadge}>
          <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
          <Text style={c.paidBadgeText}>Paid</Text>
        </View>
      ) : order.remaining != null && order.remaining > 0 ? (
        <TouchableOpacity style={c.paidBtn} onPress={markPaid}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
          <Text style={c.paidBtnTxt}>Mark Paid</Text>
        </TouchableOpacity>
      ) : null}

      {role === 'live' && (
        <View style={c.actionRow}>
          <TouchableOpacity style={c.actionBtn} onPress={markPreparing}>
            <Text style={c.actionBtnTxt}>Preparing</Text>
          </TouchableOpacity>
          {order.orderType === 'delivery' && (
            <TouchableOpacity style={[c.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={assignDriver}>
              <Text style={c.actionBtnTxt}>Send to Driver</Text>
            </TouchableOpacity>
          )}
          {order.orderType === 'pickup' && (
            <TouchableOpacity style={[c.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={markPickupReady}>
              <Text style={c.actionBtnTxt}>Ready for Pickup</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {role === 'pickup' && (
        <TouchableOpacity style={[c.actionBtn, { backgroundColor: '#22c55e', marginTop: 12 }]} onPress={markPickedUp}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={c.actionBtnTxt}>Picked Up</Text>
        </TouchableOpacity>
      )}

      {role === 'sent' && (
        <View style={c.sentNote}>
          <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
          <Text style={c.sentNoteTxt}>Driver is handling this order — status updates live.</Text>
        </View>
      )}

      {role === 'completed' && (
        <TouchableOpacity style={c.deleteBtn} onPress={deleteOrder}>
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={c.deleteBtnTxt}>Delete Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'live' | 'pickup' | 'delivery' | 'sent' | 'completed'>('live');
  const [dateFilter, setDateFilter] = useState('');
  const knownOrderIds = useRef<Set<string>>(new Set());
  const isFirstLoad   = useRef(true);

  useEffect(() => {
    (async () => {
      const token = await registerForPushToken();
      if (token) {
        await set(ref(db, 'staffTokens/manager'), token);
        await set(ref(db, 'debug/managerTokenAttempt'), { token, timestamp: Date.now() });
      }
    })();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, 'orders'), snap => {
      const all: Order[] = [];
      snap.forEach(child => {
        all.push({ id: child.key!, ...child.val() });
      });
      all.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      if (!isFirstLoad.current) {
        all.forEach(o => {
          if (!knownOrderIds.current.has(o.id)) {
            sendPushNotification(
              '', o.id, // token fetched from staffTokens below
              `New Order from ${o.name}`,
              CHANNELS.MANAGER
            );
          }
        });
      }
      isFirstLoad.current = false;
      knownOrderIds.current = new Set(all.map(o => o.id));
      setOrders(all);
    });
    return unsub;
  }, []);

  // Fix: send push to manager token properly
  useEffect(() => {
    const unsub = onValue(ref(db, 'orders'), async snap => {
      if (isFirstLoad.current) return;
      const managerSnap = await (await import('firebase/database')).get(ref(db, 'staffTokens/manager'));
      const managerToken = managerSnap.val();
      if (!managerToken) return;
      snap.forEach(child => {
        if (!knownOrderIds.current.has(child.key!)) {
          const v = child.val();
          sendPushNotification(managerToken, 'New Order!', `Order from ${v.name}`, CHANNELS.MANAGER);
        }
      });
    });
    return unsub;
  }, []);

  const liveOrders      = orders.filter(o => o.status !== 'completed' && o.driverStatus !== 'delivered' && !o.assignedToDriver);
  const pickupOrders    = orders.filter(o => o.orderType === 'pickup' && o.preparingStatus === 'ready' && o.status !== 'completed');
  const deliveryOrders  = orders.filter(o => o.orderType === 'delivery' && !o.assignedToDriver && o.status !== 'completed');
  const sentOrders      = orders.filter(o => o.assignedToDriver && o.driverStatus !== 'delivered');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.driverStatus === 'delivered');

  const filteredCompleted = dateFilter
    ? completedOrders.filter(o => o.date.startsWith(dateFilter) || o.date.split(',')[0].trim() === dateFilter)
    : completedOrders;

  const shown = tab === 'live' ? liveOrders
    : tab === 'pickup' ? pickupOrders
    : tab === 'delivery' ? deliveryOrders
    : tab === 'sent' ? sentOrders
    : filteredCompleted;

  const TABS: { key: typeof tab; label: string; count?: number }[] = [
    { key: 'live',      label: 'Live',        count: liveOrders.length },
    { key: 'pickup',    label: 'Pickup',      count: pickupOrders.length },
    { key: 'delivery',  label: 'Delivery',    count: deliveryOrders.length },
    { key: 'sent',      label: 'With Driver', count: sentOrders.length },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Manager Dashboard</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={s.signOutBtn}>
          <Ionicons name="log-out-outline" size={22} color={PINK_DARK} />
        </TouchableOpacity>
      </View>

      {/* 2×3 tab grid */}
      <View style={s.tabGrid}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabCell, tab === t.key && s.tabCellActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabCellText, tab === t.key && s.tabCellTextActive]}>
              {t.label}
            </Text>
            {t.count != null && t.count > 0 && (
              <View style={s.tabBadge}>
                <Text style={s.tabBadgeText}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'completed' && (
        <View style={s.dateFilterRow}>
          <Text style={s.dateFilterLabel}>Filter:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
            <TouchableOpacity style={[s.dateChip, dateFilter === '' && s.dateChipActive]} onPress={() => setDateFilter('')}>
              <Text style={[s.dateChipTxt, dateFilter === '' && s.dateChipTxtActive]}>All</Text>
            </TouchableOpacity>
            {Array.from(new Set(completedOrders.map(o => o.date.split(',')[0].trim()))).map(d => (
              <TouchableOpacity key={d} style={[s.dateChip, dateFilter === d && s.dateChipActive]} onPress={() => setDateFilter(prev => prev === d ? '' : d)}>
                <Text style={[s.dateChipTxt, dateFilter === d && s.dateChipTxtActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {shown.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="receipt-outline" size={56} color={PINK_MID} />
          <Text style={s.emptyTxt}>
            {tab === 'live' ? 'No live orders' : tab === 'pickup' ? 'No ready pickups' : tab === 'delivery' ? 'No pending deliveries' : tab === 'sent' ? 'No orders with driver' : 'No completed orders'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {shown.map(o => (
            <OrderCard key={o.id} order={o} role={tab} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: PINK_LIGHT },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  title:           { fontSize: 20, fontWeight: '800', color: '#1a1612' },
  signOutBtn:      { padding: 8 },
  tabGrid:         { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  tabCell:         { width: '33.33%', paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', position: 'relative' },
  tabCellActive:   { borderBottomColor: PINK_DARK },
  tabCellText:     { fontSize: 12, fontWeight: '700', color: '#6b6b6b' },
  tabCellTextActive:{ color: PINK_DARK },
  tabBadge:        { position: 'absolute', top: 6, right: 10, backgroundColor: PINK_DARK, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabBadgeText:    { fontSize: 9, fontWeight: '900', color: '#fff' },
  dateFilterRow:   { backgroundColor: '#fff', paddingVertical: 10, paddingLeft: 16, borderBottomWidth: 1, borderBottomColor: PINK_LIGHT, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateFilterLabel: { fontSize: 12, fontWeight: '700', color: '#1a1612', flexShrink: 0 },
  dateChip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f3f3f3', borderWidth: 1, borderColor: '#eee' },
  dateChipActive:  { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  dateChipTxt:     { fontSize: 12, fontWeight: '700', color: '#6b6b6b' },
  dateChipTxtActive:{ color: '#fff' },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTxt:        { fontSize: 16, fontWeight: '700', color: '#1a1612' },
});

const c = StyleSheet.create({
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardDate:     { fontSize: 12, color: '#6b6b6b' },
  typeBadge:    { backgroundColor: PINK_LIGHT, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText:{ fontSize: 10, fontWeight: '900', color: PINK_DARK },
  cardName:     { fontSize: 16, fontWeight: '800', color: '#1a1612', marginBottom: 6 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoTxt:      { fontSize: 13, color: '#6b6b6b' },
  cakeTag:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cakeTagText:  { fontSize: 12, color: PINK_DARK, fontWeight: '700' },
  divider:      { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 10 },
  itemRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName:     { fontSize: 13, color: '#1a1612' },
  itemPrice:    { fontSize: 13, fontWeight: '600', color: '#1a1612' },
  totalTxt:     { fontSize: 15, fontWeight: '800', color: PINK_DARK, marginTop: 8 },
  depositTxt:   { fontSize: 12, color: '#6b6b6b', marginTop: 2 },
  paidBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  paidBadgeText:{ fontSize: 13, fontWeight: '700', color: '#22c55e' },
  paidBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 10 },
  paidBtnTxt:   { fontSize: 13, fontWeight: '800', color: '#fff' },
  actionRow:    { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  actionBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: PINK_DARK, borderRadius: 12, paddingVertical: 12 },
  actionBtnTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
  sentNote:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#eff6ff', borderRadius: 10, padding: 10 },
  sentNoteTxt:  { fontSize: 12, color: '#1d4ed8', flex: 1 },
  deleteBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#6b6b6b' },
  deleteBtnTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
