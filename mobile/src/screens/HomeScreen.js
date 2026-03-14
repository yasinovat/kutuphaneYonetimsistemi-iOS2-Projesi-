import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kutuphane Yonetim Sistemi</Text>
      <Text style={styles.subtitle}>1. Hafta Teslimi: Ana ekran ve kitap listesi gecisi</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('BookList')}
      >
        <Text style={styles.buttonText}>Kitap Listesini Ac</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0b3d2e',
    textAlign: 'center',
    marginBottom: 12
  },
  subtitle: {
    fontSize: 15,
    color: '#365b50',
    textAlign: 'center',
    marginBottom: 32
  },
  button: {
    backgroundColor: '#0b3d2e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  }
});
