import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useSafeArea = () => {
  const insets = useSafeAreaInsets();
  
  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    hasBottomBar: insets.bottom > 0,
    hasTopBar: insets.top > 0,
  };
};
