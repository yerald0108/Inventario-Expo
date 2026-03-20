/**
 * Pantalla de gestión de cajeros.
 * El dueño puede ver, agregar y desactivar cajeros.
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Text, useTheme, FAB, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStaffStore }  from '../../store/staffStore';
import { useAuthStore }   from '../../store/authStore';
import { AppCard }        from '../../components/AppCard';
import { EmptyState }     from '../../components/EmptyState';
import type { AppTheme }  from '../../theme/paperTheme';
import { Spacing }        from '../../theme/spacing';
import type { SettingsStackParamList, StaffMember } from '../../types';

type NavProp = NativeStackNavigationProp<SettingsStackParamList>;

function StaffCard({ member }: { member: StaffMember }) {
  const theme = useTheme<AppTheme>();

  return (
    <AppCard style={styles.staffCard} elevation={1}>
      <View style={styles.cardContent}>
        {/* Avatar */}
        <View style={[
          styles.avatar,
          {
            backgroundColor: member.role === 'owner'
              ? theme.colors.primaryContainer
              : theme.colors.surfaceVariant,
          },
        ]}>
          <MaterialCommunityIcons
            name={member.role === 'owner' ? 'crown' : 'account'}
            size={24}
            color={member.role === 'owner'
              ? theme.colors.primary
              : theme.colors.onSurfaceVariant
            }
          />
        </View>

        {/* Info */}
        <View style={styles.staffInfo}>
          <View style={styles.nameRow}>
            <Text
              variant="titleSmall"
              style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              numberOfLines={1}
            >
              {member.name}
            </Text>
            {/* Badge de rol */}
            <View style={[
              styles.roleBadge,
              {
                backgroundColor: member.role === 'owner'
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
              },
            ]}>
              <Text
                variant="labelSmall"
                style={{
                  color: member.role === 'owner'
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant,
                  fontWeight: '700',
                }}
              >
                {member.role === 'owner' ? 'Propietario' : 'Cajero'}
              </Text>
            </View>
          </View>

          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
            numberOfLines={1}
          >
            {member.email}
          </Text>

          <Text
            variant="bodySmall"
            style={{
              color: member.isActive
                ? theme.custom.success.main
                : theme.colors.error,
            }}
          >
            {member.isActive ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

export function StaffListScreen() {
  const theme      = useTheme<AppTheme>();
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const { staff, isLoading, loadStaff } = useStaffStore();
  const { user }                         = useAuthStore();

  useEffect(() => {
    loadStaff();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          Empleados
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {staff.length} {staff.length === 1 ? 'persona' : 'personas'}
        </Text>
      </View>

      <FlatList
        data={staff}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          staff.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="account-group-outline"
              title="Sin empleados"
              description="Agrega cajeros para que puedan registrar ventas en tu negocio"
              actionLabel="Agregar cajero"
              onAction={() => navigation.navigate('StaffForm', {})}
            />
          ) : null
        }
        renderItem={({ item }) => <StaffCard member={item} />}
      />

      {/* Solo el dueño puede agregar cajeros */}
      {user?.role === 'owner' && (
        <FAB
          icon="plus"
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
              bottom:          insets.bottom + Spacing.base + 60,
            },
          ]}
          color="#FFFFFF"
          onPress={() => navigation.navigate('StaffForm', {})}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingBottom:     Spacing.base,
    borderBottomWidth: 1,
    gap:               Spacing.sm,
  },
  headerTitle: { flex: 1, fontWeight: '700' },
  list: {
    padding: Spacing.base,
    gap:     Spacing.sm,
  },
  listEmpty: { flex: 1 },
  staffCard:  { marginBottom: Spacing.sm },
  cardContent: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.base,
  },
  avatar: {
    width:          52,
    height:         52,
    borderRadius:   26,
    alignItems:     'center',
    justifyContent: 'center',
  },
  staffInfo: { flex: 1, gap: 2 },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    flexWrap:      'wrap',
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
    borderRadius:      Spacing.radiusFull,
  },
  fab: {
    position: 'absolute',
    right:    Spacing.base,
  },
});