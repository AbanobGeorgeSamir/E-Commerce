import { useState, useEffect } from 'react';
import api from '../api/axios';
import { normalizeItem, normalizeProduct } from '../utils/api';

export const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(normalizeProduct(normalizeItem(response.data)));
      } catch {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    } else {
      setLoading(false);
    }
  }, [id]);

  return { product, loading, error };
};
