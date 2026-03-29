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
import { validateLoginForm } from '../utils/validation';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { signIn, isLoading, error } = useContext(AuthContext);

  const handleLogin = async () => {
    // Form validasyonu
    const { isValid, errors: formErrors } = validateLoginForm(email, password);

    if (!isValid) {
      setErrors(formErrors);
      return;
    }

    setErrors({});

    try {
      await signIn(email, password);
      // AuthContext tarafından navigation otomatik değişecek
    } catch (err) {
      Alert.alert('Giriş Hatası', err.message || 'Giriş yapılamadı');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Giriş Yap</Text>
        <Text style={styles.subtitle}>Kütüphane Yönetim Sistemi</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
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
              placeholder="Şifrenizi girin"
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

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Hesabınız yok mu? </Text>
            <TouchableOpacity
              onPress={() => navigation.replace('Register')}
              disabled={isLoading}
            >
              <Text style={styles.signUpLink}>Kayıt Ol</Text>
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
    paddingTop: 40,
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
  loginButton: {
    backgroundColor: '#0b3d2e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  loginButtonDisabled: {
    opacity: 0.6
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  signUpText: {
    color: '#666',
    fontSize: 14
  },
  signUpLink: {
    color: '#0b3d2e',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
