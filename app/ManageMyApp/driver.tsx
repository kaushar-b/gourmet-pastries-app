import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ref, onValue, update, set } from 'firebase/database';
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
  total: number;
  deposit?: number;
  status: string;
  driverStatus: string | null;
  customerPushToken?: string | null;
  cakeOrder?: Record<string, any>;
  createdAt: number;
};

export default function DriverDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'live' | 'completed'>('live');

  useEffect(() => {
    (async () => {
      const token = await registerForPushToken();
      if (token) await set(ref(db, 'staffTokens/driver'), token);
    })();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, 'orders'), snap => {
      const all: Order[] = [];
      snap.forEach(child => {
        const v = child.val();
        if (v.assignedToDriver) all.push({ id: child.key!, ...v });
      });
      all.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setOrders(all);
    });
    return unsub;
  }, []);

  const liveOrders      = orders.filter(o => o.driverStatus !== 'delivered');
  const completedOrders = orders.filter(o => o.driverStatus === 'delivered');
  const shown = tab === 'live' ? liveOrders : completedOrders;

  const markPickedUp = (order: Order) => {
    Alert.alert('Confirm', 'Mark as picked up from shop?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        await update(ref(db, `orders/${order.id}`), { driverStatus: 'picked_up' });
        if (order.customerPushToken) {
          sendPushNotification(order.customerPushToken, 'Order Picked Up', 'Your order has been picked up and is on the way!', CHANNELS.CUSTOMER);
        }
      }},
    ]);
  };

  const markOnTheWay = (order: Order) => {
    Alert.alert('Confirm', 'Mark as on the way to customer?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        await update(ref(db, `orders/${order.id}`), { driverStatus: 'on_the_way' });
        if (order.customerPushToken) {
          sendPushNotification(order.customerPushToken, 'On the Way!', 'Your order is on its way to you!', CHANNELS.CUSTOMER);
        }
      }},
    ]);
  };

  const markDelivered = (order: Order) => {
    Alert.alert('Confirm', 'Mark as delivered?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        await update(ref(db, `orders/${order.id}`), { driverStatus: 'delivered', status: 'completed' });
        if (order.customerPushToken) {
          sendPushNotification(order.customerPushToken, 'Delivered!', 'Your order has been delivered. Enjoy!', CHANNELS.CUSTOMER);
        }
      }},
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Driver Dashboard</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={s.signOutBtn}>
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
          {shown.map(order => (
            <View key={order.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardDate}>{order.date}</Text>
                <View style={s.typeBadge}>
                  <Text style={s.typeBadgeText}>{order.orderType.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={s.cardName}>{order.name}</Text>
              {order.phone ? (
                <View style={s.infoRow}>
                  <Ionicons name="call-outline" size={14} color="#6b6b6b" />
                  <Text style={s.infoTxt}>{order.phone}</Text>
                </View>
              ) : null}
              {order.address ? (
                <View style={s.infoRow}>
                  <Ionicons name="location-outline" size={14} color="#6b6b6b" />
                  <Text style={s.infoTxt}>{order.address}{order.address2 ? `, ${order.address2}` : ''}</Text>
                </View>
              ) : null}
              {order.paymentMethod ? (
                <View style={s.infoRow}>
                  <Ionicons name="card-outline" size={14} color="#6b6b6b" />
                  <Text style={s.infoTxt}>{order.paymentMethod === 'online' ? 'Pay Online' : 'Pay on Delivery'}</Text>
                </View>
              ) : null}
              {order.tip ? (
                <View style={s.infoRow}>
                  <Ionicons name="gift-outline" size={14} color={PINK_DARK} />
                  <Text style={[s.infoTxt, { color: PINK_DARK, fontWeight: '800' }]}>Tip: P{order.tip}.00</Text>
                </View>
              ) : null}

              <View style={s.divider} />

              {order.items?.map((item, i) => (
                <View key={i} style={s.itemRow}>
                  <Text style={s.itemName}>{item.quantity}× {item.name}</Text>
                  <Text style={s.itemPrice}>P {item.price * item.quantity}.00</Text>
                </View>
              ))}

              <Text style={s.totalTxt}>Total: P {order.total}.00</Text>

              {tab === 'live' && (
                <View style={s.actionRow}>
                  {!order.driverStatus && (
                    <TouchableOpacity style={s.actionBtn} onPress={() => markPickedUp(order)}>
                      <Text style={s.actionBtnTxt}>Picked Up</Text>
                    </TouchableOpacity>
                  )}
                  {order.driverStatus === 'picked_up' && (
                    <TouchableOpacity style={s.actionBtn} onPress={() => markOnTheWay(order)}>
                      <Text style={s.actionBtnTxt}>On the Way</Text>
                    </TouchableOpacity>
                  )}
                  {order.driverStatus === 'on_the_way' && (
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => markDelivered(order)}>
                      <Text style={s.actionBtnTxt}>Delivered</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
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
  cardName:         { fontSize: 16, fontWeight: '800', color: '#1a1612', marginBottom: 6 },
  infoRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoTxt:          { fontSize: 13, color: '#6b6b6b' },
  divider:          { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 10 },
  itemRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName:         { fontSize: 13, color: '#1a1612' },
  itemPrice:        { fontSize: 13, fontWeight: '600', color: '#1a1612' },
  totalTxt:         { fontSize: 15, fontWeight: '800', color: PINK_DARK, marginTop: 8 },
  actionRow:        { marginTop: 12, gap: 8 },
  actionBtn:        { backgroundColor: PINK_DARK, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionBtnTxt:     { fontSize: 14, fontWeight: '800', color: '#fff' },
});
