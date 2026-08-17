import { useState, useEffect } from 'react';
import api from '../api/axios';
import { normalizeCollection, normalizeProduct } from '../utils/api';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(normalizeCollection(response.data).map(normalizeProduct));
      } catch (err) {
        setError('Could not load products. Check your connection.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
};
