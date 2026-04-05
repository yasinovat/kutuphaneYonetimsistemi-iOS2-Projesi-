import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import { fetchBooksWithFilters } from '../services/api';

function BookItem({ item, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.bookTitle}>{item.title}</Text>
      <Text style={styles.bookInfo}>Yazar: {item.author}</Text>
      <Text style={styles.bookInfo}>Tür: {item.genre || 'Genel'}</Text>
      <Text style={styles.bookInfo}>ISBN: {item.isbn}</Text>
      <Text style={styles.bookInfo}>Stok: {item.available_copies}/{item.total_copies}</Text>
      <Text style={[styles.statusBadge, item.available_copies > 0 ? styles.statusInStock : styles.statusOutOfStock]}>
        {item.available_copies > 0 ? 'Stokta' : 'Tükendi'}
      </Text>
    </Pressable>
  );
}

export default function BookListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 900;
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  const loadBooks = useCallback(async (filters = {}, shouldShowLoading = false) => {
    try {
      if (shouldShowLoading) {
        setLoading(true);
      }

      setError('');
      const data = await fetchBooksWithFilters(filters);
      setBooks(data);
    } catch (err) {
      setError(err.message || 'Bilinmeyen hata olustu.');
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadBooks({}, true);
  }, [loadBooks]);

  useFocusEffect(
    useCallback(() => {
      loadBooks({
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim(),
        inStock: inStockOnly
      });
    }, [author, genre, inStockOnly, loadBooks, title])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBooks({ title, author, genre, inStock: inStockOnly });
    setRefreshing(false);
  }, [author, genre, inStockOnly, loadBooks, title]);

  const handleSearch = useCallback(async () => {
    await loadBooks({
      title: title.trim(),
      author: author.trim(),
      genre: genre.trim(),
      inStock: inStockOnly
    }, true);
  }, [author, genre, inStockOnly, loadBooks, title]);

  const handleClearFilters = useCallback(async () => {
    setTitle('');
    setAuthor('');
    setGenre('');
    setInStockOnly(false);
    await loadBooks({}, true);
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
    <View style={styles.screen}>
      <View style={[styles.pageShell, isWideLayout && styles.pageShellWide]}>
        <View style={[styles.filterBox, isWideLayout && styles.filterBoxWide]}>
          <Text style={styles.sectionTitle}>Kitap Ara / Filtrele</Text>

          <View style={[styles.fieldGrid, isWideLayout && styles.fieldGridWide]}>
            <TextInput
              style={[styles.input, isWideLayout && styles.inputWide]}
              placeholder="Başlık"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, isWideLayout && styles.inputWide]}
              placeholder="Yazar"
              value={author}
              onChangeText={setAuthor}
            />
            <TextInput
              style={[styles.input, isWideLayout && styles.inputWide]}
              placeholder="Tür"
              value={genre}
              onChangeText={setGenre}
            />

            <View style={styles.toggleRow}>
              <Pressable
                style={[styles.toggleButton, inStockOnly && styles.toggleButtonActive]}
                onPress={() => setInStockOnly((value) => !value)}
              >
                <Text style={[styles.toggleText, inStockOnly && styles.toggleTextActive]}>
                  Sadece stokta olanlar
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.primaryButton} onPress={handleSearch}>
              <Text style={styles.primaryButtonText}>Ara</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleClearFilters}>
              <Text style={styles.secondaryButtonText}>Temizle</Text>
            </Pressable>
          </View>

          {user?.role === 'admin' && (
            <Pressable style={styles.adminButton} onPress={() => navigation.navigate('BookForm', { mode: 'create' })}>
              <Text style={styles.adminButtonText}>+ Yeni Kitap Ekle</Text>
            </Pressable>
          )}
        </View>

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContainer}
          data={books}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <BookItem item={item} onPress={() => navigation.navigate('BookDetail', { bookId: item.id })} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Henuz kitap bulunamadi.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f7f5'
  },
  pageShell: {
    flex: 1
  },
  pageShellWide: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  filterBox: {
    padding: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: '#eef5f1',
    borderBottomWidth: 1,
    borderBottomColor: '#d6e2dc'
  },
  filterBoxWide: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d6e2dc',
    marginBottom: 16,
    overflow: 'hidden'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b3d2e'
  },
  fieldGrid: {
    gap: 10
  },
  fieldGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  input: {
    borderWidth: 1,
    borderColor: '#c8d7d0',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#143d31'
  },
  inputWide: {
    flexBasis: '48%',
    minWidth: 240,
    flexGrow: 1
  },
  toggleRow: {
    flexDirection: 'row'
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#b7c8c0',
    backgroundColor: '#fff'
  },
  toggleButtonActive: {
    backgroundColor: '#0b3d2e',
    borderColor: '#0b3d2e'
  },
  toggleText: {
    color: '#35544b',
    fontSize: 13,
    fontWeight: '600'
  },
  toggleTextActive: {
    color: '#fff'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  primaryButton: {
    backgroundColor: '#0b3d2e',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  secondaryButton: {
    backgroundColor: '#e4ece8',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1
  },
  secondaryButtonText: {
    color: '#143d31',
    fontWeight: '700'
  },
  adminButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  listContainer: {
    padding: 16,
    paddingTop: 8
  },
  list: {
    flex: 1
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
  statusBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700'
  },
  statusInStock: {
    backgroundColor: '#e3f7e8',
    color: '#1f7a35'
  },
  statusOutOfStock: {
    backgroundColor: '#fde8e8',
    color: '#b42318'
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
