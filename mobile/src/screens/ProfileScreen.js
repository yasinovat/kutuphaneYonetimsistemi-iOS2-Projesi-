import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { changePassword } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Yönetici',
      member: 'Üye'
    };
    return roles[role] || role;
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Hata', 'Mevcut şifreyi giriniz.');
      return;
    }

    if (!newPassword) {
      Alert.alert('Hata', 'Yeni şifreyi giriniz.');
      return;
    }

    if (!confirmPassword) {
      Alert.alert('Hata', 'Şifreyi onaylayınız.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword(currentPassword, newPassword, confirmPassword);
      
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.', [
        {
          text: 'Tamam',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Şifre değiştirilirken hata oluştu.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Oturumunuzu kapatmak istiyor musunuz?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, Çıkış Yap',
          onPress: () => {
            signOut();
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ad Soyad</Text>
            <Text style={styles.infoValue}>{user?.full_name || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rol</Text>
            <Text style={[styles.infoValue, { color: user?.role === 'admin' ? '#ef4444' : '#10b981' }]}>
              {getRoleLabel(user?.role)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kayıt Tarihi</Text>
            <Text style={styles.infoValue}>{formatDate(user?.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Change Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
        
        {/* Current Password */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Mevcut Şifre</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Mevcut şifrenizi giriniz"
              placeholderTextColor="#999"
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              editable={!isChangingPassword}
            />
            <Pressable
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeButtonText}>
                {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Yeni Şifre</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Yeni şifrenizi giriniz"
              placeholderTextColor="#999"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!isChangingPassword}
            />
            <Pressable
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeButtonText}>
                {showNewPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Şifreyi Onayla</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Şifrenizi onaylayınız"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isChangingPassword}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeButtonText}>
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Change Password Button */}
        <Pressable
          style={[styles.button, styles.primaryButton, isChangingPassword && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={isChangingPassword}
        >
          {isChangingPassword ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Şifre Değiştir</Text>
          )}
        </Pressable>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <Pressable
          style={[styles.button, styles.dangerButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Çıkış Yap</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f5'
  },
  content: {
    padding: 16,
    paddingBottom: 24
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
    flex: 1,
    textAlign: 'right'
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0b3d2e',
    marginBottom: 8
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12
  },
  input: {
    flex: 1,
    height: 48,
    color: '#333',
    fontSize: 14
  },
  eyeButton: {
    padding: 8
  },
  eyeButtonText: {
    fontSize: 18
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48
  },
  primaryButton: {
    backgroundColor: '#0b3d2e'
  },
  dangerButton: {
    backgroundColor: '#ef4444'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
