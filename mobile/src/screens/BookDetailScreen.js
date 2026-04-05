import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { deleteBook, fetchBookById } from '../services/api';

export default function BookDetailScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const { bookId } = route.params || {};
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBook = async () => {
      try {
        if (!bookId) {
          throw new Error('Kitap bilgisi bulunamadi.');
        }

        const data = await fetchBookById(bookId);
        setBook(data);
      } catch (err) {
        setError(err.message || 'Kitap detayi yuklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [bookId]);

  const performDelete = async () => {
    try {
      setDeleting(true);
      await deleteBook(book.id);
      Alert.alert('Başarılı', 'Kitap silindi.', [
        { text: 'Tamam', onPress: () => navigation.navigate('BookList') }
      ]);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Kitap silinemedi.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      const shouldDelete = window.confirm('Bu kitabi silmek istedigine emin misin?');

      if (!shouldDelete) {
        return;
      }

      await performDelete();
      return;
    }

    Alert.alert('Kitap Sil', 'Bu kitabı silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: performDelete
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b3d2e" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Kitap bulunamadı.</Text>
      </View>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.meta}>Yazar: {book.author}</Text>
        <Text style={styles.meta}>Tür: {book.genre || 'Genel'}</Text>
        <Text style={styles.meta}>ISBN: {book.isbn}</Text>
        <Text style={styles.meta}>Yayın Yılı: {book.published_year || '-'}</Text>
        <Text style={styles.meta}>Toplam Kopya: {book.total_copies}</Text>
        <Text style={styles.meta}>Mevcut Kopya: {book.available_copies}</Text>
        <Text style={[styles.status, book.available_copies > 0 ? styles.inStock : styles.outOfStock]}>
          {book.available_copies > 0 ? 'Stokta' : 'Tükendi'}
        </Text>
      </View>

      {isAdmin && (
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => navigation.navigate('BookForm', { mode: 'edit', book })}
          >
            <Text style={styles.primaryButtonText}>Düzenle</Text>
          </Pressable>

          <Pressable style={[styles.dangerButton, deleting && styles.disabledButton]} onPress={handleDelete} disabled={deleting}>
            <Text style={styles.dangerButtonText}>{deleting ? 'Siliniyor...' : 'Sil'}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f5',
    padding: 20
  },
  container: {
    padding: 16,
    backgroundColor: '#f4f7f5',
    flexGrow: 1
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d6e2dc'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0b3d2e',
    marginBottom: 12
  },
  meta: {
    fontSize: 15,
    color: '#2b4f45',
    marginBottom: 6
  },
  status: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '700'
  },
  inStock: {
    backgroundColor: '#e3f7e8',
    color: '#1f7a35'
  },
  outOfStock: {
    backgroundColor: '#fde8e8',
    color: '#b42318'
  },
  actions: {
    marginTop: 16,
    gap: 10
  },
  primaryButton: {
    backgroundColor: '#0b3d2e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  dangerButton: {
    backgroundColor: '#b42318',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  errorText: {
    color: '#a93226',
    fontSize: 15,
    textAlign: 'center'
  }
});
