/**
 * Navegador raíz de la aplicación.
 * Decide entre mostrar Auth o Main según el estado de sesión.
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import type { AppTheme } from '../theme/paperTheme';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme                        = useTheme<AppTheme>();
  const { user, isInitialized, initialize } = useAuthStore();

  // Inicializar store (leer token guardado)
  useEffect(() => {
    initialize();
  }, []);

  // Mostrar spinner mientras verifica sesión
  if (!isInitialized) {
    return (
      <View style={{
        flex:            1,
        alignItems:      'center',
        justifyContent:  'center',
        backgroundColor: theme.colors.background,
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}