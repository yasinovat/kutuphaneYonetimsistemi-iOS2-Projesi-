import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { LoanRequestContext } from '../contexts/LoanRequestContext';

function RequestCard({ request, onApprove, onReject, isProcessing }) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    if (rejectReason.trim().length === 0) {
      Alert.alert('Hata', 'Lütfen red sebebini yazın.');
      return;
    }
    onReject(request.id, rejectReason);
    setShowRejectReason(false);
    setRejectReason('');
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {request.book_title}
          </Text>
          <Text style={styles.memberName}>{request.member_name}</Text>
        </View>
        <Text style={styles.requestDate}>
          {new Date(request.request_date).toLocaleDateString('tr-TR')}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.authorText}>{request.book_author}</Text>
        {request.note && (
          <Text style={styles.noteText} numberOfLines={2}>
            "{request.note}"
          </Text>
        )}
        {request.desired_date && (
          <Text style={styles.desiredDateText}>Talep Edilen Tarih: {new Date(request.desired_date).toLocaleDateString('tr-TR')}</Text>
        )}
        {request.delivery_date && (
          <Text style={styles.desiredDateText}>Teslim Tarihi: {new Date(request.delivery_date).toLocaleDateString('tr-TR')}</Text>
        )}
      </View>

      {!showRejectReason ? (
        <View style={styles.actionButtonsContainer}>
          <Pressable
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => onApprove(request.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>✓ Onayla</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => setShowRejectReason(true)}
            disabled={isProcessing}
          >
            <Text style={styles.actionButtonText}>✕ Reddet</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.rejectForm}>
          <TextInput
            style={styles.rejectInput}
            placeholder="Red sebebini yazın..."
            placeholderTextColor="#9ca3af"
            value={rejectReason}
            onChangeText={setRejectReason}
            multiline={true}
            numberOfLines={2}
          />
          <View style={styles.rejectFormButtons}>
            <Pressable
              style={[styles.formButton, styles.confirmButton]}
              onPress={handleReject}
              disabled={isProcessing}
            >
              <Text style={styles.formButtonText}>Gönder</Text>
            </Pressable>
            <Pressable
              style={[styles.formButton, styles.cancelFormButton]}
              onPress={() => {
                setShowRejectReason(false);
                setRejectReason('');
              }}
              disabled={isProcessing}
            >
              <Text style={styles.cancelFormButtonText}>İptal</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export default function AdminLoanRequestsScreen({ navigation }) {
  const {
    pendingRequests,
    stats,
    isLoading,
    isRefreshing,
    error,
    loadPendingRequests,
    approveRequest,
    rejectRequest
  } = useContext(LoanRequestContext);

  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPendingRequests({ showRefreshing: false });
    });

    return unsubscribe;
  }, [navigation, loadPendingRequests]);

  const handleRefresh = async () => {
    await loadPendingRequests({ showRefreshing: true });
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await approveRequest(requestId);
      Alert.alert('Başarılı', 'İstek onaylandı.');
    } catch (error) {
      Alert.alert('Hata', error.message || 'İstek onaylanamadı.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId, reason) => {
    try {
      setProcessingId(requestId);
      await rejectRequest(requestId, reason);
      Alert.alert('Başarılı', 'İstek reddedildi.');
    } catch (error) {
      Alert.alert('Hata', error.message || 'İstek reddedilemedi.');
    } finally {
      setProcessingId(null);
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Bekleyen istek yok</Text>
      <Text style={styles.emptySubtext}>Harika! Tüm istekler işlendi.</Text>
    </View>
  );

  if (isLoading && pendingRequests.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b3d2e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Bekleniyor</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Onaylı</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Reddedilen</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onApprove={handleApprove}
            onReject={handleReject}
            isProcessing={processingId === item.id}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 6
  },
  errorText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '500'
  },
  listContent: {
    padding: 12,
    paddingBottom: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12
  },
  cardTitle: {
    flex: 1,
    marginRight: 8
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4
  },
  memberName: {
    fontSize: 12,
    color: '#6b7280'
  },
  requestDate: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500'
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingBottom: 8
  },
  authorText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4
  },
  noteText: {
    fontSize: 12,
    color: '#4b5563',
    fontStyle: 'italic',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  desiredDateText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 8
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 8,
    paddingTop: 8
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  approveButton: {
    backgroundColor: '#10b981'
  },
  rejectButton: {
    backgroundColor: '#ef4444'
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13
  },
  rejectForm: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 8,
    paddingTop: 8
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1f2937',
    textAlignVertical: 'top',
    marginBottom: 8,
    minHeight: 60
  },
  rejectFormButtons: {
    flexDirection: 'row',
    gap: 8
  },
  formButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  confirmButton: {
    backgroundColor: '#ef4444'
  },
  cancelFormButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb'
  },
  formButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12
  },
  cancelFormButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 12
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6b7280'
  }
});
