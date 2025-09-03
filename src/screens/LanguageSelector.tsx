import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const languages = [
  { code: 'uz', name: 'O'zbek tili', flag: require('../assets/images/uz_flag.png') },
  { code: 'ru', name: 'Русский язык', flag: require('../assets/images/ru_flag.png') },
];

const LanguageSelector = () => {
  const navigation = useNavigation();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  useEffect(() => {
    checkLanguage();
  }, []);

  const checkLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error checking language:', error);
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      await AsyncStorage.setItem('selectedLanguage', languageCode);
      setSelectedLanguage(languageCode);
      // Navigate to Launch Screen
      navigation.navigate('LaunchScreen');
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tilni tanlang / Выберите язык</Text>
      </View>

      <View style={styles.languageContainer}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageButton,
              selectedLanguage === language.code && styles.selectedLanguage,
            ]}
            onPress={() => handleLanguageSelect(language.code)}
          >
            <Image source={language.flag} style={styles.flagIcon} />
            <Text style={styles.languageText}>{language.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  languageContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  selectedLanguage: {
    backgroundColor: '#E8F0FE',
    borderColor: '#4285F4',
  },
  flagIcon: {
    width: 30,
    height: 20,
    marginRight: 15,
  },
  languageText: {
    fontSize: 18,
    color: '#333333',
  },
});

export default LanguageSelector;
