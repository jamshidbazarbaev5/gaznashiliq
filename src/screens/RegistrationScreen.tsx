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
import {authService} from '../api';
import {useToast} from '../contexts/ToastContext';
import {useTheme, useLanguage} from '../contexts';
import SelectionModal from '../components/SelectionModal';

const RegistrationScreen = ({navigation}: any) => {
  const [phone, setPhone] = useState('+998');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [region, setRegion] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const {showToast} = useToast();
  const {colors, theme} = useTheme();
  const {t} = useLanguage();

  const karakalpakstanCities = [
     t('regions.nukus'),
    t('regions.khodjeyli'),
    t('regions.chimbay'),
    t('regions.kungrad'),
    t('regions.takhtakupyr'),
    t('regions.karauziak'),
    t('regions.kegeyli'),
    t('regions.shumanay'),
    t('regions.amudarya'),
    t('regions.beruniy'),
    t('regions.ellikkala'),
    t('regions.moynak'),
    t('regions.turtkul'),
    t('regions.qanlikul'),
     t('regions.nukus_rayon'),
  ];

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

  const handleRegister = async () => {
    // Remove spaces and check if we have a complete phone number
    const cleanPhone = phone.replace(/\s/g, '');

    // Check each field individually for better error messages
    if (!cleanPhone || cleanPhone.length !== 13) {
      showToast(t('validation.phoneRequired'), 'warning');
      return;
    }

    if (!email.trim()) {
      showToast(t('validation.emailRequired'), 'warning');
      return;
    }

    if (!fullName.trim()) {
      showToast(t('validation.nameRequired'), 'warning');
      return;
    }

    if (!region) {
      showToast(t('validation.regionRequired'), 'warning');
      return;
    }

    if (!password) {
      showToast(t('validation.passwordRequired'), 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const registrationData: any = {
        phone: cleanPhone, // Send clean phone number without spaces
        email,
        full_name: fullName,
        region,
        address,
        password,
      };

      await authService.register(registrationData);
      showToast(
        'Регистрация прошла успешно! Теперь войдите в свой аккаунт.',
        'success',
      );

      navigation.navigate('Login');
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Не удалось зарегистрироваться';

      if (error.message) {
        // Try to parse validation errors from the response
        try {
          if (error.message.includes('body:')) {
            const bodyStart = error.message.indexOf('body:') + 5;
            const bodyJson = error.message.substring(bodyStart).trim();
            const parsedError = JSON.parse(bodyJson);

            if (parsedError.extra && parsedError.extra.fields) {
              const fields = parsedError.extra.fields;
              if (fields.phone && fields.phone.length > 0) {
                const phoneError = fields.phone[0];
                if (
                  phoneError.includes('already exists') ||
                  phoneError.includes('уже существует')
                ) {
                  errorMessage = 'Аккаунт с этим номером уже существует';
                } else if (
                  phoneError.includes('invalid format') ||
                  phoneError.includes('неверный формат')
                ) {
                  errorMessage = 'Неверный формат номера телефона';
                } else if (
                  phoneError.includes('required') ||
                  phoneError.includes('обязательно')
                ) {
                  errorMessage = 'Номер телефона обязателен';
                } else {
                  errorMessage = phoneError;
                }
              } else if (fields.email && fields.email.length > 0) {
                const emailError = fields.email[0];
                if (
                  emailError.includes('already exists') ||
                  emailError.includes('уже существует')
                ) {
                  errorMessage = 'Аккаунт с этим email уже существует';
                } else if (
                  emailError.includes('invalid') ||
                  emailError.includes('неверный')
                ) {
                  errorMessage = 'Неверный формат email';
                } else if (
                  emailError.includes('required') ||
                  emailError.includes('обязательно')
                ) {
                  errorMessage = 'Email обязателен';
                } else {
                  errorMessage = emailError;
                }
              } else if (fields.password && fields.password.length > 0) {
                const passwordError = fields.password[0];
                if (
                  passwordError.includes('too short') ||
                  passwordError.includes('слишком короткий')
                ) {
                  errorMessage = 'Пароль слишком короткий';
                } else if (
                  passwordError.includes('required') ||
                  passwordError.includes('обязательно')
                ) {
                  errorMessage = 'Пароль обязателен';
                } else {
                  errorMessage = passwordError;
                }
              } else {
                // Get first field error
                const firstField = Object.keys(fields)[0];
                const fieldError = fields[firstField][0];

                // Translate common field names
                let fieldName = firstField;
                switch (firstField) {
                  case 'phone':
                    fieldName = t('auth.phone');
                    break;
                  case 'email':
                    fieldName = t('auth.email');
                    break;
                  case 'password':
                    fieldName = t('auth.password');
                    break;
                  case 'full_name':
                    fieldName = t('auth.name');
                    break;
                  case 'region':
                    fieldName = t('auth.region');
                    break;
                  case 'address':
                    fieldName = t('common.address');
                    break;
                }

                if (
                  fieldError.includes('required') ||
                  fieldError.includes('обязательно')
                ) {
                  errorMessage = `${fieldName} обязателен`;
                } else if (
                  fieldError.includes('already exists') ||
                  fieldError.includes('уже существует')
                ) {
                  errorMessage = `${fieldName} уже используется`;
                } else {
                  errorMessage = fieldError;
                }
              }
            } else if (parsedError.message) {
              errorMessage = parsedError.message;
            }
          } else if (error.message.includes('Network request failed')) {
            errorMessage =
              'Проблема с подключением к интернету. Проверьте соединение.';
          } else if (error.message.includes('415')) {
            errorMessage = 'Ошибка формата данных. Попробуйте еще раз.';
          } else if (error.message.includes('400')) {
            errorMessage =
              'Неверные данные. Проверьте правильность заполнения полей.';
          } else if (error.message.includes('409')) {
            errorMessage = 'Пользователь с такими данными уже существует.';
          } else {
            errorMessage = error.message;
          }
        } catch (parseError) {
          // If parsing fails, use original error handling
          if (error.message.includes('Network request failed')) {
            errorMessage =
              'Проблема с подключением к интернету. Проверьте соединение.';
          } else if (error.message.includes('415')) {
            errorMessage = 'Ошибка формата данных. Попробуйте еще раз.';
          } else if (error.message.includes('400')) {
            errorMessage =
              'Неверные данные. Проверьте правильность заполнения полей.';
          } else if (error.message.includes('409')) {
            errorMessage = 'Пользователь с такими данными уже существует.';
          } else {
            errorMessage = error.message;
          }
        }
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegionSelect = (selectedRegion: string) => {
    setRegion(selectedRegion);
    setShowRegionModal(false);
  };

  const styles = createStyles(colors, theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{t('auth.register')}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.phone')}</Text>
          <TextInput
            style={styles.input}
            placeholder="+998 97 123 45 67"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={17} // +998 XX XXX XX XX = 17 characters with spaces
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('common.fullName')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('common.fullName')}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.region')}</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowRegionModal(true)}>
            <Text style={styles.dropdownText}>
              {region || t('auth.region')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('common.address')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('common.address')}
            value={address}
            onChangeText={setAddress}
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
          onPress={handleRegister}
          disabled={isLoading}>
          <Text style={styles.loginButtonText}>
            {isLoading ? t('common.loading') : t('auth.register')}
          </Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            {t('common.alreadyHaveAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={handleGoToLogin}>
            <Text style={styles.registerLink}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SelectionModal
        visible={showRegionModal}
        title={t('auth.region')}
        data={karakalpakstanCities}
        selectedValue={region}
        onSelect={handleRegionSelect}
        onClose={() => setShowRegionModal(false)}
      />
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
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: colors.textTertiary,
    },
    googleButton: {
      backgroundColor: colors.buttonSecondary,
      borderRadius: 12,
      paddingVertical: 16,
      marginBottom: 16,
    },
    appleButton: {
      backgroundColor: theme === 'dark' ? colors.surface : '#000000',
      borderRadius: 12,
      paddingVertical: 16,
    },
    socialButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      // backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    googleIconText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#4285F4',
    },
    googleButtonText: {
      color: '#4285F4',
      fontSize: 16,
      fontWeight: '500',
    },
    appleIcon: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    appleIconText: {
      fontSize: 16,
    },
    appleButtonText: {
      color: theme === 'dark' ? colors.text : '#ffffff',
      fontSize: 16,
      fontWeight: '500',
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    loginText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    loginLink: {
      fontSize: 16,
      color: colors.accent,
      fontWeight: '600',
    },
    dropdown: {
      backgroundColor: colors.input,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    dropdownText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    dropdownArrow: {
      fontSize: 12,
      color: colors.accent,
      transform: [{rotate: '0deg'}],
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

export default RegistrationScreen;
