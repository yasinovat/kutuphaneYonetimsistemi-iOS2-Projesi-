import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AuthContext } from './AuthContext';
import { fetchBooksWithFilters } from '../services/api';

const DEFAULT_FILTERS = {
  search: '',
  title: '',
  author: '',
  genre: '',
  inStock: false
};

export const BooksContext = createContext();

function normalizeBookValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function BooksProvider({ children }) {
  const { userToken } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [coverCache, setCoverCache] = useState({});
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const loadBooks = useCallback(async (nextFilters = DEFAULT_FILTERS, options = {}) => {
    const { showLoading = false, showRefreshing = false } = options;

    try {
      if (showLoading) {
        setIsLoading(true);
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      }

      setError('');

      const query = {
        search: normalizeBookValue(nextFilters.search),
        title: normalizeBookValue(nextFilters.title),
        author: normalizeBookValue(nextFilters.author),
        genre: normalizeBookValue(nextFilters.genre),
        inStock: Boolean(nextFilters.inStock)
      };

      const data = await fetchBooksWithFilters(query);
      setBooks(Array.isArray(data) ? data : []);
      setLastSyncedAt(new Date().toISOString());
    } catch (loadError) {
      setError(loadError.message || 'Kitaplar yüklenemedi.');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }

      if (showRefreshing) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!userToken) {
      setBooks([]);
      setFilters(DEFAULT_FILTERS);
      setError('');
      setIsLoading(false);
      setIsRefreshing(false);
      setLastSyncedAt(null);
      return;
    }

    loadBooks(DEFAULT_FILTERS, { showLoading: true });
  }, [loadBooks, userToken]);

  const updateFilters = useCallback((patch) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const searchBooks = useCallback(async (nextFilters) => {
    const mergedFilters = { ...filters, ...nextFilters };
    setFilters(mergedFilters);
    await loadBooks(mergedFilters, { showLoading: true });
  }, [filters, loadBooks]);

  const clearFilters = useCallback(async () => {
    setFilters(DEFAULT_FILTERS);
    await loadBooks(DEFAULT_FILTERS, { showLoading: true });
  }, [loadBooks]);

  const refreshBooks = useCallback(async () => {
    await loadBooks(filters, { showRefreshing: true });
  }, [filters, loadBooks]);

  const getBookById = useCallback((bookId) => {
    const normalizedId = String(bookId);
    return books.find((book) => String(book.id) === normalizedId) || null;
  }, [books]);

  const dashboardStats = useMemo(() => {
    const totalBooks = books.length;
    const booksInStock = books.filter((book) => Number(book.available_copies || 0) > 0).length;
    const outOfStockBooks = totalBooks - booksInStock;
    const uniqueGenres = new Set(books.map((book) => book.genre || 'Genel')).size;
    const lowStockBooks = books.filter((book) => {
      const availableCopies = Number(book.available_copies || 0);
      return availableCopies > 0 && availableCopies <= 2;
    }).length;

    return {
      totalBooks,
      booksInStock,
      outOfStockBooks,
      uniqueGenres,
      lowStockBooks
    };
  }, [books]);

  const booksContext = {
    books,
    filters,
    // cover cache: map of bookId -> coverUrl
    coverCache,
    setCoverForBook: (bookId, url) => {
      if (!bookId) return;
      setCoverCache((prev) => ({ ...prev, [String(bookId)]: url }));
    },
    getCoverForBook: (bookId) => {
      if (!bookId) return null;
      return coverCache[String(bookId)] || null;
    },
    isLoading,
    isRefreshing,
    error,
    lastSyncedAt,
    dashboardStats,
    loadBooks,
    updateFilters,
    searchBooks,
    clearFilters,
    refreshBooks,
    getBookById
  };

  return <BooksContext.Provider value={booksContext}>{children}</BooksContext.Provider>;
}
