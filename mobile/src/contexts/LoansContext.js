import React, { createContext, useState, useCallback, useContext } from 'react';
import {
  fetchActiveLoans,
  fetchAllLoans,
  fetchLoanDetail,
  returnLoan,
  fetchOverdueCount
} from '../services/api';

export const LoansContext = createContext();

export function LoansProvider({ children }) {
  const [activeLoans, setActiveLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Get active loans for current user
  const loadActiveLoans = useCallback(async (options = {}) => {
    const { showLoading = true, showRefreshing = false } = options;

    try {
      if (showLoading) setIsLoading(true);
      if (showRefreshing) setIsRefreshing(true);
      setError('');

      const data = await fetchActiveLoans();
      setActiveLoans(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'Ödünç alma kayıtları yüklenemedi.');
    } finally {
      if (showLoading) setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  }, []);

  // Get all loans (including returned)
  const loadAllLoans = useCallback(async (options = {}) => {
    const { showLoading = false, showRefreshing = false } = options;

    try {
      if (showLoading) setIsLoading(true);
      if (showRefreshing) setIsRefreshing(true);
      setError('');

      const data = await fetchAllLoans();
      setAllLoans(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'Ödünç alma kayıtları yüklenemedi.');
    } finally {
      if (showLoading) setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  }, []);

  // Get overdue count
  const loadOverdueCount = useCallback(async () => {
    try {
      const data = await fetchOverdueCount();
      setOverdueCount(data.overdue_count || 0);
    } catch (error) {
      console.error('Gecikmiş ödünç sayısı yüklenemedi:', error.message);
    }
  }, []);

  // Return a loan
  const returnBookFromLoan = useCallback(async (loanId) => {
    try {
      setError('');
      await returnLoan(loanId);
      
      // Refresh the loans list
      await loadActiveLoans({ showRefreshing: true });
      await loadOverdueCount();
      
      return { success: true };
    } catch (returnError) {
      setError(returnError.message || 'Kitap iade edilemedi.');
      throw returnError;
    }
  }, [loadActiveLoans, loadOverdueCount]);

  return (
    <LoansContext.Provider value={{
      activeLoans,
      allLoans,
      overdueCount,
      isLoading,
      isRefreshing,
      error,
      loadActiveLoans,
      loadAllLoans,
      loadOverdueCount,
      returnBookFromLoan
    }}>
      {children}
    </LoansContext.Provider>
  );
}
