/**
 * Pantalla de recuperación de contraseña.
 * Flujo: email → código de 6 dígitos → nueva contraseña
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { authApi }       from '../../services/api';
import { AppButton }     from '../../components/AppButton';
import { AppInput }      from '../../components/AppInput';
import { AppCard }       from '../../components/AppCard';
import type { AppTheme } from '../../theme/paperTheme';
import { Spacing }       from '../../theme/spacing';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

type Step = 'email' | 'code' | 'success';

const emailSchema = z.object({
  email: z.string().min(1, 'Ingresa tu email').email('Email inválido'),
});

const resetSchema = z.object({
  code:            z.string().length(6, 'El código tiene 6 dígitos'),
  newPassword:     z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma la contraseña'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path:    ['confirmPassword'],
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const [step, setStep]         = useState<Step>('email');
  const [email, setEmail]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  // En desarrollo el backend devuelve el código en la respuesta
  const [devCode, setDevCode]   = useState<string | null>(null);

  const emailForm = useForm<EmailForm>({
    resolver:      zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetForm>({
    resolver:      zodResolver(resetSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  // ─── Paso 1: Solicitar código ────────────────────────────────────────
  const handleRequestCode = async (data: EmailForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.forgotPassword(data.email);
      setEmail(data.email);
      // En desarrollo el backend devuelve el código
      if (response.data?.code) setDevCode(response.data.code);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Paso 2: Verificar código y nueva contraseña ────────────────────
  const handleResetPassword = async (data: ResetForm) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({
        email,
        code:        data.code,
        newPassword: data.newPassword,
      });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto o expirado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor:   theme.colors.surface,
          paddingTop:        insets.top + Spacing.sm,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={theme.colors.onSurface}
          onPress={() => navigation.goBack()}
        />
        <Text
          variant="titleLarge"
          style={[styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          Recuperar contraseña
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Paso 1: Email ──────────────────────────────────────── */}
        {step === 'email' && (
          <>
            <View style={styles.iconSection}>
              <View style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.primaryContainer },
              ]}>
                <MaterialCommunityIcons
                  name="lock-question"
                  size={48}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                variant="titleLarge"
                style={{ color: theme.colors.onSurface, fontWeight: '700', textAlign: 'center' }}
              >
                ¿Olvidaste tu contraseña?
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
              >
                Ingresa tu email y te enviaremos un código de recuperación de 6 dígitos.
              </Text>
            </View>

            <AppCard style={styles.section}>
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Correo electrónico"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={emailForm.formState.errors.email?.message}
                    icon="email-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={emailForm.handleSubmit(handleRequestCode)}
                  />
                )}
              />

              {error && (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.error, textAlign: 'center' }}
                >
                  {error}
                </Text>
              )}

              <AppButton
                label="Enviar código"
                onPress={emailForm.handleSubmit(handleRequestCode)}
                loading={isLoading}
                icon="send-outline"
                size="large"
              />
            </AppCard>
          </>
        )}

        {/* ─── Paso 2: Código + nueva contraseña ──────────────────── */}
        {step === 'code' && (
          <>
            <View style={styles.iconSection}>
              <View style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.primaryContainer },
              ]}>
                <MaterialCommunityIcons
                  name="numeric"
                  size={48}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                variant="titleLarge"
                style={{ color: theme.colors.onSurface, fontWeight: '700', textAlign: 'center' }}
              >
                Ingresa el código
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
              >
                Se envió un código de 6 dígitos a {email}. Válido por 15 minutos.
              </Text>

              {/* Mostrar código en desarrollo */}
              {devCode && (
                <AppCard style={{ backgroundColor: theme.custom.warning.bg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <MaterialCommunityIcons
                      name="bug-outline"
                      size={18}
                      color={theme.custom.warning.main}
                    />
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.custom.warning.dark }}
                    >
                      Modo desarrollo — código: <Text style={{ fontWeight: '700' }}>{devCode}</Text>
                    </Text>
                  </View>
                </AppCard>
              )}
            </View>

            <AppCard style={styles.section}>
              <Controller
                control={resetForm.control}
                name="code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Código de 6 dígitos"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={resetForm.formState.errors.code?.message}
                    icon="numeric"
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                )}
              />

              <Controller
                control={resetForm.control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Nueva contraseña"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={resetForm.formState.errors.newPassword?.message}
                    icon="lock-plus-outline"
                    secureText
                    returnKeyType="next"
                  />
                )}
              />

              <Controller
                control={resetForm.control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Confirmar contraseña"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={resetForm.formState.errors.confirmPassword?.message}
                    icon="lock-check-outline"
                    secureText
                    returnKeyType="done"
                    onSubmitEditing={resetForm.handleSubmit(handleResetPassword)}
                  />
                )}
              />

              {error && (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.error, textAlign: 'center' }}
                >
                  {error}
                </Text>
              )}

              <AppButton
                label="Restablecer contraseña"
                onPress={resetForm.handleSubmit(handleResetPassword)}
                loading={isLoading}
                icon="lock-reset"
                size="large"
              />

              <AppButton
                label="Solicitar nuevo código"
                onPress={() => { setStep('email'); setError(null); }}
                variant="text"
                size="small"
              />
            </AppCard>
          </>
        )}

        {/* ─── Paso 3: Éxito ──────────────────────────────────────── */}
        {step === 'success' && (
          <View style={styles.successSection}>
            <View style={[
              styles.iconCircle,
              { backgroundColor: theme.custom.success.bg },
            ]}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={64}
                color={theme.custom.success.main}
              />
            </View>
            <Text
              variant="headlineSmall"
              style={{ color: theme.colors.onSurface, fontWeight: '700', textAlign: 'center' }}
            >
              ¡Contraseña restablecida!
            </Text>
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              Tu contraseña fue actualizada. Inicia sesión con tu nueva contraseña.
            </Text>
            <AppButton
              label="Ir al inicio de sesión"
              onPress={() => navigation.navigate('Login')}
              icon="login"
              size="large"
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom:     Spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: { fontWeight: '700' },
  content: {
    padding: Spacing.base,
    gap:     Spacing.base,
  },
  iconSection: {
    alignItems:      'center',
    gap:             Spacing.base,
    paddingVertical: Spacing.xl,
  },
  iconCircle: {
    width:          100,
    height:         100,
    borderRadius:   50,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.sm,
  },
  section:        { gap: Spacing.sm },
  successSection: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.base,
    paddingVertical: Spacing.xl,
  },
});