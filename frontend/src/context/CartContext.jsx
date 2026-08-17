import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CartContext } from './cart-context';
import { getEntityId, normalizeProduct } from '../utils/api';

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch {
      localStorage.removeItem('cart');
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, amount = 1) => {
    const quantityToAdd = Math.max(1, Number(amount));
    const normalizedProduct = normalizeProduct(product);
    const productId = getEntityId(normalizedProduct);
    const stock = Number(normalizedProduct.stock);
    const hasTrackedStock = Number.isFinite(stock);

    if (hasTrackedStock && stock < 1) {
      toast.error('This product is currently out of stock.');
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => getEntityId(item) === productId);

      if (existingItem) {
        const nextQuantity = hasTrackedStock
          ? Math.min(existingItem.quantity + quantityToAdd, stock)
          : existingItem.quantity + quantityToAdd;

        return prevCart.map((item) =>
          getEntityId(item) === productId ?
            { ...item, quantity: nextQuantity } :
            item
        );
      }

      return [...prevCart, {
        ...normalizedProduct,
        quantity: hasTrackedStock ? Math.min(quantityToAdd, stock) : quantityToAdd
      }];
    });

    const quantityAdded = hasTrackedStock ? Math.min(quantityToAdd, stock) : quantityToAdd;
    toast.success(`${quantityAdded} x ${normalizedProduct.name} added!`);
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => getEntityId(item) !== String(id)));
    toast.success('Item removed from cart');
  };

  const updateQty = (id, newQty) => {
    const qty = Number(newQty);
    if (qty < 1) return;

    setCart((prevCart) =>
      prevCart.map((item) => getEntityId(item) === String(id) ? { ...item, quantity: qty } : item)
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const subtotal = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        subtotal,
        cartCount
      }}>

      {children}
    </CartContext.Provider>);

};
