import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useLanguage} from '../../contexts';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (value: string) => Promise<void>;
  title: string;
  fieldType: 'name' | 'email' | 'phone' | 'region';
  initialValue: string;
  placeholder?: string;
}

// Utility functions for phone number handling
const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/[\s-]/g, '');
};

const formatPhoneNumber = (text: string): string => {
  // Remove all non-digits except +
  let cleaned = text.replace(/[^\d+]/g, '');

  // Ensure it starts with +998
  if (!cleaned.startsWith('+998')) {
    if (cleaned.startsWith('998')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('8')) {
      cleaned = '+99' + cleaned;
    } else {
      cleaned = '+998' + cleaned.replace(/^\+/, '');
    }
  }

  // Format: +998 XX XXX-XX-XX
  if (cleaned.length >= 4) {
    const country = cleaned.slice(0, 4); // +998
    const rest = cleaned.slice(4);

    if (rest.length >= 2) {
      const operator = rest.slice(0, 2);
      const remaining = rest.slice(2);

      if (remaining.length >= 3) {
        const first = remaining.slice(0, 3);
        const second = remaining.slice(3, 5);
        const third = remaining.slice(5, 7);

        return `${country} ${operator} ${first}${second ? '-' + second : ''}${
          third ? '-' + third : ''
        }`;
      } else {
        return `${country} ${operator} ${remaining}`;
      }
    } else {
      return `${country} ${rest}`;
    }
  }

  return cleaned;
};

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
  title,
  fieldType,
  initialValue,
  placeholder,
}) => {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const {t} = useLanguage();

  const getKeyboardType = () => {
    switch (fieldType) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  const validateInput = (input: string): boolean => {
    switch (fieldType) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input);
      case 'phone':
        const phoneRegex = /^\+998\d{9}$/;
        const cleanedPhone = cleanPhoneNumber(input);
        return phoneRegex.test(cleanedPhone);
      case 'name':
        return input.trim().length >= 2;
      case 'region':
        return input.trim().length >= 2;
      default:
        return true;
    }
  };

  const getErrorMessage = () => {
    switch (fieldType) {
      case 'email':
        return t('validation.emailInvalid');
      case 'phone':
        return t('validation.phoneInvalid');
      case 'name':
        return t('validation.nameMinLength');
      case 'region':
        return t('validation.regionMinLength');
      default:
        return t('validation.correctValue');
    }
  };

  const handleSave = async () => {
    if (!value.trim()) {
      Alert.alert(t('common.error'), t('modal.fieldEmpty'));
      return;
    }

    if (!validateInput(value)) {
      Alert.alert(t('common.error'), getErrorMessage());
      return;
    }

    setLoading(true);
    try {
      // Clean phone number for API if it's a phone field
      const valueToSave =
        fieldType === 'phone' ? cleanPhoneNumber(value) : value;
      await onSave(valueToSave);
      onClose();
    } catch (error) {
      console.error('Error saving profile field:', error);
      Alert.alert(t('common.error'), t('modal.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setValue(initialValue); // Reset to initial value
    onClose();
  };

  const handleTextChange = (text: string) => {
    if (fieldType === 'phone') {
      setValue(formatPhoneNumber(text));
    } else {
      setValue(text);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelText}>{t('modal.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.saveText}>{t('modal.save')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{title}</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={handleTextChange}
              placeholder={
                placeholder || `${t('modal.enterField')} ${title.toLowerCase()}`
              }
              keyboardType={getKeyboardType()}
              autoCapitalize={fieldType === 'email' ? 'none' : 'sentences'}
              autoCorrect={false}
              editable={!loading}
              maxLength={fieldType === 'phone' ? 19 : undefined}
            />
          </View>

          {fieldType === 'phone' && (
            <Text style={styles.helperText}>{t('validation.phoneFormat')}</Text>
          )}

          {fieldType === 'email' && (
            <Text style={styles.helperText}>
              {t('validation.emailExample')}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 12,
  },
  input: {
    fontSize: 16,
    color: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  helperText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    paddingHorizontal: 4,
  },
});

export default EditProfileModal;
