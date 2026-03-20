import React, { useEffect, useState, useCallback } from 'react';
import { View, StatusBar, useColorScheme, LogBox } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { AppLightTheme, AppDarkTheme }         from './src/theme/paperTheme';
import { initializeDatabase }                  from './src/lib/database';
import { RootNavigator }                       from './src/navigation/RootNavigator';
import { ErrorBoundary }                       from './src/components/ErrorBoundary';
import { Colors }                              from './src/theme/colors';
import {
  configureNotifications,
  requestNotificationPermissions,
} from './src/services/notificationService';

// Suprimir warnings conocidos de librerías externas
LogBox.ignoreLogs([
  'TextInput.Icon: Support for defaultProps',
  'Warning: TextInput.Icon',
  'Non-serializable values were found in the navigation state',
]);

SplashScreen.preventAutoHideAsync();

export default function App() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady]   = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const theme = colorScheme === 'dark' ? AppDarkTheme : AppLightTheme;

  useEffect(() => {
    async function prepareApp() {
      try {
        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        });

        await initializeDatabase();

        // Configurar sistema de notificaciones
        configureNotifications();

        // Solicitar permisos de notificaciones (no bloquea si el usuario deniega)
        await requestNotificationPermissions();

        setAppReady(true);
      } catch (error) {
        console.error('[App] Error al inicializar:', error);
        setInitError(
          error instanceof Error ? error.message : 'Error al iniciar'
        );
        setAppReady(true);
      }
    }
    prepareApp();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) await SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) return null;

  if (initError) {
    return (
      <View
        style={{
          flex:            1,
          justifyContent:  'center',
          alignItems:      'center',
          backgroundColor: Colors.error.bg,
          padding:         24,
        }}
        onLayout={onLayoutRootView}
      >
        <Text style={{ fontSize: 16, color: Colors.error.dark, textAlign: 'center' }}>
          Error al iniciar: {initError}
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <StatusBar
              barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
              backgroundColor={
                colorScheme === 'dark' ? Colors.neutral[950] : Colors.neutral[50]
              }
            />
            <RootNavigator />
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}