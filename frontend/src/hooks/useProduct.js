import { useState, useEffect } from 'react';
import api from '../api/axios';
import { normalizeItem, normalizeProduct } from '../utils/api';

export const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setProduct(null);
    setError(null);
    setLoading(Boolean(id));

    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`, { signal: controller.signal });
        if (!controller.signal.aborted) setProduct(normalizeProduct(normalizeItem(response.data)));
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.response?.status === 404 ? 'Product not found' : 'Could not load this product.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    if (id) fetchProduct();
    return () => controller.abort();
  }, [id]);

  return { product, loading, error };
};
