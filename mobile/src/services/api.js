import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_BASE_URL;

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Token ile request gönder
async function apiFetch(endpoint, options = {}) {
  const token = await AsyncStorage.getItem('userToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMessage = `İstek başarısız (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // JSON parse hatası, errorMessage'ı olduğu gibi kullan
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Authentication endpoints
export async function register(fullName, email, password) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      full_name: fullName,
      email,
      password
    })
  });

  return {
    token: data.token,
    user: data.user
  };
}

export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password
    })
  });

  return {
    token: data.token,
    user: data.user
  };
}

// Books endpoints
export async function fetchBooks() {
  return apiFetch('/books', {
    method: 'GET'
  });
}

export async function fetchBooksWithFilters(filters = {}) {
  const queryString = buildQueryString(filters);

  return apiFetch(`/books${queryString}`, {
    method: 'GET'
  });
}

export async function fetchBookById(bookId) {
  return apiFetch(`/books/${bookId}`, {
    method: 'GET'
  });
}

export async function createBook(bookData) {
  return apiFetch('/books', {
    method: 'POST',
    body: JSON.stringify(bookData)
  });
}

export async function updateBook(bookId, bookData) {
  return apiFetch(`/books/${bookId}`, {
    method: 'PUT',
    body: JSON.stringify(bookData)
  });
}

export async function deleteBook(bookId) {
  return apiFetch(`/books/${bookId}`, {
    method: 'DELETE'
  });
}

// User endpoints
export async function getUserProfile() {
  const userId = (await AsyncStorage.getItem('userData')).split('"id":')[1].split(',')[0];
  return apiFetch(`/users/${userId}`, {
    method: 'GET'
  });
}

export async function updateUserProfile(userData) {
  const savedUser = JSON.parse(await AsyncStorage.getItem('userData'));
  return apiFetch(`/users/${savedUser.id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
}
