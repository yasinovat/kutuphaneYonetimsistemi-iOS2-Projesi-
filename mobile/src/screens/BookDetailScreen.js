import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthContext } from '../contexts/AuthContext';
import { BooksContext } from '../contexts/BooksContext';
import { deleteBook, fetchBookById } from '../services/api';

export default function BookDetailScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const { getBookById, refreshBooks } = useContext(BooksContext);
  const { getCoverForBook } = useContext(BooksContext);
  const { bookId } = route.params || {};
  // Önce iletilen kitabı tercih et (kapakUrl içerebilir); yoksa context'ten al ve önbellekteki kapak URL'si ile tamamla
  const rawInitial = route.params?.book || getBookById(bookId);
  const cachedCover = getCoverForBook(rawInitial?.id ?? rawInitial?.isbn ?? `${rawInitial?.title || ''}-${rawInitial?.author || ''}`);
  const initialBook = rawInitial ? { ...rawInitial, coverUrl: rawInitial.coverUrl || cachedCover } : null;
  const [book, setBook] = useState(initialBook);
  const [loading, setLoading] = useState(!initialBook);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBook = async () => {
      try {
        if (!bookId) {
          throw new Error('Kitap bilgisi bulunamadı.');
        }

        const data = await fetchBookById(bookId);
        setBook(data);
      } catch (err) {
        setError(err.message || 'Kitap detayı yüklenemedi.');
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
      await refreshBooks();
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
      const shouldDelete = window.confirm('Bu kitabı silmek istediğine emin misin?');

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

  const initials = book.title
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'KB';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.cover}>
          {book.coverUrl ? (
            <Image source={{ uri: book.coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <Text style={styles.coverText}>{initials}</Text>
          )}
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.meta}>{book.author}</Text>
          <Text style={styles.metaSecondary}>{book.genre || 'Genel'}</Text>
          <Text style={[styles.status, book.available_copies > 0 ? styles.inStock : styles.outOfStock]}>
            {book.available_copies > 0 ? 'Stokta' : 'Tükendi'}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Kitap Bilgileri</Text>
        <View style={styles.infoRow}><Text style={styles.infoKey}>ISBN</Text><Text style={styles.infoValue}>{book.isbn}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoKey}>Yayın Yılı</Text><Text style={styles.infoValue}>{book.published_year || '-'}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoKey}>Toplam Kopya</Text><Text style={styles.infoValue}>{book.total_copies}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoKey}>Mevcut Kopya</Text><Text style={styles.infoValue}>{book.available_copies}</Text></View>
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
  heroCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d6e2dc',
    shadowColor: '#0b3d2e',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  cover: {
    width: 76,
    minHeight: 104,
    borderRadius: 18,
    backgroundColor: '#0b3d2e',
    padding: 12,
    justifyContent: 'space-between'
  },
  coverText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900'
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0b3d2e',
    marginBottom: 6
  },
  meta: {
    fontSize: 15,
    color: '#2b4f45',
    fontWeight: '700'
  },
  metaSecondary: {
    fontSize: 13,
    color: '#63756f',
    marginTop: 4
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
  infoCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d6e2dc'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b3d2e',
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef3ef'
  },
  infoKey: {
    color: '#667d75',
    fontWeight: '700'
  },
  infoValue: {
    color: '#143d31',
    fontWeight: '800'
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
  disabledButton: {
    opacity: 0.7
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
