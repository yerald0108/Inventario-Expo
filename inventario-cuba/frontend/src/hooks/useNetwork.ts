/**
 * Hook para detectar el estado de la conexión a internet.
 * Usa expo-network para verificar conectividad real.
 * Se actualiza automáticamente cuando cambia el estado de red.
 */

import { useState, useEffect, useRef } from 'react';
import * as Network from 'expo-network';

interface NetworkState {
  isConnected:    boolean;
  isInternetReachable: boolean;
  networkType:    string;
  isChecking:     boolean;
}

export function useNetwork() {
  const [state, setState] = useState<NetworkState>({
    isConnected:         true,
    isInternetReachable: true,
    networkType:         'unknown',
    isChecking:          true,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkNetwork = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setState({
        isConnected:         networkState.isConnected ?? false,
        isInternetReachable: networkState.isInternetReachable ?? false,
        networkType:         networkState.type ?? 'unknown',
        isChecking:          false,
      });
    } catch {
      setState(prev => ({ ...prev, isChecking: false }));
    }
  };

  useEffect(() => {
    // Verificar inmediatamente al montar
    checkNetwork();

    // Verificar cada 10 segundos
    intervalRef.current = setInterval(checkNetwork, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    // true si hay conexión real a internet
    isOnline: state.isConnected && state.isInternetReachable,
    checkNetwork,
  };
}