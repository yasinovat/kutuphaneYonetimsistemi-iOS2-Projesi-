import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable
} from 'react-native';
import { LoansContext } from '../contexts/LoansContext';

export default function LoanDetailScreen({ route, navigation }) {
  const { loanId } = route.params;
  const { activeLoans, returnBookFromLoan } = useContext(LoansContext);
  const [isReturning, setIsReturning] = useState(false);

  const loan = activeLoans.find(l => l.id === loanId);

  if (!loan) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Ödünç kaydı bulunamadı</Text>
      </View>
    );
  }

  const handleReturn = () => {
    const message = `"${loan.book_title}" kitabını iade etmek istiyor musunuz?`;
    
    const performReturn = async () => {
      try {
        setIsReturning(true);
        await returnBookFromLoan(loanId);
        
        if (Platform.OS === 'web') {
          window.alert(`"${loan.book_title}" başarıyla iade edildi.`);
        } else {
          Alert.alert('Başarılı', `"${loan.book_title}" başarıyla iade edildi.`, [
            { text: 'Tamam', onPress: () => navigation.goBack() }
          ]);
        }
        navigation.goBack();
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert(`Hata: ${error.message || 'Kitap iade edilemedi.'}`);
        } else {
          Alert.alert('Hata', error.message || 'Kitap iade edilemedi.');
        }
      } finally {
        setIsReturning(false);
      }
    };
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        performReturn();
      }
    } else {
      Alert.alert(
        'Kitap İade Et',
        message,
        [
          { text: 'Hayır', style: 'cancel' },
          {
            text: 'Evet, İade Et',
            onPress: performReturn,
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
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = () => {
    if (loan.return_date) {
      return '#6b7280';
    }
    if (loan.is_overdue) {
      return '#ef4444';
    }
    return '#10b981';
  };

  const getStatusLabel = () => {
    if (loan.return_date) {
      return 'İade Edildi';
    }
    if (loan.is_overdue) {
      return `${Math.abs(loan.days_overdue)} gün gecikmiş`;
    }
    return 'Aktif';
  };

  const daysRemaining = loan.return_date
    ? null
    : Math.floor((new Date(loan.due_date) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Badge */}
      <View style={styles.statusSection}>
        <View
          style={[
            styles.statusLargeBadge,
            { backgroundColor: getStatusColor() }
          ]}
        >
          <Text style={styles.statusLargeText}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      {/* Kitap Bilgileri */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kitap Bilgileri</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kitap Adı</Text>
            <Text style={styles.infoValue}>{loan.book_title || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Yazar</Text>
            <Text style={styles.infoValue}>{loan.book_author || '-'}</Text>
          </View>
        </View>
      </View>

      {/* Ödünç Detayları */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ödünç Detayları</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ödünç Alınma Tarihi</Text>
            <Text style={styles.infoValue}>{formatDate(loan.loan_date)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, loan.is_overdue && !loan.return_date && { color: '#ef4444' }]}>
              İade Tarihi
            </Text>
            <Text style={[
              styles.infoValue,
              loan.is_overdue && !loan.return_date && { color: '#ef4444', fontWeight: 'bold' }
            ]}>
              {formatDate(loan.due_date)}
            </Text>
          </View>
          {daysRemaining !== null && !loan.return_date && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kalan Gün</Text>
                <Text style={[
                  styles.infoValue,
                  daysRemaining < 0 && { color: '#ef4444', fontWeight: 'bold' }
                ]}>
                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)} gün geç` : `${daysRemaining} gün`}
                </Text>
              </View>
            </>
          )}
          {loan.return_date && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>İade Edilme Tarihi</Text>
                <Text style={[styles.infoValue, { color: '#10b981' }]}>
                  {formatDate(loan.return_date)}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Return Button */}
      {!loan.return_date && (
        <View style={styles.section}>
          <Pressable
            style={[styles.returnButton, loan.is_overdue && styles.returnButtonOverdue]}
            onPress={handleReturn}
            disabled={isReturning}
          >
            {isReturning ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.returnButtonText}>
                {loan.is_overdue ? '⚠️ Gecikmiş Kitabı İade Et' : '✓ Kitabı İade Et'}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 24
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24
  },
  statusLargeBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  statusLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b3d2e',
    marginBottom: 12
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0b3d2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  infoValue: {
    fontSize: 14,
    color: '#0b3d2e',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8
  },
  returnButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48
  },
  returnButtonOverdue: {
    backgroundColor: '#ef4444'
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16
  }
});
