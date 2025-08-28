import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useLanguage} from '../contexts';
import {useTheme} from '../contexts/ThemeContext';

export const HeaderLanguageSelector: React.FC = () => {
  const {language, setLanguage, t} = useLanguage();
  const {colors} = useTheme();

  const languages = [
    {code: 'uz', name: "O'zbek"},
    {code: 'ru', name: 'Русский'},
    {code: 'kk', name: 'Qaraqalpaq'},
  ];

  const handleLanguageChange = () => {
    const currentIndex = languages.findIndex(lang => lang.code === language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].code as 'uz' | 'ru' | 'kk');
  };

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <TouchableOpacity
      style={[styles.container, {backgroundColor: colors.card}]}
      onPress={handleLanguageChange}>
      <Text style={[styles.languageText, {color: colors.text}]}>
        {currentLanguage?.name || "O'zbek"}
      </Text>
      <Text style={[styles.arrow, {color: colors.textSecondary}]}>⟳</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  arrow: {
    fontSize: 12,
  },
});
