/**
 * Pantalla de registro de nuevo usuario.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  businessName: z
    .string()
    .min(2, 'El nombre del negocio debe tener al menos 2 caracteres')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path:    ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const { register, isLoading, error, clearError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '', businessName: '', email: '', password: '', confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await register({
        name:         data.name,
        email:        data.email,
        password:     data.password,
        businessName: data.businessName || undefined,
      });
    } catch {
      // Error manejado en el store
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
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.primaryContainer },
          ]}>
            <MaterialCommunityIcons
              name="store-plus"
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <Text
            variant="headlineSmall"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            Crear cuenta
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
          >
            Configura tu negocio y comienza a gestionar tu inventario
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Tu nombre"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                icon="account-outline"
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Nombre del negocio (opcional)"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.businessName?.message}
                icon="store-outline"
                returnKeyType="next"
              />
            )}
          />

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
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Confirmar contraseña"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                secureText={true}
                icon="lock-check-outline"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />

          <View style={styles.buttonContainer}>
            <AppButton
              label="Crear cuenta"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              icon="account-plus"
              size="large"
            />
          </View>
        </View>

        {/* Link a login */}
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            ¿Ya tienes cuenta?{' '}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.link, { color: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            Inicia sesión
          </Text>
        </View>
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={4000}
        action={{ label: 'Cerrar', onPress: clearError }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: Spacing.base },
  header: {
    alignItems:   'center',
    marginBottom: Spacing['2xl'],
  },
  iconContainer: {
    width:          88,
    height:         88,
    borderRadius:   Spacing.radius2xl,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.base,
  },
  title: {
    fontWeight:   '700',
    marginBottom: Spacing.xs,
  },
  form:            { gap: Spacing.xs },
  buttonContainer: { marginTop: Spacing.base },
  footer: {
    flexDirection:  'row',
    justifyContent: 'center',
    marginTop:      Spacing.xl,
  },
  link: { fontWeight: '600' },
});