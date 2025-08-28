import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, StyleSheet} from 'react-native';
import {Icon} from '../components';
import {useTheme, useLanguage} from '../contexts';

import SubmitAppealScreen from '../screens/SubmitAppealScreen';
import MyAppealsScreen from '../screens/MyAppealsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const styles = createStyles(colors);

  // Tab icon components with access to styles
  const HomeIcon = ({color, focused}: {color: string; focused: boolean}) => (
    <View style={[styles.tabIconContainer, focused && styles.activeTab]}>
      <Icon name="home" size={24} tintColor={color} />
    </View>
  );

  const MyAppealsIcon = ({
    color,
    focused,
  }: {
    color: string;
    focused: boolean;
  }) => (
    <View style={[styles.tabIconContainer, focused && styles.activeTab]}>
      <Icon name="cubic" size={24} tintColor={color} />
    </View>
  );

  const NotificationsIcon = ({
    color,
    focused,
  }: {
    color: string;
    focused: boolean;
  }) => (
    <View style={[styles.tabIconContainer, focused && styles.activeTab]}>
      <Icon name="message" size={24} tintColor={color} />
    </View>
  );

  const ProfileIcon = ({color, focused}: {color: string; focused: boolean}) => (
    <View style={[styles.tabIconContainer, focused && styles.activeTab]}>
      <Icon name="profile" size={24} tintColor={color} />
    </View>
  );

  return (
    <Tab.Navigator
      initialRouteName="SubmitAppeal"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarShowLabel: false,
      }}>
      <Tab.Screen
        name="SubmitAppeal"
        component={SubmitAppealScreen}
        options={{
          title: t('appeals.submitAppeal'),
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="MyAppeals"
        component={MyAppealsScreen}
        options={{
          title: t('appeals.myAppeals'),
          tabBarIcon: MyAppealsIcon,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: t('profile.notifications'),
          tabBarIcon: NotificationsIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('profile.title'),
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      height: 60,
      paddingBottom: 8,
      paddingTop: 8,
    },
    tabIconContainer: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    activeTab: {
      backgroundColor: colors.accent + '20',
    },
  });

export default BottomTabNavigator;
