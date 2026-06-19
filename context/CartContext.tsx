import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  icon: string;
  image?: any;
  quantity: number;
  // Optional — present only for cake/event orders built via the Event wizard.
  // Stored as a generic object so checkout/dashboards can read+display it
  // without CartContext needing to know the full cake order shape.
  cakeOrder?: Record<string, any>;
};

export type AddableItem = {
  id: string;
  name: string;
  price: number;
  icon?: string;
  image?: any;
  cakeOrder?: Record<string, any>;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (id: string, item?: AddableItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextType | null>(null);
const PINK_DARK = '#CE6F79';

function CartToast({ message, opacity }: { message: string; opacity: Animated.Value }) {
  if (!message) return null;
  return (
    <Animated.View style={[toastStyles.wrap, { opacity }]} pointerEvents="none">
      <View style={toastStyles.pill}>
        <Text style={toastStyles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]       = useState<CartItem[]>([]);
  const [toastMsg, setToastMsg] = useState('');
  const toastOpacity            = useRef(new Animated.Value(0)).current;
  const hideTimer                = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }, 1300);
  };

  const addToCart = (id: string, item?: AddableItem) => {
    setItems(prev => {
      // Cake orders are always unique line items (never merged/stacked),
      // since each one carries its own custom configuration.
      if (item?.cakeOrder) {
        return [...prev, { id, name: item.name, price: item.price, icon: item.icon || 'restaurant', image: item.image, quantity: 1, cakeOrder: item.cakeOrder }];
      }
      const existing = prev.find(i => i.id === id && !i.cakeOrder);
      if (existing) return prev.map(i => i.id === id && !i.cakeOrder ? { ...i, quantity: i.quantity + 1 } : i);
      if (!item) return prev;
      return [...prev, { id, name: item.name, price: item.price, icon: item.icon || 'restaurant', image: item.image, quantity: 1 }];
    });
    showToast('Added to Cart');
  };

  const removeFromCart = (id: string) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && !existing.cakeOrder && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
    showToast('Removed from Cart');
  };

  const clearCart = () => setItems([]);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, count }}>
      <View style={{ flex: 1 }}>
        {children}
        <CartToast message={toastMsg} opacity={toastOpacity} />
      </View>
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

const toastStyles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 110, left: 0, right: 0, alignItems: 'center', zIndex: 9999, elevation: 9999 },
  pill: { backgroundColor: '#1a1612', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, borderWidth: 1, borderColor: PINK_DARK },
  text: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
