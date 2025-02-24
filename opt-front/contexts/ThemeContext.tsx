// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 테마 색상 정의
const lightTheme = {
  primary: '#007AFF',
  background: '#FFFFFF',
  text: '#000000',
  secondaryText: '#666666',
  border: '#EEEEEE',
  card: '#F5F5F5',
  error: '#FF3B30'
};

const darkTheme = {
  primary: '#0A84FF',
  background: '#000000',
  text: '#FFFFFF',
  secondaryText: '#ADADAD',
  border: '#333333',
  card: '#1C1C1E',
  error: '#FF453A'
};

interface ThemeContextType {
  isDarkMode: boolean;
  colors: typeof lightTheme;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 저장된 테마 설정 불러오기
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'true');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  const toggleTheme = async () => {
    try {
      const newThemeValue = !isDarkMode;
      await AsyncStorage.setItem('isDarkMode', String(newThemeValue));
      setIsDarkMode(newThemeValue);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      throw error;
    }
  };

  const colors = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      colors,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};