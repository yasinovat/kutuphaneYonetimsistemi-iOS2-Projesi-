import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import { BooksProvider } from './src/contexts/BooksContext';
import { LoanRequestProvider } from './src/contexts/LoanRequestContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookListScreen from './src/screens/BookListScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';
import BookFormScreen from './src/screens/BookFormScreen';
import LoanRequestListScreen from './src/screens/LoanRequestListScreen';
import LoanRequestDetailScreen from './src/screens/LoanRequestDetailScreen';
import LoanRequestCreateScreen from './src/screens/LoanRequestCreateScreen';
import AdminLoanRequestsScreen from './src/screens/AdminLoanRequestsScreen';

const Stack = createNativeStackNavigator();

// Auth stack (Login / Register)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#f4f7f5' }
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animationTypeForReplace: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ animationTypeForReplace: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

// App stack (Home / BookList) - Protected routes(token varsa gösterilir)
function AppStack() {
  const { signOut, user } = useContext(AuthContext);

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#0b3d2e' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#f4f7f5' }
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Kütüphane Ana Ekran',
          headerRight: () => (
            <TouchableOpacity
              onPress={signOut}
              style={{ marginRight: 16 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Çıkış</Text>
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen
        name="BookList"
        component={BookListScreen}
        options={{ title: 'Kitap Listesi' }}
      />
      <Stack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{ title: 'Kitap Detayı' }}
      />
      <Stack.Screen
        name="BookForm"
        component={BookFormScreen}
        options={{ title: 'Kitap İşlemi' }}
      />

      {/* Loan Request Screens */}
      <Stack.Screen
        name="LoanRequestList"
        component={LoanRequestListScreen}
        options={{ title: 'Ödünç Alma İsteklerim' }}
      />
      <Stack.Screen
        name="LoanRequestDetail"
        component={LoanRequestDetailScreen}
        options={{ title: 'İstek Detayı' }}
      />
      <Stack.Screen
        name="LoanRequestCreate"
        component={LoanRequestCreateScreen}
        options={{ title: 'Yeni Ödünç Alma İsteği' }}
      />

      {/* Admin Screens */}
      {user?.role === 'admin' && (
        <Stack.Screen
          name="AdminLoanRequests"
          component={AdminLoanRequestsScreen}
          options={{ title: 'Ödünç Alma İstekleri' }}
        />
      )}
    </Stack.Navigator>
  );
}

// Root navigator - Auth state'e göre uygun stack'i göster
function RootNavigator() {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7f5' }}>
        <ActivityIndicator size="large" color="#0b3d2e" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {userToken ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BooksProvider>
        <LoanRequestProvider>
          <RootNavigator />
        </LoanRequestProvider>
      </BooksProvider>
    </AuthProvider>
  );
}

