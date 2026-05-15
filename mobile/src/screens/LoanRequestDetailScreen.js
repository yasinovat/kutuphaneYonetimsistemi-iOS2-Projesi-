import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable
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

export default function LoanRequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params;
  const { myRequests, cancelRequest } = useContext(LoanRequestContext);
  const [isCancelling, setIsCancelling] = useState(false);

  const request = myRequests.find(r => r.id === requestId);

  if (!request) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>İstek bulunamadı</Text>
      </View>
    );
  }

  const handleCancelRequest = () => {
    Alert.alert(
      'İsteği İptal Et',
      'Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
      [
        { text: 'Hayır', onPress: () => {}, style: 'cancel' },
        {
          text: 'Evet, İptal Et',
          onPress: async () => {
            try {
              setIsCancelling(true);
              await cancelRequest(requestId);
              Alert.alert('Başarılı', 'İstek iptal edildi.', [
                { text: 'Tamam', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('Hata', error.message || 'İstek iptal edilemedi.');
            } finally {
              setIsCancelling(false);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Badge */}
      <View style={styles.statusSection}>
        <View
          style={[
            styles.statusLargeBadge,
            { backgroundColor: getStatusColor(request.status) }
          ]}
        >
          <Text style={styles.statusLargeText}>
            {getStatusLabel(request.status)}
          </Text>
        </View>
      </View>

      {/* Kitap Bilgileri */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kitap Bilgileri</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kitap Adı</Text>
            <Text style={styles.infoValue}>{request.book_title || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Yazar</Text>
            <Text style={styles.infoValue}>{request.book_author || '-'}</Text>
          </View>
          {request.available_copies !== undefined && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mevcut Kopya</Text>
                <Text style={[styles.infoValue, { color: request.available_copies > 0 ? '#10b981' : '#ef4444' }]}>
                  {request.available_copies}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* İstek Detayları */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>İstek Detayları</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>İstek Tarihi</Text>
            <Text style={styles.infoValue}>
              {formatDate(request.request_date)}
            </Text>
          </View>
          {request.desired_date && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Talep Edilen Tarih</Text>
                <Text style={styles.infoValue}>{new Date(request.desired_date).toLocaleDateString('tr-TR')}</Text>
              </View>
            </>
          )}
          {request.delivery_date && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teslim Tarihi</Text>
                <Text style={styles.infoValue}>{new Date(request.delivery_date).toLocaleDateString('tr-TR')}</Text>
              </View>
            </>
          )}
          {request.note && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Not</Text>
                <Text style={styles.infoValue}>{request.note}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Onay/Red Bilgileri */}
      {(request.approval_date || request.rejection_reason) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Onay/Red Bilgileri</Text>
          <View style={styles.infoCard}>
            {request.approval_date && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Onay Tarihi</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(request.approval_date)}
                  </Text>
                </View>
                {request.approver_name && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Onaylayan</Text>
                      <Text style={styles.infoValue}>{request.approver_name}</Text>
                    </View>
                  </>
                )}
              </>
            )}
            {request.rejection_reason && (
              <>
                {request.approval_date && <View style={styles.divider} />}
                <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                  <Text style={styles.infoLabel}>Red Sebebi</Text>
                  <Text style={[styles.infoValue, { flex: 1, marginLeft: 12 }]}>
                    {request.rejection_reason}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* İşlemler */}
      {request.status === 'pending' && (
        <View style={styles.actionSection}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancelRequest}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.cancelButtonText}>İsteği İptal Et</Text>
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
  content: {
    padding: 16
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
    fontWeight: '700',
    fontSize: 18
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb'
  },
  actionSection: {
    marginBottom: 24
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#ef4444'
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280'
  }
});
