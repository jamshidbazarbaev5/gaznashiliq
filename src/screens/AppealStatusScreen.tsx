import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {Icon, ResponseModal} from '../components';
import {appealsService} from '../api';
import {mapApiAppealToScreenAppeal, ScreenAppeal} from '../utils/appealMappers';
import {useToast} from '../contexts/ToastContext';
import {useTheme, useLanguage, useAuth} from '../contexts';

const AppealStatusScreen = ({navigation, route}: any) => {
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appealData, setAppealData] = useState<ScreenAppeal | null>(null);
  const [responseText, setResponseText] = useState('');
  const [authError, setAuthError] = useState(false);
  const {showToast} = useToast();
  const {colors, theme} = useTheme();
  const {t} = useLanguage();
  const {isAuthenticated} = useAuth();

  const styles = createStyles(colors, theme);

  // Get appeal ID from navigation params
  const appealId = route?.params?.appealId;

  // Load appeal details from API
  const loadAppealDetails = useCallback(async () => {
    if (!appealId) {
      showToast(t('appeals.id_not_found'), 'error');
      navigation.goBack();
      return;
    }

    // Don't make API calls if user is not authenticated or we've already detected auth error
    if (!isAuthenticated || authError) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const apiAppeal = await appealsService.getAppealDetail(
        parseInt(appealId, 10),
      );
      const screenAppeal = mapApiAppealToScreenAppeal(apiAppeal);
      setAppealData(screenAppeal);

      // Set response text if available
      if (screenAppeal.response && screenAppeal.response.text) {
        setResponseText(screenAppeal.response.text);
      } else {
        setResponseText(t('common.no_response_yet'));
      }
    } catch (error) {
      console.error('Error loading appeal details:', error);

      // Check if it's an auth error to prevent repeated error messages
      if (
        error instanceof Error &&
        error.message.includes('Authentication token not found')
      ) {
        setAuthError(true);
        // Don't show toast for auth errors as user will be logged out automatically
        return;
      }

      showToast(t('appeals.load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [appealId, navigation, showToast, t, isAuthenticated, authError]);

  // Reset auth error when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      setAuthError(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadAppealDetails();
  }, [loadAppealDetails]);

  const handleViewResponse = () => {
    console.log('handleViewResponse called');
    console.log('Setting modal visible to true');
    // alert('Button clicked! Modal should open now.');
    setResponseModalVisible(true);
  };

  const handleBackToMain = () => {
    navigation.navigate('Main');
  };

  const handleFileOpen = async (file: any, index: number) => {
    try {
      console.log('Debug - Opening file in browser:', file);

      // Construct full file URL using the API base URL
      const baseURL = 'https://eappeal.uz';
      const fileUrl = file.file?.startsWith('http')
        ? file.file
        : `${baseURL}${file.file}`;

      console.log('Debug - Constructed file URL for browser:', fileUrl);

      // Validate that we have a proper URL
      if (
        !fileUrl ||
        (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://'))
      ) {
        console.error('Invalid file URL:', fileUrl);
        showToast(t('common.file_open_error'), 'error');
        return;
      }

      try {
        const canOpen = await Linking.canOpenURL(fileUrl);
        if (canOpen) {
          await Linking.openURL(fileUrl);
          showToast(t('common.file_opened_browser'), 'success');
        } else {
          console.error('Cannot open URL:', fileUrl);
          showToast(t('common.file_open_error'), 'error');
        }
      } catch (browserError) {
        console.error('Failed to open in browser:', browserError);
        showToast(t('common.file_open_error'), 'error');
      }
    } catch (error) {
      console.error('Error opening file in browser:', error);
      showToast(t('common.file_open_error'), 'error');
    }
  };

  const renderStatusItem = (
    iconName: string,
    text: string,
    isActive: boolean,
    isCompleted: boolean,
    isLast: boolean = false,
    stepNumber: number,
  ) => {
    // Define status colors
    const statusColors = {
      completed: '#34C759', // Success green
      active: '#007AFF', // iOS blue
      inactive: '#8E8E93', // Gray
      rejected: '#34C759', // Success green
    };

    let statusStyle = styles.statusItemInactive;
    let iconStyle = styles.statusIconInactive;
    let textStyle = styles.statusTextInactive;
    let connectingLineStyle = styles.connectingLineInactive;
    let stepNumberStyle = styles.stepNumberInactive;
    let stepContainerStyle = styles.stepContainerInactive;
    let currentColor = statusColors.inactive;

    if (isCompleted) {
      if (appealData?.status === 'rejected') {
        currentColor = statusColors.rejected;
        statusStyle = styles.statusItemRejected;
        iconStyle = styles.statusIconRejected;
        textStyle = styles.statusTextRejected;
        connectingLineStyle = styles.connectingLineRejected;
        stepNumberStyle = styles.stepNumberRejected;
        stepContainerStyle = styles.stepContainerRejected;
      } else if (appealData?.status === 'completed') {
        currentColor = statusColors.completed;
        statusStyle = styles.statusItemAccepted;
        iconStyle = styles.statusIconAccepted;
        textStyle = styles.statusTextAccepted;
        connectingLineStyle = styles.connectingLineAccepted;
        stepNumberStyle = styles.stepNumberAccepted;
        stepContainerStyle = styles.stepContainerAccepted;
      } else {
        currentColor = statusColors.completed;
        statusStyle = styles.statusItemCompleted;
        iconStyle = styles.statusIconCompleted;
        textStyle = styles.statusTextCompleted;
        connectingLineStyle = styles.connectingLineCompleted;
        stepNumberStyle = styles.stepNumberCompleted;
        stepContainerStyle = styles.stepContainerCompleted;
      }
    } else if (isActive) {
      currentColor = statusColors.active;
      statusStyle = styles.statusItemActive;
      iconStyle = styles.statusIconActive;
      textStyle = styles.statusTextActive;
      connectingLineStyle = styles.connectingLineActive;
      stepNumberStyle = styles.stepNumberActive;
      stepContainerStyle = styles.stepContainerActive;
    }

    return (
      <View style={styles.statusItemContainer}>
        <View style={[styles.statusItem, statusStyle]}>
          <View style={styles.statusIconContainer}>
            <View style={[styles.stepContainer, stepContainerStyle]}>
              <Text style={[styles.stepNumber, stepNumberStyle]}>
                {stepNumber}
              </Text>
            </View>
            <View style={[styles.statusIcon, iconStyle]}>
              <Icon name={iconName} size={24} />
            </View>
            {!isLast && (
              <View style={[styles.connectingLine, connectingLineStyle]} />
            )}
          </View>
          <View style={styles.statusContent}>
            <Text style={[styles.statusText, textStyle]}>{text}</Text>
            <Text style={styles.statusDescription}>
              {isCompleted
                ? appealData?.status === 'rejected'
                  ? t('appeals.step_rejected')
                  : appealData?.status === 'completed'
                  ? t('appeals.step_completed')
                  : t('appeals.step_done')
                : isActive
                ? t('appeals.step_in_progress')
                : t('appeals.step_pending')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Show loading indicator while fetching data
  if (loading || !appealData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('appeals.title')}
            {'\n'}
            {t('auth.region')}
          </Text>
          <View style={styles.headerRight} />
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('appeals.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{t('appeals.sended')}</Text>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>{t('appeals.number')}</Text>
          <Text style={styles.detailValue}>
            {String(appealData.appealNumber || '')}
          </Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>{t('appeals.category')}</Text>
          <Text style={styles.detailValue}>
            {String(appealData.category || '')}
          </Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>{t('appeals.description')}</Text>
          <Text style={styles.detailValue}>
            {String(appealData.text || '')}
          </Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>{t('common.files')}</Text>
          {(() => {
            console.log('Debug - appealData:', appealData);
            console.log(
              'Debug - appealData.appealFiles:',
              appealData.appealFiles,
            );
            console.log(
              'Debug - appealFiles length:',
              (appealData.appealFiles || []).length,
            );
            return null;
          })()}
          {(appealData.appealFiles || []).length === 0 ? (
            <Text style={styles.noFilesText}>{t('common.no_files')}</Text>
          ) : (
            (appealData.appealFiles || []).map((file: any, index: number) => {
              // Extract filename from file path if name is not available
              const fileName =
                file.name ||
                file.file?.split('/').pop() ||
                t('common.unknown_file');

              // Determine file type from extension
              const getFileType = (name: string) => {
                const ext = name.split('.').pop()?.toLowerCase();
                if (
                  ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(
                    ext || '',
                  )
                ) {
                  return 'image';
                }
                return 'document';
              };

              const fileType = getFileType(fileName);

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.fileItem}
                  onPress={() => handleFileOpen(file, index)}>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {fileName}
                    </Text>
                    <Text style={styles.fileSize}>
                      {t('modal.click_to_download')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Response files section - only show if appeal has been responded
        {(appealData.status === 'completed' ||
          appealData.status === 'rejected') && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>{t('common.files')}</Text>
            {!appealData.response ||
            !appealData.response.files ||
            appealData.response.files.length === 0 ? (
              <Text style={styles.noFilesText}>{t('common.see')}</Text>
            ) : (
              appealData.response.files.map((file: any, index: number) => {
                // Extract filename from file path
                const fileName =
                  file.file?.split('/').pop() || t('common.unknown_file');

                // Determine file type from extension
                const getFileType = (name: string) => {
                  const ext = name.split('.').pop()?.toLowerCase();
                  if (
                    ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(
                      ext || '',
                    )
                  ) {
                    return 'image';
                  }
                  return 'document';
                };

                const fileType = getFileType(fileName);

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.fileItem}
                    onPress={() => handleFileOpen(file, index)}>
                    <View style={styles.fileIcon}>
                      <Icon
                        name={fileType === 'image' ? 'Show' : 'SMS_1'}
                        size={18}
                      />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {fileName}
                      </Text>
                      <Text style={styles.fileSize}>
                        {t('modal.click_to_download')}
                      </Text>
                    </View>
                    <View style={styles.downloadButton}>
                      <Text style={styles.downloadIconActive}>
                        🌐
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )} */}

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>{t('auth.region')}</Text>
          <Text style={styles.detailValue}>
            {String(appealData.region || '')}
          </Text>
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>{t('appeals.status')}</Text>

          {/* Progress indicator bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      appealData.status === 'under_review'
                        ? 66
                        : appealData.status === 'completed' ||
                          appealData.status === 'rejected'
                        ? 100
                        : 33
                    }%`,
                    backgroundColor:
                      appealData.status === 'rejected'
                        ? colors.success
                        : appealData.status === 'completed'
                        ? colors.success
                        : colors.accent,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {appealData.status === 'under_review'
                ? '2/3'
                : appealData.status === 'completed' ||
                  appealData.status === 'rejected'
                ? '3/3'
                : '1/3'}{' '}
              {t('appeals.steps_completed')}
            </Text>
          </View>

          {/* Step 1: Submit Appeal - Always completed */}
          {renderStatusItem(
            'message-square',
            t('appeals.submitAppeal'),
            false,
            true,
            false,
            1,
          )}

          {/* Step 2: Under Review */}
          {renderStatusItem(
            'search',
            t('appeals.under_review'),
            appealData.status === 'under_review',
            appealData.status === 'completed' ||
              appealData.status === 'rejected',
            false,
            2,
          )}

          {/* Step 3: Final Decision */}
          {appealData.status === 'rejected' &&
            renderStatusItem(
              'x-circle',
              t('appeals.appeal_rejected'),
              false,
              true,
              true,
              3,
            )}

          {appealData.status === 'completed' &&
            renderStatusItem(
              'check-circle',
              t('appeals.appeal_accepted'),
              false,
              true,
              true,
              3,
            )}

          {appealData.status === 'under_review' &&
            renderStatusItem(
              'clock',
              t('appeals.final_decision'),
              false,
              false,
              true,
              3,
            )}
        </View>

        <View style={styles.buttonContainer}>
          {(appealData.status === 'completed' ||
            appealData.status === 'rejected') && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                appealData.status === 'rejected'
                  ? styles.responseButtonRed
                  : styles.responseButtonGreen,
              ]}
              onPress={handleViewResponse}>
              <Text style={styles.actionButtonText}>{t('common.see_2')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backToMainButton}
            onPress={handleBackToMain}>
            <Text style={styles.backToMainButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ResponseModal
        visible={responseModalVisible}
        onClose={() => {
          console.log('Closing modal');
          setResponseModalVisible(false);
        }}
        appealNumber={String(appealData.appealNumber || '')}
        appealId={String(appealId || '')}
        responseId={appealData.response?.id}
        responseText={String(responseText || t('common.no_response'))}
        responseFiles={appealData.response?.files || []}
        answerer={appealData.response?.answerer}
        onFileDownload={handleFileOpen}
      />
      {/* {console.log('Modal visible state:', responseModalVisible)} */}
    </SafeAreaView>
  );
};

const createStyles = (colors: any, _theme: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      fontSize: 24,
      color: colors.text,
      fontWeight: '300',
    },
    headerTitle: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 18,
    },
    headerRight: {
      width: 32,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    pageTitle: {
      fontSize: 18,
      fontWeight: '500',
      fontFamily: 'Montserrat',
      color: colors.text,
      marginBottom: 24,
    },
    detailSection: {
      marginBottom: 20,
    },
    detailLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
      fontFamily: 'Montserrat',
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent + '20',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginTop: 8,
    },
    fileIcon: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    fileIconText: {
      fontSize: 16,
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      fontSize: 16,
      color: colors.accent,
      fontWeight: '500',
      marginBottom: 2,
    },
    fileSize: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '400',
    },
    downloadProgress: {
      fontSize: 14,
      color: colors.warning,
      fontWeight: '400',
    },
    downloadIcon: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    downloadIconActive: {
      color: '#4A90E2',
    },
    downloadIconDisabled: {
      color: '#999999',
    },
    downloadButton: {
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noFilesText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 20,
    },

    statusSection: {
      marginBottom: 32,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statusTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    progressBarContainer: {
      marginBottom: 32,
      alignItems: 'center',
    },
    progressBar: {
      width: '100%',
      height: 6,
      backgroundColor: '#E9ECEF',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      borderRadius: 8,
      transition: 'width 0.3s ease-in-out',
    },
    progressText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    statusItemContainer: {
      marginBottom: 24,
      position: 'relative',
    },
    statusItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    statusIconContainer: {
      alignItems: 'center',
      marginRight: 16,
      position: 'relative',
    },
    stepContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: -10,
      left: 20,
      zIndex: 2,
      borderWidth: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    stepNumber: {
      fontSize: 12,
      fontWeight: '700',
    },
    statusContent: {
      flex: 1,
      paddingTop: 8,
    },
    statusDescription: {
      fontSize: 14,
      marginTop: 4,
      color: '#6C757D',
      letterSpacing: 0.2,
    },
    statusItemCompleted: {},
    statusItemActive: {},
    statusItemInactive: {},
    statusItemRejected: {},
    statusItemAccepted: {},
    statusIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    connectingLine: {
      width: 2,
      height: 36,
      marginTop: 4,
      alignSelf: 'center',
      marginLeft: 23,
    },
    connectingLineCompleted: {
      backgroundColor: '#34C759',
    },
    connectingLineActive: {
      backgroundColor: '#007AFF',
    },
    connectingLineInactive: {
      backgroundColor: '#E9ECEF',
    },
    connectingLineRejected: {
      backgroundColor: '#34C759',
    },
    connectingLineAccepted: {
      backgroundColor: '#34C759',
    },
    statusIconCompleted: {
      backgroundColor: '#E8F5E9',
      borderColor: '#34C759',
    },
    statusIconActive: {
      backgroundColor: '#E3F2FD',
      borderColor: '#007AFF',
    },
    statusIconInactive: {
      backgroundColor: '#F8F9FA',
      borderColor: '#DEE2E6',
    },
    statusIconRejected: {
      backgroundColor: '#E8F5E9',
      borderColor: '#34C759',
    },
    statusIconAccepted: {
      backgroundColor: '#E8F5E9',
      borderColor: '#34C759',
    },
    statusIconText: {
      fontSize: 20,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    statusTextCompleted: {
      color: '#34C759',
    },
    statusTextActive: {
      color: '#007AFF',
    },
    statusTextInactive: {
      color: '#8E8E93',
    },
    statusTextRejected: {
      color: '#34C759',
    },
    statusTextAccepted: {
      color: '#34C759',
    },
    // Step number styles
    stepContainerCompleted: {
      backgroundColor: '#34C759',
      borderColor: '#ffffff',
    },
    stepContainerActive: {
      backgroundColor: '#007AFF',
      borderColor: '#ffffff',
    },
    stepContainerInactive: {
      backgroundColor: '#F8F9FA',
      borderColor: '#DEE2E6',
    },
    stepContainerRejected: {
      backgroundColor: '#34C759',
      borderColor: '#ffffff',
    },
    stepContainerAccepted: {
      backgroundColor: '#34C759',
      borderColor: '#ffffff',
    },
    stepNumberCompleted: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '600',
    },
    stepNumberActive: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '600',
    },
    stepNumberInactive: {
      color: '#8E8E93',
      fontSize: 13,
      fontWeight: '600',
    },
    stepNumberRejected: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '600',
    },
    stepNumberAccepted: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '600',
    },
    buttonContainer: {
      paddingBottom: 20,
    },
    actionButton: {
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    responseButtonRed: {
      backgroundColor: colors.success,
    },
    responseButtonGreen: {
      backgroundColor: colors.success,
    },
    actionButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    backToMainButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    backToMainButtonText: {
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
  });

export default AppealStatusScreen;
