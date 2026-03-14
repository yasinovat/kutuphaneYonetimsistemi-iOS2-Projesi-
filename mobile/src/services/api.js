import { Platform } from 'react-native';

const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_BASE_URL;

export async function fetchBooks() {
  const response = await fetch(`${API_BASE_URL}/books`);

  if (!response.ok) {
    throw new Error('Kitaplar getirilirken hata olustu.');
  }

  return response.json();
}
