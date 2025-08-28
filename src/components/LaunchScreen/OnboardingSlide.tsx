import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import Icon, {IconName} from '../Icon';
import {useTheme} from '../../contexts';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface OnboardingSlideProps {
  iconName: IconName;
  title: string;
  description: string;
  scrollX: SharedValue<number>;
  index: number;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  iconName,
  title,
  description,
  scrollX,
  index,
}) => {
  const {colors} = useTheme();
  const styles = createStyles(colors);

  const animatedIconStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const scale = interpolate(scrollX.value, inputRange, [0.8, 1.2, 0.8]);
    const translateY = interpolate(scrollX.value, inputRange, [50, 0, 50]);
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3]);

    return {
      transform: [{scale}, {translateY}],
      opacity,
    };
  });

  const animatedTitleStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const translateY = interpolate(scrollX.value, inputRange, [30, 0, 30]);
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0]);

    return {
      transform: [{translateY}],
      opacity,
    };
  });

  const animatedDescriptionStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const translateY = interpolate(scrollX.value, inputRange, [40, 0, 40]);
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0]);

    return {
      transform: [{translateY}],
      opacity,
    };
  });

  return (
    <View style={styles.slide}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          <View style={styles.iconBackground}>
            <Icon name={iconName} size={60} tintColor={colors.accent} />
          </View>
        </Animated.View>

        <Animated.Text style={[styles.title, animatedTitleStyle]}>
          {title}
        </Animated.Text>

        <Animated.Text style={[styles.description, animatedDescriptionStyle]}>
          {description}
        </Animated.Text>
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
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
  });

export default OnboardingSlide;
