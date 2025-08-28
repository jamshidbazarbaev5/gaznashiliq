import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {pick} from '@react-native-documents/picker';
import appealsService, {AppealCategory} from '../api/appeals';

import {useAuth} from '../contexts/AuthContext';
import {useApiErrorHandler} from '../hooks/useApiErrorHandler';
import {useToast} from '../contexts/ToastContext';
import {useTheme, useLanguage} from '../contexts';
import SelectionModal from '../components/SelectionModal';

const SubmitAppealScreen = ({navigation}: any) => {
  const {user} = useAuth();
  const {handleApiError} = useApiErrorHandler();
  const {showToast} = useToast();
  const {colors, theme} = useTheme();
  const {t} = useLanguage();
  const [categories, setCategories] = useState<AppealCategory[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<AppealCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [appealText, setAppealText] = useState('');
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
  const [region, setRegion] = useState('');
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(colors, theme);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasFetchedCategories = useRef(false);
  const hasFetchedUserData = useRef(false);
  const isMounted = useRef(true);

  const loadCategories = useCallback(async () => {
    if (hasFetchedCategories.current || isLoading) return;

    try {
      hasFetchedCategories.current = true;
      setIsLoading(true);
      const categoriesData = await appealsService.getCategories();

      if (isMounted.current) {
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      hasFetchedCategories.current = false;

      if (isMounted.current) {
        // Handle token expiration
        const wasLoggedOut = await handleApiError(
          error,
          'Не удалось загрузить категории обращений',
        );

        if (!wasLoggedOut) {
          showToast('Не удалось загрузить категории обращений', 'error');
        }
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [handleApiError, isLoading]);

  const loadUserData = useCallback(() => {
    if (hasFetchedUserData.current || !user) return;

    try {
      hasFetchedUserData.current = true;
      // Get region from auth context (should be available after login improvements)
      if (user.region && karakalpakstanCities.includes(user.region)) {
        setRegion(user.region);
      } else if (user.region) {
        // If user has a region but it's not in our cities list, still set it
        setRegion(user.region);
      } else {
        console.warn('No region found in user data');
        // Don't set a default region, let user choose
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setRegion('');
    }
  }, [user]);

  useEffect(() => {
    isMounted.current = true;
    loadCategories();

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (user && !hasFetchedUserData.current) {
      loadUserData();
    }
  }, [user, loadUserData]);

  const handleAttachFiles = async () => {
    try {
      const results = await pick({
        type: [
          'image/*',
          'video/*',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        allowMultiSelection: true,
      });

      // Check file size (10MB limit)
      const validFiles = results.filter(file => {
        if (file.size && file.size > 10 * 1024 * 1024) {
          showToast(`Файл ${file.name} превышает размер 10 МБ`, 'error');
          return false;
        }
        return true;
      });

      setAttachedFiles(prev => [...prev, ...validFiles]);
    } catch (error: any) {
      if (error.message === 'User canceled document picker') {
        console.log('User cancelled file picker');
      } else {
        console.error('Error picking files:', error);
        showToast('Не удалось выбрать файлы', 'error');
      }
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAppeal = async () => {
    if (!selectedCategory) {
      showToast('Выберите категорию обращения', 'warning');
      return;
    }

    if (!appealText.trim()) {
      showToast('Введите текст обращения', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);

      const appealData = {
        text: appealText.trim(),
        category: selectedCategory.id,
        region: region || '',
        files: attachedFiles,
      };

      const response = await appealsService.createAppeal(appealData);

      showToast('Обращение успешно отправлено', 'success');

      // Navigate after a short delay to let user see the success message
      setTimeout(() => {
        navigation.navigate('AppealStatus', {
          appealId: response.id,
        });
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting appeal:', error);

      // Handle token expiration
      const wasLoggedOut = await handleApiError(
        error,
        'Не удалось отправить обращение. Попробуйте снова.',
      );

      if (!wasLoggedOut) {
        showToast('Не удалось отправить обращение. Попробуйте снова.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySelect = (category: AppealCategory) => {
    setSelectedCategory(category);
  };

  const handleRegionSelect = (selectedRegion: string) => {
    setRegion(selectedRegion);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('appeals.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{t('appeals.submitAppeal')}</Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('appeals.category')}</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowCategoryModal(true)}
            disabled={isLoading}>
            <Text style={styles.dropdownText}>
              {isLoading
                ? t('common.loading')
                : selectedCategory?.name || t('appeals.category')}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('appeals.description')}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={t('appeals.description')}
            value={appealText}
            onChangeText={setAppealText}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#999999"
          />
        </View>

        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleAttachFiles}>
          <Text style={styles.attachButtonText}>{t('common.file')}</Text>
        </TouchableOpacity>

        {attachedFiles.length > 0 && (
          <View style={styles.attachedFilesContainer}>
            <Text style={styles.attachedFilesTitle}>{t('common.file')}:</Text>
            {attachedFiles.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => removeFile(index)}>
                  <Text style={styles.removeFileText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.fileRestrictions}>{t('common.edit')}</Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('auth.region')}</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowRegionModal(true)}>
            <Text style={styles.dropdownText}>
              {region || t('auth.region')}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitAppeal}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t('appeals.submitAppeal')}
            </Text>
          )}
        </TouchableOpacity>

        <SelectionModal
          visible={showCategoryModal}
          title={t('modal.selectCategory')}
          data={categories}
          selectedValue={selectedCategory}
          onSelect={handleCategorySelect}
          onClose={() => setShowCategoryModal(false)}
          displayKey="name"
          valueKey="id"
        />

        <SelectionModal
          visible={showRegionModal}
          title={t('modal.selectRegion')}
          data={karakalpakstanCities}
          selectedValue={region}
          onSelect={handleRegionSelect}
          onClose={() => setShowRegionModal(false)}
        />
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
    header: {
      backgroundColor: colors.surface,
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 18,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 24,
    },
    fieldContainer: {
      marginBottom: 20,
    },
    fieldLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: '400',
    },
    dropdown: {
      backgroundColor: colors.input,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
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
    },
    textArea: {
      backgroundColor: colors.input,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: colors.text,
      height: 120,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    attachButton: {
      backgroundColor: colors.success,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    attachButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '500',
    },
    attachedFilesContainer: {
      marginBottom: 12,
    },
    attachedFilesTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.input,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 4,
    },
    fileName: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    removeFileButton: {
      padding: 4,
      marginLeft: 8,
    },
    removeFileText: {
      color: colors.error,
      fontSize: 16,
      fontWeight: 'bold',
    },
    fileRestrictions: {
      fontSize: 12,
      color: colors.textTertiary,
      lineHeight: 16,
      marginBottom: 20,
    },
    submitButton: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 20,
      height: 50,
    },
    submitButtonDisabled: {
      backgroundColor: colors.textDisabled,
    },
    submitButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '500',
    },
  });

export default SubmitAppealScreen;
