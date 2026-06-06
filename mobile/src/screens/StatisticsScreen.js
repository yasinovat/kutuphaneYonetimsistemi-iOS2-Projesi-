import React, { useEffect, useState, useContext } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import BookCard from '../components/BookCard';
import { fetchMostBorrowedBooks } from '../services/api';
import { ThemeContext } from '../contexts/ThemeContext';

export default function StatisticsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { colors } = useContext(ThemeContext);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchMostBorrowedBooks(10)
      .then((res) => {
        if (!mounted) return;
        setItems(res || []);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || 'Hata');
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.textPrimary }]}>En Çok Ödünç Alınan Kitaplar</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <View style={styles.itemRow}>
            <View style={styles.rankBox}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.cardWrapper}>
              <BookCard book={{ id: item.id, title: item.title, author: item.author, coverUrl: item.cover_url }} onPress={() => navigation.navigate('BookDetail', { bookId: item.id })} compact />
            </View>
            <View style={styles.countBox}>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>{item.borrow_count}</Text>
              <Text style={[styles.countLabel, { color: colors.textSecondary }]}>ödünç</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 18, fontWeight: '800', margin: 16 },
  error: { color: '#c0392b', paddingHorizontal: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#eef5f1', justifyContent: 'center', alignItems: 'center' },
  rankText: { fontWeight: '900', color: '#0b3d2e' },
  cardWrapper: { flex: 1 },
  countBox: { width: 64, alignItems: 'center' },
  countText: { fontSize: 18, fontWeight: '900' },
  countLabel: { fontSize: 11 }
});
