import { useState, useEffect } from 'react';
import api from '../api/axios';
import { normalizeCollection, normalizeProduct } from '../utils/api';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        const response = await api.get('/products?limit=24', { signal: controller.signal });
        setProducts(normalizeCollection(response.data).map(normalizeProduct));
      } catch {
        if (!controller.signal.aborted) setError('Could not load products. Check your connection.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, []);

  return { products, loading, error };
};
