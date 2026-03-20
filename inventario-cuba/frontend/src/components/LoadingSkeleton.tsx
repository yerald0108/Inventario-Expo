import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

interface SkeletonProps {
  width?:  number | `${number}%`;
  height?: number;
  radius?: number;
  style?:  ViewStyle;
}

export function Skeleton({
  width  = '100%' as `${number}%`,
  height = 16,
  radius = Spacing.radiusMd,
  style,
}: SkeletonProps) {
  const theme   = useTheme<AppTheme>();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue:         1,
          duration:        800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue:         0.3,
          duration:        800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius:    radius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ProductSkeleton() {
  const theme = useTheme<AppTheme>();

  return (
    <View style={[
      skeletonStyles.productCard,
      { backgroundColor: theme.colors.surface },
    ]}>
      <Skeleton width={48} height={48} radius={Spacing.radiusMd} />
      <View style={skeletonStyles.productInfo}>
        <Skeleton width={'70%' as `${number}%`} height={16} style={{ marginBottom: 8 }} />
        <Skeleton width={'40%' as `${number}%`} height={13} />
      </View>
      <Skeleton width={60} height={20} radius={Spacing.radiusSm} />
    </View>
  );
}

export function ProductListSkeleton() {
  return (
    <View style={skeletonStyles.list}>
      {Array.from({ length: 6 }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  list: {
    padding: Spacing.base,
    gap:     Spacing.sm,
  },
  productCard: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        Spacing.base,
    borderRadius:   Spacing.radiusLg,
    gap:            Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
});