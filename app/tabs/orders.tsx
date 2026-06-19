import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';

type Order = {
  id: string;
  date: string;
  orderType: 'pickup' | 'delivery';
  status: string;
  driverStatus?: string | null;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  deposit?: number;
  remaining?: number;
  paid?: boolean;
  cakeOrder?: Record<string, any>;
};

function statusLabel(order: Order): { label: string; color: string; icon: string } {
  if (order.paid) return { label: 'Paid ✓', color: '#22c55e', icon: 'checkmark-circle' };
  if (order.driverStatus === 'delivered') return { label: 'Delivered', color: '#22c55e', icon: 'checkmark-circle' };
  if (order.driverStatus === 'on_the_way') return { label: 'On the Way', color: '#3b82f6', icon: 'car' };
  if (order.driverStatus === 'picked_up') return { label: 'With Driver', color: '#8b5cf6', icon: 'bicycle' };
  if (order.status === 'completed') return { label: 'Ready for Pickup', color: '#f59e0b', icon: 'storefront' };
  if (order.status === 'preparing') return { label: 'Being Prepared', color: '#f97316', icon: 'restaurant' };
  return { label: 'Order Received', color: PINK_DARK, icon: 'receipt' };
}

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUid(u?.uid ?? null));
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const q = ref(db, 'orders');
    const unsub = onValue(q, snap => {
      const all: Order[] = [];
      snap.forEach(child => {
        const v = child.val();
        if (v.userId === uid) {
          all.push({ id: child.key!, ...v });
        }
      });
      all.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setOrders(all);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={PINK_DARK} />
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="receipt-outline" size={64} color={PINK_MID} />
          <Text style={s.emptyText}>No orders yet</Text>
          <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/tabs')}>
            <Text style={s.shopBtnText}>Start Ordering</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {orders.map(order => {
            const { label, color, icon } = statusLabel(order);
            return (
              <View key={order.id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.cardTopLeft}>
                    <Text style={s.cardDate}>{order.date}</Text>
                    <Text style={s.cardType}>{order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: color + '22', borderColor: color }]}>
                    <Ionicons name={icon as any} size={13} color={color} />
                    <Text style={[s.statusText, { color }]}>{label}</Text>
                  </View>
                </View>

                <View style={s.divider} />

                {order.items?.map((item, i) => (
                  <View key={i} style={s.itemRow}>
                    <Text style={s.itemName}>{item.quantity}× {item.name}</Text>
                    <Text style={s.itemPrice}>P {item.price * item.quantity}.00</Text>
                  </View>
                ))}

                {order.cakeOrder && (
                  <View style={s.cakeTag}>
                    <Ionicons name="gift-outline" size={13} color={PINK_DARK} />
                    <Text style={s.cakeTagText}>Custom Cake Order</Text>
                  </View>
                )}

                <View style={s.divider} />

                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Total</Text>
                  <Text style={s.totalVal}>P {order.total}.00</Text>
                </View>

                {order.deposit != null && (
                  <>
                    <View style={s.totalRow}>
                      <Text style={s.totalLabel}>50% Deposit</Text>
                      <Text style={s.totalVal}>P {order.deposit}.00</Text>
                    </View>
                    <View style={s.totalRow}>
                      <Text style={s.toBePaidLabel}>To be Paid</Text>
                      <Text style={[s.toBePaidVal, order.paid && s.paidVal]}>
                        {order.paid ? '✓ Paid' : `P ${order.remaining ?? 0}.00`}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: PINK_LIGHT },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PINK_LIGHT },
  header:       { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  title:        { fontSize: 22, fontWeight: '800', color: '#1a1612' },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyText:    { fontSize: 17, fontWeight: '700', color: '#6b6b6b' },
  shopBtn:      { backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  shopBtnText:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  card:         { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, elevation: 2 },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cardTopLeft:  { gap: 2 },
  cardDate:     { fontSize: 13, fontWeight: '700', color: '#1a1612' },
  cardType:     { fontSize: 12, color: '#6b6b6b' },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  statusText:   { fontSize: 12, fontWeight: '700' },
  divider:      { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 10 },
  itemRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName:     { fontSize: 13, color: '#1a1612', flex: 1 },
  itemPrice:    { fontSize: 13, fontWeight: '600', color: '#1a1612' },
  cakeTag:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cakeTagText:  { fontSize: 12, color: PINK_DARK, fontWeight: '700' },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  totalLabel:   { fontSize: 13, color: '#6b6b6b' },
  totalVal:     { fontSize: 13, fontWeight: '700', color: '#1a1612' },
  toBePaidLabel:{ fontSize: 14, fontWeight: '800', color: '#1a1612' },
  toBePaidVal:  { fontSize: 14, fontWeight: '800', color: PINK_DARK },
  paidVal:      { color: '#22c55e' },
});
