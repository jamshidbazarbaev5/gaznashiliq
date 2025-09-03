import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Icon, EditProfileModal, SelectionModal} from '../components';
import {useAuth, useTheme, useLanguage} from '../contexts';
import {authService} from '../api';
import {useApiErrorHandler} from '../hooks/useApiErrorHandler';
import {useToast} from '../contexts/ToastContext';

const ProfileScreen = () => {
  const {logout, user, accessToken, updateUser} = useAuth();
  const {handleApiError} = useApiErrorHandler();
  const {showToast} = useToast();
  const {colors, theme, toggleTheme} = useTheme();
  const {t, language, setLanguage} = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<{
    type: 'name' | 'email' | 'phone' | 'region';
    title: string;
    value: string;
  } | null>(null);
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  console.log(user);

  // Define regions list with translations
  const regions = [
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

    // 'Турткуль',
    // 'Канлыкул',
    // 'Нукус Район',
  ];

  const hasFetched = useRef(false);

  const fetchUserProfile = async () => {
    console.log('Fetching profile with token:', accessToken ? 'Yes' : 'No');
    console.log('Current user state:', user);

    // Only fetch if we have a token and haven't fetched yet
    if (!accessToken) {
      console.log('No access token available');
      return;
    }

    setLoading(true);
    try {
      const profileData = await authService.getUserProfile(accessToken);
      console.log('Received profile data:', profileData);
      await updateUser(profileData);
      console.log('Updated user in context');
      setError(null);
      hasFetched.current = true;
    } catch (fetchError) {
      console.error('Error fetching user profile:', fetchError);
      hasFetched.current = false; // Reset on error so we can retry

      // Handle token expiration
      const wasLoggedOut = await handleApiError(
        fetchError,
        t('profile.loadError'),
      );

      if (!wasLoggedOut) {
        setError(t('profile.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Only fetch user profile once on mount if user data is missing
  useEffect(() => {
    console.log('useEffect running, user:', user ? 'exists' : 'null');
    console.log('hasFetched:', hasFetched.current);

    if (!user && !hasFetched.current) {
      console.log('Initiating profile fetch');
      fetchUserProfile();
    }
  }, [accessToken, user]);

  // Use user data from context
  const displayUserProfile = {
    name: user?.full_name || '',
    type: t('profile.userType'),
    phone: user?.phone || '',
    email: user?.email || '',
    region: user?.region || '',
  };

  const handleEditField = (type: 'name' | 'email' | 'phone' | 'region') => {
    if (type === 'region') {
      setRegionModalVisible(true);
      return;
    }

    const fieldMap = {
      name: {title: t('auth.name'), value: displayUserProfile.name},
      email: {title: t('auth.email'), value: displayUserProfile.email},
      phone: {title: t('auth.phone'), value: displayUserProfile.phone},
      region: {title: t('auth.region'), value: displayUserProfile.region},
    };

    setEditField({
      type,
      title: fieldMap[type].title,
      value: fieldMap[type].value,
    });
    setEditModalVisible(true);
  };

  const handleSaveField = async (value: string) => {
    if (!editField || !accessToken) {
      return;
    }

    setUpdating(true);
    try {
      const updateData: any = {};

      switch (editField.type) {
        case 'name':
          updateData.full_name = value;
          break;
        case 'email':
          updateData.email = value;
          break;
        case 'phone':
          updateData.phone = value;
          break;
        case 'region':
          updateData.region = value;
          break;
      }

      const updatedProfile = await authService.updateUserProfile(
        accessToken,
        updateData,
      );

      console.log('Updated profile received:', updatedProfile);

      // Update user data in context and local storage
      await updateUser(updatedProfile);

      // Close the modal
      setEditModalVisible(false);
      setEditField(null);

      // Force a refresh of the profile data
      await fetchUserProfile();

      showToast(t('profile.updated'), 'success');
    } catch (updateError) {
      console.error('Error updating profile:', updateError);

      // Handle token expiration
      const wasLoggedOut = await handleApiError(
        updateError,
        t('modal.saveError'),
      );

      if (!wasLoggedOut) {
        showToast(t('modal.saveError'), 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRegionSelect = async (selectedRegion: string) => {
    if (!accessToken) {
      return;
    }

    setUpdating(true);
    try {
      const updateData = {
        region: selectedRegion,
      };

      const updatedProfile = await authService.updateUserProfile(
        accessToken,
        updateData,
      );

      console.log('Updated profile after region change:', updatedProfile);

      // Update user data in context and local storage
      await updateUser(updatedProfile);

      // Close the modal
      setRegionModalVisible(false);

      // Force a refresh of the profile data
      await fetchUserProfile();

      showToast(t('profile.regionUpdated'), 'success');
    } catch (updateError) {
      console.error('Error updating region:', updateError);

      // Handle token expiration
      const wasLoggedOut = await handleApiError(
        updateError,
        t('modal.saveError'),
      );

      if (!wasLoggedOut) {
        showToast(t('modal.saveError'), 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRefresh = () => {
    fetchUserProfile();
  };

  const handleStatistics = () => {
    console.log('View statistics');
  };

  const getLanguageDisplayName = (langCode: string) => {
    const languageMap = {
      uz: "O'zbek",
      ru: 'Русский',
      kk: 'Qaraqalpaq',
    };
    return languageMap[langCode as keyof typeof languageMap] || "O'zbek";
  };

  const handleLanguageChange = () => {
    const languages = [
      {code: 'uz', name: "O'zbek"},
      {code: 'ru', name: 'Русский'},
      {code: 'kk', name: 'Qaraqalpaq'},
    ];

    const currentIndex = languages.findIndex(lang => lang.code === language);
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLanguage = languages[nextIndex];

    setLanguage(nextLanguage.code as 'uz' | 'ru' | 'kk');
    showToast(
      `${t('profile.language')} ${t('common.changed')}: ${nextLanguage.name}`,
      'success',
    );
  };

  const handleThemeChange = () => {
    toggleTheme();
    showToast(`${t('profile.theme')} ${t('common.changed')}`, 'success');
  };

  const handleDeleteAccount = () => {
    // Language-specific text ordering
    const deleteTitle =
      language === 'ru'
        ? `${t('common.delete')} ${t('profile.title')}`
        : `${t('profile.title')} ${t('common.delete')}`;

    Alert.alert(deleteTitle, t('profile.confirmDelete'), [
      {
        text: t('modal.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('common.confirm'), t('profile.confirmDeleteDetails'), [
            {
              text: t('modal.cancel'),
              style: 'cancel',
            },
            {
              text: t('common.yes') + ', ' + t('common.delete'),
              style: 'destructive',
              onPress: async () => {
                if (!accessToken) {
                  return;
                }

                setUpdating(true);
                try {
                  await authService.deleteAccount(accessToken);
                  showToast(t('profile.accountDeleted'), 'success');
                  await logout();
                } catch (deleteError) {
                  console.error('Delete account error:', deleteError);

                  // Handle token expiration
                  const wasLoggedOut = await handleApiError(
                    deleteError,
                    t('profile.deleteError'),
                  );

                  if (!wasLoggedOut) {
                    showToast(t('profile.deleteError'), 'error');
                  }
                } finally {
                  setUpdating(false);
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), t('profile.confirmLogout'), [
      {
        text: t('modal.cancel'),
        style: 'cancel',
      },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (logoutError) {
            console.error('Logout error:', logoutError);
            showToast(t('profile.logoutError'), 'error');
          }
        },
      },
    ]);
  };

  const styles = createStyles(colors, theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        {/* <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Icon name="edit" size={20} tintColor={colors.text} />
        </TouchableOpacity> */}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}

        {updating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* User Profile Card */}
        <View style={[styles.profileCard, updating && styles.disabledCard]}>
          {/* <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Icon name="frame" size={40} tintColor={colors.accent} />
            </View>
          </View> */}
          <View style={styles.userInfo}>
            <TouchableOpacity
              onPress={() => handleEditField('name')}
              style={styles.nameContainer}
              disabled={updating}>
              <Text style={styles.userName}>{displayUserProfile.name}</Text>
              <Icon
                name="edit"
                size={14}
                tintColor={colors.textSecondary}
                style={styles.editIcon}
              />
            </TouchableOpacity>
            <Text style={styles.userType}>{displayUserProfile.type}</Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={[styles.contactSection, updating && styles.disabledCard]}>
          <View style={styles.contactItem}>
            <View style={styles.contactIconWrapper}>
              <Icon name="phone" size={24} tintColor={colors.textSecondary} />
            </View>
            <Text style={styles.contactText}>{displayUserProfile.phone}</Text>
            <TouchableOpacity
              style={styles.editButton}
              // onPress={() => handleEditField('phone')}
              disabled={updating}>
              {/* <Icon name="edit" size={16} tintColor={colors.textSecondary} /> */}
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          <View style={styles.contactItem}>
            <View style={styles.contactIconWrapper}>
              <Icon
                name="message_2"
                size={24}
                tintColor={colors.textSecondary}
              />
            </View>
            <Text style={styles.contactText}>{displayUserProfile.email}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditField('email')}
              disabled={updating}>
              <Icon name="edit" size={16} tintColor={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          <View style={styles.contactItem}>
            <View style={styles.contactIconWrapper}>
              <Icon
                name="location"
                size={24}
                tintColor={colors.textSecondary}
              />
            </View>
            <Text style={styles.contactText}>{displayUserProfile.region}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditField('region')}
              disabled={updating}>
              <Icon name="edit" size={16} tintColor={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Options */}
        <View style={[styles.menuSection, updating && styles.disabledCard]}>
          {/* <View style={styles.separator} /> */}

          {/* <View style={styles.separator} /> */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLanguageChange}>
            <Text style={styles.menuText}>{t('profile.language')}</Text>
            <Text style={styles.optionText}>
              {getLanguageDisplayName(language)}
            </Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.menuItem} onPress={handleThemeChange}>
            <Text style={styles.menuText}>{t('profile.theme')}</Text>
            <Text style={styles.optionText}>
              {theme === 'light'
                ? t('profile.lightMode')
                : t('profile.darkMode')}
            </Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuText, styles.logoutText]}>
              {t('auth.logout')}
            </Text>
            <Icon name="logout" size={16} tintColor={colors.error} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDeleteAccount}
            disabled={updating}>
            <Text style={[styles.menuText, styles.deleteText]}>
              {language === 'ru'
                ? `${t('common.delete')} ${t('profile.title')}`
                : `${t('profile.title')} ${t('common.delete')}`}
            </Text>
            <Icon name="edit" size={16} tintColor={colors.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      {editField && (
        <EditProfileModal
          visible={editModalVisible}
          onClose={() => {
            setEditModalVisible(false);
            setEditField(null);
          }}
          onSave={handleSaveField}
          title={editField.title}
          fieldType={editField.type}
          initialValue={editField.value}
        />
      )}

      {/* Region Selection Modal */}
      <SelectionModal
        visible={regionModalVisible}
        title={t('auth.region')}
        data={regions}
        selectedValue={displayUserProfile.region}
        onSelect={handleRegionSelect}
        onClose={() => setRegionModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: any, theme: string) =>
  StyleSheet.create({
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    editIcon: {
      marginTop: 4,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'left',
    },
    refreshButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    avatarContainer: {
      marginRight: 16,
    },
    avatar: {
      width: 70,
      height: 70,
      borderRadius: 16,
      backgroundColor: colors.accent + '20',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    userInfo: {
      display:"flex",
      justifyContent:"space-between"
    },
    userName: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    userType: {
      fontSize: 16,
      color: colors.textTertiary,
      fontWeight: '400',
    },
    contactSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 8,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
    },
    contactIconWrapper: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    contactText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      fontWeight: '400',
    },
    editButton: {
      padding: 8,
    },
    separator: {
      height: 1,
      backgroundColor: colors.separator,
      marginLeft: 56,
    },
    menuSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 8,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
    },
    menuText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '400',
      flex: 1,
    },
    optionText: {
      fontSize: 16,
      color: colors.textDisabled,
      fontWeight: '400',
    },
    logoutText: {
      color: colors.error,
    },
    deleteText: {
      color: colors.error,
    },
    loadingContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    errorText: {
      fontSize: 16,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 12,
    },
    retryButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryButtonText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: '600',
    },
    disabledCard: {
      opacity: 0.6,
    },
  });

export default ProfileScreen;
