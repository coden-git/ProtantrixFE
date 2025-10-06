import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import api, { setAuthToken, registerUnauthorizedHandler } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({
  loading: true,
  token: null,
  user: null,
  role: null,
  name: null,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.user';
const EXPIRES_KEY = 'auth.expiresIn';

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const loadFromStorage = useCallback(async () => {
    try {
      const [[, storedToken], [, storedUser], [, expires]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY, EXPIRES_KEY]);
      if (storedToken && storedUser) {
        let parsed = null;
        try { parsed = JSON.parse(storedUser); } catch { parsed = null; }
        setToken(storedToken);
        setUser(parsed);
        setAuthToken(storedToken);
      } else {
        setToken(null);
        setUser(null);
        setAuthToken(null);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Auth load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  const login = useCallback(async (tokenValue, userObj, expiresIn) => {
    setToken(tokenValue);
    setUser(userObj);
    setAuthToken(tokenValue);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, tokenValue || ''],
      [USER_KEY, JSON.stringify(userObj || {})],
      [EXPIRES_KEY, expiresIn || ''],
    ]);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, EXPIRES_KEY]);
  }, []);

  const refresh = useCallback(loadFromStorage, [loadFromStorage]);

  const value = useMemo(() => ({
    loading,
    token,
    user,
    role: user?.role || null,
    name: user?.name || null,
    login,
    logout,
    refresh,
  }), [loading, token, user, login, logout, refresh]);

  useEffect(() => {
    // Register a single unauthorized handler (runs once)
    registerUnauthorizedHandler(async () => {
      // Auto logout on 401
      await logout();
    });
  }, [logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
