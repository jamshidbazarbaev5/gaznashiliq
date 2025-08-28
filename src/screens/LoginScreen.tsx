import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {authService, LoginData} from '../api';
import {useAuth, useTheme, useLanguage} from '../contexts';
import {useToast} from '../contexts/ToastContext';

const LoginScreen = ({navigation}: any) => {
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {login} = useAuth();
  const {showToast} = useToast();
  const {colors, theme} = useTheme();
  const {t} = useLanguage();

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters except +
    let cleaned = text.replace(/[^\d+]/g, '');

    // Always start with +998
    if (!cleaned.startsWith('+998')) {
      cleaned = '+998';
    }

    // Limit to +998 + 9 digits = 13 characters total
    if (cleaned.length > 13) {
      cleaned = cleaned.substring(0, 13);
    }

    // Format: +998 XX XXX XX XX
    if (cleaned.length > 4) {
      const countryCode = cleaned.substring(0, 4); // +998
      const remaining = cleaned.substring(4);

      if (remaining.length <= 2) {
        return `${countryCode} ${remaining}`;
      } else if (remaining.length <= 5) {
        return `${countryCode} ${remaining.substring(
          0,
          2,
        )} ${remaining.substring(2)}`;
      } else if (remaining.length <= 7) {
        return `${countryCode} ${remaining.substring(
          0,
          2,
        )} ${remaining.substring(2, 5)} ${remaining.substring(5)}`;
      } else {
        return `${countryCode} ${remaining.substring(
          0,
          2,
        )} ${remaining.substring(2, 5)} ${remaining.substring(
          5,
          7,
        )} ${remaining.substring(7)}`;
      }
    }

    return cleaned;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  const handleLogin = async () => {
    // Remove spaces and check if we have a complete phone number
    const cleanPhone = phone.replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length !== 13 || !password) {
      showToast(
        'Пожалуйста, введите полный номер телефона и пароль',
        'warning',
      );
      return;
    }

    setIsLoading(true);
    try {
      const loginData: LoginData = {
        phone: cleanPhone, // Send clean phone number without spaces
        password,
      };

      const response = await authService.login(loginData);

      // Fetch user profile data including region
      const userProfile = await authService.getUserProfile(response.access);

      // Use AuthContext to handle login with user data
      await login(response.access, response.refresh, userProfile);

      showToast(t('common.success'), 'success');
      navigation.navigate('Main');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = t('common.error');

      if (error.message) {
        if (error.message.includes('Network request failed')) {
          errorMessage = t('common.error');
        } else if (error.message.includes('401')) {
          errorMessage = t('common.error');
        } else if (error.message.includes('400')) {
          errorMessage = t('common.error');
        } else {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToRegistration = () => {
    navigation.navigate('Registration');
  };

  const styles = createStyles(colors, theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{t('auth.login')}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.phone')}</Text>
          <TextInput
            style={styles.input}
            placeholder="+998 XX XXX XX XX"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={17} // +998 XX XXX XX XX = 17 characters with spaces
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}>
          <Text style={styles.loginButtonText}>
            {isLoading ? t('common.loading') : t('auth.login')}
          </Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>{t('auth.notregistered')}? </Text>
          <TouchableOpacity onPress={handleGoToRegistration}>
            <Text style={styles.registerLink}>{t('auth.register')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, theme: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 30,
      paddingTop: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 40,
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '400',
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    loginButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 40,
    },
    disabledButton: {
      backgroundColor: colors.textDisabled,
    },
    loginButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    registerText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    registerLink: {
      fontSize: 16,
      color: colors.accent,
      fontWeight: '600',
    },
  });

export default LoginScreen;
