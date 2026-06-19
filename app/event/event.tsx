import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SW } = Dimensions.get('window');
const PINK_DARK   = '#CE6F79';
const PINK_LIGHT  = '#FADAD9';
const PINK_MID    = '#E9ABAE';
const PINK_DEEPER = '#D78289';

const ITEM_SIZE = Math.round(SW / 3);

const CAROUSEL_ITEMS = [
  { id: 'c1', icon: 'gift-outline' as const },
  { id: 'c2', icon: 'flower-outline' as const },
  { id: 'c3', icon: 'cafe-outline' as const },
  { id: 'c4', icon: 'heart-outline' as const },
  { id: 'c5', icon: 'ellipse-outline' as const },
  { id: 'c6', icon: 'pie-chart-outline' as const },
];

const OCCASIONS = ['Birthday', 'Party', 'Wedding', 'Corporate', 'None / Skip'];
const FLAVOURS = ['Chocolate', 'Vanilla', 'Coffee', 'Fruit', 'Lemon', 'Other', 'None / Skip'];
const PART_COUNTS = Array.from({ length: 25 }, (_, i) => 4 + i * 4); // 4..100 step 4

const CAKE_TYPES = [
  { id: 'round',      label: 'Round',          icon: 'ellipse-outline' as const },
  { id: 'tall_round',  label: 'Tall Round',     icon: 'ellipse-outline' as const },
  { id: 'tall_flat',   label: 'Tall Flat',      icon: 'square-outline' as const },
  { id: 'square_flat', label: 'Square Flat',    icon: 'square-outline' as const },
  { id: 'tiered',      label: 'Tiered',         icon: 'layers-outline' as const },
  { id: 'sheet',       label: 'Sheet Cake',     icon: 'tablet-landscape-outline' as const },
  { id: 'heart',       label: 'Heart Shaped',   icon: 'heart-outline' as const },
  { id: 'number',      label: 'Number Shaped',  icon: 'text-outline' as const },
  { id: 'cupcake_tower', label: 'Cupcake Tower', icon: 'gift-outline' as const },
  { id: 'sculpted',    label: 'Sculpted',       icon: 'shapes-outline' as const },
  { id: 'none',        label: 'None / Skip',    icon: 'close-circle-outline' as const },
];

const ALLERGY_OPTIONS = ['Gluten', 'Almond', 'Peanuts', 'Dairy', 'Eggs', 'Soy', 'Other'];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

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

export type EventOrderData = {
  occasion: string | null;
  cakeParts: number | null;
  flavour: string | null;
  flavourOther: string;
  cakeType: string | null;
  allergies: string[];
  allergyOther: string;
  date: { year: number; month: number; day: number } | null;
  hour: { h: number; m: number } | null;
};

const STEPS = ['intro', 'occasion', 'parts', 'flavour', 'type', 'allergies', 'date', 'hour', 'recall'] as const;
type Step = typeof STEPS[number];

export default function EventBuilder() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const [data, setData] = useState<EventOrderData>({
    occasion: null,
    cakeParts: null,
    flavour: null,
    flavourOther: '',
    cakeType: null,
    allergies: [],
    allergyOther: '',
    date: null,
    hour: null,
  });
  const [typePage, setTypePage] = useState(0);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [hourVal, setHourVal] = useState(12);
  const [minuteVal, setMinuteVal] = useState(0);

  const flatRef = useRef<FlatList>(null);
  const LOOPED = [...CAROUSEL_ITEMS, ...CAROUSEL_ITEMS, ...CAROUSEL_ITEMS];
  const START = CAROUSEL_ITEMS.length;

  useEffect(() => {
    try { flatRef.current?.scrollToIndex({ index: START, animated: false }); } catch {}
  }, []);

  useEffect(() => {
    if (step !== 'intro') return;
    let idx = 0;
    const t = setInterval(() => {
      idx += 1;
      try { flatRef.current?.scrollToIndex({ index: START + (idx % CAROUSEL_ITEMS.length), animated: true }); } catch {}
    }, 2000);
    return () => clearInterval(t);
  }, [step]);

  const canGoNext = (): boolean => {
    if (step === 'occasion') return !!data.occasion;
    if (step === 'parts') return !!data.cakeParts;
    if (step === 'flavour') return !!data.flavour && (data.flavour !== 'Other' || data.flavourOther.trim().length > 0);
    if (step === 'type') return !!data.cakeType;
    if (step === 'allergies') return true; // multi-select, can be empty
    if (step === 'date') return !!data.date;
    if (step === 'hour') return !!data.hour;
    return true;
  };

  const goNext = () => { if (stepIdx < STEPS.length - 1) setStepIdx(i => i + 1); };
  const goBack = () => {
    if (stepIdx === 0) { router.push('/tabs'); return; }
    setStepIdx(i => i - 1);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#1a1612" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title}>Plan Your Event Cake</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {step === 'intro' && (
          <>
            <View style={s.carouselWrap}>
              <FlatList
                ref={flatRef}
                data={LOOPED}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, i) => `${item.id}-${i}`}
                getItemLayout={(_, i) => ({ length: ITEM_SIZE + 8, offset: (ITEM_SIZE + 8) * i, index: i })}
                onScrollToIndexFailed={() => {}}
                renderItem={({ item }) => (
                  <View style={s.carouselItem}>
                    <PlaceholderTile icon={item.icon} size={ITEM_SIZE} />
                  </View>
                )}
              />
            </View>
            <Text style={s.introText}>Let's build your perfect celebration cake — step by step.</Text>
          </>
        )}

        {step === 'occasion' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>What's the occasion?</Text>
            {OCCASIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[s.optionRow, data.occasion === opt && s.optionRowActive]}
                onPress={() => setData(d => ({ ...d, occasion: opt }))}
              >
                <View style={[s.radio, data.occasion === opt && s.radioActive]}>
                  {data.occasion === opt && <View style={s.radioDot} />}
                </View>
                <Text style={[s.optionText, data.occasion === opt && s.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'parts' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Number of Cake Parts</Text>
            <View style={s.partsRow}>
              <PlaceholderTile icon="layers-outline" size={70} />
              <ScrollView style={s.partsScroller} contentContainerStyle={{ paddingVertical: 8 }}>
                {PART_COUNTS.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[s.partOption, data.cakeParts === n && s.partOptionActive]}
                    onPress={() => setData(d => ({ ...d, cakeParts: n }))}
                  >
                    <Text style={[s.partOptionText, data.cakeParts === n && s.partOptionTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {step === 'flavour' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Flavour</Text>
            {FLAVOURS.map(opt => (
              <View key={opt}>
                <TouchableOpacity
                  style={[s.optionRow, data.flavour === opt && s.optionRowActive]}
                  onPress={() => setData(d => ({ ...d, flavour: opt }))}
                >
                  <View style={[s.radio, data.flavour === opt && s.radioActive]}>
                    {data.flavour === opt && <View style={s.radioDot} />}
                  </View>
                  <Text style={[s.optionText, data.flavour === opt && s.optionTextActive]}>{opt}</Text>
                </TouchableOpacity>
                {opt === 'Other' && data.flavour === 'Other' && (
                  <View style={s.specifyRow}>
                    <TextInput
                      style={s.specifyInput}
                      placeholder="Specify flavour..."
                      placeholderTextColor="#aaa"
                      value={data.flavourOther}
                      onChangeText={v => setData(d => ({ ...d, flavourOther: v }))}
                    />
                    <TouchableOpacity style={s.okBtn}>
                      <Text style={s.okBtnText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {step === 'type' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Type of Cake</Text>
            <View style={s.typeGrid}>
              {CAKE_TYPES.slice(typePage * 6, typePage * 6 + 6).map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.typeCard, data.cakeType === t.id && s.typeCardActive]}
                  onPress={() => setData(d => ({ ...d, cakeType: t.id }))}
                >
                  <Ionicons name={t.icon} size={28} color={data.cakeType === t.id ? '#fff' : PINK_DARK} />
                  <Text style={[s.typeLabel, data.cakeType === t.id && s.typeLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.typeSwipeRow}>
              <TouchableOpacity
                style={[s.typeArrow, typePage === 0 && s.typeArrowDisabled]}
                disabled={typePage === 0}
                onPress={() => setTypePage(0)}
              >
                <Ionicons name="chevron-back" size={20} color={typePage === 0 ? '#ccc' : PINK_DARK} />
              </TouchableOpacity>
              <View style={s.dotsRow}>
                <View style={[s.dot, typePage === 0 && s.dotActive]} />
                <View style={[s.dot, typePage === 1 && s.dotActive]} />
              </View>
              <TouchableOpacity
                style={[s.typeArrow, typePage === 1 && s.typeArrowDisabled]}
                disabled={typePage === 1}
                onPress={() => setTypePage(1)}
              >
                <Ionicons name="chevron-forward" size={20} color={typePage === 1 ? '#ccc' : PINK_DARK} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'allergies' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Allergies</Text>
            {ALLERGY_OPTIONS.map(opt => {
              const checked = data.allergies.includes(opt);
              return (
                <View key={opt}>
                  <TouchableOpacity
                    style={[s.optionRow, checked && s.optionRowActive]}
                    onPress={() => setData(d => ({
                      ...d,
                      allergies: checked ? d.allergies.filter(a => a !== opt) : [...d.allergies, opt],
                    }))}
                  >
                    <View style={[s.checkbox, checked && s.checkboxActive]}>
                      {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={[s.optionText, checked && s.optionTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                  {opt === 'Other' && checked && (
                    <View style={s.specifyRow}>
                      <TextInput
                        style={s.specifyInput}
                        placeholder="Specify allergy..."
                        placeholderTextColor="#aaa"
                        value={data.allergyOther}
                        onChangeText={v => setData(d => ({ ...d, allergyOther: v }))}
                      />
                      <TouchableOpacity style={s.okBtn}>
                        <Text style={s.okBtnText}>OK</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {step === 'date' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Date</Text>
            <View style={s.calCard}>
              <View style={s.calHeader}>
                <TouchableOpacity onPress={() => {
                  if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                  else setCalMonth(m => m - 1);
                }}>
                  <Ionicons name="chevron-back" size={22} color={PINK_DARK} />
                </TouchableOpacity>
                <Text style={s.calMonthLabel}>{MONTH_NAMES[calMonth]} {calYear}</Text>
                <TouchableOpacity onPress={() => {
                  if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                  else setCalMonth(m => m + 1);
                }}>
                  <Ionicons name="chevron-forward" size={22} color={PINK_DARK} />
                </TouchableOpacity>
              </View>
              <View style={s.calGrid}>
                {Array.from({ length: firstWeekday(calYear, calMonth) }).map((_, i) => (
                  <View key={`empty-${i}`} style={s.calCell} />
                ))}
                {Array.from({ length: daysInMonth(calYear, calMonth) }).map((_, i) => {
                  const day = i + 1;
                  const isSelected = data.date?.year === calYear && data.date?.month === calMonth && data.date?.day === day;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[s.calCell, s.calDayCell, isSelected && s.calDayCellActive]}
                      onPress={() => setData(d => ({ ...d, date: { year: calYear, month: calMonth, day } }))}
                    >
                      <Text style={[s.calDayText, isSelected && s.calDayTextActive]}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {step === 'hour' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Hour</Text>
            <View style={s.hourRow}>
              <View style={s.hourBox}>
                <ScrollView style={s.hourScroller} contentContainerStyle={{ paddingVertical: 8 }}>
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[s.hourOption, hourVal === h && s.hourOptionActive]}
                      onPress={() => { setHourVal(h); setData(d => ({ ...d, hour: { h, m: minuteVal } })); }}
                    >
                      <Text style={[s.hourOptionText, hourVal === h && s.hourOptionTextActive]}>{String(h).padStart(2, '0')}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={s.hourColon}>:</Text>
                <ScrollView style={s.hourScroller} contentContainerStyle={{ paddingVertical: 8 }}>
                  {Array.from({ length: 60 }, (_, i) => i).filter(m => m % 5 === 0).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[s.hourOption, minuteVal === m && s.hourOptionActive]}
                      onPress={() => { setMinuteVal(m); setData(d => ({ ...d, hour: { h: hourVal, m } })); }}
                    >
                      <Text style={[s.hourOptionText, minuteVal === m && s.hourOptionTextActive]}>{String(m).padStart(2, '0')}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={s.ampmBadge}>
                <Text style={s.ampmText}>{hourVal >= 12 ? 'PM' : 'AM'}</Text>
              </View>
            </View>
          </View>
        )}

        {step === 'recall' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Order Summary</Text>
            <View style={s.recallBox}>
              <View style={s.recallRow}><Text style={s.recallLabel}>Occasion</Text><Text style={s.recallValue}>{data.occasion || '—'}</Text></View>
              <View style={s.recallRow}><Text style={s.recallLabel}>Cake Parts</Text><Text style={s.recallValue}>{data.cakeParts || '—'}</Text></View>
              <View style={s.recallRow}><Text style={s.recallLabel}>Flavour</Text><Text style={s.recallValue}>{data.flavour === 'Other' ? data.flavourOther : (data.flavour || '—')}</Text></View>
              <View style={s.recallRow}><Text style={s.recallLabel}>Type</Text><Text style={s.recallValue}>{CAKE_TYPES.find(t => t.id === data.cakeType)?.label || '—'}</Text></View>
              <View style={s.recallRow}><Text style={s.recallLabel}>Allergies</Text><Text style={s.recallValue}>{data.allergies.length ? data.allergies.join(', ') + (data.allergyOther ? ` (${data.allergyOther})` : '') : 'None'}</Text></View>
              <View style={s.recallRow}><Text style={s.recallLabel}>Date</Text><Text style={s.recallValue}>{data.date ? `${data.date.day} ${MONTH_NAMES[data.date.month]} ${data.date.year}` : '—'}</Text></View>
              <View style={s.recallRow}><Text style={s.recallLabel}>Time</Text><Text style={s.recallValue}>{data.hour ? `${String(data.hour.h % 12 === 0 ? 12 : data.hour.h % 12).padStart(2,'0')}:${String(data.hour.m).padStart(2,'0')} ${data.hour.h >= 12 ? 'PM' : 'AM'}` : '—'}</Text></View>
            </View>
            <TouchableOpacity
              style={s.confirmBtn}
              onPress={() => router.push({ pathname: '/event/checkout', params: { eventData: JSON.stringify(data) } })}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={s.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.editBtn} onPress={() => setStepIdx(1)}>
              <Text style={s.editBtnText}>No, Edit</Text>
            </TouchableOpacity>
          </View>
        )}

        {step !== 'intro' && step !== 'recall' && (
          <Text style={s.stepIndicator}>Step {stepIdx} of {STEPS.length - 1}</Text>
        )}

      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.nextBtn, !canGoNext() && s.nextBtnDisabled]}
          onPress={goNext}
          disabled={!canGoNext()}
        >
          <Text style={s.nextBtnText}>{step === 'intro' ? "Let's Start" : 'Next'}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: PINK_LIGHT },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: '#fff' },
  backBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, width: 70 },
  backText:         { fontSize: 16, fontWeight: '700', color: '#1a1612' },
  headerCenter:     { flex: 1, alignItems: 'center' },
  title:            { fontSize: 16, fontWeight: '800', color: '#1a1612', textAlign: 'center' },
  content:          { padding: 20, paddingBottom: 40 },
  carouselWrap:     { marginBottom: 16, marginHorizontal: -20 },
  carouselItem:     { width: ITEM_SIZE, height: ITEM_SIZE, marginRight: 8, marginLeft: 12, borderRadius: 12, overflow: 'hidden' },
  introText:        { fontSize: 15, color: '#1a1612', textAlign: 'center', lineHeight: 22, marginTop: 8 },
  section:          { marginTop: 8 },
  sectionTitle:     { fontSize: 19, fontWeight: '800', color: '#1a1612', marginBottom: 16 },
  optionRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: PINK_MID },
  optionRowActive:  { borderColor: PINK_DARK, backgroundColor: '#fff' },
  radio:            { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: PINK_MID, alignItems: 'center', justifyContent: 'center' },
  radioActive:      { borderColor: PINK_DARK },
  radioDot:         { width: 12, height: 12, borderRadius: 6, backgroundColor: PINK_DARK },
  optionText:       { fontSize: 15, fontWeight: '600', color: '#1a1612' },
  optionTextActive: { color: PINK_DARK, fontWeight: '800' },
  specifyRow:       { flexDirection: 'row', gap: 10, marginBottom: 10, marginTop: -4, paddingHorizontal: 4 },
  specifyInput:     { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: PINK_MID, padding: 12, fontSize: 14, color: '#1a1612' },
  okBtn:            { backgroundColor: PINK_DARK, borderRadius: 10, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  okBtnText:        { color: '#fff', fontWeight: '800', fontSize: 14 },
  partsRow:         { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  partsScroller:    { flex: 1, maxHeight: 280, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: PINK_MID },
  partOption:       { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  partOptionActive: { backgroundColor: PINK_DARK },
  partOptionText:   { fontSize: 16, fontWeight: '700', color: '#1a1612', textAlign: 'center' },
  partOptionTextActive: { color: '#fff' },
  stepIndicator:    { fontSize: 12, color: '#6b6b6b', textAlign: 'center', marginTop: 24 },
  footer:           { padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: PINK_MID, backgroundColor: '#fff' },
  nextBtn:          { backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnDisabled:  { opacity: 0.4 },
  nextBtnText:      { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Type of Cake
  typeGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  typeCard:         { width: '30%', aspectRatio: 1, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: PINK_MID },
  typeCardActive:   { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  typeLabel:        { fontSize: 11, fontWeight: '700', color: '#1a1612', textAlign: 'center', paddingHorizontal: 4 },
  typeLabelActive:  { color: '#fff' },
  typeSwipeRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  typeArrow:        { padding: 8 },
  typeArrowDisabled:{ opacity: 0.3 },
  dotsRow:          { flexDirection: 'row', gap: 8 },
  dot:              { width: 8, height: 8, borderRadius: 4, backgroundColor: PINK_MID },
  dotActive:        { backgroundColor: PINK_DARK, width: 20 },

  // Allergies
  checkbox:         { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: PINK_MID, alignItems: 'center', justifyContent: 'center' },
  checkboxActive:   { backgroundColor: PINK_DARK, borderColor: PINK_DARK },

  // Date / Calendar
  calCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: PINK_MID },
  calHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calMonthLabel:    { fontSize: 16, fontWeight: '800', color: '#1a1612' },
  calGrid:          { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:          { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calDayCell:       { borderRadius: 999 },
  calDayCellActive: { backgroundColor: PINK_DARK },
  calDayText:       { fontSize: 14, fontWeight: '600', color: '#1a1612' },
  calDayTextActive: { color: '#fff', fontWeight: '800' },

  // Hour
  hourRow:          { flexDirection: 'row', alignItems: 'center', gap: 16 },
  hourBox:          { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: PINK_MID, paddingHorizontal: 8 },
  hourScroller:     { flex: 1, maxHeight: 200 },
  hourOption:       { paddingVertical: 12, alignItems: 'center' },
  hourOptionActive: { backgroundColor: PINK_DARK, borderRadius: 8 },
  hourOptionText:   { fontSize: 18, fontWeight: '700', color: '#1a1612' },
  hourOptionTextActive: { color: '#fff' },
  hourColon:        { fontSize: 20, fontWeight: '800', color: '#1a1612' },
  ampmBadge:        { backgroundColor: PINK_DARK, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16 },
  ampmText:         { fontSize: 16, fontWeight: '900', color: '#fff' },

  // Order Recall
  recallBox:        { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: PINK_MID, marginBottom: 20 },
  recallRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  recallLabel:      { fontSize: 13, color: '#6b6b6b', fontWeight: '600' },
  recallValue:      { fontSize: 13, color: '#1a1612', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 },
  confirmBtn:       { backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  confirmBtnText:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  editBtn:          { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: PINK_MID },
  editBtnText:      { fontSize: 14, fontWeight: '700', color: '#6b6b6b' },
});
