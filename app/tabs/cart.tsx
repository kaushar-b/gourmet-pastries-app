import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { allergyDisplay, CAKE_TYPE_LABELS } from '../../constants/eventPricing';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';
const VAT_RATE   = 0.14;

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(d: any) {
  if (!d) return '—';
  return `${d.day} ${MONTH_NAMES[d.month]} ${d.year}`;
}
function fmtHour(h: any) {
  if (!h) return '—';
  const hr = h.h % 12 === 0 ? 12 : h.h % 12;
  return `${String(hr).padStart(2,'0')}:${String(h.m).padStart(2,'0')} ${h.h >= 12 ? 'PM' : 'AM'}`;
}

export default function Cart() {
  const router = useRouter();
  const { items, addToCart, removeFromCart, removeLine, clearCart } = useCart();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const menuItems = items.filter(i => !i.cakeOrder);
  const cakeItems = items.filter(i => i.cakeOrder);

  const menuFull      = menuItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const cakeFull      = cakeItems.reduce((s, i) => s + (i.cakeOrder?.total ?? 0), 0);
  const cakeDeposit   = cakeItems.reduce((s, i) => s + (i.cakeOrder?.deposit ?? 0), 0);
  const cakeRemaining = cakeItems.reduce((s, i) => s + (i.cakeOrder?.remaining ?? 0), 0);
  const tips          = cakeItems.reduce((s, i) => s + (i.cakeOrder?.tip ?? 0), 0);

  const subtotal  = menuFull + cakeFull;
  const vatAmount = Math.round(subtotal * VAT_RATE);
  const dueNow    = menuFull + cakeDeposit + vatAmount + tips;

  if (items.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.header}><Text style={s.title}>My Cart</Text></View>
        <View style={s.empty}>
          <Ionicons name="cart-outline" size={72} color={PINK_MID} />
          <Text style={s.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/menu/menu')}>
            <Text style={s.shopBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Cart</Text>
        <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={s.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 240 }}>
        {items.map(item => {
          const cake = item.cakeOrder;
          const isOpen = !!expanded[item.id];
          return (
            <View key={item.id} style={s.card}>
              <View style={s.cardTopRow}>
                <View style={s.cardIconWrap}>
                  <Ionicons name={(item.icon as any) || 'gift'} size={26} color={PINK_DARK} />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardName}>{item.name}</Text>
                  {cake && <Text style={s.cakeTag}>Custom Cake Order</Text>}
                  <Text style={s.cardPrice}>
                    P {cake ? (cake.total ?? item.price) : item.price * item.quantity}.00
                  </Text>
                </View>
                <TouchableOpacity style={s.binBtn} onPress={() => removeLine(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#C65C69" />
                </TouchableOpacity>
              </View>

              {/* Menu item qty controls */}
              {!cake && (
                <View style={s.qtyRow}>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => removeFromCart(item.id)}>
                    <Ionicons name="remove" size={16} color="#1a1612" />
                  </TouchableOpacity>
                  <Text style={s.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => addToCart(item.id, { id: item.id, name: item.name, price: item.price, icon: item.icon })}>
                    <Ionicons name="add" size={16} color="#1a1612" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Cake dropdown */}
              {cake && (
                <>
                  <TouchableOpacity style={s.dropToggle} onPress={() => toggle(item.id)}>
                    <Text style={s.dropToggleText}>{isOpen ? 'Hide' : 'View'} order details</Text>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={PINK_DARK} />
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={s.summaryBox}>
                      <SumRow label="Occasion" value={cake.occasion === 'Other' ? cake.occasionOther : (cake.occasion || '—')} />
                      <SumRow label="Cake Parts" value={String(cake.cakeParts ?? '—')} />
                      <SumRow label="Flavour" value={(cake.flavours || []).join(', ') || '—'} />
                      <SumRow label="Decoration" value={(cake.decorations || []).join(', ') || '—'} />
                      <SumRow label="Text" value={cake.cakeText?.trim() || 'None'} />
                      <SumRow label="Type" value={CAKE_TYPE_LABELS[cake.cakeType] || '—'} />
                      <SumRow label="Allergies" value={allergyDisplay(cake.allergies, cake.allergyOther)} />
                      <SumRow label="Date" value={fmtDate(cake.date)} />
                      <SumRow label="Time" value={fmtHour(cake.hour)} />
                      <SumRow label="Fulfilment" value={cake.orderType === 'delivery' ? 'Delivery' : 'Pickup'} />
                      {cake.tip ? <SumRow label="Driver Tip" value={`P ${cake.tip}.00`} /> : null}
                      <View style={s.summaryDivider} />
                      <SumRow label="Full Price" value={`P ${cake.total}.00`} />
                      <SumRow label="50% Deposit" value={`P ${cake.deposit}.00`} />
                      <SumRow label="Remaining" value={`P ${cake.remaining}.00`} />

                      <TouchableOpacity
                        style={s.editBtn}
                        onPress={() => router.push({ pathname: '/event/event', params: { editId: item.id, editData: JSON.stringify(cake) } })}
                      >
                        <Ionicons name="create-outline" size={18} color="#fff" />
                        <Text style={s.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={s.footer}>
        <View style={s.totalsBox}>
          <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalVal}>P {subtotal}.00</Text></View>
          <View style={s.totalRow}><Text style={s.totalLabel}>VAT (14%)</Text><Text style={s.totalVal}>P {vatAmount}.00</Text></View>
          {tips > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>Driver Tip</Text><Text style={s.totalVal}>P {tips}.00</Text></View>}
          {cakeRemaining > 0 && (
            <View style={s.totalRow}><Text style={s.totalLabel}>Cake balance (on collection)</Text><Text style={s.totalVal}>P {cakeRemaining}.00</Text></View>
          )}
          <View style={s.divider} />
          <View style={s.totalRow}><Text style={s.grandLabel}>Due Now</Text><Text style={s.grandVal}>P {dueNow}.00</Text></View>
        </View>
        <TouchableOpacity style={s.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Ionicons name="card" size={20} color="#fff" />
          <Text style={s.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.sumRow}>
      <Text style={s.sumLabel}>{label}</Text>
      <Text style={s.sumValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: PINK_LIGHT },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  title:         { fontSize: 22, fontWeight: '800', color: '#1a1612' },
  clearText:     { fontSize: 14, fontWeight: '700', color: '#C65C69' },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyText:     { fontSize: 17, fontWeight: '700', color: '#6b6b6b' },
  shopBtn:       { backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  shopBtnText:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  card:          { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, elevation: 1 },
  cardTopRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconWrap:  { width: 52, height: 52, borderRadius: 12, backgroundColor: PINK_LIGHT, alignItems: 'center', justifyContent: 'center' },
  cardBody:      { flex: 1 },
  cardName:      { fontSize: 15, fontWeight: '700', color: '#1a1612', marginBottom: 2 },
  cakeTag:       { fontSize: 11, color: PINK_DARK, fontWeight: '700', marginBottom: 2 },
  cardPrice:     { fontSize: 14, fontWeight: '800', color: PINK_DARK },
  binBtn:        { padding: 8 },
  qtyRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: PINK_LIGHT, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 12, marginLeft: 64 },
  qtyBtn:        { padding: 4 },
  qtyText:       { fontSize: 16, fontWeight: '800', color: '#1a1612', minWidth: 20, textAlign: 'center' },
  dropToggle:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: PINK_LIGHT },
  dropToggleText:{ fontSize: 13, fontWeight: '700', color: PINK_DARK },
  summaryBox:    { backgroundColor: PINK_LIGHT, borderRadius: 12, padding: 14, marginTop: 4 },
  sumRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumLabel:      { fontSize: 12, color: '#6b6b6b', fontWeight: '600' },
  sumValue:      { fontSize: 12, color: '#1a1612', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 },
  summaryDivider:{ height: 1, backgroundColor: PINK_MID, marginVertical: 6 },
  editBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PINK_DARK, borderRadius: 12, paddingVertical: 12, marginTop: 12 },
  editBtnText:   { fontSize: 14, fontWeight: '800', color: '#fff' },
  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: PINK_LIGHT, elevation: 10, gap: 12 },
  totalsBox:     { gap: 6 },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel:    { fontSize: 13, color: '#6b6b6b' },
  totalVal:      { fontSize: 13, fontWeight: '600', color: '#1a1612' },
  divider:       { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 4 },
  grandLabel:    { fontSize: 16, fontWeight: '800', color: '#1a1612' },
  grandVal:      { fontSize: 16, fontWeight: '800', color: PINK_DARK },
  checkoutBtn:   { backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 2 },
  checkoutBtnText:{ fontSize: 16, fontWeight: '700', color: '#fff' },
});
