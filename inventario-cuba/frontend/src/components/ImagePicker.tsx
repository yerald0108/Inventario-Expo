/**
 * Componente para seleccionar o tomar foto de un producto.
 * Soporta cámara y galería.
 * Comprime automáticamente la imagen para no ocupar mucho espacio.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

interface ImagePickerProps {
  imageUri:    string | null;
  onImageSelected: (uri: string | null) => void;
  size?:       number;
}

export function ProductImagePicker({
  imageUri,
  onImageSelected,
  size = 120,
}: ImagePickerProps) {
  const theme      = useTheme<AppTheme>();
  const [loading, setLoading] = useState(false);

  /**
   * Comprime y redimensiona la imagen para ahorrar espacio.
   * Máximo 800x800px y calidad 70%.
   */
  const processImage = async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800, height: 800 } }],
      {
        compress: 0.7,
        format:   ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  };

  const handleCamera = async () => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a la cámara para tomar fotos de productos.'
      );
      return;
    }

    setLoading(true);
    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes:          ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing:       true,
        aspect:              [1, 1],
        quality:             0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const processed = await processImage(result.assets[0].uri);
        onImageSelected(processed);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    } finally {
      setLoading(false);
    }
  };

  const handleGallery = async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a la galería para seleccionar fotos.'
      );
      return;
    }

    setLoading(true);
    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes:    ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect:        [1, 1],
        quality:       0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const processed = await processImage(result.assets[0].uri);
        onImageSelected(processed);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    Alert.alert(
      'Foto del producto',
      'Selecciona cómo agregar la imagen',
      [
        { text: 'Cancelar',   style: 'cancel' },
        { text: 'Cámara',     onPress: handleCamera },
        { text: 'Galería',    onPress: handleGallery },
        ...(imageUri ? [{
          text:    'Eliminar foto',
          style:   'destructive' as const,
          onPress: () => onImageSelected(null),
        }] : []),
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.imageContainer,
          {
            width:           size,
            height:          size,
            borderRadius:    Spacing.radiusLg,
            backgroundColor: theme.colors.surfaceVariant,
            borderColor:     theme.colors.outlineVariant,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
          />
        ) : imageUri ? (
          <>
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                { width: size, height: size, borderRadius: Spacing.radiusLg },
              ]}
              resizeMode="cover"
            />
            {/* Overlay de edición */}
            <View style={[
              styles.editOverlay,
              { borderRadius: Spacing.radiusLg },
            ]}>
              <MaterialCommunityIcons
                name="camera-plus-outline"
                size={24}
                color="#FFFFFF"
              />
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons
              name="camera-plus-outline"
              size={32}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{
                color:     theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: Spacing.xs,
              }}
            >
              Agregar foto
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  image: {
    position: 'absolute',
  },
  editOverlay: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  placeholder: {
    alignItems: 'center',
    padding:    Spacing.sm,
  },
});