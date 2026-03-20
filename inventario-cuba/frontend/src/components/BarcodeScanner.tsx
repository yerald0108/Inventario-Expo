/**
 * Componente modal para escanear códigos de barras.
 * Se abre como modal a pantalla completa.
 * Soporta todos los formatos comunes: EAN-13, QR, CODE-128, etc.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

interface BarcodeScannerProps {
  visible:   boolean;
  onScanned: (barcode: string) => void;
  onClose:   () => void;
}

export function BarcodeScannerModal({
  visible,
  onScanned,
  onClose,
}: BarcodeScannerProps) {
  const theme = useTheme<AppTheme>();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned]             = useState(false);
  const scanLineAnim                      = useRef(new Animated.Value(0)).current;

  // Solicitar permisos de cámara al abrir
  useEffect(() => {
    if (visible) {
      requestPermissions();
      setScanned(false);
      startScanAnimation();
    }
  }, [visible]);

  const requestPermissions = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  // Animación de línea de escaneo
  const startScanAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue:         1,
          duration:        2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue:         0,
          duration:        2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const scanLineY = scanLineAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, SCAN_AREA_SIZE - 4],
  });

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Sin permisos */}
        {hasPermission === false && (
          <View style={styles.permissionContainer}>
            <MaterialCommunityIcons
              name="camera-off"
              size={64}
              color="#FFFFFF"
            />
            <Text
              variant="titleLarge"
              style={styles.permissionTitle}
            >
              Sin acceso a la cámara
            </Text>
            <Text
              variant="bodyMedium"
              style={styles.permissionText}
            >
              Necesitamos acceso a la cámara para escanear códigos de barras.
              Ve a Configuración y activa el permiso de cámara.
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text variant="labelLarge" style={{ color: '#FFFFFF' }}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Escáner activo */}
        {hasPermission === true && (
          <>
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
              barCodeTypes={[
                BarCodeScanner.Constants.BarCodeType.ean13,
                BarCodeScanner.Constants.BarCodeType.ean8,
                BarCodeScanner.Constants.BarCodeType.code128,
                BarCodeScanner.Constants.BarCodeType.code39,
                BarCodeScanner.Constants.BarCodeType.qr,
                BarCodeScanner.Constants.BarCodeType.upc_a,
                BarCodeScanner.Constants.BarCodeType.upc_e,
              ]}
            />

            {/* Overlay oscuro */}
            <View style={styles.overlay}>
              {/* Parte superior */}
              <View style={styles.overlayTop} />

              {/* Fila del medio */}
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />

                {/* Área de escaneo */}
                <View style={[
                  styles.scanArea,
                  { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE },
                ]}>
                  {/* Esquinas del marco */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  {/* Línea de escaneo animada */}
                  {!scanned && (
                    <Animated.View
                      style={[
                        styles.scanLine,
                        { transform: [{ translateY: scanLineY }] },
                      ]}
                    />
                  )}

                  {/* Éxito */}
                  {scanned && (
                    <View style={styles.scanSuccess}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={48}
                        color="#4CAF50"
                      />
                    </View>
                  )}
                </View>

                <View style={styles.overlaySide} />
              </View>

              {/* Parte inferior con instrucciones */}
              <View style={styles.overlayBottom}>
                <Text variant="bodyLarge" style={styles.instructionText}>
                  {scanned
                    ? '¡Código escaneado!'
                    : 'Apunta la cámara al código de barras'
                  }
                </Text>
                {scanned && (
                  <TouchableOpacity
                    style={styles.rescanButton}
                    onPress={() => setScanned(false)}
                  >
                    <MaterialCommunityIcons
                      name="refresh"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text variant="labelLarge" style={{ color: '#FFFFFF' }}>
                      Escanear otro
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}

        {/* Botón cerrar */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
        >
          <MaterialCommunityIcons
            name="close"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const OVERLAY_COLOR = 'rgba(0,0,0,0.6)';
const CORNER_SIZE   = 24;
const CORNER_WIDTH  = 3;
const CORNER_COLOR  = '#2196F3';

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#000000',
  },

  // Sin permisos
  permissionContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing['2xl'],
    gap:            Spacing.base,
  },
  permissionTitle: {
    color:      '#FFFFFF',
    fontWeight: '700',
    textAlign:  'center',
  },
  permissionText: {
    color:     '#CCCCCC',
    textAlign: 'center',
  },
  closeButton: {
    marginTop:         Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.base,
    borderRadius:      Spacing.radiusLg,
    borderWidth:       1,
    borderColor:       '#FFFFFF',
  },

  // Overlay
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex:            1,
    backgroundColor: OVERLAY_COLOR,
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex:            1,
    backgroundColor: OVERLAY_COLOR,
  },
  overlayBottom: {
    flex:            1,
    backgroundColor: OVERLAY_COLOR,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.base,
  },

  // Área de escaneo
  scanArea: {
    position: 'relative',
    overflow: 'hidden',
  },

  // Esquinas del marco
  corner: {
    position: 'absolute',
    width:    CORNER_SIZE,
    height:   CORNER_SIZE,
  },
  cornerTL: {
    top:         0,
    left:        0,
    borderTopWidth:  CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor:     CORNER_COLOR,
  },
  cornerTR: {
    top:          0,
    right:        0,
    borderTopWidth:   CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor:      CORNER_COLOR,
  },
  cornerBL: {
    bottom:       0,
    left:         0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth:   CORNER_WIDTH,
    borderColor:       CORNER_COLOR,
  },
  cornerBR: {
    bottom:       0,
    right:        0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth:  CORNER_WIDTH,
    borderColor:       CORNER_COLOR,
  },

  // Línea de escaneo
  scanLine: {
    position:        'absolute',
    left:            0,
    right:           0,
    height:          2,
    backgroundColor: CORNER_COLOR,
    opacity:         0.8,
  },

  // Éxito
  scanSuccess: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Textos
  instructionText: {
    color:      '#FFFFFF',
    textAlign:  'center',
    fontWeight: '500',
  },
  rescanButton: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.base,
    borderRadius:      Spacing.radiusLg,
    borderWidth:       1,
    borderColor:       '#FFFFFF',
  },

  // Botón cerrar
  closeBtn: {
    position:          'absolute',
    top:               50,
    right:             Spacing.base,
    width:             44,
    height:            44,
    borderRadius:      22,
    backgroundColor:   'rgba(0,0,0,0.5)',
    alignItems:        'center',
    justifyContent:    'center',
  },
});