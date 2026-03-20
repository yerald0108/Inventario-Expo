/**
 * Input de texto reutilizable.
 * Integrado con React Hook Form.
 * Soporta validación visual, iconos y mostrar/ocultar contraseña.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, HelperText, useTheme } from 'react-native-paper';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

interface AppInputProps {
  label:         string;
  value:         string;
  onChangeText:  (text: string) => void;
  onBlur?:       () => void;
  error?:        string;
  placeholder?:  string;
  secureText?:   boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?:         string;
  iconRight?:    string;
  onIconRightPress?: () => void;
  multiline?:    boolean;
  numberOfLines?: number;
  disabled?:     boolean;
  autoFocus?:    boolean;
  returnKeyType?: 'done' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  editable?:     boolean;
}

export function AppInput({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  placeholder,
  secureText    = false,
  keyboardType  = 'default',
  autoCapitalize = 'sentences',
  icon,
  iconRight,
  onIconRightPress,
  multiline     = false,
  numberOfLines = 1,
  disabled      = false,
  autoFocus     = false,
  returnKeyType,
  onSubmitEditing,
  editable      = true,
}: AppInputProps) {
  const theme = useTheme<AppTheme>();
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureText;

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        secureTextEntry={isPassword && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        left={icon ? <TextInput.Icon icon={icon} /> : undefined}
        right={
          isPassword ? (
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          ) : iconRight ? (
            <TextInput.Icon
              icon={iconRight}
              onPress={onIconRightPress}
            />
          ) : undefined
        }
        multiline={multiline}
        numberOfLines={numberOfLines}
        disabled={disabled}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        editable={editable}
        mode="outlined"
        error={!!error}
        style={[
          styles.input,
          multiline && { height: numberOfLines * 48 },
        ]}
        outlineStyle={{ borderRadius: Spacing.radiusLg }}
        contentStyle={styles.content}
      />
      {error ? (
        <HelperText type="error" visible={!!error} style={styles.helperText}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: 'transparent',
  },
  content: {
    paddingVertical: Spacing.sm,
  },
  helperText: {
    marginTop: -Spacing.xs,
    marginLeft: Spacing.xs,
  },
});