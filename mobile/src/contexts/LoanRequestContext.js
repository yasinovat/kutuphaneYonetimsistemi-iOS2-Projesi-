import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import {
  fetchMyLoanRequests,
  fetchPendingLoanRequests,
  fetchLoanRequestDetail,
  createLoanRequest,
  approveLoanRequest,
  rejectLoanRequest,
  cancelLoanRequest,
  fetchLoanRequestStats
} from '../services/api';

export const LoanRequestContext = createContext();

export function LoanRequestProvider({ children }) {
  const { userToken, user } = useContext(AuthContext);
  const [myRequests, setMyRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, cancelled: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Kullanıcının kendi isteklerini yükle
  const loadMyRequests = useCallback(async (options = {}) => {
    const { showLoading = false, showRefreshing = false } = options;

    try {
      if (showLoading) setIsLoading(true);
      if (showRefreshing) setIsRefreshing(true);
      setError('');

      const data = await fetchMyLoanRequests();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'İstekler yüklenemedi.');
    } finally {
      if (showLoading) setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  }, []);

  // Admin: Bekleyen istekleri yükle
  const loadPendingRequests = useCallback(async (options = {}) => {
    const { showLoading = false, showRefreshing = false } = options;

    try {
      if (showLoading) setIsLoading(true);
      if (showRefreshing) setIsRefreshing(true);
      setError('');

      if (user?.role !== 'admin') {
        throw new Error('Yalnızca admin bu işlemi yapabilir.');
      }

      const data = await fetchPendingLoanRequests();
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'Bekleyen istekler yüklenemedi.');
    } finally {
      if (showLoading) setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  }, [user]);

  // İstek istatistikleri yükle (Admin)
  const loadStats = useCallback(async () => {
    try {
      if (user?.role !== 'admin') return;

      const data = await fetchLoanRequestStats();
      const statsMap = {};
      data.forEach(item => {
        statsMap[item.status] = item.count;
      });

      setStats({
        pending: statsMap.pending || 0,
        approved: statsMap.approved || 0,
        rejected: statsMap.rejected || 0,
        cancelled: statsMap.cancelled || 0
      });
    } catch (error) {
      console.error('Stats yükleme hatası:', error.message);
    }
  }, [user]);

  // Yeni istek oluştur
  const createNewRequest = useCallback(async (bookId, note = null) => {
    try {
      setError('');
      const result = await createLoanRequest({ bookId, note });
      setMyRequests(prev => [result.request, ...prev]);
      return result;
    } catch (createError) {
      setError(createError.message || 'İstek oluşturulamadı.');
      throw createError;
    }
  }, []);

  // İsteği onayla (Admin)
  const approveRequest = useCallback(async (requestId) => {
    try {
      setError('');
      const result = await approveLoanRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      await loadStats();
      return result;
    } catch (approveError) {
      setError(approveError.message || 'İstek onaylanamadı.');
      throw approveError;
    }
  }, [loadStats]);

  // İsteği reddet (Admin)
  const rejectRequest = useCallback(async (requestId, rejectionReason = null) => {
    try {
      setError('');
      const result = await rejectLoanRequest(requestId, rejectionReason);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      await loadStats();
      return result;
    } catch (rejectError) {
      setError(rejectError.message || 'İstek reddedilemedi.');
      throw rejectError;
    }
  }, [loadStats]);

  // İsteği iptal et
  const cancelRequest = useCallback(async (requestId) => {
    try {
      setError('');
      const result = await cancelLoanRequest(requestId);
      setMyRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'cancelled' } : r));
      return result;
    } catch (cancelError) {
      setError(cancelError.message || 'İstek iptal edilemedi.');
      throw cancelError;
    }
  }, []);

  // Sayfa yüklendiğinde ilk verileri getir
  useEffect(() => {
    if (!userToken) {
      setMyRequests([]);
      setPendingRequests([]);
      setStats({ pending: 0, approved: 0, rejected: 0, cancelled: 0 });
      setError('');
      setIsLoading(false);
      return;
    }

    loadMyRequests({ showLoading: true });
    if (user?.role === 'admin') {
      loadPendingRequests({ showLoading: false });
      loadStats();
    }
  }, [userToken, user, loadMyRequests, loadPendingRequests, loadStats]);

  const value = {
    myRequests,
    pendingRequests,
    stats,
    isLoading,
    isRefreshing,
    error,
    loadMyRequests,
    loadPendingRequests,
    loadStats,
    createNewRequest,
    approveRequest,
    rejectRequest,
    cancelRequest
  };

  return (
    <LoanRequestContext.Provider value={value}>
      {children}
    </LoanRequestContext.Provider>
  );
}
