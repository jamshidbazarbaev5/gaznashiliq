// Export all available icons from the public folder
export const icons = {
  SMS_1: require('./SMS_1.png'),
  Show: require('./Show.png'),
  Tick_Circle: require('./Tick_Circle.png'),
  profile: require('./profile.png'),
  home: require('./home.png'),
  message: require('./message.png'),
  cubic: require('./cubic.png'),
  location: require('./location.png'),
  message_2: require('./message-2.png'),
  frame: require('./frame.png'),
  phone: require('./calling.png'),
  edit: require('./edit.png'),
  logout: require('./logout.png'),
  iphone: require('./iphone.png'),
  google: require('./google.png'),
} as const;

// Type for available icon names
export type IconName = keyof typeof icons;

// Helper function to get icon source
export const getIconSource = (name: IconName) => {
  return icons[name];
};

// Export individual icons for direct import
export const SMS_1_Icon = icons.SMS_1;
export const Show_Icon = icons.Show;
export const Tick_Circle_Icon = icons.Tick_Circle;
export const profile_Icon = icons.profile;
export const home_Icon = icons.home;
export const message_Icon = icons.message;
export const cubic_Icon = icons.cubic;
export const location_Icon = icons.location;
export const message_2_Icon = icons.message_2;
export const frame_Icon = icons.frame;
export const phone_Icon = icons.phone;
export const edit_Icon = icons.edit;
