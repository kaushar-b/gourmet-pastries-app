import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';

const { width: SW } = Dimensions.get('window');
const PINK_DARK  = '#CE6F79';
const PINK_LIGHT = '#FADAD9';
const PINK_MID   = '#E9ABAE';

// ── PLACEHOLDER PRODUCTS ──
// Swap icon for a real image later: add `images: [require('../../assets/images/...')]`
// and change PlaceholderTile usages to <Image source={...} />
const PRODUCTS = [
  { id: 'p1', image: require('../../assets/carousel/Cake4.jpeg'), name: 'Strawberry Cream Cake', description: 'Vanilla cream cake with fresh strawberries.', price: 0, icon: 'flower-outline' as const, details: 'Vanilla cream cake layered with fresh strawberries.' },
  { id: 'p2', image: require('../../assets/carousel/Cake6.jpeg'), name: 'Vanilla Swiss Roll', description: 'Soft sponge rolled with vanilla cream.', price: 0, icon: 'flower-outline' as const, details: 'Light vanilla sponge rolled with smooth vanilla cream.' },
  { id: 'p3', image: require('../../assets/carousel/Cake5.jpeg'), name: 'Tiramisu Trifle', description: 'Coffee layers with mascarpone cream.', price: 0, icon: 'cafe-outline' as const, details: 'Coffee-soaked sponge layered with mascarpone cream and cocoa.' },
  { id: 'p4', image: require('../../assets/carousel/Cake8.jpeg'), name: 'Strawberry Swiss Roll', description: 'Sponge rolled with strawberries and cream.', price: 0, icon: 'flower-outline' as const, details: 'Soft vanilla sponge rolled with fresh strawberries and cream.' },
  { id: 'p5', image: require('../../assets/carousel/Cake2.jpeg'), name: 'Strawberry Trifle', description: 'Layered berries, cream and sponge.', price: 0, icon: 'ellipse-outline' as const, details: 'Individual cup of layered sponge, fresh berries and cream.' },
  { id: 'p6', image: require('../../assets/carousel/Cake7.jpeg'), name: 'Fruit Tart', description: 'Crisp pastry with custard and fresh fruit.', price: 0, icon: 'pie-chart-outline' as const, details: 'Crisp shortcrust shell with custard and fresh seasonal fruit.' },
];

function PlaceholderTile({ icon, size }: { icon: keyof typeof Ionicons.glyphMap; size: number }) {
  return (
    <View style={[ph.tile, { width: size, height: size }]}>
      <Ionicons name={icon} size={size * 0.35} color={PINK_DARK} />
    </View>
  );
}
const ph = StyleSheet.create({
  tile: { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});

function ProductModal({ product, onClose }: { product: typeof PRODUCTS[0] | null; onClose: () => void }) {
  if (!product) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={modal.sheet}>
          <View style={modal.imageBox}>
            <Image source={product.image} style={{ width: SW, height: SW }} resizeMode="cover" />
            <TouchableOpacity style={modal.backBtn} onPress={onClose}>
              <Ionicons name="arrow-back" size={18} color="#1a1612" />
              <Text style={modal.backBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={modal.body}>
            <Text style={modal.name}>{product.name}</Text>
            <Text style={modal.desc}>{product.details}</Text>
            <View style={modal.priceRow}>
            </View>
            <View style={modal.pickupSpacer} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function Menu() {
  const router = useRouter();
  const { count } = useCart();
  const [search, setSearch] = useState('');
  const [activeProduct, setActiveProduct] = useState<typeof PRODUCTS[0] | null>(null);

  const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.push('/tabs')}>
          <Ionicons name="arrow-back" size={24} color="#1a1612" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title}>Menu</Text>
          <Text style={s.subtitle}>Gourmet Fine Pastries</Text>
        </View>
        <TouchableOpacity style={s.cartBtn} onPress={() => router.push('/tabs/cart')}>
          <Ionicons name="cart" size={22} color="#1a1612" />
          {count > 0 && (
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeTxt}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={PINK_DARK} style={{ marginRight: 8 }} />
        <TextInput style={s.search} placeholder="Search..." placeholderTextColor={PINK_DARK} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView contentContainerStyle={s.list}>
        {filtered.map(product => (
          <TouchableOpacity key={product.id} style={s.card} onPress={() => setActiveProduct(product)} activeOpacity={0.88}>
            <View style={s.cardImgWrap}>
              <Image source={product.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardName}>{product.name}</Text>
              <Text style={s.cardDesc} numberOfLines={2}>{product.description}</Text>

            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>

      <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: PINK_LIGHT },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: '#fff' },
  cartBtn:      { padding: 8, position: 'relative', width: 44, alignItems: 'center' },
  cartBadge:    { position: 'absolute', top: 0, right: 0, backgroundColor: PINK_DARK, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cartBadgeTxt: { fontSize: 10, fontWeight: '900', color: '#fff', textAlign: 'center' },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, width: 70 },
  backText:     { fontSize: 16, fontWeight: '700', color: '#1a1612' },
  headerCenter: { flex: 1, alignItems: 'center' },
  title:        { fontSize: 18, fontWeight: '800', color: '#1a1612', textAlign: 'center' },
  subtitle:     { fontSize: 11, color: PINK_DARK, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: PINK_MID },
  search:       { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1a1612' },
  list:         { paddingHorizontal: 16, paddingTop: 14 },
  card:         { backgroundColor: '#fff', borderRadius: 18, marginBottom: 20, overflow: 'hidden', elevation: 2 },
  cardImgWrap:  { width: '100%', aspectRatio: 1, backgroundColor: PINK_LIGHT },
  cardBody:     { padding: 16 },
  cardName:     { fontSize: 17, fontWeight: '800', color: '#1a1612', marginBottom: 4 },
  cardDesc:     { fontSize: 13, color: '#6b6b6b', lineHeight: 19, marginBottom: 8 },
  cardPrice:    { fontSize: 16, fontWeight: '800', color: PINK_DARK },
  cardBottomRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  pickupChip:   { backgroundColor: PINK_LIGHT, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: PINK_MID },
  pickupChipTxt:{ fontSize: 11, fontWeight: '800', color: PINK_DARK },
});

const modal = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  imageBox:     { width: SW, height: SW, backgroundColor: PINK_LIGHT, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  backBtn:      { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, elevation: 6, zIndex: 10 },
  backBtnText:  { fontSize: 14, fontWeight: '700', color: '#1a1612' },
  body:         { padding: 20, paddingBottom: 40 },
  name:         { fontSize: 20, fontWeight: '800', color: '#1a1612', marginBottom: 8 },
  desc:         { fontSize: 14, color: '#6b6b6b', lineHeight: 22, marginBottom: 16 },
  priceRow:     { marginBottom: 16 },
  price:        { fontSize: 22, fontWeight: '800', color: PINK_DARK },
  addBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 16, marginBottom: 24 },
  addBtnTxt:    { fontSize: 16, fontWeight: '800', color: '#fff' },
  cartControls: { gap: 10 },
  removeBtn:    { alignItems: 'center', justifyContent: 'center', backgroundColor: '#C65C69', borderRadius: 14, paddingVertical: 14 },
  removeBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
  qtyRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: PINK_LIGHT, borderRadius: 14, paddingVertical: 12 },
  qtyBtn:       { padding: 4 },
  qtyText:      { fontSize: 18, fontWeight: '800', color: '#1a1612', minWidth: 24, textAlign: 'center' },
  pickupNote:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PINK_LIGHT, borderRadius: 14, paddingVertical: 16, marginBottom: 24 },
  pickupSpacer: { height: 24 },
  pickupNoteTxt:{ fontSize: 15, fontWeight: '800', color: PINK_DARK },
});
