import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { validateRegisterForm } from '../utils/validation';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const { signUp, isLoading, error } = useContext(AuthContext);

  const handleRegister = async () => {
    // Form validasyonu
    const { isValid, errors: formErrors } = validateRegisterForm(
      fullName,
      email,
      password,
      passwordConfirm
    );

    if (!isValid) {
      setErrors(formErrors);
      return;
    }

    setErrors({});

    try {
      await signUp(fullName, email, password);
      Alert.alert('Kayıt Başarılı', 'Hesabınız oluşturuldu. Lütfen giriş yapın.', [
        {
          text: 'Tamam',
          onPress: () => navigation.replace('Login')
        }
      ]);
    } catch (err) {
      Alert.alert('Kayıt Hatası', err.message || 'Kayıt olunamadı');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Kayıt Ol</Text>
        <Text style={styles.subtitle}>Kütüphane Yönetim Sistemi</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              placeholder="Adınızı ve Soyadınızı girin"
              autoCapitalize="words"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
              editable={!isLoading}
            />
            {errors.fullName && <Text style={styles.errorMessage}>{errors.fullName}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>E-posta Adresi</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              editable={!isLoading}
            />
            {errors.email && <Text style={styles.errorMessage}>{errors.email}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Min. 6 karakter, 1 büyük harf, 1 sayı"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              editable={!isLoading}
            />
            {errors.password && <Text style={styles.errorMessage}>{errors.password}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Şifre Tekrarı</Text>
            <TextInput
              style={[styles.input, errors.passwordConfirm && styles.inputError]}
              placeholder="Şifrenizi tekrar girin"
              secureTextEntry
              value={passwordConfirm}
              onChangeText={(text) => {
                setPasswordConfirm(text);
                if (errors.passwordConfirm) setErrors({ ...errors, passwordConfirm: '' });
              }}
              editable={!isLoading}
            />
            {errors.passwordConfirm && (
              <Text style={styles.errorMessage}>{errors.passwordConfirm}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Kayıt Ol</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
            <TouchableOpacity
              onPress={() => navigation.replace('Login')}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingTop: 30,
    paddingBottom: 40
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0b3d2e',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24
  },
  errorBox: {
    backgroundColor: '#fee',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16
  },
  errorText: {
    color: '#dc3545',
    fontSize: 13
  },
  form: {
    gap: 16
  },
  fieldContainer: {
    marginBottom: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333'
  },
  inputError: {
    borderColor: '#dc3545'
  },
  errorMessage: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4
  },
  registerButton: {
    backgroundColor: '#0b3d2e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  registerButtonDisabled: {
    opacity: 0.6
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loginText: {
    color: '#666',
    fontSize: 14
  },
  loginLink: {
    color: '#0b3d2e',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
