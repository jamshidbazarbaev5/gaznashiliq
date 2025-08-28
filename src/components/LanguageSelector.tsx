import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import {useLanguage} from '../contexts';
import {useTheme} from '../contexts/ThemeContext';
import {useToast} from '../contexts';

interface LanguageSelectorProps {
  showTitle?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  showTitle = true,
}) => {
  const {language, setLanguage, t} = useLanguage();
  const {colors} = useTheme();
  const {showToast} = useToast();
  const [modalVisible, setModalVisible] = useState(false);

  const languages = [
    {code: 'uz', name: t('languages.uzbek'), nativeName: "O'zbek"},
    {code: 'ru', name: t('languages.russian'), nativeName: 'Русский'},
    {code: 'kk', name: t('languages.karakalpak'), nativeName: 'Qaraqalpaq'},
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageSelect = async (langCode: string) => {
    const selectedLang = languages.find(lang => lang.code === langCode);
    try {
      await setLanguage(langCode as 'uz' | 'ru' | 'kk');
      setModalVisible(false);

      // Show success toast with the selected language name
      showToast(
        `${t('profile.language')} ${t('common.changed')}: ${
          selectedLang?.nativeName
        }`,
        'success',
      );
    } catch (error) {
      console.error('Error changing language:', error);
      showToast(t('common.error'), 'error');
    }
  };

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={[styles.title, {color: colors.text}]}>
          {t('profile.language')}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.selector,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
        accessible={true}
        accessibilityLabel={`${t('profile.language')}: ${
          currentLanguage?.nativeName || "O'zbek"
        }`}
        accessibilityHint={
          t('profile.selectLanguageHint') || 'Tap to change language'
        }>
        <View style={styles.selectorContent}>
          <View style={styles.languageDisplay}>
            <Text style={[styles.selectedLanguage, {color: colors.text}]}>
              {currentLanguage?.nativeName || "O'zbek"}
            </Text>
            <Text
              style={[
                styles.selectedLanguageSubtext,
                {color: colors.textSecondary},
              ]}>
              {currentLanguage?.name}
            </Text>
          </View>
          <Text style={[styles.dropdownIcon, {color: colors.textSecondary}]}>
            ▼
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {t('profile.language')}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}>
                <Text style={[styles.closeButtonText, {color: colors.text}]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.languageList}>
              {languages.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    {borderBottomColor: colors.border},
                    language === lang.code && {
                      backgroundColor: colors.primary + '15',
                    },
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                  accessible={true}
                  accessibilityLabel={`${lang.nativeName} - ${lang.name}`}
                  accessibilityRole="button">
                  <View style={styles.languageInfo}>
                    <Text
                      style={[
                        styles.languageName,
                        {color: colors.text},
                        language === lang.code && [
                          {color: colors.primary},
                          styles.selectedLanguageName,
                        ],
                      ]}>
                      {lang.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.languageSubname,
                        {color: colors.textSecondary},
                      ]}>
                      {lang.name}
                    </Text>
                  </View>
                  {language === lang.code && (
                    <Text style={[styles.checkMark, {color: colors.primary}]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selector: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageDisplay: {
    flex: 1,
  },
  selectedLanguage: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedLanguageSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  dropdownIcon: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    paddingTop: 10,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  languageSubname: {
    fontSize: 14,
  },
  closeButtonText: {
    fontSize: 18,
  },
  selectedLanguageName: {
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 18,
  },
});
