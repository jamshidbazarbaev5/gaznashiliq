import React from 'react';
import {Image, ImageStyle, StyleProp} from 'react-native';
import {icons, IconName} from '../public';

// Re-export IconName for convenience
export type {IconName};

interface IconProps {
  name: IconName;
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  tintColor?: string;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  width,
  height,
  style,
  tintColor,
}) => {
  const iconStyle: ImageStyle = {
    width: width || size,
    height: height || size,
    ...(tintColor && {tintColor}),
  };

  return (
    <Image
      source={icons[name]}
      style={[iconStyle, style]}
      resizeMode="contain"
    />
  );
};

export default Icon;
