/**
 * Pantalla de inicio de sesión.
 * Validación en tiempo real con React Hook Form + Zod.
 * Feedback visual de errores y estado de carga.
 */

import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { Text, useTheme, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuthStore } from '../../store/authStore';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import type { AppTheme } from '../../theme/paperTheme';
import { Spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../types';

// Schema de validación
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const theme   = useTheme<AppTheme>();
  const insets  = useSafeAreaInsets();
  const { login, isLoading, error, clearError } = useAuthStore();

  const passwordRef = useRef<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
    } catch {
      // Error ya manejado en el store
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + Spacing['2xl'], paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo e ícono */}
        <View style={styles.header}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.primaryContainer },
          ]}>
            <MaterialCommunityIcons
              name="store"
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            Inventario Cuba
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Inicia sesión para continuar
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Correo electrónico"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="email-outline"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Contraseña"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureText={true}
                icon="lock-outline"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />

          <View style={styles.buttonContainer}>
            <AppButton
              label="Iniciar sesión"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              icon="login"
              size="large"
            />
          </View>
        </View>

        {/* Link a registro */}
        <View style={styles.footer}>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            ¿No tienes cuenta?{' '}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.link, { color: theme.colors.primary }]}
            onPress={() => navigation.navigate('Register')}
          >
            Regístrate aquí
          </Text>
        </View>
      </ScrollView>

      {/* Snackbar de error */}
      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={4000}
        action={{ label: 'Cerrar', onPress: clearError }}
        style={{ backgroundColor: theme.colors.errorContainer }}
      >
        <Text style={{ color: theme.colors.onErrorContainer }}>
          {error}
        </Text>
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow:       1,
    paddingHorizontal: Spacing.base,
  },
  header: {
    alignItems:   'center',
    marginBottom: Spacing['3xl'],
  },
  iconContainer: {
    width:          96,
    height:         96,
    borderRadius:   Spacing.radius2xl,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.base,
  },
  title: {
    fontWeight:   '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    gap: Spacing.xs,
  },
  buttonContainer: {
    marginTop: Spacing.base,
  },
  footer: {
    flexDirection:  'row',
    justifyContent: 'center',
    marginTop:      Spacing.xl,
  },
  link: {
    fontWeight: '600',
  },
});