import { useEffect, useState } from 'react';
import { AuthContext } from './auth-context';
import {
  clearStoredAuth,
  fetchAuthenticatedUser,
  getStoredToken,
  storeAuthToken
} from
  '../api/axios';
import { isAdminUser, normalizeItem } from '../utils/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const freshUser = normalizeItem(await fetchAuthenticatedUser());
    localStorage.setItem('user', JSON.stringify(freshUser));
    setUser(freshUser);
    return freshUser;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        await refreshUser();
      } catch (error) {
        if (getStoredToken() || localStorage.getItem('user')) {
          console.error('Failed to initialize auth state', error);
        }
        clearStoredAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userData, token) => {
    if (token) {
      storeAuthToken(token);
    }

    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }

    try {
      return await refreshUser();
    } catch (error) {
      console.error('Failed to fetch authenticated user', error);
      return userData;
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        isAdmin: isAdminUser(user)
      }}>

      {children}
    </AuthContext.Provider>);

};
