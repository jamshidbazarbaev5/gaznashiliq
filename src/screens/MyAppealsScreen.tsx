import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import RNFS from 'react-native-fs';

import {appealsService} from '../api';
import {
  mapApiAppealsToScreenAppeals,
  ScreenAppeal,
  getStatusDisplayText,
} from '../utils/appealMappers';
import {useToast} from '../contexts/ToastContext';
import {useTheme, useLanguage, useAuth} from '../contexts';

// Using ScreenAppeal interface from utils

const MyAppealsScreen = ({navigation}: any) => {
  const [appeals, setAppeals] = useState<ScreenAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  const {showToast} = useToast();
  const {colors, theme} = useTheme();
  const {t} = useLanguage();
  const {isAuthenticated} = useAuth();

  // Load appeals from API
  const loadAppeals = useCallback(async () => {
    // Don't make API calls if user is not authenticated or we've already detected auth error
    if (!isAuthenticated || authError) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // First get the list of appeals
      const response = await appealsService.getMyAppeals(10, 0);
      console.log('Initial API Response:', JSON.stringify(response, null, 2));

      // Fetch full details for each appeal
      const fullAppealsData = await Promise.all(
        response.results.map(async appeal => {
          try {
            const detailResponse = await appealsService.getAppealDetail(
              appeal.id,
            );
            console.log(
              `Detail for appeal ${appeal.id}:`,
              JSON.stringify(detailResponse, null, 2),
            );
            return detailResponse;
          } catch (error) {
            console.error(
              `Error fetching details for appeal ${appeal.id}:`,
              error,
            );
            // Check if it's an auth error
            if (
              error instanceof Error &&
              error.message.includes('Authentication token not found')
            ) {
              setAuthError(true);
              return appeal; // Return what we have
            }
            return appeal; // Fallback to list data if detail fetch fails
          }
        }),
      );

      const screenAppeals = mapApiAppealsToScreenAppeals(fullAppealsData);
      console.log(
        'Mapped Appeals with full details:',
        JSON.stringify(screenAppeals, null, 2),
      );

      setAppeals(screenAppeals);
    } catch (error) {
      console.error('Error loading appeals:', error);

      // Check if it's an auth error to prevent repeated error messages
      if (
        error instanceof Error &&
        error.message.includes('Authentication token not found')
      ) {
        setAuthError(true);
        // Don't show toast for auth errors as user will be logged out automatically
        return;
      }

      showToast(
        'Не удалось загрузить обращения. Проверьте подключение к интернету.',
        'error',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, isAuthenticated, authError]);

  // Reset auth error when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      setAuthError(false);
    }
  }, [isAuthenticated]);

  // Load appeals on component mount
  useEffect(() => {
    loadAppeals();
  }, [loadAppeals]);

  // Handle pull to refresh
  const onRefresh = () => {
    if (!isAuthenticated || authError) {
      return;
    }
    setRefreshing(true);
    loadAppeals();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'under_review':
        return {backgroundColor: colors.info};
      case 'rejected':
        return {backgroundColor: colors.error};
      case 'completed':
        return {backgroundColor: colors.success};
      default:
        return {backgroundColor: colors.info};
    }
  };

  const styles = createStyles(colors, theme);

  const handleAppealPress = (appeal: ScreenAppeal) => {
    // Pass the appeal ID to fetch detailed data in AppealStatusScreen
    navigation.navigate('AppealStatus', {appealId: appeal.id, ...appeal});
  };

  const handleDetailsPress = (appeal: ScreenAppeal) => {
    navigation.navigate('AppealStatus', {appealId: appeal.id, ...appeal});
  };

  const handleFileDownload = async (fileUrl: string) => {
    try {
      showToast('Загрузка файла началась...', 'info');

      // Get the file name from the URL
      const fileName = fileUrl.split('/').pop() || 'downloaded_file';

      // Define the download destination
      const downloadDir = Platform.select({
        ios: RNFS.DocumentDirectoryPath,
        android: RNFS.DownloadDirectoryPath,
      });

      const filePath = `${downloadDir}/${fileName}`;

      // Download options
      const options = {
        fromUrl: fileUrl,
        toFile: filePath,
        background: true,
        begin: (res: any) => {
          console.log('Download started:', res);
        },
        progress: (res: any) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Download progress: ${progress.toFixed(2)}%`);
        },
      };

      // Start download
      const response = await RNFS.downloadFile(options).promise;

      if (response.statusCode === 200) {
        showToast('Файл успешно загружен', 'success');
      } else {
        throw new Error(`Download failed with status ${response.statusCode}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      showToast('Ошибка при загрузке файла', 'error');
    }
  };

  const renderAppealItem = ({item}: {item: ScreenAppeal}) => (
    <TouchableOpacity
      style={styles.appealCard}
      onPress={() => handleAppealPress(item)}>
      <View style={styles.appealHeader}>
        <Text style={styles.appealNumber}>{t('appeals.number')}</Text>
      </View>
      <Text style={styles.appealNumberValue}>{item.appealNumber}</Text>

      <View style={styles.appealDetail}>
        <Text style={styles.detailLabel}>{t('appeals.category')}</Text>
        <Text style={styles.detailValue}>{item.category}</Text>
      </View>

      <View style={styles.appealDetail}>
        <Text style={styles.detailLabel}>{t('auth.region')}</Text>
        <Text style={styles.detailValue}>{item.region}</Text>
      </View>

      <View style={styles.appealDetail}>
        <Text style={styles.detailLabel}>{t('appeals.date')}</Text>
        <Text style={styles.detailValue}>{item.date}</Text>
      </View>

      <View style={styles.appealDetail}>
        <Text style={styles.detailLabel}>{t('appeals.status')}</Text>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={styles.statusText}>
            {getStatusDisplayText(item.status, t)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => handleDetailsPress(item)}>
        <Text style={styles.detailsButtonText}>{t('common.see')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('appeals.myAppeals')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('appeals.myAppeals')}</Text>
      </View>

      <FlatList
        data={appeals}
        renderItem={renderAppealItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('appeals.myAppeals')}</Text>
            <Text style={styles.emptySubtext}>{t('appeals.submitAppeal')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: any, theme: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    fileButton: {
      backgroundColor: colors.accent,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginTop: 8,
      marginRight: 8,
    },
    fileButtonText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: '500',
    },
    header: {
      backgroundColor: colors.surface,
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'center',
      flex: 1,
    },
    sortButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContainer: {
      padding: 16,
    },
    appealCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    appealHeader: {
      marginBottom: 8,
    },
    appealNumber: {
      fontSize: 14,
      color: colors.textTertiary,
      fontWeight: '500',
    },
    appealNumberValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 16,
    },
    appealDetail: {
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.textTertiary,
      marginBottom: 4,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 20,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    statusText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: '600',
    },
    detailsButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    detailsButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default MyAppealsScreen;
