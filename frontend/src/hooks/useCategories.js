import { useState, useEffect } from 'react';
import api from '../api/axios';
import { normalizeCategory, normalizeCollection } from '../utils/api';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCats = async () => {
      try {
        const { data } = await api.get('/categories', { signal: controller.signal });
        setCategories(normalizeCollection(data).map(normalizeCategory));
      } catch {
        // The caller can continue without category filters if this request fails.
      }
    };

    fetchCats();
    return () => controller.abort();
  }, []);

  return categories;
};
