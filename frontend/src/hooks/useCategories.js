import { useState, useEffect } from 'react';
import api from '../api/axios';
import { normalizeCategory, normalizeCollection } from '../utils/api';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(normalizeCollection(data).map(normalizeCategory));
      } catch (err) {
        console.error('Error fetching categories', err);
      }
    };

    fetchCats();
  }, []);

  return categories;
};
