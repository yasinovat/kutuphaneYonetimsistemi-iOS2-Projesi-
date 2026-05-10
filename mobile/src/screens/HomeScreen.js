import React, { useContext } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import BookCard from '../components/BookCard';
import { AuthContext } from '../contexts/AuthContext';
import { BooksContext } from '../contexts/BooksContext';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { books, dashboardStats, isLoading, error, lastSyncedAt, searchBooks, refreshBooks } = useContext(BooksContext);

  const featuredBooks = books.slice(0, 3);

  const formatSyncedAt = (value) => {
    if (!value) {
      return 'Henüz güncellenmedi';
    }

    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  };

  const goToList = async (nextFilters = null) => {
    if (nextFilters) {
      await searchBooks(nextFilters);
    }

    navigation.navigate('BookList');
  };

  if (isLoading && books.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b3d2e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>Hafta 5 Dashboard</Text>
        <Text style={styles.title}>Kitap akışı, stok ve filtreler tek merkezde.</Text>
        {user && <Text style={styles.subtitle}>{user.full_name || user.email}</Text>}

        <View style={styles.heroActions}>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('BookList')}>
            <Text style={styles.primaryButtonText}>Kitapları Aç</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={refreshBooks}>
            <Text style={styles.secondaryButtonText}>Yenile</Text>
          </Pressable>
        </View>

        <Text style={styles.syncText}>Son senkronizasyon: {formatSyncedAt(lastSyncedAt)}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dashboardStats.totalBooks}</Text>
          <Text style={styles.statLabel}>Toplam Kitap</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dashboardStats.booksInStock}</Text>
          <Text style={styles.statLabel}>Stokta Olan</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dashboardStats.outOfStockBooks}</Text>
          <Text style={styles.statLabel}>Tükenen</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dashboardStats.uniqueGenres}</Text>
          <Text style={styles.statLabel}>Tür</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.quickActionsBox}>
        <Text style={styles.sectionTitle}>Hızlı Eylemler</Text>

        <View style={styles.quickActionsRow}>
          <Pressable style={styles.quickActionButton} onPress={() => goToList({ search: '', inStock: true })}>
            <Text style={styles.quickActionTitle}>Stokta Olanlar</Text>
            <Text style={styles.quickActionText}>Sadece aktif kitaplar</Text>
          </Pressable>
          <Pressable style={styles.quickActionButton} onPress={() => goToList({ search: '' })}>
            <Text style={styles.quickActionTitle}>Tüm Liste</Text>
            <Text style={styles.quickActionText}>Filtreleri temizle</Text>
          </Pressable>
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('LoanRequestList')}
          >
            <Text style={styles.quickActionTitle}>İsteklerim</Text>
            <Text style={styles.quickActionText}>Ödünç isteklerini göster</Text>
          </Pressable>
          {user?.role === 'admin' && (
            <Pressable
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AdminLoanRequests')}
            >
              <Text style={styles.quickActionTitle}>Admin Panel</Text>
              <Text style={styles.quickActionText}>İstekleri yönet</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Son Eklenen Kitaplar</Text>
        {featuredBooks.length > 0 ? (
          featuredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              compact
              onPress={() => navigation.navigate('BookDetail', { bookId: book.id, book })}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>Gösterilecek kitap yok.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f5'
  },
  container: {
    flex: 1,
    backgroundColor: '#f4f7f5'
  },
  content: {
    padding: 16,
    gap: 14
  },
  heroCard: {
    backgroundColor: '#0b3d2e',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0b3d2e',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  kicker: {
    color: '#a8c9bd',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: 10
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    color: '#ffffff',
    marginBottom: 8
  },
  subtitle: {
    color: '#d5e7e1',
    fontSize: 14,
    fontWeight: '600'
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#0b3d2e',
    fontWeight: '800'
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  syncText: {
    color: '#d5e7e1',
    fontSize: 12,
    marginTop: 12
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statCard: {
    flexBasis: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d6e2dc'
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0b3d2e'
  },
  statLabel: {
    marginTop: 4,
    color: '#567066',
    fontSize: 13,
    fontWeight: '600'
  },
  quickActionsBox: {
    backgroundColor: '#eef5f1',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d6e2dc'
  },
  sectionBox: {
    gap: 12,
    paddingBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b3d2e',
    marginBottom: 12
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d6e2dc'
  },
  quickActionTitle: {
    color: '#133c31',
    fontWeight: '800',
    marginBottom: 4
  },
  quickActionText: {
    color: '#667d75',
    fontSize: 12
  },
  errorText: {
    color: '#a93226',
    fontWeight: '700'
  },
  emptyText: {
    color: '#667d75'
  }
});
