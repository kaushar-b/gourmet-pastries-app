import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';

const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';
const VAT_RATE   = 0.14;

export default function Cart() {
  const router = useRouter();
  const { items, addToCart, removeFromCart, clearCart, total, count } = useCart();

  const vatAmount  = Math.round(total * VAT_RATE);
  const grandTotal = total + vatAmount;

  if (items.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>My Cart</Text>
        </View>
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 200 }}>
        {items.map(item => (
          <View key={item.id} style={s.card}>
            <View style={s.cardIconWrap}>
              <Ionicons name={item.icon as any || 'gift'} size={28} color={PINK_DARK} />
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardName}>{item.name}</Text>
              {item.cakeOrder && (
                <Text style={s.cakeTag}>Custom Cake Order</Text>
              )}
              <Text style={s.cardPrice}>P {item.price}.00</Text>
            </View>
            {item.cakeOrder ? (
              <TouchableOpacity style={s.removeBtn} onPress={() => removeFromCart(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#C65C69" />
              </TouchableOpacity>
            ) : (
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
          </View>
        ))}
      </ScrollView>

      <View style={s.footer}>
        <View style={s.totalsBox}>
          <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalVal}>P {total}.00</Text></View>
          <View style={s.totalRow}><Text style={s.totalLabel}>VAT (14%)</Text><Text style={s.totalVal}>P {vatAmount}.00</Text></View>
          <View style={s.divider} />
          <View style={s.totalRow}><Text style={s.grandLabel}>Total</Text><Text style={s.grandVal}>P {grandTotal}.00</Text></View>
        </View>
        <TouchableOpacity style={s.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Ionicons name="card" size={20} color="#fff" />
          <Text style={s.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
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
  card:          { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1 },
  cardIconWrap:  { width: 52, height: 52, borderRadius: 12, backgroundColor: PINK_LIGHT, alignItems: 'center', justifyContent: 'center' },
  cardBody:      { flex: 1 },
  cardName:      { fontSize: 15, fontWeight: '700', color: '#1a1612', marginBottom: 2 },
  cakeTag:       { fontSize: 11, color: PINK_DARK, fontWeight: '700', marginBottom: 2 },
  cardPrice:     { fontSize: 14, fontWeight: '800', color: PINK_DARK },
  removeBtn:     { padding: 8 },
  qtyRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: PINK_LIGHT, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  qtyBtn:        { padding: 4 },
  qtyText:       { fontSize: 16, fontWeight: '800', color: '#1a1612', minWidth: 20, textAlign: 'center' },
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
