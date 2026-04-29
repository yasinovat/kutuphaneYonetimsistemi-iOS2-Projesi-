import React, { useContext, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import BookCard from '../components/BookCard';
import { AuthContext } from '../contexts/AuthContext';
import { BooksContext } from '../contexts/BooksContext';

export default function BookListScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const hasAppliedInitialFilters = useRef(false);
  const {
    books,
    filters,
    isLoading,
    isRefreshing,
    error,
    lastSyncedAt,
    dashboardStats,
    updateFilters,
    searchBooks,
    clearFilters,
    refreshBooks
  } = useContext(BooksContext);
  const { getCoverForBook } = useContext(BooksContext);

  useEffect(() => {
    const initialFilters = route.params?.initialFilters;

    if (initialFilters && !hasAppliedInitialFilters.current) {
      hasAppliedInitialFilters.current = true;
      searchBooks(initialFilters);
    }
  }, [route.params?.initialFilters, searchBooks]);

  const handleSearch = async () => {
    await searchBooks(filters);
  };

  const handleClearFilters = async () => {
    await clearFilters();
  };

  const header = (
    <View style={styles.headerBox}>
      <Text style={styles.pageTitle}>Kitap Listesi</Text>
      <Text style={styles.pageSubtitle}>
        {dashboardStats.totalBooks} kitap, {dashboardStats.booksInStock} stokta, {dashboardStats.outOfStockBooks} tükenmiş.
      </Text>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Genel arama"
          value={filters.search}
          onChangeText={(text) => updateFilters({ search: text })}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />

        <View style={styles.filterGrid}>
          <TextInput
            style={[styles.input, styles.gridItem]}
            placeholder="Başlık"
            value={filters.title}
            onChangeText={(text) => updateFilters({ title: text })}
          />
          <TextInput
            style={[styles.input, styles.gridItem]}
            placeholder="Yazar"
            value={filters.author}
            onChangeText={(text) => updateFilters({ author: text })}
          />
          <TextInput
            style={[styles.input, styles.gridItem]}
            placeholder="Tür"
            value={filters.genre}
            onChangeText={(text) => updateFilters({ genre: text })}
          />
        </View>

        <Pressable style={[styles.stockToggle, filters.inStock && styles.stockToggleActive]} onPress={() => updateFilters({ inStock: !filters.inStock })}>
          <Text style={[styles.stockToggleText, filters.inStock && styles.stockToggleTextActive]}>
            Sadece stokta olanlar
          </Text>
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable style={styles.primaryButton} onPress={handleSearch}>
            <Text style={styles.primaryButtonText}>Ara</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleClearFilters}>
            <Text style={styles.secondaryButtonText}>Temizle</Text>
          </Pressable>
        </View>

        <Text style={styles.syncText}>
          Son güncelleme: {lastSyncedAt ? new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastSyncedAt)) : 'yok'}
        </Text>

        {user?.role === 'admin' && (
          <Pressable style={styles.adminButton} onPress={() => navigation.navigate('BookForm', { mode: 'create' })}>
            <Text style={styles.adminButtonText}>+ Yeni Kitap Ekle</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (isLoading && books.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0b3d2e" />
      </View>
    );
  }

  if (error && books.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={refreshBooks}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContainer}
        data={books}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const cacheKey = item?.id ?? item?.isbn ?? `${item?.title || ''}-${item?.author || ''}`;
          const cached = getCoverForBook(cacheKey);

          return (
            <View style={styles.cardWrap}>
              <BookCard
                book={{ ...item, coverUrl: cached }}
                onPress={() => navigation.navigate('BookDetail', { bookId: item.id, book: { ...item, coverUrl: cached } })}
              />
            </View>
          );
        }}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.emptyText}>Filtrelere uygun kitap bulunamadı.</Text>}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshBooks} tintColor="#0b3d2e" colors={['#0b3d2e']} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f7f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f7f5'
  },
  headerBox: {
    gap: 14,
    paddingBottom: 12
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0b3d2e'
  },
  pageSubtitle: {
    color: '#597167',
    fontSize: 13,
    fontWeight: '600'
  },
  searchBox: {
    backgroundColor: '#eef5f1',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d6e2dc',
    gap: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#c8d7d0',
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#143d31'
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '31%'
  },
  stockToggle: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#b7c8c0',
    backgroundColor: '#fff'
  },
  stockToggleActive: {
    backgroundColor: '#0b3d2e',
    borderColor: '#0b3d2e'
  },
  stockToggleText: {
    color: '#35544b',
    fontSize: 13,
    fontWeight: '700'
  },
  stockToggleTextActive: {
    color: '#fff'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0b3d2e',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800'
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8d7d0'
  },
  secondaryButtonText: {
    color: '#143d31',
    fontWeight: '800'
  },
  syncText: {
    color: '#667d75',
    fontSize: 12,
    fontWeight: '600'
  },
  adminButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: '800'
  },
  listContainer: {
    padding: 16,
    paddingBottom: 28
  },
  cardWrap: {
    marginBottom: 12
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#47645b',
    fontWeight: '600'
  },
  errorText: {
    color: '#a93226',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12
  },
  retryButton: {
    backgroundColor: '#0b3d2e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '800'
  }
});
