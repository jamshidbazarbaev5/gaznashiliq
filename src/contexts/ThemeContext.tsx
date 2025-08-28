import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StatusBar} from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Background colors
  primary: string;
  secondary: string;
  surface: string;
  background: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;

  // Border and separator colors
  border: string;
  separator: string;

  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;

  // Interactive colors
  accent: string;
  buttonPrimary: string;
  buttonSecondary: string;

  // Card and modal colors
  card: string;
  modal: string;
  overlay: string;

  // Input colors
  input: string;
  inputBorder: string;
  inputFocused: string;
  placeholder: string;

  // Icon colors
  icon: string;
  iconSecondary: string;

  // Shadow colors
  shadow: string;

  // Status bar
  statusBar: 'light-content' | 'dark-content';
}

const lightTheme: ThemeColors = {
  // Background colors
  primary: '#E8EDF4',
  secondary: '#F5F5F5',
  surface: '#ffffff',
  background: '#E8EDF4',

  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#AAAAAA',

  // Border and separator colors
  border: '#E0E0E0',
  separator: '#F0F0F0',

  // Status colors
  success: '#28A745',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',

  // Interactive colors
  accent: '#007AFF',
  buttonPrimary: '#007AFF',
  buttonSecondary: '#F0F0F0',

  // Card and modal colors
  card: '#ffffff',
  modal: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Input colors
  input: '#ffffff',
  inputBorder: '#E0E0E0',
  inputFocused: '#007AFF',
  placeholder: '#AAAAAA',

  // Icon colors
  icon: '#000000',
  iconSecondary: '#666666',

  // Shadow colors
  shadow: '#000000',

  // Status bar
  statusBar: 'dark-content',
};

const darkTheme: ThemeColors = {
  // Background colors
  primary: '#1C1C1E',
  secondary: '#2C2C2E',
  surface: '#3A3A3C',
  background: '#1C1C1E',

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textTertiary: '#8E8E93',
  textDisabled: '#636366',

  // Border and separator colors
  border: '#48484A',
  separator: '#38383A',

  // Status colors
  success: '#30D158',
  error: '#FF453A',
  warning: '#FF9F0A',
  info: '#007AFF',

  // Interactive colors
  accent: '#0A84FF',
  buttonPrimary: '#0A84FF',
  buttonSecondary: '#48484A',

  // Card and modal colors
  card: '#2C2C2E',
  modal: '#2C2C2E',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Input colors
  input: '#3A3A3C',
  inputBorder: '#48484A',
  inputFocused: '#0A84FF',
  placeholder: '#8E8E93',

  // Icon colors
  icon: '#FFFFFF',
  iconSecondary: '#EBEBF5',

  // Shadow colors
  shadow: '#000000',

  // Status bar
  statusBar: 'light-content',
};

export interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

export const ThemeProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on app start
  useEffect(() => {
    loadTheme();
  }, []);

  // Update status bar when theme changes
  useEffect(() => {
    const colors = theme === 'light' ? lightTheme : darkTheme;
    StatusBar.setBarStyle(colors.statusBar, true);
  }, [theme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newTheme: ThemeMode) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const colors = theme === 'light' ? lightTheme : darkTheme;

  const value: ThemeContextType = {
    theme,
    colors,
    toggleTheme,
    setTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper function to create themed styles
export const createThemedStyles = <T extends Record<string, any>>(
  styleFunction: (colors: ThemeColors) => T,
) => {
  return (colors: ThemeColors): T => styleFunction(colors);
};

// Common shadow styles for light and dark themes
export const getThemedShadow = (colors: ThemeColors, theme: ThemeMode) => ({
  shadowColor: colors.shadow,
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
  shadowRadius: 4,
  elevation: 2,
});

export default ThemeContext;
