/**
 * Error Boundary para capturar errores inesperados en la app.
 * Muestra una pantalla amigable con opción de reiniciar.
 */

import React, { Component, ErrorInfo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError:    boolean;
  error:       Error | null;
  errorInfo:   ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError:  false,
      error:     null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={64}
              color={Colors.error.main}
            />
          </View>

          <Text style={styles.title}>
            Algo salió mal
          </Text>

          <Text style={styles.description}>
            La aplicación encontró un error inesperado. Tus datos están seguros.
          </Text>

          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>
                {this.state.error.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.buttonText}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.neutral[50],
    padding:         Spacing['2xl'],
    gap:             Spacing.base,
  },
  iconContainer: {
    width:          120,
    height:         120,
    borderRadius:   60,
    backgroundColor: Colors.error.bg,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.base,
  },
  title: {
    fontSize:   24,
    fontWeight: '700',
    color:      Colors.neutral[900],
    textAlign:  'center',
  },
  description: {
    fontSize:  16,
    color:     Colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: Colors.error.bg,
    padding:         Spacing.base,
    borderRadius:    Spacing.radiusLg,
    width:           '100%',
  },
  errorText: {
    fontSize: 12,
    color:    Colors.error.main,
    fontFamily: 'monospace',
  },
  button: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.primary[700],
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.base,
    borderRadius:      Spacing.radiusLg,
    gap:               Spacing.sm,
    marginTop:         Spacing.base,
  },
  buttonText: {
    color:      '#FFFFFF',
    fontSize:   16,
    fontWeight: '700',
  },
});