import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/data/products';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size?: string) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'sam-esthetic-cart';

const getCartKey = (productId: string, size?: string) =>
  size ? `${productId}__${size}` : productId;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, size?: string) => {
    setItems(prev => {
      const key = getCartKey(product.id, size);
      const existing = prev.find(
        i => getCartKey(i.product.id, i.selectedSize) === key
      );
      if (existing) {
        return prev.map(i =>
          getCartKey(i.product.id, i.selectedSize) === key
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1, selectedSize: size }];
    });
  };

  const removeItem = (cartKey: string) => {
    setItems(prev =>
      prev.filter(i => getCartKey(i.product.id, i.selectedSize) !== cartKey)
    );
  };

  const updateQuantity = (cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartKey);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        getCartKey(i.product.id, i.selectedSize) === cartKey
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
