import React, { useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { LoanRequestContext } from '../contexts/LoanRequestContext';

const getStatusColor = (status) => {
  const colors = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    cancelled: '#6b7280'
  };
  return colors[status] || '#3b82f6';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Bekleniyor',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    cancelled: 'İptal Edildi'
  };
  return labels[status] || status;
};

function RequestCard({ request, onPress, onCancel }) {
  const handleSmallCancel = () => {
    try {
      // quick local trace for debugging
      console.log('RequestCard: smallCancel pressed for', request.id);
      // give immediate visual feedback on web/native
      // eslint-disable-next-line no-undef
      if (typeof alert === 'function') alert('İptal düğmesine basıldı — işlemi onaylayınız.');
    } catch (e) {}
    if (onCancel) onCancel(request);
  };
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Pressable onPress={onPress} style={{ flex: 1 }}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {request.book_title || 'Bilinmiyor'}
          </Text>
        </Pressable>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(request.status)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.authorText}>
          {request.book_author || 'Yazarı bilinmiyor'}
        </Text>
        <Text style={styles.dateText}>
          {new Date(request.request_date).toLocaleDateString('tr-TR')}
        </Text>
      </View>

      {request.note && (
        <Text style={styles.noteText} numberOfLines={2}>
          {request.note}
        </Text>
      )}

      {request.rejection_reason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>Ret Sebebi:</Text>
          <Text style={styles.rejectionText}>{request.rejection_reason}</Text>
        </View>
      )}
      {request.desired_date && (
        <Text style={styles.desiredDateText}>
          İstenen Tarih: {new Date(request.desired_date).toLocaleDateString('tr-TR')}
        </Text>
      )}
      {request.delivery_date && (
        <Text style={styles.desiredDateText}>
          Teslim Tarihi: {new Date(request.delivery_date).toLocaleDateString('tr-TR')}
        </Text>
      )}

      {request.status === 'pending' && (
        <Pressable
          style={styles.smallCancel}
          onPressIn={() => console.log('smallCancel onPressIn', request.id)}
          onPressOut={() => console.log('smallCancel onPressOut', request.id)}
          onPress={handleSmallCancel}
          pointerEvents="auto"
        >
          <Text style={styles.smallCancelText}>İptal Et</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function LoanRequestListScreen({ navigation }) {
  const { myRequests, isLoading, isRefreshing, error, loadMyRequests, cancelRequest } = useContext(LoanRequestContext);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMyRequests({ showRefreshing: false });
    });

    return unsubscribe;
  }, [navigation, loadMyRequests]);

  const handleRefresh = async () => {
    await loadMyRequests({ showRefreshing: true });
  };

  const handleRequestPress = (request) => {
    navigation.navigate('LoanRequestDetail', { requestId: request.id });
  };

  const handleCancelPress = (request) => {
    console.log('handleCancelPress called for', request && request.id);
    if (Platform.OS === 'web') {
      const ok = window.confirm('İsteği iptal etmek istiyor musunuz? Bu işlem geri alınamaz.');
      if (!ok) return;
      (async () => {
        try {
          const res = await cancelRequest(request.id);
          console.log('cancelRequest: API result', res);
          await loadMyRequests({ showRefreshing: false });
        } catch (e) {
          // use alert on web
          // eslint-disable-next-line no-undef
          if (typeof alert === 'function') alert(e.message || 'İstek iptal edilemedi.');
        }
      })();
      return;
    }

    Alert.alert(
      'İsteği İptal Et',
      'Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet',
          onPress: async () => {
            try {
              await cancelRequest(request.id);
              await loadMyRequests({ showRefreshing: false });
            } catch (e) {
              Alert.alert('Hata', e.message || 'İstek iptal edilemedi.');
            }
          }
        }
      ]
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Henüz ödünç alma isteği oluşturmadınız.</Text>
      <Pressable
        style={styles.createButton}
        onPress={() => navigation.navigate('LoanRequestCreate')}
      >
        <Text style={styles.createButtonText}>+ Yeni İstek</Text>
      </Pressable>
    </View>
  );

  if (isLoading && myRequests.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b3d2e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ödünç Alma İsteklerim</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('LoanRequestCreate')}
        >
          <Text style={styles.addButtonText}>+ Yeni</Text>
        </Pressable>
      </View>

      <FlatList
        data={myRequests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RequestCard request={item} onPress={() => handleRequestPress(item)} onCancel={handleCancelPress} />
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937'
  },
  addButton: {
    backgroundColor: '#0b3d2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12
  },
  listContent: {
    padding: 12,
    paddingBottom: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0b3d2e'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },
  cardBody: {
    marginBottom: 8
  },
  authorText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af'
  },
  noteText: {
    fontSize: 12,
    color: '#4b5563',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  rejectionBox: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    padding: 8,
    marginTop: 8,
    borderRadius: 4
  },
  rejectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4
  },
  rejectionText: {
    fontSize: 12,
    color: '#7f1d1d'
  },
  desiredDateText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 8
  },
  smallCancel: {
    marginTop: 10,
    alignSelf: 'flex-end',
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
    ,
    zIndex: 10,
    elevation: 10
  },
  smallCancelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20
  },
  createButton: {
    backgroundColor: '#0b3d2e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  errorText: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 6,
    fontSize: 12
  }
});
