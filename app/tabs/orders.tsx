import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ref, onValue } from 'firebase/database';
import { allergyDisplay, CAKE_TYPE_LABELS } from '../../constants/eventPricing';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';

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
  id: string; date: string; orderType: 'pickup' | 'delivery';
  status: string; driverStatus?: string | null;
  items: { name: string; price: number; quantity: number; cakeOrder?: any }[];
  total: number; cakeRemaining?: number; paid?: boolean;
  createdAt?: number;
};

function statusLabel(o: Order): { label: string; color: string; icon: string } {
  if (o.status === 'completed' || o.driverStatus === 'delivered') return { label: 'Completed', color: '#22c55e', icon: 'checkmark-circle' };
  if (o.driverStatus === 'on_the_way') return { label: 'On the Way!', color: '#3b82f6', icon: 'car' };
  if (o.status === 'ready') return { label: 'Ready to Pickup', color: '#22c55e', icon: 'storefront' };
  if (o.status === 'preparing') return { label: 'Preparing', color: '#f59e0b', icon: 'restaurant' };
  return { label: 'Pending', color: '#9a8f8f', icon: 'time' };
}

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
      <Row l="Total" v={`P ${cake.total}.00`} />
      <Row l="Total Incl VAT (14%)" v={`P ${cake.total + Math.round(cake.total * 0.14)}.00`} />
      <Row l="Deposit Paid (50% + Full VAT)" v={`P ${cake.deposit + Math.round(cake.total * 0.14)}.00`} />
    </View>
  );
}

function OrderRow({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const { label, color, icon } = statusLabel(order);
  const remaining = order.cakeRemaining ?? 0;

  const cakeNames = (order.items || []).map(i => i.name).join(', ') || 'Custom Cake';

  return (
    <View style={s.card}>
      {/* Collapsed header: name + status */}
      <View style={s.cardTop}>
        <View style={s.cardTopLeft}>
          <Text style={s.cakeTitle}>{cakeNames}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: color + '22', borderColor: color }]}>
          <Ionicons name={icon as any} size={13} color={color} />
          <Text style={[s.statusText, { color }]}>{label}</Text>
        </View>
      </View>

      {/* Collapsed: remaining balance (red) or paid (green) */}
      {remaining > 0 && (
        order.paid ? (
          <View style={[s.balancePill, s.balancePillNarrow, { backgroundColor: '#22c55e22', borderColor: '#22c55e' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={[s.balanceText, { color: '#22c55e' }]}>Paid</Text>
          </View>
        ) : (
          <View style={[s.balancePill, { backgroundColor: '#C65C6922', borderColor: '#C65C69' }]}>
            <Ionicons name="alert-circle" size={16} color="#C65C69" />
            <Text style={[s.balanceText, { color: '#C65C69' }]}>Remaining to be Paid: P {remaining}.00</Text>
          </View>
        )
      )}

      {/* Dropdown toggle */}
      <TouchableOpacity style={s.dropToggle} onPress={() => setOpen(o => !o)}>
        <Text style={s.dropToggleText}>{open ? 'Hide' : 'View'} order details</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={PINK_DARK} />
      </TouchableOpacity>

      {/* Expanded: full summary */}
      {open && (
        <View>
          <View style={s.divider} />
          <View style={s.itemRow}>
            <Text style={s.itemName}>{order.date}</Text>
            <Text style={s.itemPrice}>{order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</Text>
          </View>
          <View style={s.divider} />

          {order.items?.filter(i => i.cakeOrder).map((i, idx) => <CakeBlock key={idx} cake={i.cakeOrder} />)}

          <View style={s.divider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Paid Now</Text>
            <Text style={s.totalVal}>P {order.total}.00</Text>
          </View>
          {remaining > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Remaining {order.orderType === 'delivery' ? '(on delivery)' : '(on collection)'}</Text>
              <Text style={s.totalVal}>P {remaining}.00</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
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
    const unsub = onValue(ref(db, 'orders'), snap => {
      const all: Order[] = [];
      snap.forEach(child => {
        const v = child.val();
        if (v.userId === uid) all.push({ id: child.key!, ...v });
      });
      all.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setOrders(all);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={PINK_DARK} /></View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>My Orders</Text></View>

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
          {orders.map(order => <OrderRow key={order.id} order={order} />)}
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
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  cardTopLeft:  { gap: 2, flex: 1, paddingRight: 10 },
  cakeTitle:    { fontSize: 16, fontWeight: '800', color: '#1a1612' },
  cardDate:     { fontSize: 13, fontWeight: '700', color: '#1a1612' },
  cardType:     { fontSize: 12, color: '#6b6b6b' },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  statusText:   { fontSize: 12, fontWeight: '700' },
  divider:      { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 10 },
  itemRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName:     { fontSize: 13, color: '#1a1612', flex: 1 },
  itemPrice:    { fontSize: 13, fontWeight: '600', color: '#1a1612' },
  dropToggle:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, paddingVertical: 6 },
  dropToggleText:{ fontSize: 13, fontWeight: '700', color: PINK_DARK },
  cakeBox:      { backgroundColor: PINK_LIGHT, borderRadius: 10, padding: 12, marginTop: 6 },
  cakeBoxTitle: { fontSize: 12, fontWeight: '800', color: PINK_DARK, marginBottom: 6 },
  sumRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sumLabel:     { fontSize: 12, color: '#6b6b6b', fontWeight: '600' },
  sumValue:     { fontSize: 12, color: '#1a1612', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  totalLabel:   { fontSize: 13, color: '#6b6b6b' },
  totalVal:     { fontSize: 13, fontWeight: '700', color: '#1a1612' },
  balancePill:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10 },
  balanceText:  { fontSize: 14, fontWeight: '800' },
  balancePillNarrow: { alignSelf: 'flex-start' },
});
