import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Kütüphane Yönetim Sistemi</Text>
        
        {user && (
          <View style={styles.userBox}>
            <Text style={styles.userGreeting}>Hoş geldiniz!</Text>
            <Text style={styles.userName}>{user.email}</Text>
          </View>
        )}

        <View style={styles.featuresBox}>
          <Text style={styles.sectionTitle}>Mevcut Özellikler</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓ </Text>
            <Text style={styles.featureText}>Kitap listesini görüntüle</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓ </Text>
            <Text style={styles.featureText}>Güvenli giriş ve kayıt sistemi</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓ </Text>
            <Text style={styles.featureText}>Oturum yönetimi</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookList')}
        >
          <Text style={styles.bookButtonText}>Kitap Listesini Aç</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Week 4: Book CRUD's</Text>
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
    padding: 20,
    paddingTop: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0b3d2e',
    textAlign: 'center',
    marginBottom: 20
  },
  userBox: {
    backgroundColor: '#e8f5f0',
    borderLeftWidth: 4,
    borderLeftColor: '#0b3d2e',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20
  },
  userGreeting: {
    fontSize: 14,
    color: '#0b3d2e',
    fontWeight: '600',
    marginBottom: 4
  },
  userName: {
    fontSize: 13,
    color: '#555'
  },
  featuresBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b3d2e',
    marginBottom: 12
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  featureBullet: {
    color: '#28a745',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    flex: 1
  },
  bookButton: {
    backgroundColor: '#0b3d2e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 8
  }
});
