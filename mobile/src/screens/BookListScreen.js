import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { fetchBooks } from '../services/api';

function BookItem({ item }) {
  return (
    <View style={styles.card}>
      <Text style={styles.bookTitle}>{item.title}</Text>
      <Text style={styles.bookInfo}>Yazar: {item.author}</Text>
      <Text style={styles.bookInfo}>ISBN: {item.isbn}</Text>
      <Text style={styles.bookInfo}>Mevcut: {item.available_copies}</Text>
    </View>
  );
}

export default function BookListScreen() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadBooks = useCallback(async () => {
    try {
      setError('');
      const data = await fetchBooks();
      setBooks(data);
    } catch (err) {
      setError(err.message || 'Bilinmeyen hata olustu.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadBooks();
      setLoading(false);
    })();
  }, [loadBooks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  }, [loadBooks]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0b3d2e" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContainer}
      data={books}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <BookItem item={item} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text style={styles.emptyText}>Henuz kitap bulunamadi.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  listContainer: {
    padding: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d6e2dc'
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#143d31',
    marginBottom: 8
  },
  bookInfo: {
    fontSize: 14,
    color: '#2b4f45',
    marginBottom: 2
  },
  errorText: {
    color: '#a93226',
    fontSize: 15,
    textAlign: 'center'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#47645b'
  }
});
