import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isSignout: false,
    userToken: null,
    user: null,
    error: null
  });

  // App başlatıldığında saved token'ı kontrol et
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('userToken');
        const savedUser = await AsyncStorage.getItem('userData');

        if (savedToken && savedUser) {
          setAuthState({
            isLoading: false,
            isSignout: false,
            userToken: savedToken,
            user: JSON.parse(savedUser),
            error: null
          });
        } else {
          setAuthState({
            isLoading: false,
            isSignout: true,
            userToken: null,
            user: null,
            error: null
          });
        }
      } catch (e) {
        setAuthState({
          isLoading: false,
          isSignout: true,
          userToken: null,
          user: null,
          error: 'Token yükleme hatası: ' + e.message
        });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    ...authState,
    signIn: async (email, password) => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await apiLogin(email, password);
        
        // Token ve user bilgisini kaydet
        await AsyncStorage.setItem('userToken', response.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));

        setAuthState({
          isLoading: false,
          isSignout: false,
          userToken: response.token,
          user: response.user,
          error: null
        });

        return response;
      } catch (error) {
        const errorMessage = error.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.';
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    signUp: async (fullName, email, password) => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await apiRegister(fullName, email, password);

        // Register sonrası otomatik giriş yapılmaz, kullanıcı login ekranına yönlendirilir.
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null
        }));

        return response;
      } catch (error) {
        const errorMessage = error.message || 'Kayıt olunamadı. Lütfen bilgilerinizi kontrol edin.';
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
        throw error;
      }
    },

    signOut: async () => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        
        // AsyncStorage'dan temizle
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');

        setAuthState({
          isLoading: false,
          isSignout: true,
          userToken: null,
          user: null,
          error: null
        });
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Çıkış yapılamadı: ' + error.message
        }));
        throw error;
      }
    },

    clearError: () => {
      setAuthState(prev => ({ ...prev, error: null }));
    }
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}
