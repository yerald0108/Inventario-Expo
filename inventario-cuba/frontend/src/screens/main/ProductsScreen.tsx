/**
 * Pantalla principal de gestión de productos.
 * Lista con búsqueda, filtros por categoría y acciones rápidas.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput as RNTextInput,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  FAB,
  Chip,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useProductStore } from '../../store/productStore';
import { ProductCard }         from '../../components/ProductCard';
import { EmptyState }          from '../../components/EmptyState';
import { ProductListSkeleton } from '../../components/LoadingSkeleton';
import type { AppTheme }       from '../../theme/paperTheme';
import { Spacing }             from '../../theme/spacing';
import type { ProductsStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<ProductsStackParamList>;

// Debounce hook para búsqueda
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ProductsScreen() {
  const theme      = useTheme<AppTheme>();
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const {
    isLoading,
    categories,
    selectedCategory,
    searchQuery,
    loadProducts,
    loadCategories,
    deleteProduct,
    setSearchQuery,
    setCategory,
    getFilteredProducts,
  } = useProductStore();

  const [localSearch, setLocalSearch]   = useState(searchQuery);
  const [refreshing, setRefreshing]     = useState(false);
  const [snackbar, setSnackbar]         = useState('');
  const searchRef                       = useRef<RNTextInput>(null);

  const debouncedSearch = useDebounce(localSearch, 300);

  // Sincronizar búsqueda con debounce al store
  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch]);

  // Cargar datos al montar
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    await loadCategories();
    setRefreshing(false);
  }, []);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text:    'Eliminar',
          style:   'destructive',
          onPress: async () => {
            await deleteProduct(id);
            setSnackbar(`"${name}" eliminado`);
          },
        },
      ]
    );
  };

  const filteredProducts = getFilteredProducts();

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.background },
    ]}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          paddingTop:      insets.top + Spacing.sm,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}>
        <Text
          variant="headlineSmall"
          style={[styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          Productos
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {filteredProducts.length} productos
        </Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={[
        styles.searchBar,
        {
          backgroundColor: theme.colors.surface,
          borderColor:     theme.colors.outlineVariant,
        },
      ]}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
        <RNTextInput
          ref={searchRef}
          value={localSearch}
          onChangeText={setLocalSearch}
          placeholder="Buscar por nombre o código..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[styles.searchInput, { color: theme.colors.onSurface }]}
          returnKeyType="search"
        />
        {localSearch.length > 0 && (
          <TouchableOpacity onPress={() => setLocalSearch('')}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros por categoría */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            data={['Todos', ...categories]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => {
              const isAll      = item === 'Todos';
              const isSelected = isAll
                ? selectedCategory === null
                : selectedCategory === item;

              return (
                <Chip
                  selected={isSelected}
                  onPress={() => setCategory(isAll ? null : item)}
                  style={[
                    styles.chip,
                    isSelected && { backgroundColor: theme.colors.primaryContainer },
                  ]}
                  textStyle={{
                    color: isSelected
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant,
                    fontWeight: isSelected ? '700' : '400',
                  }}
                >
                  {isAll ? 'Todos' : item.charAt(0).toUpperCase() + item.slice(1)}
                </Chip>
              );
            }}
          />
        </View>
      )}

      {/* Lista de productos */}
      {isLoading && filteredProducts.length === 0 ? (
        <ProductListSkeleton />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list,
            filteredProducts.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={localSearch ? 'magnify-close' : 'package-variant-closed'}
              title={localSearch ? 'Sin resultados' : 'Sin productos'}
              description={
                localSearch
                  ? `No se encontraron productos para "${localSearch}"`
                  : 'Agrega tu primer producto para comenzar a gestionar tu inventario'
              }
              actionLabel={localSearch ? undefined : 'Agregar producto'}
              onAction={localSearch ? undefined : () => navigation.navigate('ProductForm', {})}
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              onEdit={() => navigation.navigate('ProductForm', { productId: item.id })}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB para agregar */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: insets.bottom + Spacing.base + 60,
          },
        ]}
        color="#FFFFFF"
        onPress={() => navigation.navigate('ProductForm', {})}
      />

      {/* Snackbar de feedback */}
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={2500}
      >
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom:     Spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: { fontWeight: '700' },
  searchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    margin:            Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderRadius:      Spacing.radiusLg,
    borderWidth:       1,
    gap:               Spacing.sm,
  },
  searchInput: {
    flex:     1,
    fontSize: 15,
    padding:  0,
  },
  categoriesContainer: {
    marginBottom: Spacing.xs,
  },
  categoriesList: {
    paddingHorizontal: Spacing.base,
    gap:               Spacing.sm,
  },
  chip: {
    borderRadius: Spacing.radiusFull,
  },
  list: {
    padding: Spacing.base,
  },
  listEmpty: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right:    Spacing.base,
  },
});