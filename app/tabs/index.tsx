import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, FlatList, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { CAROUSEL_IMAGES } from '../../constants/carousel';

const { width: SW } = Dimensions.get('window');
const PINK_DARK   = '#CE6F79';
const PINK_ACCENT = '#FF7FA1';
const PINK_LIGHT  = '#FADAD9';
const PINK_MID    = '#E9ABAE';
const PINK_DEEPER = '#D78289';

const ITEM_SIZE = Math.round(SW / 3);

const CAROUSEL_ITEMS = [
  { id: 'c1', label: 'Celebration Cakes', icon: 'gift-outline' as const },
  { id: 'c2', label: 'Cupcakes', icon: 'flower-outline' as const },
  { id: 'c3', label: 'Pastries', icon: 'cafe-outline' as const },
  { id: 'c4', label: 'Wedding Cakes', icon: 'heart-outline' as const },
  { id: 'c5', label: 'Macarons', icon: 'ellipse-outline' as const },
  { id: 'c6', label: 'Tarts', icon: 'pie-chart-outline' as const },
];

// ── HOME SLIDESHOW ──
// To change a slide image: overwrite the file in assets/slideshow/ (keep the name).
// To change a slide's caption: edit the `text` below.
const SLIDESHOW_ITEMS = [
  { id: 's1', text: 'Strawberry Cream Cake',     image: require('../../assets/slideshow/slide1.jpeg') },
  { id: 's2', text: 'Birthday Cakes',      image: require('../../assets/slideshow/slide2.jpeg') },
  { id: 's3', text: 'Wedding Cakes',  image: require('../../assets/slideshow/slide3.jpeg') },
];

function PlaceholderTile({ icon, size }: { icon: keyof typeof Ionicons.glyphMap; size: number }) {
  return (
    <View style={[ph.tile, { width: size, height: size }]}>
      <Ionicons name={icon} size={size * 0.4} color={PINK_DARK} />
    </View>
  );
}

const ph = StyleSheet.create({
  tile: { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: PINK_MID },
});

const ACTIONS = [
  { label: 'Menu',  icon: 'restaurant' as const,         route: '/menu/menu' as const },
  { label: 'Event', icon: 'calendar' as const,           route: '/event/event' as const },
  { label: 'About', icon: 'information-circle' as const,  route: '/about' as const },
];

export default function Home() {
  const router = useRouter();
  const { count } = useCart();
  const flatRef = useRef<FlatList>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);

  const LOOPED = [...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES];
  const START = CAROUSEL_IMAGES.length;

  useEffect(() => {
    try { flatRef.current?.scrollToIndex({ index: START, animated: false }); } catch {}
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentIdx(prev => {
        const next = prev + 1;
        try { flatRef.current?.scrollToIndex({ index: START + (next % CAROUSEL_IMAGES.length), animated: true }); } catch {}
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % SLIDESHOW_ITEMS.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: PINK_LIGHT }}>
      <StatusBar barStyle="dark-content" backgroundColor={PINK_LIGHT} />

      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.cartCircle} onPress={() => router.push('/tabs/cart')}>
          <Ionicons name="cart" size={22} color={PINK_LIGHT} />
          {count > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{count > 9 ? '9+' : count}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 0 }}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/pink-icon.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Carousel — 3 visible, auto-sliding, flush left + right */}
        <View style={styles.carouselWrap}>
          <FlatList
            ref={flatRef}
            data={LOOPED}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `c-${i}`}
            getItemLayout={(_, i) => ({ length: ITEM_SIZE + 8, offset: (ITEM_SIZE + 8) * i, index: i })}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item }) => (
              <View style={[styles.carouselItem, { width: ITEM_SIZE, height: ITEM_SIZE }]}>
                <Image source={item} style={{ width: ITEM_SIZE, height: ITEM_SIZE }} resizeMode="cover" />
              </View>
            )}
          />
        </View>

        <View style={{ height: 22 }} />

        {/* Stacked action buttons */}
        <View style={styles.actionsCol}>
          {ACTIONS.map(a => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route)} activeOpacity={0.85}>
              <Ionicons name={a.icon} size={28} color="#fff" />
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={26} color={PINK_LIGHT} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Big single-image slideshow */}
        <View style={styles.sectionWrap}>
          <TouchableOpacity style={styles.slideshowWrap} activeOpacity={0.9}>
            <Image source={SLIDESHOW_ITEMS[slideIdx].image} style={{ width: '100%', height: (SW - 32) * 0.62 }} resizeMode="cover" />
            <Text style={styles.slideshowLabel}>{SLIDESHOW_ITEMS[slideIdx].text}</Text>
          </TouchableOpacity>
        </View>

        {/* Location & Hours */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={PINK_DARK} />
            <Text style={styles.infoTitle}>Location</Text>
          </View>
          <Text style={styles.infoText}>Mowana Park Mall, Phakalane</Text>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="time" size={18} color={PINK_DARK} />
            <Text style={styles.infoTitle}>Hours</Text>
          </View>
          <Text style={styles.infoText}>Mon–Sun: 7:00 AM – 10:00 PM</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:          { flexDirection: 'row', alignItems: 'center', backgroundColor: PINK_LIGHT, paddingTop: 44, paddingBottom: 0, paddingHorizontal: 16 },
  cartCircle:      { width: 42, height: 42, borderRadius: 21, backgroundColor: PINK_ACCENT, alignItems: 'center', justifyContent: 'center' },
  cartBadge:       { position: 'absolute', top: -4, right: -4, backgroundColor: '#fff', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  cartBadgeText:   { color: PINK_DARK, fontSize: 10, fontWeight: '800' },
  logoWrap:        { alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  logo:            { width: SW, height: SW },
  carouselWrap:    { marginTop: 6 },
  carouselItem:    { marginRight: 8, borderRadius: 12, overflow: 'hidden' },
  actionsCol:      { marginHorizontal: 16, marginBottom: 20, gap: 14 },
  actionBtn:       { backgroundColor: PINK_ACCENT, borderRadius: 40, paddingVertical: 22, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  actionLabel:     { fontSize: 20, fontWeight: '800', color: '#fff', marginLeft: 16, flex: 1 },
  sectionWrap:     { marginBottom: 20, paddingHorizontal: 16 },
  slideshowWrap:   { borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', elevation: 2 },
  slideshowLabel:  { fontSize: 14, fontWeight: '700', color: '#1a1612', padding: 12, textAlign: 'center' },
  infoCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: PINK_MID },
  infoRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoTitle:       { fontSize: 14, fontWeight: '700', color: '#1a1612' },
  infoText:        { fontSize: 13, color: '#6b6b6b', marginLeft: 24 },
  infoDivider:     { height: 1, backgroundColor: PINK_LIGHT, marginVertical: 12 },
});
