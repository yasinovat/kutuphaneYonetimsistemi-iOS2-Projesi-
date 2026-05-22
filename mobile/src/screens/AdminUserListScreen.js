import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  RefreshControl
} from 'react-native';
import { useUsers } from '../contexts/UserContext';

export default function AdminUserListScreen() {
  const { users, isLoading, error, fetchUsers, toggleUserStatus } = useUsers();
  const [refreshing, setRefreshing] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUsers();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    setTogglingUserId(userId);
    try {
      await toggleUserStatus(userId);
      const statusText = currentStatus ? 'Pasif' : 'Aktif';
      Alert.alert('Başarılı', `Kullanıcı ${statusText} yapıldı.`);
    } catch (err) {
      Alert.alert('Hata', err.response?.data?.message || 'İşlem başarısız oldu.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.roleContainer}>
          <Text
            style={[
              styles.roleText,
              item.role === 'admin' ? styles.roleAdmin : styles.roleMember
            ]}
          >
            {item.role.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.statusToggle}>
        <Text style={styles.statusLabel}>
          {item.is_active ? 'Aktif' : 'Pasif'}
        </Text>
        <Switch
          value={item.is_active}
          onValueChange={() =>
            handleToggleStatus(item.id, item.is_active)
          }
          disabled={togglingUserId === item.id}
          trackColor={{ false: '#d32f2f', true: '#4caf50' }}
          thumbColor={item.is_active ? '#45a049' : '#c62828'}
        />
      </View>
    </View>
  );

  if (error && !isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Hata: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
          <Text style={styles.retryButtonText}>Tekrar Deneyin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kullanıcı Yönetimi</Text>
        <Text style={styles.userCount}>
          Toplam: {users.length} | Aktif: {users.filter(u => u.is_active).length}
        </Text>
      </View>

      {isLoading && users.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8
  },
  userCount: {
    fontSize: 14,
    color: '#e0e0e0'
  },
  listContent: {
    padding: 12
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  userInfo: {
    flex: 1,
    marginRight: 12
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6
  },
  roleContainer: {
    marginTop: 4
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'flex-start'
  },
  roleAdmin: {
    backgroundColor: '#ffebee',
    color: '#c62828'
  },
  roleMember: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0'
  },
  statusToggle: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666'
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  emptyContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  }
});
