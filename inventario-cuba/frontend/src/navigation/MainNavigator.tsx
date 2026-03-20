import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardScreen }     from '../screens/main/DashboardScreen';
import { ProductsScreen }      from '../screens/main/ProductsScreen';
import { ProductFormScreen }   from '../screens/main/ProductFormScreen';
import { ProductDetailScreen } from '../screens/main/ProductDetailScreen';
import { POSScreen }           from '../screens/main/POSScreen';
import { SalesScreen }         from '../screens/main/SalesScreen';
import { SaleDetailScreen }    from '../screens/main/SaleDetailScreen';
import { SettingsScreen }      from '../screens/main/SettingsScreen';
import { SyncScreen }          from '../screens/main/SyncScreen';
import { ReportsScreen } from '../screens/main/ReportsScreen';
import { VoidSaleScreen } from '../screens/main/VoidSaleScreen';
import { CashClosingScreen }        from '../screens/main/CashClosingScreen';
import { CashClosingHistoryScreen }  from '../screens/main/CashClosingHistoryScreen';
import { StaffListScreen } from '../screens/main/StaffListScreen';
import { StaffFormScreen } from '../screens/main/StaffFormScreen';
import { InventoryAdjustmentScreen } from '../screens/main/InventoryAdjustmentScreen';
import { AdjustmentHistoryScreen }   from '../screens/main/AdjustmentHistoryScreen';
import type { AppTheme }       from '../theme/paperTheme';
import type {
  MainTabParamList,
  ProductsStackParamList,
  SalesStackParamList,
  SettingsStackParamList,
} from '../types';
import { Spacing } from '../theme/spacing';
import { BackupScreen } from '@/screens/main/BackupScreen';
import { BusinessConfigScreen } from '@/screens/main/BusinessConfigScreen';

const Tab           = createBottomTabNavigator<MainTabParamList>();
const ProdStack     = createNativeStackNavigator<ProductsStackParamList>();
const SalesStackNav = createNativeStackNavigator<SalesStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function ProductsStackNav() {
  const theme = useTheme<AppTheme>();
  return (
    <ProdStack.Navigator screenOptions={{
      headerShown:  false,
      animation:    'slide_from_right',
      contentStyle: { backgroundColor: theme.colors.background },
    }}>
      <ProdStack.Screen name="ProductList"   component={ProductsScreen} />
      <ProdStack.Screen name="ProductForm"   component={ProductFormScreen} />
      <ProdStack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </ProdStack.Navigator>
  );
}

function SalesStackNavigator() {
  const theme = useTheme<AppTheme>();
  return (
    <SalesStackNav.Navigator screenOptions={{
      headerShown:  false,
      animation:    'slide_from_right',
      contentStyle: { backgroundColor: theme.colors.background },
    }}>
      <SalesStackNav.Screen name="SaleList"   component={SalesScreen} />
      <SalesStackNav.Screen name="SaleDetail" component={SaleDetailScreen} />
      <SalesStackNav.Screen name="VoidSale"   component={VoidSaleScreen} />
    </SalesStackNav.Navigator>
  );
}

function SettingsStackNavigator() {
  const theme = useTheme<AppTheme>();
  return (
    <SettingsStack.Navigator screenOptions={{
      headerShown:  false,
      animation:    'slide_from_right',
      contentStyle: { backgroundColor: theme.colors.background },
    }}>
      <SettingsStack.Screen name="SettingsHome"       component={SettingsScreen} />
      <SettingsStack.Screen name="Sync"               component={SyncScreen} />
      <SettingsStack.Screen name="CashClosing"        component={CashClosingScreen} />
      <SettingsStack.Screen name="CashClosingHistory" component={CashClosingHistoryScreen} />
      <SettingsStack.Screen name="StaffList"          component={StaffListScreen} />
      <SettingsStack.Screen name="StaffForm"          component={StaffFormScreen} />
      <SettingsStack.Screen name="Reports"            component={ReportsScreen} />
      <SettingsStack.Screen name="InventoryAdjustment" component={InventoryAdjustmentScreen} />
      <SettingsStack.Screen name="AdjustmentHistory"  component={AdjustmentHistoryScreen} />
      <SettingsStack.Screen name="Backup"             component={BackupScreen} />
      <SettingsStack.Screen name="BusinessConfig" component={BusinessConfigScreen} />
    </SettingsStack.Navigator>
  );
}

const TABS = [
  { name: 'Dashboard' as const, label: 'Inicio',    icon: 'home-outline',           iconActive: 'home' },
  { name: 'Products'  as const, label: 'Productos', icon: 'package-variant-closed', iconActive: 'package-variant' },
  { name: 'POS'       as const, label: 'Vender',    icon: 'cart-outline',           iconActive: 'cart' },
  { name: 'Sales'     as const, label: 'Ventas',    icon: 'clipboard-list-outline', iconActive: 'clipboard-list' },
  { name: 'Settings'  as const, label: 'Ajustes',   icon: 'cog-outline',            iconActive: 'cog' },
];

export function MainNavigator() {
  const theme  = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tabConfig = TABS.find(t => t.name === route.name)!;
        return {
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor:  theme.colors.outlineVariant,
              paddingBottom:   insets.bottom > 0 ? insets.bottom : Spacing.sm,
              height:          60 + (insets.bottom > 0 ? insets.bottom : Spacing.sm),
            },
          ],
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={(focused ? tabConfig.iconActive : tabConfig.icon) as any}
              size={24}
              color={color}
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text
              variant="labelSmall"
              style={{ color, fontWeight: focused ? '700' : '400' }}
            >
              {tabConfig.label}
            </Text>
          ),
          tabBarActiveTintColor:   theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Products"  component={ProductsStackNav} />
      <Tab.Screen name="POS"       component={POSScreen} />
      <Tab.Screen name="Sales"     component={SalesStackNavigator} />
      <Tab.Screen name="Settings"  component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    elevation:      8,
    shadowOpacity:  0.1,
    shadowRadius:   4,
    shadowOffset:   { width: 0, height: -2 },
  },
});