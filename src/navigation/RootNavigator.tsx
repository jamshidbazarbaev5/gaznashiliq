import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LanguageSelector from '../screens/LanguageSelector';
import LaunchScreen from '../screens/LaunchScreen';
import { BottomTabNavigator } from './';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [initialRoute, setInitialRoute] = useState<string>('');

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasSelectedLanguage = await AsyncStorage.getItem('selectedLanguage');
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');

      if (!hasSelectedLanguage) {
        setInitialRoute('LanguageSelector');
      } else if (!hasLaunched) {
        setInitialRoute('LaunchScreen');
        await AsyncStorage.setItem('hasLaunched', 'true');
      } else {
        setInitialRoute('MainApp');
      }

      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error checking first launch:', error);
      setInitialRoute('LanguageSelector');
      setIsFirstLaunch(false);
    }
  };

  if (isFirstLaunch === null) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="LanguageSelector" component={LanguageSelector} />
        <Stack.Screen name="LaunchScreen" component={LaunchScreen} />
        <Stack.Screen name="MainApp" component={BottomTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
