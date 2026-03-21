/**
 * Pantalla de perfil del usuario.
 * Permite editar nombre, businessName y cambiar contraseña.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, useTheme, Divider, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuthStore }  from '../../store/authStore';
import { authApi }       from '../../services/api';
import { AppButton }     from '../../components/AppButton';
import { AppInput }      from '../../components/AppInput';
import { AppCard }       from '../../components/AppCard';
import type { AppTheme } from '../../theme/paperTheme';
import { Spacing }       from '../../theme/spacing';
import type { SettingsStackParamList } from '../../types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Profile'>;

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name:         z.string().min(2, 'Mínimo 2 caracteres'),
  businessName: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword:     z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path:    ['confirmPassword'],
});

type ProfileForm  = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfileScreen({ navigation }: Props) {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const { user, logout } = useAuthStore();

  const [isSavingProfile,  setIsSavingProfile]  = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [snackbar, setSnackbar]                 = useState<string | null>(null);
  const [snackbarError, setSnackbarError]       = useState(false);

  // ─── Formulario de perfil ────────────────────────────────────────────
  const profileForm = useForm<ProfileForm>({
    resolver:      zodResolver(profileSchema),
    defaultValues: {
      name:         user?.name         ?? '',
      businessName: user?.businessName ?? '',
    },
  });

  // ─── Formulario de contraseña ────────────────────────────────────────
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword:     '',
      confirmPassword: '',
    },
  });

  // ─── Guardar perfil ──────────────────────────────────────────────────
  const handleSaveProfile = async (data: ProfileForm) => {
    setIsSavingProfile(true);
    try {
      const response = await authApi.updateProfile({
        name:         data.name,
        businessName: data.businessName || undefined,
      });

      // Actualizar datos guardados en SecureStore
      const updatedUser = { ...user, ...response.data };
      await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));

      setSnackbarError(false);
      setSnackbar('Perfil actualizado correctamente');
    } catch (err) {
      setSnackbarError(true);
      setSnackbar(
        err instanceof Error ? err.message : 'Error al actualizar el perfil'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── Cambiar contraseña ───────────────────────────────────────────────
  const handleChangePassword = async (data: PasswordForm) => {
    Alert.alert(
      'Confirmar cambio',
      'Al cambiar la contraseña se cerrarán todas las demás sesiones activas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text:    'Confirmar',
          onPress: async () => {
            setIsSavingPassword(true);
            try {
              await authApi.changePassword({
                currentPassword: data.currentPassword,
                newPassword:     data.newPassword,
              });

              passwordForm.reset();
              setSnackbarError(false);
              setSnackbar('Contraseña actualizada. Otras sesiones cerradas.');
            } catch (err) {
              setSnackbarError(true);
              setSnackbar(
                err instanceof Error ? err.message : 'Error al cambiar la contraseña'
              );
            } finally {
              setIsSavingPassword(false);
            }
          },
        },
      ]
    );
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
          Mi perfil
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
        {/* Avatar y rol */}
        <View style={styles.avatarSection}>
          <View style={[
            styles.avatar,
            { backgroundColor: theme.colors.primaryContainer },
          ]}>
            <MaterialCommunityIcons
              name="account"
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <View style={[
            styles.roleBadge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}>
            <MaterialCommunityIcons
              name={user?.role === 'owner' ? 'crown' : 'account-tie'}
              size={14}
              color={theme.colors.primary}
            />
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.primary, fontWeight: '700' }}
            >
              {user?.role === 'owner' ? 'Propietario' : 'Cajero'}
            </Text>
          </View>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {user?.email}
          </Text>
        </View>

        {/* ─── Datos del perfil ─────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            INFORMACIÓN PERSONAL
          </Text>

          <Controller
            control={profileForm.control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Nombre completo"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={profileForm.formState.errors.name?.message}
                icon="account-outline"
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={profileForm.control}
            name="businessName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Nombre del negocio"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                icon="store-outline"
                returnKeyType="done"
                onSubmitEditing={profileForm.handleSubmit(handleSaveProfile)}
              />
            )}
          />

          {/* Email — solo lectura */}
          <AppInput
            label="Correo electrónico"
            value={user?.email ?? ''}
            onChangeText={() => {}}
            icon="email-outline"
            editable={false}
          />

          <AppButton
            label="Guardar cambios"
            onPress={profileForm.handleSubmit(handleSaveProfile)}
            loading={isSavingProfile}
            icon="content-save-outline"
            size="medium"
          />
        </AppCard>

        {/* ─── Cambiar contraseña ───────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            CAMBIAR CONTRASEÑA
          </Text>

          <Controller
            control={passwordForm.control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Contraseña actual"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={passwordForm.formState.errors.currentPassword?.message}
                icon="lock-outline"
                secureText
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={passwordForm.control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Nueva contraseña"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={passwordForm.formState.errors.newPassword?.message}
                icon="lock-plus-outline"
                secureText
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={passwordForm.control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Confirmar nueva contraseña"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={passwordForm.formState.errors.confirmPassword?.message}
                icon="lock-check-outline"
                secureText
                returnKeyType="done"
                onSubmitEditing={passwordForm.handleSubmit(handleChangePassword)}
              />
            )}
          />

          <AppButton
            label="Cambiar contraseña"
            onPress={passwordForm.handleSubmit(handleChangePassword)}
            loading={isSavingPassword}
            icon="lock-reset"
            size="medium"
            variant="outlined"
          />
        </AppCard>

        {/* ─── Sesiones activas ─────────────────────────────────── */}
        <AppCard style={{ backgroundColor: theme.colors.surfaceVariant }}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, flex: 1, lineHeight: 18 }}
            >
              Al cambiar la contraseña se cierran automáticamente todas las
              sesiones en otros dispositivos por seguridad.
            </Text>
          </View>
        </AppCard>
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={3000}
        style={{
          backgroundColor: snackbarError
            ? theme.colors.errorContainer
            : theme.custom.success.bg,
        }}
      >
        <Text style={{
          color: snackbarError
            ? theme.colors.onErrorContainer
            : theme.custom.success.dark,
        }}>
          {snackbar}
        </Text>
      </Snackbar>
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
  headerTitle:   { fontWeight: '700' },
  content: {
    padding: Spacing.base,
    gap:     Spacing.base,
  },
  avatarSection: {
    alignItems: 'center',
    gap:        Spacing.sm,
    paddingVertical: Spacing.base,
  },
  avatar: {
    width:          96,
    height:         96,
    borderRadius:   48,
    alignItems:     'center',
    justifyContent: 'center',
  },
  roleBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.xs,
    borderRadius:      Spacing.radiusFull,
  },
  section:      { gap: Spacing.sm },
  sectionTitle: {
    fontWeight:    '700',
    letterSpacing: 0.5,
    marginBottom:  Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.sm,
  },
});