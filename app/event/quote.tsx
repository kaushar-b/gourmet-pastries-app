import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { computeCakeTotal, allergyDisplay, CAKE_TYPE_LABELS, CakeData } from '../../constants/eventPricing';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmtDate(d: any) { return d ? `${d.day} ${MONTH_NAMES[d.month]} ${d.year}` : '—'; }
function fmtHour(h: any) {
  if (!h) return '—';
  const hr = h.h % 12 === 0 ? 12 : h.h % 12;
  return `${String(hr).padStart(2,'0')}:${String(h.m).padStart(2,'0')} ${h.h >= 12 ? 'PM' : 'AM'}`;
}

export default function Quote() {
  const router = useRouter();
  const { addToCart, updateCartItem } = useCart();
  const params = useLocalSearchParams<{ cakeData: string; editId?: string }>();
  const data: CakeData | null = params.cakeData ? JSON.parse(params.cakeData) : null;
  const editId = params.editId || null;

  if (!data) {
    return (
      <View style={s.center}>
        <Text style={s.muted}>No cake data. Please start again.</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace('/event/event')}>
          <Text style={s.primaryBtnText}>Back to Event Builder</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const total = computeCakeTotal(data);
  const cakeName = `Custom ${data.occasion && data.occasion !== 'Other' ? data.occasion + ' ' : ''}Cake`;

  const buildItem = () => ({
    id: editId || `event-${Date.now()}`,
    name: cakeName,
    price: total,
    icon: 'gift',
    cakeOrder: { ...data, total, deposit: Math.round(total * 0.5), remaining: total - Math.round(total * 0.5) },
  });

  const onOrder = () => {
    const item = buildItem();
    if (editId) updateCartItem(editId, item); else addToCart(item.id, item);
    router.push('/checkout');
  };
  const onAddToCart = () => {
    const item = buildItem();
    if (editId) updateCartItem(editId, item);
    else addToCart(item.id, item);
    router.replace('/tabs/cart');
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1612" />
        </TouchableOpacity>
        <Text style={s.title}>Your Quote</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={s.summaryBox}>
          <Row l="Occasion" v={data.occasion === 'Other' ? data.occasionOther : (data.occasion || '—')} />
          <Row l="Cake Parts" v={String(data.cakeParts ?? '—')} />
          <Row l="Flavour" v={data.flavours.join(', ') || '—'} />
          <Row l="Decoration" v={data.decorations.join(', ') || '—'} />
          <Row l="Text" v={data.cakeText.trim() || 'None'} />
          <Row l="Type" v={CAKE_TYPE_LABELS[data.cakeType ?? ''] || '—'} />
          <Row l="Allergies" v={allergyDisplay(data.allergies, data.allergyOther)} />
          <Row l="Date" v={fmtDate(data.date)} />
          <Row l="Time" v={fmtHour(data.hour)} />
        </View>

        <View style={s.depositNote}>
          <Ionicons name="information-circle" size={20} color={PINK_DARK} />
          <Text style={s.depositNoteText}>50% Down Payment required to confirm your order</Text>
        </View>

        <View style={s.totalBox}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>P {total}.00</Text>
        </View>
        <Text style={s.vatNote}>VAT is added at checkout.</Text>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.primaryBtn} onPress={onOrder}>
          <Ionicons name="bag-check" size={20} color="#fff" />
          <Text style={s.primaryBtnText}>{editId ? 'Update & Order' : 'Order'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.outlineBtn} onPress={onAddToCart}>
          <Ionicons name="cart" size={20} color={PINK_DARK} />
          <Text style={s.outlineBtnText}>{editId ? 'Update Cart' : 'Add to Cart'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <View style={s.row}><Text style={s.rowLabel}>{l}</Text><Text style={s.rowValue}>{v}</Text></View>;
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f9f9f9' },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: PINK_LIGHT, gap: 16 },
  muted:           { fontSize: 15, color: '#6b6b6b', textAlign: 'center' },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  backBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: PINK_LIGHT, alignItems: 'center', justifyContent: 'center' },
  title:           { fontSize: 22, fontWeight: '800', color: '#1a1612' },
  summaryBox:      { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: PINK_MID, marginBottom: 16 },
  row:             { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rowLabel:        { fontSize: 13, color: '#6b6b6b', fontWeight: '600' },
  rowValue:        { fontSize: 13, color: '#1a1612', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 },
  depositNote:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: PINK_LIGHT, borderRadius: 14, padding: 14, marginBottom: 16 },
  depositNoteText: { fontSize: 13, fontWeight: '700', color: '#1a1612', flex: 1 },
  totalBox:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: PINK_DARK },
  totalLabel:      { fontSize: 18, fontWeight: '800', color: '#1a1612' },
  totalValue:      { fontSize: 24, fontWeight: '900', color: PINK_DARK },
  vatNote:         { fontSize: 12, color: '#9a8f8f', textAlign: 'center', marginTop: 8 },
  footer:          { padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: PINK_LIGHT, backgroundColor: '#fff', gap: 10 },
  primaryBtn:      { backgroundColor: PINK_DARK, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText:  { fontSize: 16, fontWeight: '800', color: '#fff' },
  outlineBtn:      { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: PINK_DARK },
  outlineBtnText:  { fontSize: 15, fontWeight: '800', color: PINK_DARK },
});
