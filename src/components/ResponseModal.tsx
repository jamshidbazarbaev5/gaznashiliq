import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import {StorageService} from '../utils/storage';
import {useLanguage} from '../contexts';
import {ratingService} from '../api';
import Icon from './Icon';

const {height: screenHeight} = Dimensions.get('window');

interface ResponseModalProps {
  visible: boolean;
  onClose: () => void;
  appealNumber: string;
  appealId: string;
  responseId?: number;
  responseText: string;
  responseFiles?: Array<{
    id: number;
    file: string;
  }>;
  answerer?: {
    full_name: string;
    phone: string;
  };
  onFileDownload?: (file: any, index: number) => void;
}

const ResponseModal = ({
  visible,
  onClose,
  appealNumber,
  appealId,
  responseId,
  responseText,
  responseFiles = [],
  answerer,
  onFileDownload,
}: ResponseModalProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [ratingError, setRatingError] = useState<string>('');
  const {t} = useLanguage();

  // Load existing rating when modal opens
  useEffect(() => {
    const loadExistingRating = async () => {
      if (visible && responseId) {
        try {
          setRatingError('');
          // Try to get existing rating from API
          const existingRating = await ratingService.getRating(responseId);
          if (existingRating) {
            setRating(existingRating.rating);
            setHasRated(true);
          } else {
            // Fallback to local storage for backward compatibility
            const localRating = await StorageService.getAppealRating(appealId);
            if (localRating) {
              setRating(localRating);
              setHasRated(false); // Mark as not submitted to API yet
            } else {
              setRating(4); // Default rating
              setHasRated(false);
            }
          }
        } catch (error) {
          console.error('Error loading existing rating:', error);
          // Try local storage as fallback
          try {
            const localRating = await StorageService.getAppealRating(appealId);
            if (localRating) {
              setRating(localRating);
              setHasRated(false); // Mark as not submitted to API yet
            } else {
              setRating(4);
              setHasRated(false);
            }
          } catch (localError) {
            console.error('Error loading local rating:', localError);
            setRating(4);
            setHasRated(false);
          }
        }
      }
    };

    loadExistingRating();
  }, [visible, responseId, appealId]);

  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmitRating = async () => {
    if (!responseId) {
      setRatingError('Response ID not available. Cannot submit rating.');
      return;
    }

    try {
      setIsSubmittingRating(true);
      setRatingError('');

      if (hasRated) {
        // Update existing rating
        await ratingService.updateRating(responseId, rating);
        console.log('Rating updated successfully:', rating);
      } else {
        // Submit new rating
        await ratingService.submitRating(responseId, rating);
        console.log('Rating submitted successfully:', rating);
      }

      // Also save locally for offline access
      await StorageService.setAppealRating(appealId, rating);

      setHasRated(true);

      // Close modal after successful submission
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error submitting rating:', error);

      // Try to save locally as fallback
      try {
        await StorageService.setAppealRating(appealId, rating);
        setHasRated(true);
        setRatingError('Rating saved locally. Will sync when online.');
      } catch (localError) {
        console.error('Error saving rating locally:', localError);
        setRatingError('Failed to submit rating. Please try again.');
      }
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const getRatingText = (ratingValue: number): string => {
    if (ratingValue <= 2) {
      return t('rating.poor');
    } else if (ratingValue <= 3) {
      return t('rating.satisfactory');
    } else if (ratingValue <= 4) {
      return t('rating.good');
    } else {
      return t('rating.excellent');
    }
  };

  const getRatingColor = (ratingValue: number): string => {
    if (ratingValue <= 2) {
      return '#DC3545'; // Red
    } else if (ratingValue <= 3) {
      return '#FFC107'; // Yellow
    } else if (ratingValue <= 4) {
      return '#17A2B8'; // Blue
    } else {
      return '#28A745'; // Green
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= rating;
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleRatingPress(i)}
          style={styles.starButton}>
          <Text
            style={[
              styles.starIcon,
              isActive ? styles.activeStarIcon : styles.inactiveStarIcon,
            ]}>
            ★
          </Text>
        </TouchableOpacity>,
      );
    }
    return stars;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.modalContainer}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>
              {t('modal.response_title')} #{appealNumber}
            </Text>
          </View>

          <ScrollView style={styles.content}>
            {/* Answerer information */}
            {answerer && (
              <View style={styles.answererSection}>
                <Text style={styles.answererTitle}>{t('modal.answerer')}</Text>
                <Text style={styles.answererInfo}>
                  {t('modal.full_name')}: {answerer.full_name}
                </Text>
                <Text style={styles.answererInfo}>
                  {t('modal.phone')}: {answerer.phone}
                </Text>
              </View>
            )}

            <Text style={styles.responseText}>
              {String(responseText || t('common.no_response'))}
            </Text>

            {/* Response files section */}
            {responseFiles && responseFiles.length > 0 && (
              <View style={styles.filesSection}>
                <Text style={styles.filesSectionTitle}>
                  {t('modal.attached_files')}
                </Text>
                {responseFiles.map((file, index) => {
                  const fileName =
                    file.file?.split('/').pop() || t('common.unknown_file');

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
                      style={styles.responseFileItem}
                      onPress={() =>
                        onFileDownload && onFileDownload(file, index)
                      }>
                      <View style={styles.responseFileIcon}>
                        <Icon
                          name={fileType === 'image' ? 'Show' : 'SMS_1'}
                          size={16}
                        />
                      </View>
                      <View style={styles.responseFileInfo}>
                        <Text style={styles.responseFileName} numberOfLines={1}>
                          {fileName}
                        </Text>
                        <Text style={styles.responseFileSize}>
                          {t('modal.click_to_download')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.ratingSection}>
              <Text style={styles.ratingTitle}>{t('modal.rating_title')}</Text>
              <View style={styles.starsContainer}>{renderStars()}</View>
              <Text style={styles.userRatingText}>
                {t('modal.your_rating')}{' '}
                <Text
                  style={[styles.ratingValue, {color: getRatingColor(rating)}]}>
                  {getRatingText(rating)}
                </Text>
              </Text>
              {hasRated && !ratingError && (
                <Text style={styles.savedRatingText}>
                  {t('modal.rating_saved')}
                </Text>
              )}
              {ratingError && (
                <Text style={styles.errorText}>{ratingError}</Text>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.submitButton,
              hasRated && styles.ratedButton,
              isSubmittingRating && styles.disabledButton,
            ]}
            onPress={handleSubmitRating}
            disabled={isSubmittingRating}>
            <Text style={styles.submitButtonText}>
              {isSubmittingRating
                ? t('modal.submitting_rating')
                : hasRated
                ? t('modal.update_rating')
                : t('modal.rate')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    maxHeight: screenHeight * 0.5,
  },
  responseText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 30,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  starButton: {
    marginRight: 8,
  },
  starIcon: {
    fontSize: 32,
    padding: 4,
  },
  activeStarIcon: {
    color: '#FFD700', // Yellow color for active stars
  },
  inactiveStarIcon: {
    color: '#D3D3D3', // Light gray color for inactive stars
  },
  userRatingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingValue: {
    fontWeight: '600',
  },
  savedRatingText: {
    fontSize: 12,
    color: '#28A745',
    marginTop: 5,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#DC3545',
    marginTop: 5,
    fontStyle: 'italic',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  ratedButton: {
    backgroundColor: '#28A745',
  },
  answererSection: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  answererTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  answererInfo: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  filesSection: {
    marginBottom: 20,
  },
  filesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  responseFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  responseFileIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  responseFileInfo: {
    flex: 1,
  },
  responseFileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  responseFileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  responseDownloadButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseDownloadIcon: {
    fontSize: 16,
    color: '#3B82F6',
  },
});

export default ResponseModal;
