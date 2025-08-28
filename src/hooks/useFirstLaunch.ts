import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = '@first_launch_completed';

// In-memory fallback for when AsyncStorage fails
let inMemoryFirstLaunchCompleted = false;

export const useFirstLaunch = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      // First check in-memory flag
      if (inMemoryFirstLaunchCompleted) {
        console.log('useFirstLaunch: In-memory flag shows launch completed');
        setIsFirstLaunch(false);
        setLoading(false);
        return;
      }

      const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      const shouldShowLaunchScreen = hasLaunched === null;
      console.log('useFirstLaunch: AsyncStorage check result:', {
        hasLaunched,
        shouldShowLaunchScreen,
      });
      setIsFirstLaunch(shouldShowLaunchScreen);
    } catch (error) {
      console.warn('AsyncStorage error, using in-memory fallback:', error);
      // Use in-memory fallback - show launch screen if not completed in memory
      const shouldShow = !inMemoryFirstLaunchCompleted;
      console.log('useFirstLaunch: Using fallback, shouldShow:', shouldShow);
      setIsFirstLaunch(shouldShow);
    } finally {
      setLoading(false);
    }
  };

  const markFirstLaunchComplete = async () => {
    console.log('useFirstLaunch: Marking first launch as complete...');
    // Always update in-memory flag first
    inMemoryFirstLaunchCompleted = true;
    setIsFirstLaunch(false);
    console.log('useFirstLaunch: State updated - isFirstLaunch set to false');

    // Try to persist to AsyncStorage, but don't block user if it fails
    try {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
      console.log('useFirstLaunch: Successfully persisted to AsyncStorage');
    } catch (error) {
      console.warn('AsyncStorage failed, using in-memory persistence:', error);
      // We've already set the in-memory flag, so the user can continue
    }
  };

  return {
    isFirstLaunch,
    loading,
    markFirstLaunchComplete,
  };
};
