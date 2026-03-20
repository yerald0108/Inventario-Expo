import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { AppTheme } from '../theme/paperTheme';
import { Spacing } from '../theme/spacing';

interface BarData {
  label:  string;
  value:  number;
  color?: string;
}

interface SimpleBarChartProps {
  data:    BarData[];
  height?: number;
  title?:  string;
}

export function SimpleBarChart({ data, height = 160, title }: SimpleBarChartProps) {
  const theme  = useTheme<AppTheme>();
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.container}>
      {title && (
        <Text
          variant="titleSmall"
          style={[styles.title, { color: theme.colors.onSurfaceVariant }]}
        >
          {title}
        </Text>
      )}

      <View style={[styles.chartArea, { height }]}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxVal) * (height - 32);
          const isEmpty   = item.value === 0;

          return (
            <View key={index} style={styles.barWrapper}>
              {!isEmpty && (
                <Text
                  variant="labelSmall"
                  style={[styles.barValue, { color: theme.colors.primary }]}
                >
                  ${item.value.toFixed(0)}
                </Text>
              )}
              <View style={{ flex: 1 }} />
              <View
                style={[
                  styles.bar,
                  {
                    height:          Math.max(barHeight, isEmpty ? 4 : 8),
                    backgroundColor: isEmpty
                      ? theme.colors.surfaceVariant
                      : item.color ?? theme.colors.primary,
                    borderRadius: Spacing.radiusSm,
                  },
                ]}
              />
              <Text
                variant="labelSmall"
                style={[styles.barLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  title: {
    fontWeight:    '700',
    letterSpacing: 0.5,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           Spacing.xs,
  },
  barWrapper: {
    flex:           1,
    alignItems:     'center',
    height:         '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
  },
  barValue: {
    fontWeight: '700',
    fontSize:   9,
  },
  barLabel: {
    marginTop: Spacing.xs,
    fontSize:  10,
  },
});