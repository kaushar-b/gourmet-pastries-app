// ─────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for all event-cake pricing.
// Change a number here and it updates the wizard, quote, cart,
// checkout and dashboards everywhere. Prices are INTERNAL — never
// shown per-line to the customer, only the computed total is shown.
// ─────────────────────────────────────────────────────────────

export const PRICE_PER_PART   = 80;   // P80 per cake part (= per person)
export const PRICE_PER_FLAVOUR = 50;  // P50 each (multi-select)
export const PRICE_PER_DECOR   = 50;  // P50 each (multi-select, incl. Candle)
export const PRICE_TEXT_ON_CAKE = 10; // P10 if any text added, else 0
export const VAT_RATE = 0.14;

export const FLAVOURS = ['Chocolate', 'Vanilla', 'Coffee', 'Fruit', 'Lemon'];
export const DECORATIONS = ['Sprinkles', 'Fresh Fruit', 'Flowers', 'Chocolate Drip', 'Candle'];
export const OCCASIONS = ['Birthday', 'Party', 'Wedding', 'Corporate', 'Other'];
export const ALLERGY_OPTIONS = ['Gluten', 'Almond', 'Peanuts', 'Dairy', 'Eggs', 'Soy', 'Other', 'None'];

export const CAKE_TYPES = [
  { id: 'round',    label: 'Round Cake',    image: require('../assets/cake-round.png') },
  { id: 'square',   label: 'Sheet Cake',    image: require('../assets/cake-square.png') },
  { id: 'two_tier', label: 'Two-Tier Cake', image: require('../assets/cake-two-tier.png') },
];
export const CAKE_TYPE_LABELS: Record<string, string> = {
  round: 'Round Cake', square: 'Sheet Cake', two_tier: 'Two-Tier Cake',
};

// Number of parts: 4..50 stepping by 4 (4,8,...,48) plus 50
export const PART_COUNTS = (() => {
  const arr: number[] = [];
  for (let n = 4; n <= 48; n += 4) arr.push(n);
  arr.push(50);
  return arr;
})();

export type CakeData = {
  occasion: string | null;
  occasionOther: string;
  cakeParts: number | null;
  flavours: string[];
  decorations: string[];
  cakeText: string;
  cakeType: string | null;
  allergies: string[];
  allergyOther: string;
  date: { year: number; month: number; day: number } | null;
  hour: { h: number; m: number } | null;
};

// Returns the full cake total EXCLUDING vat.
export function computeCakeTotal(d: Partial<CakeData>): number {
  const parts   = (d.cakeParts ?? 0) * PRICE_PER_PART;
  const flav    = (d.flavours?.length ?? 0) * PRICE_PER_FLAVOUR;
  const decor   = (d.decorations?.length ?? 0) * PRICE_PER_DECOR;
  const text    = (d.cakeText && d.cakeText.trim().length > 0) ? PRICE_TEXT_ON_CAKE : 0;
  return parts + flav + decor + text;
}

// Build the human-readable allergy list (drops the literal "Other",
// substitutes the specified text instead).
export function allergyDisplay(allergies: string[] = [], other = ''): string {
  if (!allergies.length) return 'None';
  if (allergies.includes('None')) return 'None';
  const out = allergies.filter(a => a !== 'Other');
  if (allergies.includes('Other') && other.trim()) out.push(other.trim());
  return out.length ? out.join(', ') : '—';
}
