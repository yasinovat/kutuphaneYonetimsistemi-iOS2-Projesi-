import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import BookListScreen from './src/screens/BookListScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#0b3d2e' },
          headerTintColor: '#ffffff',
          contentStyle: { backgroundColor: '#f4f7f5' }
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Kutuphane Ana Ekran' }}
        />
        <Stack.Screen
          name="BookList"
          component={BookListScreen}
          options={{ title: 'Kitap Listesi' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
