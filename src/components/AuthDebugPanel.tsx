import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useAuth, useTheme} from '../contexts';
import {authTestUtils, StorageService} from '../utils';
import appealsService from '../api/appeals';

interface AuthDebugPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

const AuthDebugPanel: React.FC<AuthDebugPanelProps> = ({
  visible = false,
  onClose,
}) => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const {isAuthenticated, user, accessToken, logout} = useAuth();
  const {colors} = useTheme();

  const styles = createStyles(colors);

  if (!visible) {
    return null;
  }

  const handleRunTests = async () => {
    setLoading(true);
    try {
      const results = await authTestUtils.runAllTests();
      setTestResults(results);
      authTestUtils.printResults();
    } catch (error) {
      console.error('Error running tests:', error);
      Alert.alert('Error', 'Failed to run authentication tests');
    } finally {
      setLoading(false);
    }
  };

  const handleClearTokens = async () => {
    Alert.alert(
      'Clear Tokens',
      'This will clear all authentication tokens and simulate token expiration. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearTokens();
              Alert.alert('Success', 'Tokens cleared successfully');
            } catch (error) {
              console.error('Error clearing tokens:', error);
              Alert.alert('Error', 'Failed to clear tokens');
            }
          },
        },
      ]
    );
  };

  const handleSimulateTokenExpiration = async () => {
    Alert.alert(
      'Simulate Token Expiration',
      'This will clear tokens and try to make API calls to test logout behavior. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Simulate',
          style: 'destructive',
          onPress: async () => {
            try {
              await authTestUtils.simulateTokenExpiration();
              Alert.alert(
                'Simulation Complete',
                'Check console for results. App should automatically logout.'
              );
            } catch (error) {
              console.error('Error simulating token expiration:', error);
              Alert.alert('Error', 'Failed to simulate token expiration');
            }
          },
        },
      ]
    );
  };

  const handleCheckAuthState = async () => {
    await authTestUtils.checkAuthState();
    Alert.alert('Auth State', 'Check console for authentication state details');
  };

  const handleTestApiCall = async () => {
    try {
      setLoading(true);
      console.log('🧪 Testing API call with current authentication state...');

      const response = await appealsService.getMyAppeals(5, 0);
      console.log('✅ API call successful:', response);
      Alert.alert('Success', `API call successful. Found ${response.results.length} appeals.`);
    } catch (error) {
      console.error('❌ API call failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('API Call Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = () => {
    Alert.alert(
      'Force Logout',
      'This will force logout the current user. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>Auth Debug Panel</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Auth State Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Authentication State</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Authenticated:</Text>
              <Text style={[styles.infoValue, {color: isAuthenticated ? colors.success : colors.error}]}>
                {isAuthenticated ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User:</Text>
              <Text style={styles.infoValue}>
                {user ? `${user.full_name} (${user.email})` : 'None'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Token:</Text>
              <Text style={styles.infoValue}>
                {accessToken ? 'Present' : 'Missing'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={handleCheckAuthState}
              disabled={loading}>
              <Text style={styles.buttonText}>Check Auth State</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleTestApiCall}
              disabled={loading}>
              <Text style={styles.buttonText}>Test API Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.warningButton]}
              onPress={handleClearTokens}
              disabled={loading}>
              <Text style={styles.buttonText}>Clear Tokens</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleSimulateTokenExpiration}
              disabled={loading}>
              <Text style={styles.buttonText}>Simulate Token Expiration</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleForceLogout}
              disabled={loading}>
              <Text style={styles.buttonText}>Force Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Test Suite */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Suite</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRunTests}
              disabled={loading}>
              <Text style={styles.buttonText}>
                {loading ? 'Running Tests...' : 'Run Auth Tests'}
              </Text>
            </TouchableOpacity>

            {testResults.length > 0 && (
              <View style={styles.testResults}>
                <Text style={styles.testResultsTitle}>Test Results:</Text>
                {testResults.map((result, index) => (
                  <View key={index} style={styles.testResult}>
                    <Text style={[
                      styles.testResultText,
                      {color: result.passed ? colors.success : colors.error}
                    ]}>
                      {result.passed ? '✅' : '❌'} {result.testName}
                    </Text>
                    {result.details && (
                      <Text style={styles.testResultDetails}>{result.details}</Text>
                    )}
                    {result.error && (
                      <Text style={styles.testResultError}>{result.error}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    panel: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      width: '90%',
      maxHeight: '80%',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      color: colors.surface,
      fontSize: 20,
      fontWeight: 'bold',
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
      textAlign: 'right',
      marginLeft: 8,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
      alignItems: 'center',
    },
    warningButton: {
      backgroundColor: colors.warning || '#FF9800',
    },
    dangerButton: {
      backgroundColor: colors.error,
    },
    buttonText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: '600',
    },
    testResults: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    testResultsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    testResult: {
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    testResultText: {
      fontSize: 13,
      fontWeight: '500',
    },
    testResultDetails: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      marginLeft: 20,
    },
    testResultError: {
      fontSize: 12,
      color: colors.error,
      marginTop: 2,
      marginLeft: 20,
    },
  });

export default AuthDebugPanel;
