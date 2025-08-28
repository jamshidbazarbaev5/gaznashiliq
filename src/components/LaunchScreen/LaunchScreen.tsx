import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import OnboardingSlide from './OnboardingSlide';
import {useTheme} from '../../contexts';
import {IconName} from '../Icon';

const {width: screenWidth} = Dimensions.get('window');

interface LaunchScreenProps {
  onComplete: () => void;
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

// DotIndicator component moved outside to avoid React warning
const DotIndicator = ({
  index,
  scrollX,
  colors,
}: {
  index: number;
  scrollX: SharedValue<number>;
  colors: any;
}) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const scale = interpolate(scrollX.value, inputRange, [1, 1.5, 1]);
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3]);

    return {
      transform: [{scale: withSpring(scale)}],
      opacity: withTiming(opacity, {duration: 300}),
    };
  });

  const dotStyle = {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginHorizontal: 5,
  };

  return <Animated.View style={[dotStyle, animatedDotStyle]} />;
};

const LaunchScreen: React.FC<LaunchScreenProps> = ({onComplete}) => {
  const {colors, theme} = useTheme();
  const styles = createStyles(colors);

  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: event => {
      const index = Math.round(event.contentOffset.x / screenWidth);
      setCurrentIndex(index);
    },
  });

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
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const isLastSlide = currentIndex === onboardingData.length - 1;
    return {
      backgroundColor: withTiming(
        isLastSlide ? colors.accent : colors.surface,
        {duration: 300},
      ),
    };
  });

  const buttonTextAnimatedStyle = useAnimatedStyle(() => {
    const isLastSlide = currentIndex === onboardingData.length - 1;
    return {
      color: withTiming(isLastSlide ? colors.background : colors.accent, {
        duration: 300,
      }),
    };
  });

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor="transparent"
        translucent
      />

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Ўтказиб юбориш</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}>
        {onboardingData.map((item, index) => (
          <OnboardingSlide
            key={item.id}
            iconName={item.iconName}
            title={item.title}
            description={item.description}
            scrollX={scrollX}
            index={index}
          />
        ))}
      </Animated.ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => {
            return (
              <DotIndicator
                key={index}
                index={index}
                scrollX={scrollX}
                colors={colors}
              />
            );
          })}
        </View>

        {/* Next/Get Started Button */}
        <TouchableOpacity onPress={handleNext} style={styles.buttonContainer}>
          <Animated.View style={[styles.button, buttonAnimatedStyle]}>
            <Animated.Text style={[styles.buttonText, buttonTextAnimatedStyle]}>
              {currentIndex === onboardingData.length - 1
                ? 'Бошлаш'
                : 'Кейинги'}
            </Animated.Text>
          </Animated.View>
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
    scrollView: {
      flex: 1,
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
      backgroundColor: colors.accent,
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

export default LaunchScreen;
