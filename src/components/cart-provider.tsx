"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  salePrice: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CART_KEY = "marginmint.cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (!raw) {
        return [];
      }

      return JSON.parse(raw) as CartItem[];
    } catch (error) {
      console.error("Failed to hydrate cart", error);
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

    return {
      items,
      count,
      subtotal,
      addItem(item) {
        setItems((current) => {
          const existing = current.find((line) => line.productId === item.productId);
          if (!existing) {
            return [...current, item];
          }

          return current.map((line) =>
            line.productId === item.productId
              ? {
                  ...line,
                  quantity: line.quantity + item.quantity,
                }
              : line,
          );
        });
      },
      removeItem(productId) {
        setItems((current) => current.filter((line) => line.productId !== productId));
      },
      updateQuantity(productId, quantity) {
        if (quantity <= 0) {
          setItems((current) => current.filter((line) => line.productId !== productId));
          return;
        }

        setItems((current) =>
          current.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
        );
      },
      clearCart() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
