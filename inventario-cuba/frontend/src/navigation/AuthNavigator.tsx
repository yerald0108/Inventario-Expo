/**
 * Navegador de autenticación.
 * Contiene Login y Register con animación de slide.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

import { LoginScreen }    from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import type { AppTheme }  from '../theme/paperTheme';
import type { AuthStackParamList } from '../types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const theme = useTheme<AppTheme>();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown:     false,
        animation:       'slide_from_right',
        contentStyle:    { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}