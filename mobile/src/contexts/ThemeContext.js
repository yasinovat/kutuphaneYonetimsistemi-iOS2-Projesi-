import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'appThemeIsDark';

export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  colors: {}
});

const lightColors = {
  background: '#f4f7f5',
  surface: '#ffffff',
  textPrimary: '#133c31',
  textSecondary: '#667d75',
  border: '#d6e2dc',
  primary: '#0b3d2e',
  card: '#ffffff',
  headerText: '#ffffff',
  input: '#ffffff',
  inputText: '#143d31',
  divider: '#e0e0e0'
};

const darkColors = {
  background: '#0f1614',
  surface: '#17211e',
  textPrimary: '#e6f2ec',
  textSecondary: '#b6c7bf',
  border: '#31403b',
  primary: '#2bd176',
  card: '#0f1614',
  headerText: '#06110c',
  input: '#121b18',
  inputText: '#e6f2ec',
  divider: '#26332f'
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!mounted) return;
      if (val === '1') setIsDark(true);
    }).catch(() => {});

    return () => { mounted = false; };
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch (e) {}
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
