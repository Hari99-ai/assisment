import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ttm_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ttm_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/api/auth/profile')
      .then((response) => {
        setUser(response.data.user);
        localStorage.setItem('ttm_user', JSON.stringify(response.data.user));
      })
      .catch(() => {
        localStorage.removeItem('ttm_token');
        localStorage.removeItem('ttm_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const response = await api.post('/api/auth/login', credentials);
    localStorage.setItem('ttm_token', response.data.token);
    localStorage.setItem('ttm_user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response.data.user;
  }

  async function signup(credentials) {
    const response = await api.post('/api/auth/signup', credentials);
    localStorage.setItem('ttm_token', response.data.token);
    localStorage.setItem('ttm_user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response.data.user;
  }

  function logout() {
    localStorage.removeItem('ttm_token');
    localStorage.removeItem('ttm_user');
    setUser(null);
  }

  async function refreshProfile() {
    const response = await api.get('/api/auth/profile');
    setUser(response.data.user);
    localStorage.setItem('ttm_user', JSON.stringify(response.data.user));
    return response.data.user;
  }

  async function updateProfile(payload) {
    const response = await api.put('/api/auth/profile', payload);
    setUser(response.data.user);
    localStorage.setItem('ttm_user', JSON.stringify(response.data.user));
    return response.data.user;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

