import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthContext } from './auth-context';
import {
  clearStoredAuth,
  clearStoredToken,
  fetchAuthenticatedUser,
  storeAuthToken
} from '../api/axios';
import { isAdminUser, normalizeItem } from '../utils/api';

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authVersion = useRef(0);

  const refreshUser = useCallback(async () => {
    const requestVersion = authVersion.current;
    const freshUser = normalizeItem(await fetchAuthenticatedUser());
    if (requestVersion !== authVersion.current) return null;
    if (!freshUser || typeof freshUser !== 'object') {
      throw new Error('The authenticated user response was invalid.');
    }

    localStorage.setItem('user', JSON.stringify(freshUser));
    // Successful cookie authentication migrates any previously stored browser bearer token.
    clearStoredToken();
    setUser(freshUser);
    return freshUser;
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      authVersion.current += 1;
      clearStoredAuth();
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    let active = true;
    const cachedUser = readStoredUser();
    if (cachedUser) setUser(cachedUser);

    const initializeAuth = async () => {
      try {
        await refreshUser();
      } catch (error) {
        if (!active) return;

        if (error.response?.status === 401) {
          clearStoredAuth();
          setUser(null);
        } else if (!cachedUser) {
          // Keep an existing cached identity through temporary API or database outages.
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    initializeAuth();
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = async (userData, token) => {
    authVersion.current += 1;
    if (token) storeAuthToken(token);

    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }

    try {
      return await refreshUser();
    } catch (error) {
      if (error.response?.status === 401) {
        clearStoredAuth();
        setUser(null);
        throw new Error('Could not establish a secure session. Please sign in again.', { cause: error });
      }

      console.error('Failed to refresh authenticated user', error);
      return userData;
    }
  };

  const logout = () => {
    authVersion.current += 1;
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
    </AuthContext.Provider>
  );
};
