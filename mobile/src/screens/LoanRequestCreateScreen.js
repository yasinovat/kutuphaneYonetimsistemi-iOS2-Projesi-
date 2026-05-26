import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  FlatList
} from 'react-native';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LoanRequestContext } from '../contexts/LoanRequestContext';
import { BooksContext } from '../contexts/BooksContext';

export default function LoanRequestCreateScreen({ navigation }) {
  const { books } = useContext(BooksContext);
  const { createNewRequest, error } = useContext(LoanRequestContext);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [note, setNote] = useState('');
  const todayIso = new Date().toISOString().split('T')[0];
  const [desiredDate, setDesiredDate] = useState(todayIso);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPickingDelivery, setIsPickingDelivery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBookPicker, setShowBookPicker] = useState(false);

  const selectedBook = books.find(b => b.id === selectedBookId);
  const availableBooks = books.filter(b => b.available_copies > 0);

  const handleCreateRequest = async () => {
    if (!selectedBookId) {
      Alert.alert('Hata', 'Lütfen bir kitap seçin.');
      return;
    }

    try {
      setIsSubmitting(true);
      // bookId'yi integer olduğundan emin ol
      const bookIdNum = parseInt(selectedBookId, 10);
      await createNewRequest(bookIdNum, note.trim() || null, desiredDate || null, deliveryDate || null);
      Alert.alert('Başarılı', 'Ödünç alma isteği oluşturuldu.', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    } catch (createError) {
      Alert.alert('Hata', createError.message || 'İstek oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (event?.type === 'dismissed') {
      setIsPickingDelivery(false);
      return;
    }
    const d = selected || new Date();
    const iso = d.toISOString().split('T')[0];
    if (isPickingDelivery) setDeliveryDate(iso);
    else setDesiredDate(iso);
    setIsPickingDelivery(false);
  };

  const openDesiredDatePicker = () => {
    if (Platform.OS === 'web') {
      const input = window.prompt('İstenen tarih (YYYY-MM-DD):', desiredDate || todayIso);
      if (!input) return;
      const m = input.match(/^\d{4}-\d{2}-\d{2}$/);
      if (!m) {
        Alert.alert('Hata', 'Lütfen tarihi YYYY-AA-GG formatında girin.');
        return;
      }
      setDesiredDate(input);
      return;
    }
    setIsPickingDelivery(false);
    setShowDatePicker(true);
  };

  const openDeliveryDatePicker = () => {
    if (Platform.OS === 'web') {
      const input = window.prompt('Teslim tarihi (YYYY-MM-DD):', deliveryDate || todayIso);
      if (!input) return;
      const m = input.match(/^\d{4}-\d{2}-\d{2}$/);
      if (!m) {
        Alert.alert('Hata', 'Lütfen tarihi YYYY-AA-GG formatında girin.');
        return;
      }
      setDeliveryDate(input);
      return;
    }
    setIsPickingDelivery(true);
    setShowDatePicker(true);
  };

  const handleSelectBook = (book) => {
    setSelectedBookId(book.id);
    setShowBookPicker(false);
  };

  return (
    <View style={styles.container}>
      {!showBookPicker ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Kitap Seçimi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kitap Seçin *</Text>
            <Pressable
              style={[styles.selectButton, !selectedBook && styles.selectButtonEmpty]}
              onPress={() => setShowBookPicker(true)}
            >
              {selectedBook ? (
                <View style={styles.selectedBookContent}>
                  <Text style={styles.selectedBookTitle}>{selectedBook.title}</Text>
                  <Text style={styles.selectedBookAuthor}>
                    {selectedBook.author}
                  </Text>
                </View>
              ) : (
                <Text style={styles.selectButtonPlaceholder}>
                  Kitap seçmek için tıklayın...
                </Text>
              )}
            </Pressable>
            {selectedBook && (
              <Text style={styles.stockInfo}>
                Mevcut: {selectedBook.available_copies} kopya
              </Text>
            )}
          </View>

          {/* Not */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Not (İsteğe bağlı)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Kütüphaneci için bir not yazın..."
              placeholderTextColor="#9ca3af"
              multiline={true}
              numberOfLines={4}
              value={note}
              onChangeText={setNote}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>{note.length}/500</Text>
          </View>

          {/* Tarih Seçici */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kitabı Almak İstediğim Tarih (İsteğe bağlı)</Text>
            <Pressable
              style={[styles.selectButton, !desiredDate && styles.selectButtonEmpty]}
              onPress={openDesiredDatePicker}
            >
              <Text style={desiredDate ? styles.selectedDateText : styles.selectButtonPlaceholder}>
                {desiredDate ? new Date(desiredDate).toLocaleDateString('tr-TR') : 'Tarih seçmek için tıklayın...'}
              </Text>
            </Pressable>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Geri Vereceğim Tarih (Zorunlu)</Text>
            <Pressable
              style={[styles.selectButton, !deliveryDate && styles.selectButtonEmpty]}
              onPress={openDeliveryDatePicker}
            >
              <Text style={deliveryDate ? styles.selectedDateText : styles.selectButtonPlaceholder}>
                {deliveryDate ? new Date(deliveryDate).toLocaleDateString('tr-TR') : 'Geri vereceğim tarihi seçin...'}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={isPickingDelivery ? (deliveryDate ? new Date(deliveryDate) : new Date()) : (desiredDate ? new Date(desiredDate) : new Date())}
                mode="date"
                display="calendar"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Bilgilendirme */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Ödünç Alma Süreci</Text>
            <Text style={styles.infoText}>
              • İsteğiniz gönderilecektir{'\n'}
              • Kütüphaneci tarafından kontrol edilecektir{'\n'}
              • Onaylanırsa kitabı alabilirsiniz{'\n'}
              • Ödünç süresi 14 gündür
            </Text>
          </View>

          {/* Gönder Butonu */}
          <Pressable
            style={[styles.submitButton, !selectedBookId && styles.submitButtonDisabled]}
            onPress={handleCreateRequest}
            disabled={isSubmitting || !selectedBookId}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>İstek Oluştur</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>İptal</Text>
          </Pressable>
        </ScrollView>
      ) : (
        // Kitap Listesi Picker
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Kitap Seç</Text>
            <Pressable onPress={() => setShowBookPicker(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>

          {availableBooks.length === 0 ? (
            <View style={styles.pickerEmpty}>
              <Text style={styles.pickerEmptyText}>Mevcut kitap bulunamadı</Text>
            </View>
          ) : (
            <FlatList
              data={availableBooks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.pickerItem}
                  onPress={() => handleSelectBook(item)}
                >
                  <View>
                    <Text style={styles.pickerItemTitle}>{item.title}</Text>
                    <Text style={styles.pickerItemAuthor}>{item.author}</Text>
                  </View>
                  <Text style={styles.pickerItemCopies}>
                    {item.available_copies}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f5'
  },
  content: {
    flex: 1
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16
  },
  errorText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '500'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8
  },
  selectButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    justifyContent: 'center'
  },
  selectButtonEmpty: {
    borderColor: '#d1d5db'
  },
  selectButtonPlaceholder: {
    color: '#9ca3af',
    fontSize: 14
  },
  selectedDateText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600'
  },
  selectedBookContent: {
    flex: 1
  },
  selectedBookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4
  },
  selectedBookAuthor: {
    fontSize: 12,
    color: '#6b7280'
  },
  stockInfo: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 8
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    fontSize: 13,
    color: '#1f2937',
    textAlignVertical: 'top'
  },
  charCount: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right'
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    marginBottom: 24
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18
  },
  submitButton: {
    backgroundColor: '#0b3d2e',
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db'
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937'
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280'
  },
  pickerEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pickerEmptyText: {
    fontSize: 14,
    color: '#9ca3af'
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  pickerItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4
  },
  pickerItemAuthor: {
    fontSize: 12,
    color: '#6b7280'
  },
  pickerItemCopies: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0b3d2e',
    minWidth: 30,
    textAlign: 'right'
  }
});
