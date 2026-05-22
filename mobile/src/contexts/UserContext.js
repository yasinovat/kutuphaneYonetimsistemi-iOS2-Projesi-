import React, { createContext, useState, useCallback, useContext } from 'react';
import { fetchUsersList, toggleUserStatusApi, updateUserApi } from '../services/api';
import { AuthContext } from './AuthContext';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const { userToken } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tüm kullanıcıları getir (Admin only)
  const fetchUsers = useCallback(async () => {
    if (!userToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchUsersList();
      // fetchUsersList parse edilmiş json arrayi döndürüyor
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Kullanıcıları getirirken hata oluştu';
      setError(errorMsg);
      console.error('Fetch users error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  // Kullanıcı durumunu aktif/pasif yap
  const toggleUserStatus = useCallback(async (userId) => {
    if (!userToken) return null;

    try {
      const response = await toggleUserStatusApi(userId);

      // Yerel state'i güncelle
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_active: !user.is_active } : user
        )
      );

      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Kullanıcı durumu değiştirilirken hata oluştu';
      setError(errorMsg);
      console.error('Toggle user status error:', err);
      throw err;
    }
  }, [userToken]);

  // Kullanıcı bilgisini güncelle
  const updateUser = useCallback(async (userId, userData) => {
    if (!userToken) return null;

    try {
      const data = await updateUserApi(userId, userData);

      // Yerel state'i güncelle
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? (data || user) : user
        )
      );

      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Kullanıcı güncellenirken hata oluştu';
      setError(errorMsg);
      console.error('Update user error:', err);
      throw err;
    }
  }, [userToken]);

  const value = {
    users,
    isLoading,
    error,
    fetchUsers,
    toggleUserStatus,
    updateUser
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUsers() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be used within UserProvider');
  }
  return context;
}
