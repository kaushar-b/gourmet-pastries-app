import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, FlatList, Image, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  FLAVOURS, DECORATIONS, OCCASIONS, ALLERGY_OPTIONS, CAKE_TYPES,
  PART_COUNTS, CAKE_TYPE_LABELS, allergyDisplay, CakeData,
} from '../../constants/eventPricing';
import { CAROUSEL_IMAGES } from '../../constants/carousel';

const { width: SW } = Dimensions.get('window');
const PINK_DARK   = '#CE6F79';
const PINK_LIGHT  = '#FADAD9';
const PINK_MID    = '#E9ABAE';

const EVENT_ITEM = Math.round(SW / 2.3);
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const CAROUSEL_ITEMS = [
  { id: 'c1', icon: 'gift-outline' as const }, { id: 'c2', icon: 'flower-outline' as const },
  { id: 'c3', icon: 'cafe-outline' as const }, { id: 'c4', icon: 'heart-outline' as const },
  { id: 'c5', icon: 'ellipse-outline' as const }, { id: 'c6', icon: 'pie-chart-outline' as const },
];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay(); }

function PlaceholderTile({ icon, size }: { icon: keyof typeof Ionicons.glyphMap; size: number }) {
  return <View style={[ph.tile, { width: size, height: size }]}><Ionicons name={icon} size={size * 0.4} color={PINK_DARK} /></View>;
}
const ph = StyleSheet.create({ tile: { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: PINK_MID } });

const STEPS = ['intro','occasion','parts','flavour','decoration','text','type','allergies','date','hour','recall'] as const;
type Step = typeof STEPS[number];

export default function EventBuilder() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string; editData?: string }>();
  const editId = params.editId || null;
  const preset: Partial<CakeData> = params.editData ? JSON.parse(params.editData) : {};

  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const [data, setData] = useState<CakeData>({
    occasion: preset.occasion ?? null,
    occasionOther: preset.occasionOther ?? '',
    cakeParts: preset.cakeParts ?? null,
    flavours: preset.flavours ?? [],
    decorations: preset.decorations ?? [],
    cakeText: preset.cakeText ?? '',
    cakeType: preset.cakeType ?? null,
    allergies: preset.allergies ?? [],
    allergyOther: preset.allergyOther ?? '',
    date: preset.date ?? null,
    hour: preset.hour ?? { h: 10, m: 30 },
  });

  // "OK confirmed" flags for the specify boxes (turn the OK button green + tick)
  const [occOk, setOccOk]   = useState(!!preset.occasionOther);
  const [algOk, setAlgOk]   = useState(!!preset.allergyOther);
  const [txtOk, setTxtOk]   = useState(!!preset.cakeText);

  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [hourVal, setHourVal]   = useState(preset.hour?.h ?? 10);
  const [minuteVal, setMinuteVal] = useState(preset.hour?.m ?? 30);
  const [hourPicked, setHourPicked]     = useState(true);
  const [minutePicked, setMinutePicked] = useState(true);

  const flatRef = useRef<FlatList>(null);
  const LOOPED = [...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES];
  const START = CAROUSEL_IMAGES.length;

  useEffect(() => { try { flatRef.current?.scrollToIndex({ index: START, animated: false }); } catch {} }, []);
  useEffect(() => {
    if (step !== 'intro') return;
    let idx = 0;
    const t = setInterval(() => { idx += 1; try { flatRef.current?.scrollToIndex({ index: START + (idx % CAROUSEL_IMAGES.length), animated: true }); } catch {} }, 2000);
    return () => clearInterval(t);
  }, [step]);

  const toggleIn = (key: 'flavours' | 'decorations', opt: string) =>
    setData(d => ({ ...d, [key]: d[key].includes(opt) ? d[key].filter(x => x !== opt) : [...d[key], opt] }));

  const toggleAllergy = (opt: string) => setData(d => {
    const checked = d.allergies.includes(opt);
    if (opt === 'None') return { ...d, allergies: checked ? [] : ['None'], allergyOther: checked ? d.allergyOther : '' };
    const base = d.allergies.filter(a => a !== 'None');
    return { ...d, allergies: base.includes(opt) ? base.filter(a => a !== opt) : [...base, opt] };
  });

  const canGoNext = (): boolean => {
    switch (step) {
      case 'occasion':   return !!data.occasion && (data.occasion !== 'Other' || (data.occasionOther.trim().length > 0 && occOk));
      case 'parts':      return !!data.cakeParts;
      case 'flavour':    return data.flavours.length > 0;
      case 'decoration': return data.decorations.length > 0;
      case 'text':       return true; // skippable
      case 'type':       return !!data.cakeType;
      case 'allergies':  return data.allergies.length > 0 && (!data.allergies.includes('Other') || (data.allergyOther.trim().length > 0 && algOk));
      case 'date':       return !!data.date;
      case 'hour':       return hourPicked && minutePicked;
      default:           return true;
    }
  };

  const goNext = () => { if (stepIdx < STEPS.length - 1) setStepIdx(i => i + 1); };
  const goBack = () => { if (stepIdx === 0) { router.push('/tabs'); return; } setStepIdx(i => i - 1); };

  const OkButton = ({ done, onPress }: { done: boolean; onPress: () => void }) => (
    <TouchableOpacity style={[s.okBtn, done && s.okBtnDone]} onPress={onPress}>
      {done ? <Ionicons name="checkmark" size={18} color="#fff" /> : <Text style={s.okBtnText}>OK</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#1a1612" /><Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}><Text style={s.title}>Plan Your Event Cake</Text></View>
        <TouchableOpacity style={s.homeBtn} onPress={() => router.push('/tabs')}>
          <Ionicons name="home" size={22} color="#CE6F79" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {step === 'intro' && (
          <>
            <View style={s.carouselWrap}>
              <FlatList ref={flatRef} data={LOOPED} horizontal showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => `c-${i}`}
                getItemLayout={(_, i) => ({ length: EVENT_ITEM + 8, offset: (EVENT_ITEM + 8) * i, index: i })}
                onScrollToIndexFailed={() => {}}
                renderItem={({ item }) => <View style={s.carouselItem}><Image source={item} style={{ width: EVENT_ITEM, height: EVENT_ITEM }} resizeMode="cover" /></View>} />
            </View>
            <Text style={s.introHeading}>Custom Event Cake</Text>
            <Text style={s.introText}>Let's build your perfect event cake, step by step.</Text>
            <TouchableOpacity style={s.introStartBtn} onPress={goNext}>
              <Text style={s.introStartText}>Let's Start</Text><Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {step === 'occasion' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>What's the occasion?</Text>
            {OCCASIONS.map(opt => (
              <View key={opt}>
                <TouchableOpacity style={[s.optionRow, data.occasion === opt && s.optionRowActive]} onPress={() => setData(d => ({ ...d, occasion: opt }))}>
                  <View style={[s.radio, data.occasion === opt && s.radioActive]}>{data.occasion === opt && <View style={s.radioDot} />}</View>
                  <Text style={[s.optionText, data.occasion === opt && s.optionTextActive]}>{opt}</Text>
                </TouchableOpacity>
                {opt === 'Other' && data.occasion === 'Other' && (
                  <View style={s.specifyRow}>
                    <TextInput style={s.specifyInput} placeholder="Specify occasion..." placeholderTextColor="#aaa"
                      value={data.occasionOther}
                      onChangeText={v => { setData(d => ({ ...d, occasionOther: v })); setOccOk(false); }} />
                    <OkButton done={occOk} onPress={() => { if (data.occasionOther.trim()) { setOccOk(true); Keyboard.dismiss(); } }} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {step === 'parts' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Number of Cake Parts <Text style={s.faint}>(Number of People)</Text></Text>
            <View style={s.partsTopImage}>
              {/* DEMO IMAGE — replace assets/cake-parts.png with your real one (keep the name) */}
              <Image source={require('../../assets/cake-parts.png')} style={{ width: 110, height: 110, borderRadius: 12 }} resizeMode="cover" />
            </View>
            <ScrollView style={s.partsScrollerFull} contentContainerStyle={{ paddingVertical: 8 }} nestedScrollEnabled>
              {PART_COUNTS.map(n => (
                <TouchableOpacity key={n} style={[s.partOption, data.cakeParts === n && s.partOptionActive]} onPress={() => setData(d => ({ ...d, cakeParts: n }))}>
                  <Text style={[s.partOptionText, data.cakeParts === n && s.partOptionTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {step === 'flavour' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Flavour <Text style={s.faint}>(select one or more)</Text></Text>
            {FLAVOURS.map(opt => {
              const checked = data.flavours.includes(opt);
              return (
                <TouchableOpacity key={opt} style={[s.optionRow, checked && s.optionRowActive]} onPress={() => toggleIn('flavours', opt)}>
                  <View style={[s.checkbox, checked && s.checkboxActive]}>{checked && <Ionicons name="checkmark" size={14} color="#fff" />}</View>
                  <Text style={[s.optionText, checked && s.optionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 'decoration' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Decoration <Text style={s.faint}>(select one or more)</Text></Text>
            {DECORATIONS.map(opt => {
              const checked = data.decorations.includes(opt);
              return (
                <TouchableOpacity key={opt} style={[s.optionRow, checked && s.optionRowActive]} onPress={() => toggleIn('decorations', opt)}>
                  <View style={[s.checkbox, checked && s.checkboxActive]}>{checked && <Ionicons name="checkmark" size={14} color="#fff" />}</View>
                  <Text style={[s.optionText, checked && s.optionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 'text' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Text on the Cake</Text>
            <Text style={s.fancyPreview}>{data.cakeText.trim() ? data.cakeText : 'Your message here'}</Text>
            <View style={s.specifyRow}>
              <TextInput style={s.specifyInput} placeholder="e.g. Happy Birthday Lisa!" placeholderTextColor="#aaa"
                value={data.cakeText}
                onChangeText={v => { setData(d => ({ ...d, cakeText: v })); setTxtOk(false); }} />
              <OkButton done={txtOk} onPress={() => { if (data.cakeText.trim()) { setTxtOk(true); Keyboard.dismiss(); } }} />
            </View>
            <TouchableOpacity style={s.skipBtn} onPress={() => { setData(d => ({ ...d, cakeText: '' })); setTxtOk(false); goNext(); }}>
              <Text style={s.skipBtnText}>Skip — no text</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'type' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Type of Cake</Text>
            <View style={s.typeStack}>
              {CAKE_TYPES.map(t => {
                const active = data.cakeType === t.id;
                return (
                  <TouchableOpacity key={t.id} style={[s.typeBox, active && s.typeBoxActive]} onPress={() => setData(d => ({ ...d, cakeType: t.id }))} activeOpacity={0.9}>
                    {/* DEMO IMAGE — replace assets/cake-<id>.png with your real ones (keep names) */}
                    <Image source={t.image} style={s.typeImage} resizeMode="cover" />
                    <View style={s.selectDotWrap}>
                      <View style={[s.selectDot, active && s.selectDotActive]}>{active && <Ionicons name="checkmark" size={16} color="#fff" />}</View>
                    </View>
                    <View style={s.typeLabelBar}><Text style={[s.typeLabelText, active && { color: '#fff' }]}>{t.label}</Text></View>
                  </TouchableOpacity>
                );
              })}
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
                  <TouchableOpacity style={[s.optionRow, checked && s.optionRowActive]} onPress={() => toggleAllergy(opt)}>
                    <View style={[s.checkbox, checked && s.checkboxActive]}>{checked && <Ionicons name="checkmark" size={14} color="#fff" />}</View>
                    <Text style={[s.optionText, checked && s.optionTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                  {opt === 'Other' && checked && (
                    <View style={s.specifyRow}>
                      <TextInput style={s.specifyInput} placeholder="Specify allergy..." placeholderTextColor="#aaa"
                        value={data.allergyOther}
                        onChangeText={v => { setData(d => ({ ...d, allergyOther: v })); setAlgOk(false); }} />
                      <OkButton done={algOk} onPress={() => { if (data.allergyOther.trim()) { setAlgOk(true); Keyboard.dismiss(); } }} />
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
                <TouchableOpacity onPress={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}>
                  <Ionicons name="chevron-back" size={22} color={PINK_DARK} />
                </TouchableOpacity>
                <Text style={s.calMonthLabel}>{MONTH_NAMES[calMonth]} {calYear}</Text>
                <TouchableOpacity onPress={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}>
                  <Ionicons name="chevron-forward" size={22} color={PINK_DARK} />
                </TouchableOpacity>
              </View>
              <View style={s.calGrid}>
                {Array.from({ length: firstWeekday(calYear, calMonth) }).map((_, i) => <View key={`e${i}`} style={s.calCell} />)}
                {Array.from({ length: daysInMonth(calYear, calMonth) }).map((_, i) => {
                  const day = i + 1;
                  const sel = data.date?.year === calYear && data.date?.month === calMonth && data.date?.day === day;
                  return (
                    <TouchableOpacity key={day} style={s.calCell} onPress={() => setData(d => ({ ...d, date: { year: calYear, month: calMonth, day } }))}>
                      <View style={[s.calDayPill, sel && s.calDayPillActive]}><Text style={[s.calDayText, sel && s.calDayTextActive]}>{day}</Text></View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {step === 'hour' && (() => {
          const ROW = 44;            // height of each time row
          const VISIBLE = 5;         // rows visible (must be odd so one centers)
          const PAD = ROW * Math.floor(VISIBLE / 2);
          const HOURS = Array.from({ length: 24 }, (_, i) => i);
          const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
          const onHourScroll = (e: any) => {
            const idx = Math.round(e.nativeEvent.contentOffset.y / ROW);
            const h = Math.max(0, Math.min(23, idx));
            setHourVal(h); setHourPicked(true);
            setData(d => ({ ...d, hour: { h, m: minuteVal } }));
          };
          const onMinScroll = (e: any) => {
            const idx = Math.round(e.nativeEvent.contentOffset.y / ROW);
            const m = Math.max(0, Math.min(11, idx)) * 5;
            setMinuteVal(m); setMinutePicked(true);
            setData(d => ({ ...d, hour: { h: hourVal, m } }));
          };
          return (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Time</Text>
              <View style={s.hourRow}>
                <View style={[s.hourBox, { height: ROW * VISIBLE }]}>
                  {/* center selection bar */}
                  <View pointerEvents="none" style={[s.centerBar, { top: PAD, height: ROW }]} />
                  <ScrollView
                    style={s.snapCol}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ROW}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingVertical: PAD }}
                    contentOffset={{ x: 0, y: hourVal * ROW }}
                    onMomentumScrollEnd={onHourScroll}
                    nestedScrollEnabled
                  >
                    {HOURS.map(h => (
                      <View key={h} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[s.snapTxt, hourVal === h && s.snapTxtActive]}>{String(h).padStart(2,'0')}</Text>
                      </View>
                    ))}
                  </ScrollView>
                  <Text style={s.hourColon}>:</Text>
                  <ScrollView
                    style={s.snapCol}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ROW}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingVertical: PAD }}
                    contentOffset={{ x: 0, y: (minuteVal / 5) * ROW }}
                    onMomentumScrollEnd={onMinScroll}
                    nestedScrollEnabled
                  >
                    {MINUTES.map(m => (
                      <View key={m} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[s.snapTxt, minuteVal === m && s.snapTxtActive]}>{String(m).padStart(2,'0')}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
                <View style={s.ampmBadge}><Text style={s.ampmText}>{hourVal >= 12 ? 'PM' : 'AM'}</Text></View>
              </View>
              <Text style={s.hourHint}>Scroll each column — the time in the pink bar is selected.</Text>
            </View>
          );
        })()}

        {step === 'recall' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Order Summary</Text>
            <View style={s.recallBox}>
              <Row l="Occasion" v={data.occasion === 'Other' ? data.occasionOther : (data.occasion || '—')} />
              <Row l="Cake Parts" v={String(data.cakeParts ?? '—')} />
              <Row l="Flavour" v={data.flavours.join(', ') || '—'} />
              <Row l="Decoration" v={data.decorations.join(', ') || '—'} />
              <Row l="Text" v={data.cakeText.trim() || 'None'} />
              <Row l="Type" v={CAKE_TYPE_LABELS[data.cakeType ?? ''] || '—'} />
              <Row l="Allergies" v={allergyDisplay(data.allergies, data.allergyOther)} />
              <Row l="Date" v={data.date ? `${data.date.day} ${MONTH_NAMES[data.date.month]} ${data.date.year}` : '—'} />
              <Row l="Time" v={data.hour ? `${String(data.hour.h % 12 === 0 ? 12 : data.hour.h % 12).padStart(2,'0')}:${String(data.hour.m).padStart(2,'0')} ${data.hour.h >= 12 ? 'PM' : 'AM'}` : '—'} />
            </View>
            <TouchableOpacity style={s.confirmBtn}
              onPress={() => router.push({ pathname: '/event/quote', params: { cakeData: JSON.stringify(data), editId: editId ?? '' } })}>
              <Ionicons name="pricetag" size={20} color="#fff" /><Text style={s.confirmBtnText}>Get Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.editBtn} onPress={() => setStepIdx(i => i - 1)}><Text style={s.editBtnText}>No, Edit</Text></TouchableOpacity>
          </View>
        )}

        {step !== 'intro' && step !== 'recall' && <Text style={s.stepIndicator}>Step {stepIdx} of {STEPS.length - 1}</Text>}
      </ScrollView>

      {step !== 'intro' && step !== 'recall' && (
        <View style={s.footer}>
          <TouchableOpacity style={[s.nextBtn, !canGoNext() && s.nextBtnDisabled]} onPress={goNext} disabled={!canGoNext()}>
            <Text style={s.nextBtnText}>Next</Text><Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <View style={s.recallRow}><Text style={s.recallLabel}>{l}</Text><Text style={s.recallValue}>{v}</Text></View>;
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: PINK_LIGHT },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: '#fff' },
  backBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, width: 70 },
  backText:         { fontSize: 16, fontWeight: '700', color: '#1a1612' },
  headerCenter:     { flex: 1, alignItems: 'center' },
  title:            { fontSize: 16, fontWeight: '800', color: PINK_DARK, textAlign: 'center' },
  content:          { padding: 20, paddingBottom: 40 },
  carouselWrap:     { marginBottom: 20, marginHorizontal: -20 },
  carouselItem:     { width: EVENT_ITEM, height: EVENT_ITEM, marginRight: 8, marginLeft: 12, borderRadius: 16, overflow: 'hidden' },
  introHeading:     { fontSize: 30, fontWeight: '800', fontFamily: 'serif', fontStyle: 'italic', color: PINK_DARK, textAlign: 'center', marginTop: 8 },
  introText:        { fontSize: 15, color: '#1a1612', textAlign: 'center', lineHeight: 22, marginTop: 10 },
  introStartBtn:    { backgroundColor: PINK_DARK, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, alignSelf: 'center', marginTop: 36 },
  introStartText:   { fontSize: 18, fontWeight: '800', color: '#fff' },
  section:          { marginTop: 8 },
  sectionTitle:     { fontSize: 19, fontWeight: '800', color: '#1a1612', marginBottom: 16 },
  faint:            { fontSize: 13, fontWeight: '600', color: '#9a8f8f' },
  optionRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: PINK_MID },
  optionRowActive:  { borderColor: PINK_DARK },
  radio:            { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: PINK_MID, alignItems: 'center', justifyContent: 'center' },
  radioActive:      { borderColor: PINK_DARK },
  radioDot:         { width: 12, height: 12, borderRadius: 6, backgroundColor: PINK_DARK },
  optionText:       { fontSize: 15, fontWeight: '600', color: '#1a1612' },
  optionTextActive: { color: PINK_DARK, fontWeight: '800' },
  checkbox:         { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: PINK_MID, alignItems: 'center', justifyContent: 'center' },
  checkboxActive:   { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  specifyRow:       { flexDirection: 'row', gap: 10, marginBottom: 10, marginTop: 4, paddingHorizontal: 4 },
  specifyInput:     { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: PINK_MID, padding: 12, fontSize: 14, color: '#1a1612' },
  okBtn:            { backgroundColor: '#fff', borderWidth: 1.5, borderColor: PINK_DARK, borderRadius: 10, paddingHorizontal: 20, minWidth: 56, alignItems: 'center', justifyContent: 'center' },
  okBtnDone:        { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  okBtnText:        { color: PINK_DARK, fontWeight: '800', fontSize: 14 },
  partsTopImage:    { alignItems: 'center', marginBottom: 16 },
  partsScrollerFull:{ maxHeight: 280, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: PINK_MID },
  partOption:       { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: PINK_LIGHT },
  partOptionActive: { backgroundColor: PINK_DARK },
  partOptionText:   { fontSize: 16, fontWeight: '700', color: '#1a1612', textAlign: 'center' },
  partOptionTextActive: { color: '#fff' },
  fancyPreview:     { fontFamily: 'serif', fontStyle: 'italic', fontSize: 24, color: PINK_DARK, textAlign: 'center', marginBottom: 16 },
  skipBtn:          { alignItems: 'center', paddingVertical: 12, marginTop: 6 },
  skipBtnText:      { fontSize: 14, fontWeight: '700', color: '#9a8f8f', textDecorationLine: 'underline' },
  typeStack:        { gap: 16 },
  typeBox:          { backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: PINK_MID, overflow: 'hidden', alignSelf: 'center', width: SW * 0.6 },
  typeBoxActive:    { borderColor: PINK_DARK },
  typeImage:        { width: '100%', height: SW * 0.5 },
  selectDotWrap:    { position: 'absolute', top: 10, right: 10 },
  selectDot:        { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', borderWidth: 2, borderColor: PINK_MID, alignItems: 'center', justifyContent: 'center' },
  selectDotActive:  { backgroundColor: PINK_DARK, borderColor: PINK_DARK },
  typeLabelBar:     { backgroundColor: PINK_LIGHT, paddingVertical: 10, alignItems: 'center' },
  typeLabelText:    { fontSize: 15, fontWeight: '800', color: '#1a1612' },
  calCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: PINK_MID },
  calHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calMonthLabel:    { fontSize: 16, fontWeight: '800', color: '#1a1612' },
  calGrid:          { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:          { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calDayPill:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  calDayPillActive: { backgroundColor: PINK_DARK },
  calDayText:       { fontSize: 14, fontWeight: '600', color: '#1a1612' },
  calDayTextActive: { color: '#fff', fontWeight: '800' },
  hourRow:          { flexDirection: 'row', alignItems: 'center', gap: 16 },
  hourBox:          { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: PINK_MID, paddingHorizontal: 8, overflow: 'hidden', position: 'relative' },
  snapCol:          { flex: 1 },
  centerBar:        { position: 'absolute', left: 8, right: 8, backgroundColor: 'rgba(206,111,121,0.14)', borderWidth: 2, borderColor: PINK_DARK, borderRadius: 10 },
  snapTxt:          { fontSize: 20, fontWeight: '700', color: '#b8b8b8' },
  snapTxtActive:    { color: PINK_DARK, fontWeight: '900' },
  hourHint:         { fontSize: 12, color: '#9a8f8f', textAlign: 'center', marginTop: 14 },
  hourScroller:     { flex: 1, maxHeight: 200 },
  hourOption:       { paddingVertical: 12, alignItems: 'center' },
  hourOptionActive: { backgroundColor: PINK_DARK, borderRadius: 8 },
  hourOptionText:   { fontSize: 18, fontWeight: '700', color: '#1a1612' },
  hourOptionTextActive: { color: '#fff' },
  hourColon:        { fontSize: 20, fontWeight: '800', color: '#1a1612' },
  ampmBadge:        { backgroundColor: PINK_DARK, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16 },
  ampmText:         { fontSize: 16, fontWeight: '900', color: '#fff' },
  homeBtn:          { width: 70, alignItems: 'flex-end', justifyContent: 'center' },
  recallBox:        { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: PINK_MID, marginBottom: 20 },
  recallRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  recallLabel:      { fontSize: 13, color: '#6b6b6b', fontWeight: '600' },
  recallValue:      { fontSize: 13, color: '#1a1612', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 },
  confirmBtn:       { backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  confirmBtnText:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  editBtn:          { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 2.5, borderColor: PINK_DARK, backgroundColor: '#fff' },
  editBtnText:      { fontSize: 14, fontWeight: '800', color: PINK_DARK },
  stepIndicator:    { fontSize: 12, color: '#6b6b6b', textAlign: 'center', marginTop: 24 },
  footer:           { padding: 20, paddingBottom: 48, borderTopWidth: 1, borderTopColor: PINK_MID, backgroundColor: '#fff' },
  nextBtn:          { backgroundColor: PINK_DARK, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnDisabled:  { opacity: 0.4 },
  nextBtnText:      { fontSize: 16, fontWeight: '700', color: '#fff' },
});
