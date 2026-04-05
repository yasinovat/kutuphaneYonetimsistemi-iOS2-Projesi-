import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { createBook, fetchBookById, updateBook } from '../services/api';

const EMPTY_FORM = {
  title: '',
  author: '',
  genre: '',
  isbn: '',
  published_year: '',
  total_copies: '1',
  available_copies: '1'
};

export default function BookFormScreen({ route, navigation }) {
  const mode = route.params?.mode || 'create';
  const initialBook = route.params?.book || null;
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      if (mode !== 'edit') {
        setLoading(false);
        return;
      }

      try {
        if (initialBook) {
          setForm({
            title: initialBook.title || '',
            author: initialBook.author || '',
            genre: initialBook.genre || '',
            isbn: initialBook.isbn || '',
            published_year: initialBook.published_year ? String(initialBook.published_year) : '',
            total_copies: String(initialBook.total_copies ?? 1),
            available_copies: String(initialBook.available_copies ?? 1)
          });
          return;
        }

        if (route.params?.bookId) {
          const data = await fetchBookById(route.params.bookId);
          setForm({
            title: data.title || '',
            author: data.author || '',
            genre: data.genre || '',
            isbn: data.isbn || '',
            published_year: data.published_year ? String(data.published_year) : '',
            total_copies: String(data.total_copies ?? 1),
            available_copies: String(data.available_copies ?? 1)
          });
          return;
        }

        throw new Error('Düzenlenecek kitap bilgisi bulunamadı.');
      } catch (err) {
        Alert.alert('Hata', err.message || 'Kitap bilgisi yüklenemedi.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [initialBook, mode, navigation, route.params]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.author.trim() || !form.genre.trim() || !form.isbn.trim()) {
      Alert.alert('Eksik Bilgi', 'Başlık, yazar, tür ve ISBN zorunludur.');
      return;
    }

    const totalCopies = Number(form.total_copies);
    const availableCopies = Number(form.available_copies);
    const publishedYear = form.published_year ? Number(form.published_year) : null;

    if (!Number.isInteger(totalCopies) || totalCopies <= 0) {
      Alert.alert('Hata', 'Toplam kopya pozitif bir sayı olmalıdır.');
      return;
    }

    if (!Number.isInteger(availableCopies) || availableCopies < 0) {
      Alert.alert('Hata', 'Mevcut kopya sıfır veya pozitif bir sayı olmalıdır.');
      return;
    }

    if (availableCopies > totalCopies) {
      Alert.alert('Hata', 'Mevcut kopya toplam kopyadan büyük olamaz.');
      return;
    }

    if (form.published_year && !Number.isInteger(publishedYear)) {
      Alert.alert('Hata', 'Yayın yılı tam sayı olmalıdır.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        genre: form.genre.trim(),
        isbn: form.isbn.trim(),
        published_year: publishedYear,
        total_copies: totalCopies,
        available_copies: availableCopies
      };

      if (mode === 'edit') {
        await updateBook(initialBook?.id || route.params?.bookId, payload);
      } else {
        await createBook(payload);
      }

      Alert.alert('Başarılı', mode === 'edit' ? 'Kitap güncellendi.' : 'Kitap eklendi.', [
        { text: 'Tamam', onPress: () => navigation.navigate('BookList') }
      ]);
    } catch (err) {
      Alert.alert('Hata', err.message || 'İşlem tamamlanamadı.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b3d2e" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.wrapper}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{mode === 'edit' ? 'Kitap Düzenle' : 'Yeni Kitap Ekle'}</Text>

        <TextInput style={styles.input} placeholder="Başlık" value={form.title} onChangeText={(text) => updateField('title', text)} />
        <TextInput style={styles.input} placeholder="Yazar" value={form.author} onChangeText={(text) => updateField('author', text)} />
        <TextInput style={styles.input} placeholder="Tür" value={form.genre} onChangeText={(text) => updateField('genre', text)} />
        <TextInput style={styles.input} placeholder="ISBN" value={form.isbn} onChangeText={(text) => updateField('isbn', text)} />
        <TextInput style={styles.input} placeholder="Yayın Yılı" value={form.published_year} keyboardType="numeric" onChangeText={(text) => updateField('published_year', text)} />
        <TextInput style={styles.input} placeholder="Toplam Kopya" value={form.total_copies} keyboardType="numeric" onChangeText={(text) => updateField('total_copies', text)} />
        <TextInput style={styles.input} placeholder="Mevcut Kopya" value={form.available_copies} keyboardType="numeric" onChangeText={(text) => updateField('available_copies', text)} />

        <Pressable style={styles.button} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kaydet</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f4f7f5'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f5'
  },
  container: {
    padding: 16,
    gap: 10
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0b3d2e',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c8d7d0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#143d31'
  },
  button: {
    marginTop: 8,
    backgroundColor: '#0b3d2e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800'
  }
});
