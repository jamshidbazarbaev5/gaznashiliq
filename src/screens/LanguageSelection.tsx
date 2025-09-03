import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  SafeAreaView,
} from 'react-native';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';

interface LanguageOption {
  code: string;
  name: string;
}

const languages: LanguageOption[] = [
  {
    code: 'uz',
    name: 'Ozbek tili',
    
  },
  {
    code: 'ru',
    name: 'Русский язык',
   
  },
  {
    code: 'en',
    name: 'English',
    
  },
];

interface LanguageSelectionProps {
  onLanguageSelected: () => void;
}

const LanguageSelection: React.FC<LanguageSelectionProps> = ({
  onLanguageSelected,
}) => {
  const {setLanguage} = useLanguage();
  const {colors} = useTheme();

  const handleLanguageSelect = async (languageCode: any) => {
    await setLanguage(languageCode);
    onLanguageSelected();
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.content}>
        <Text style={[styles.title, {color: colors.text}]}>
          Tilni tanlang / Выберите язык / Select language
        </Text>
        <View style={styles.languageList}>
          {languages.map(language => (
            <TouchableOpacity
              key={language.code}
              style={[styles.languageButton, {backgroundColor: colors.surface}]}
              onPress={() => handleLanguageSelect(language.code)}>
              <Text style={[styles.languageName, {color: colors.text}]}>
                {language.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  languageList: {
    gap: 16,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  flag: {
    width: 32,
    height: 32,
    marginRight: 16,
    borderRadius: 16,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '500',
  },
});

export default LanguageSelection;
