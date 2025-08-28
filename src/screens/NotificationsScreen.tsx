import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import {notificationsService} from '../api';
import {useAuth, useTheme, useLanguage} from '../contexts';
import {useApiErrorHandler} from '../hooks/useApiErrorHandler';
import {useToast} from '../contexts/ToastContext';
import type {ApiNotification} from '../api';

const NotificationsScreen = ({navigation}: any) => {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<ApiNotification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {isAuthenticated} = useAuth();
  const {handleApiError} = useApiErrorHandler();
  const {showToast} = useToast();
  const {colors, theme} = useTheme();
  const {t} = useLanguage();

  const styles = createStyles(colors, theme);

  // Fetch notifications from API
  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isAuthenticated) {
          navigation.navigate('Login');
          return;
        }

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const data = await notificationsService.getNotifications();
        setNotifications(data.results);
      } catch (err) {
        console.error('Fetch notifications error:', err);

        // Handle token expiration and other errors
        const wasLoggedOut = await handleApiError(err, t('common.error'));

        if (!wasLoggedOut) {
          if (
            err instanceof Error &&
            err.message.includes('Network request failed')
          ) {
            showToast(
              'Проблема с подключением к интернету. Проверьте соединение.',
              'error',
            );
          } else {
            showToast(t('common.error'), 'error');
          }
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, navigation, handleApiError, showToast],
  );

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await notificationsService.getNotificationDetail(notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? {...notification, is_read: true}
            : notification,
        ),
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);

      // Handle token expiration
      const wasLoggedOut = await handleApiError(
        err,
        'Не удалось отметить уведомление как прочитанное',
      );

      if (!wasLoggedOut) {
        showToast('Не удалось отметить уведомление как прочитанное', 'error');
      }
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        if (!isAuthenticated) {
          navigation.navigate('Login');
          return;
        }

        setLoading(true);
        setError(null);

        const data = await notificationsService.getNotifications();
        setNotifications(data.results);
      } catch (err) {
        console.error('Fetch notifications error:', err);

        // Handle token expiration and other errors
        const wasLoggedOut = await handleApiError(err, t('common.error'));

        if (!wasLoggedOut) {
          if (
            err instanceof Error &&
            err.message.includes('Network request failed')
          ) {
            showToast(
              'Проблема с подключением к интернету. Проверьте соединение.',
              'error',
            );
          } else {
            showToast(t('common.error'), 'error');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadNotifications();
    } else {
      navigation.navigate('Login');
    }
  }, [isAuthenticated, navigation, handleApiError, showToast]);

  const handleNotificationPress = async (notification: ApiNotification) => {
    setSelectedNotification(notification);
    setModalVisible(true);

    // Mark as read if it's unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  const onRefresh = () => {
    fetchNotifications(true);
  };

  const handleAppealPress = () => {
    if (selectedNotification?.appeal) {
      // Extract appeal ID from URL (e.g., "https://eappeal.uz/api/appeals/6" -> 6)
      const appealId = selectedNotification.appeal.split('/').pop();
      if (appealId) {
        closeModal();
        navigation.navigate('AppealStatus', {appealId: parseInt(appealId, 10)});
      }
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    if (type.toLowerCase().includes('отклон')) {
      return '#EF4444';
    }
    return isRead ? '#6B7280' : '#4A90E2';
  };

  const formatDate = (dateString?: string) => {
    // If no date provided, use current date
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString?: string) => {
    // If no date provided, use current time
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const extractAppealNumber = (text: string) => {
    // Extract appeal number from text (e.g., "7F97B348CB" from "Казначейство ответило на ваше обращение 7F97B348CB")
    const match = text.match(/обращение\s+([A-F0-9]+)/i);
    return match ? `№${match[1]}` : null;
  };

  const renderNotificationItem = ({item}: {item: ApiNotification}) => {
    const appealNumber = extractAppealNumber(item.text);
    const isRejected = item.type.toLowerCase().includes('отклон');

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.is_read && styles.unreadCard,
          isRejected && styles.rejectedCard,
        ]}
        onPress={() => handleNotificationPress(item)}>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View
              style={[
                styles.typeIndicator,
                {
                  backgroundColor: getNotificationColor(
                    item.type,
                    item.is_read,
                  ),
                },
              ]}
            />
            <Text
              style={[
                styles.notificationTitle,
                !item.is_read && styles.unreadTitle,
              ]}>
              {item.type}
            </Text>
            {appealNumber && (
              <Text style={styles.appealNumber}>{appealNumber}</Text>
            )}
          </View>
          <Text style={styles.notificationMessage}>{item.text}</Text>
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationDate}>{formatDate()}</Text>
            <Text style={styles.notificationTime}>{formatTime()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.notifications')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.notifications')}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchNotifications()}>
            <Text style={styles.retryButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.notifications')}</Text>
        <View style={styles.headerRight}>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {notifications.filter(n => !n.is_read).length}
              </Text>
            </View>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('profile.notifications')}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A90E2']}
              tintColor="#4A90E2"
            />
          }
        />
      )}

      {/* Notification Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}>
          <TouchableOpacity style={styles.bottomSheet} activeOpacity={1}>
            <View style={styles.dragIndicator} />
            <ScrollView
              style={styles.bottomSheetContent}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {selectedNotification?.type}
              </Text>
              <Text style={styles.modalMessage}>
                {selectedNotification?.text}
              </Text>
              {selectedNotification?.appeal && (
                <TouchableOpacity
                  style={styles.appealButton}
                  onPress={handleAppealPress}>
                  <Text style={styles.appealButtonText}>
                    {t('appeals.see')}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
      backgroundColor: colors.background,
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 18,
      color: colors.text,
      fontWeight: '600',
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    unreadBadge: {
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadBadgeText: {
      color: colors.surface,
      fontSize: 12,
      fontWeight: '600',
    },
    listContainer: {
      padding: 16,
      paddingTop: 8,
    },
    notificationCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    unreadCard: {
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    rejectedCard: {
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    typeIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      lineHeight: 22,
    },
    unreadTitle: {
      color: colors.text,
      fontWeight: '700',
    },
    appealNumber: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '500',
      backgroundColor: colors.accent + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    notificationMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    notificationFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    notificationDate: {
      fontSize: 12,
      color: colors.textTertiary,
      fontWeight: '400',
    },
    notificationTime: {
      fontSize: 12,
      color: colors.textTertiary,
      fontWeight: '400',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    loginButton: {
      backgroundColor: colors.success,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 10,
    },
    loginButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    refreshButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    refreshButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    bottomSheet: {
      backgroundColor: colors.modal,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '60%',
      minHeight: '30%',
    },
    dragIndicator: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    bottomSheetContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      lineHeight: 24,
    },
    modalMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 20,
    },
    appealButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      marginTop: 10,
    },
    appealButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default NotificationsScreen;
