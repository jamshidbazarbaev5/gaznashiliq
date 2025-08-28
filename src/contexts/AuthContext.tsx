import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {StorageService} from '../utils';
import authService from '../api/auth';
import apiManager from '../api/apiManager';

interface User {
  id: string;
  phone: string;
  email: string;
  full_name: string;
  region: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (
    accessToken: string,
    refreshToken: string,
    user?: User,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [storedAccessToken, storedRefreshToken, storedUser] =
        await Promise.all([
          StorageService.getAccessToken(),
          StorageService.getRefreshToken(),
          StorageService.getUserData(),
        ]);

      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);

        // If user data is missing, try to fetch it
        if (!storedUser) {
          try {
            const userProfile = await authService.getUserProfile(
              storedAccessToken,
            );
            await StorageService.setUserData(userProfile);
            setUser(userProfile);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // Continue with authentication even if profile fetch fails
          }
        } else {
          setUser(storedUser);
        }

        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(
    async (
      newAccessToken: string,
      newRefreshToken: string,
      userData?: User,
    ) => {
      try {
        // Validate tokens before storing
        if (!newAccessToken || !newRefreshToken) {
          throw new Error('Access token and refresh token are required');
        }

        // Store tokens
        await StorageService.setTokens(newAccessToken, newRefreshToken);

        // Store user data if provided
        if (userData) {
          await StorageService.setUserData(userData);
          setUser(userData);
        }

        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error during login:', error);
        // Reset authentication state on error
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        setIsAuthenticated(false);
        throw error;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      // Clear all stored data
      await StorageService.clearAll();

      // Reset state
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  // Initialize API manager with logout handler after logout function is defined
  useEffect(() => {
    apiManager.setTokenExpirationHandler(logout);
  }, [logout]);

  const updateUser = useCallback(async (updatedUser: User) => {
    try {
      // Store updated user data
      await StorageService.setUserData(updatedUser);

      // Update state
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      isAuthenticated,
      user,
      accessToken,
      refreshToken,
      login,
      logout,
      updateUser,
      loading,
    }),
    [
      isAuthenticated,
      user,
      accessToken,
      refreshToken,
      login,
      logout,
      updateUser,
      loading,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
