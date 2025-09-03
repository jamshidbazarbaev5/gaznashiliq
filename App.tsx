import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  StatusBar,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';

import {
  LoginScreen,
  RegistrationScreen,
  AppealStatusScreen,
  LanguageSelection,
} from './src/screens';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import {
  AuthProvider,
  useAuth,
  ToastProvider,
  ThemeProvider,
  useTheme,
  LanguageProvider,
  useLanguage,
} from './src/contexts';
import {ToastContainer, SimpleLaunchScreen} from './src/components';
import {useFirstLaunch} from './src/hooks/useFirstLaunch';

const Stack = createNativeStackNavigator();

const AppNavigator = (): React.JSX.Element => {
  const {isAuthenticated, loading} = useAuth();
  const {colors} = useTheme();
  const {language, isLanguageSelected, setLanguage} = useLanguage();
  const {
    isFirstLaunch,
    loading: firstLaunchLoading,
    markFirstLaunchComplete,
  } = useFirstLaunch();
  const [hasSelectedLanguage, setHasSelectedLanguage] = React.useState(false);

  React.useEffect(() => {
    // Don't set default language automatically - let user choose
    if (!loading && !firstLaunchLoading) {
      console.log('Initial loading completed');
    }
  }, [loading, firstLaunchLoading]);

  // Testing mode - set to true to always show launch screen for testing
  const TESTING_MODE = false;



  console.log('App.tsx: State check -', {
    loading,
    firstLaunchLoading,
    isFirstLaunch,
    isAuthenticated,
    TESTING_MODE,
  });

  if (loading || firstLaunchLoading) {
    return (
      <View
        style={[styles.loadingContainer, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // Always check language first, regardless of first launch status
  if (!language || (!isLanguageSelected && !hasSelectedLanguage)) {
    console.log('App.tsx: Showing language selector');
    return (
      <LanguageSelection
        onLanguageSelected={() => {
          setHasSelectedLanguage(true);
          markFirstLaunchComplete();
        }}
      />
    );
  }

  // After language is selected, show launch screen if it's first launch
  if (isFirstLaunch || TESTING_MODE) {
    console.log('App.tsx: Showing SimpleLaunchScreen');
    return (
      <SimpleLaunchScreen
        onComplete={markFirstLaunchComplete}
        debug={TESTING_MODE}
      />
    );
  }
  console.log('App.tsx: Proceeding to main navigation');

  return (
    <NavigationContainer>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.surface} />
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{
          headerShown: false,
        }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen name="AppealStatus" component={AppealStatusScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = (): React.JSX.Element => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppNavigator />
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
