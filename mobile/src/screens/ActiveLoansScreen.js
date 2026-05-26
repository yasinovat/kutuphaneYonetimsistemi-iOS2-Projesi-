import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { LoansContext } from '../contexts/LoansContext';

const getLoanStatusColor = (loan) => {
  if (loan.return_date) {
    return '#6b7280'; // Grey for returned
  }
  if (loan.is_overdue) {
    return '#ef4444'; // Red for overdue
  }
  return '#10b981'; // Green for active
};

const getLoanStatusLabel = (loan) => {
  if (loan.return_date) {
    return 'İade Edildi';
  }
  if (loan.is_overdue) {
    return `${Math.abs(loan.days_overdue)} gün gecikmiş`;
  }
  return 'Aktif';
};

function LoanCard({ loan, onPress, onReturn, isReturning }) {
  const handleReturn = () => {
    if (isReturning) return;
    
    console.log('handleReturn called for loan:', loan.id);
    
    const message = `"${loan.book_title}" kitabını iade etmek istiyor musunuz?`;
    
    // Web'de window.confirm, native'de Alert.alert kullan
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        console.log('Confirmed return for loan:', loan.id);
        onReturn(loan);
      }
    } else {
      Alert.alert(
        'Kitap İade Et',
        message,
        [
          { text: 'Hayır', onPress: () => console.log('Cancelled'), style: 'cancel' },
          {
            text: 'Evet, İade Et',
            onPress: () => {
              console.log('Confirmed return for loan:', loan.id);
              onReturn(loan);
            },
            style: 'default'
          }
        ]
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const daysRemaining = loan.return_date
    ? null
    : Math.floor((new Date(loan.due_date) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Pressable onPress={onPress} style={{ flex: 1 }}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {loan.book_title || 'Bilinmiyor'}
          </Text>
        </Pressable>
        <View style={[styles.statusBadge, { backgroundColor: getLoanStatusColor(loan) }]}>
          <Text style={styles.statusText}>{getLoanStatusLabel(loan)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.authorText}>
          {loan.book_author || 'Yazarı bilinmiyor'}
        </Text>

        <View style={styles.dateInfo}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Ödünç Alınma:</Text>
            <Text style={styles.dateValue}>{formatDate(loan.loan_date)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Iade Tarihi:</Text>
            <Text style={[
              styles.dateValue,
              loan.is_overdue && !loan.return_date && { color: '#ef4444', fontWeight: 'bold' }
            ]}>
              {formatDate(loan.due_date)}
            </Text>
          </View>
          {loan.return_date && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>İade Edilme:</Text>
              <Text style={[styles.dateValue, { color: '#10b981' }]}>
                {formatDate(loan.return_date)}
              </Text>
            </View>
          )}
          {!loan.return_date && daysRemaining !== null && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Kalan Gün:</Text>
              <Text style={[
                styles.dateValue,
                daysRemaining < 0 && { color: '#ef4444', fontWeight: 'bold' }
              ]}>
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)} gün geç` : `${daysRemaining} gün`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {!loan.return_date && (
        <Pressable
          style={[
            styles.returnButton,
            loan.is_overdue && styles.returnButtonOverdue,
            isReturning && styles.returnButtonDisabled
          ]}
          onPress={handleReturn}
          disabled={isReturning}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          pointerEvents="auto"
        >
          {isReturning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.returnButtonText}>
              {loan.is_overdue ? '⚠️ İade Et (Gecikmiş)' : 'İade Et'}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

export default function ActiveLoansScreen({ navigation }) {
  const {
    activeLoans,
    overdueCount,
    isLoading,
    isRefreshing,
    error,
    loadActiveLoans,
    returnBookFromLoan
  } = useContext(LoansContext);

  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadActiveLoans({ showRefreshing: false });
    });

    return unsubscribe;
  }, [navigation, loadActiveLoans]);

  const handleRefresh = async () => {
    await loadActiveLoans({ showRefreshing: true });
  };

  const handleLoanPress = (loan) => {
    
    navigation.navigate('LoanDetail', { loanId: loan.id });
  };

  const handleReturn = async (loan) => {
    try {
      setIsReturning(true);
      await returnBookFromLoan(loan.id);
      Alert.alert('Başarılı', `"${loan.book_title}" başarıyla iade edildi.`);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Kitap iade edilemedi.');
    } finally {
      setIsReturning(false);
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Şu anda aktif ödünç alma kaydınız yok.</Text>
      <Pressable
        style={styles.createButton}
        onPress={() => navigation.navigate('LoanRequestCreate')}
      >
        <Text style={styles.createButtonText}>+ Yeni İstek</Text>
      </Pressable>
    </View>
  );

  if (isLoading && activeLoans.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b3d2e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {overdueCount > 0 && (
        <View style={styles.overdueWarning}>
          <Text style={styles.overdueWarningIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.overdueWarningTitle}>Gecikmiş Kitaplarınız Var!</Text>
            <Text style={styles.overdueWarningText}>
              {overdueCount} kitabın iade tarihi geçmiş. Lütfen en kısa zamanda iade ediniz.
            </Text>
          </View>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Aktif Ödünçlerim</Text>
          <Text style={styles.headerSubtitle}>{activeLoans.length} kitap</Text>
        </View>
      </View>

      <FlatList
        data={activeLoans}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <LoanCard
            loan={item}
            onPress={() => handleLoanPress(item)}
            onReturn={handleReturn}
            isReturning={isReturning}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#0b3d2e']}
          />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f5'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    margin: 12,
    borderRadius: 8
  },
  overdueWarningIcon: {
    fontSize: 24,
    marginRight: 12
  },
  overdueWarningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4
  },
  overdueWarningText: {
    fontSize: 12,
    color: '#7f1d1d'
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  listContent: {
    padding: 12,
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b3d2e',
    flex: 1
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  cardBody: {
    marginBottom: 12
  },
  authorText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8
  },
  dateInfo: {
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 6
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  dateValue: {
    fontSize: 12,
    color: '#0b3d2e',
    fontWeight: '600'
  },
  returnButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  returnButtonOverdue: {
    backgroundColor: '#ef4444'
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  returnButtonDisabled: {
    opacity: 0.6
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16
  },
  createButton: {
    backgroundColor: '#0b3d2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    padding: 12,
    backgroundColor: '#fee2e2',
    margin: 12,
    borderRadius: 6
  }
});
