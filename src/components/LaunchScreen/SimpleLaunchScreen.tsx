import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon, {IconName} from '../Icon';
import {useTheme} from '../../contexts';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface SimpleLaunchScreenProps {
  onComplete: () => void;
  debug?: boolean; // For testing - always show launch screen
}

const onboardingData: Array<{
  id: number;
  iconName: IconName;
  title: string;
  description: string;
}> = [
  {
    id: 1,
    iconName: 'home',
    title: 'Мурожаат юборинг',
    description: 'Хокимият органларига осон ва тез йўл билан мурожаат юборинг',
  },
  {
    id: 2,
    iconName: 'cubic',
    title: 'Мурожаатларингизни кузатинг',
    description:
      'Барча юборган мурожаатларингизни бир жойда кўринг ва холатини кузатинг',
  },
  {
    id: 3,
    iconName: 'message',
    title: 'Хабарномалар олинг',
    description: 'Мурожаатингиз холати ўзгарганда дарҳол хабар олинг',
  },
  {
    id: 4,
    iconName: 'profile',
    title: 'Профилингизни бошкаринг',
    description:
      'Шахсий маълумотларингизни янгиланг ва хавфсизлик созламаларини бошкаринг',
  },
];

const SimpleLaunchScreen: React.FC<SimpleLaunchScreenProps> = ({
  onComplete,
  debug = false,
}) => {
  const {colors, theme} = useTheme();
  const styles = createStyles(colors);

  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    // Add a small delay for better visual effect
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim]);

  const gradientColors =
    theme === 'dark'
      ? [colors.background, colors.surface, colors.background]
      : [colors.accent + '10', colors.background, colors.accent + '05'];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      console.log('Launch screen completed, calling onComplete...');
      onComplete();
    }
  };

  const handleSkip = () => {
    console.log('Launch screen skipped, calling onComplete...');
    onComplete();
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentIndex(index);
  };

  const renderSlide = (item: (typeof onboardingData)[0], _index: number) => (
    <View key={item.id} style={styles.slide}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Icon name={item.iconName} size={60} tintColor={colors.accent} />
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </View>
  );

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor="transparent"
        translucent
      />

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>
          {debug ? 'Debug: Skip' : 'Ўтказиб юбориш'}
        </Text>
      </TouchableOpacity>

      {/* Reset Button for Testing (only in debug mode) */}
      {debug && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            console.log('Resetting first launch flag for testing...');
            // This will reset the launch screen to show again next time
            AsyncStorage.removeItem('@first_launch_completed')
              .then(() => {
                console.log('First launch flag reset successfully');
              })
              .catch(err => {
                console.log('Error resetting flag:', err);
              });
          }}>
          <Text style={styles.skipText}>Reset Launch</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}>
        {onboardingData.map((item, index) => renderSlide(item, index))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? colors.accent
                      : colors.accent + '30',
                  transform: [{scale: index === currentIndex ? 1.2 : 1}],
                },
              ]}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <TouchableOpacity onPress={handleNext} style={styles.buttonContainer}>
          <View
            style={[
              styles.button,
              {
                backgroundColor:
                  currentIndex === onboardingData.length - 1
                    ? colors.accent
                    : colors.surface,
              },
            ]}>
            <Text
              style={[
                styles.buttonText,
                {
                  color:
                    currentIndex === onboardingData.length - 1
                      ? colors.background
                      : colors.accent,
                },
              ]}>
              {currentIndex === onboardingData.length - 1
                ? 'Бошлаш'
                : 'Кейинги'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    skipButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      zIndex: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    skipText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '500',
    },
    resetButton: {
      position: 'absolute',
      top: 100,
      right: 20,
      zIndex: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    scrollView: {
      flex: 1,
    },
    slide: {
      width: screenWidth,
      height: screenHeight,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    content: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    iconContainer: {
      marginBottom: 60,
    },
    iconBackground: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.accent + '15',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.accent,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 36,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    bottomSection: {
      paddingBottom: 50,
      paddingHorizontal: 30,
      alignItems: 'center',
    },
    pagination: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 40,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: 5,
    },
    buttonContainer: {
      width: '100%',
    },
    button: {
      paddingVertical: 18,
      borderRadius: 25,
      alignItems: 'center',
      shadowColor: colors.accent,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

export default SimpleLaunchScreen;
