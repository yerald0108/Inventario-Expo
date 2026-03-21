# 📱 Inventario Cuba — Sistema de Gestión para Negocios

> Aplicación móvil offline-first para gestionar tu negocio sin depender de internet

---

## ¿Qué es Inventario Cuba?

**Inventario Cuba** es una aplicación para teléfonos Android e iOS diseñada especialmente para pequeños negocios cubanos: cafeterías, bares, tiendas, paladaras y cualquier negocio por cuenta propia.

La app te permite **llevar el control completo de tu negocio desde tu celular**: saber qué tienes en stock, registrar ventas, ver cuánto dinero has ganado en el día, cerrar la caja al final de la jornada y mucho más.

Lo más importante: **funciona sin internet**. En Cuba, donde la conexión no siempre está disponible, esto marca la diferencia. Puedes trabajar todo el día sin señal y cuando tengas conexión, la app sincroniza todo automáticamente con el servidor.

---

## ¿Para quién es esta aplicación?

- **Dueños de cafeterías y bares** que necesitan controlar inventario de bebidas y alimentos
- **Propietarios de tiendas** que venden productos y necesitan saber cuándo se les acaba el stock
- **Paladares y restaurantes** que quieren llevar un registro de sus ventas diarias
- **Cualquier cuentapropista** que quiera tener el control de su negocio en la palma de su mano

No necesitas saber de computadoras ni tecnología. La interfaz es simple, visual y completamente en español.

---

## Funciones principales

### 🔐 Autenticación y sesiones

- **Inicio de sesión** con email y contraseña
- **Registro de cuenta** con nombre del negocio
- **Autenticación offline**: si el token JWT expira mientras no hay internet, la sesión se mantiene activa en modo offline. No se cierra la sesión automáticamente
- **Renovación silenciosa del token**: cuando se recupera internet, el token se renueva automáticamente sin interrumpir al usuario
- **Banner de sesión offline**: avisa visualmente cuando la sesión está en modo sin conexión
- **Gestión de sesiones múltiples**: cada login registra una sesión en la base de datos con información del dispositivo (user-agent) y dirección IP
- **Cierre de sesión en todos los dispositivos**: el dueño puede cerrar todas sus sesiones activas desde cualquier dispositivo
- **Invalidación remota de tokens**: si se detecta actividad sospechosa, los tokens se pueden invalidar desde el servidor sin necesidad de cambiar contraseña

---

### 🛒 Punto de Venta (POS)

La pantalla de cobro está diseñada para ser rápida y fácil:

- Cuadrícula de productos con foto, nombre y precio
- **Escaneo de código de barras** con la cámara del teléfono: apunta al código y el producto se agrega automáticamente al carrito
- Si el código no coincide con ningún producto, muestra un aviso claro
- **Búsqueda de productos** por nombre en tiempo real
- Carrito con total actualizado en tiempo real
- Selector de método de pago: **efectivo**, **tarjeta** o **transferencia**
- Campo de descuento opcional
- Campo de nota para observaciones de la venta
- Al confirmar la venta, el stock se descuenta automáticamente
- Pantalla de confirmación con el total cobrado
- Si no hay internet, la venta se guarda localmente y se sincroniza después

---

### 📦 Gestión de Productos

- **Agregar productos** con nombre, descripción, precio de venta, costo, stock disponible, stock mínimo, categoría, unidad de medida y código de barras
- **Foto del producto**: toma una foto con la cámara o selecciónala desde la galería. Las imágenes se comprimen automáticamente (máximo 800×800px, calidad 70%) para ahorrar espacio
- **Código de barras**: escanea directamente desde el formulario de producto o escríbelo manualmente
- **Categorías**: bebidas, comida, limpieza, papelería, ropa, electro, general y más
- **Alertas de stock bajo**: cuando el stock llega al mínimo configurado, aparece en rojo con un indicador visual
- **Notificación automática**: cuando el stock de un producto llega a cero, el teléfono envía una notificación aunque la app esté cerrada
- **Editar y eliminar** productos (eliminación suave — el producto se desactiva pero no se borra del historial)
- **Ganancia estimada** visible en el detalle de cada producto (precio de venta menos costo)
- **Acceso rápido a ajuste de inventario** desde el detalle del producto

---

### 📊 Dashboard (Panel Principal)

Vista rápida del estado del negocio:

- **Total de ventas del día** con número grande y claro
- **Desglose por método de pago**: efectivo, tarjeta y transferencia
- **Gráfica de los últimos 7 días**: tendencia visual de ventas
- **Productos más vendidos** del día
- **Alertas de stock bajo** con lista de productos que necesitan reposición
- Actualización deslizando hacia abajo
- **Banner de sesión offline** cuando no hay internet o el token expiró

---

### 🧾 Historial de Ventas

- Ver ventas organizadas por día con total del período
- Filtrar por período: hoy, última semana, último mes, todo
- Ver el **detalle completo** de cada venta: productos, cantidades, precios, método de pago, descuento y nota
- **Anular ventas**: desde el detalle de la venta puedes anularla total o parcialmente
- Estado de sincronización visible en cada venta (pendiente / sincronizado)

---

### ❌ Anulación de Ventas

Flujo completo para corregir errores sin editar el cierre de caja manualmente:

- Accede desde el detalle de cualquier venta con el botón "Anular venta"
- **Selección de productos a anular**: puedes anular toda la venta o solo algunos productos
- **Anulación parcial por cantidad**: si se vendieron 5 unidades puedes anular solo 2
- El total a anular se calcula en tiempo real mientras seleccionas
- **Motivos predefinidos**: error en el precio, producto equivocado, cliente canceló, cobro duplicado, otro
- Motivo personalizado cuando seleccionas "Otro"
- Al confirmar, el **stock se restaura automáticamente** para cada producto anulado
- La anulación se guarda en SQLite y se sincroniza con el servidor cuando haya internet
- Pantalla de confirmación de éxito con el monto anulado

---

### 📦 Ajustes de Inventario

Flujo para registrar movimientos de mercancía fuera del POS:

**Tipos de movimiento:**
- **Entrada**: mercancía recibida de proveedor, devolución de cliente, transferencia entre tiendas
- **Salida**: producto dañado, vencido, pérdida, robo, muestra, donación
- **Ajuste**: corrección por conteo físico o error en sistema

**Para cada ajuste se registra:**
- Producto afectado (búsqueda en tiempo real)
- Cantidad (con preview del nuevo stock)
- Costo por unidad (solo para entradas — actualiza el costo del producto)
- Motivo (de lista predefinida por tipo de movimiento)
- Nota adicional opcional
- Fecha y hora automática

**Historial de ajustes**: todos los movimientos quedan registrados con fecha, producto, tipo, stock anterior, stock nuevo, motivo y costo total. Visible en Ajustes → Historial de ajustes.

**Trazabilidad completa**: cada modificación de stock queda documentada con quién, cuándo, por qué y cuánto costó.

---

### 💰 Cierre de Caja

Al final del día:

- **Total de ventas calculado automáticamente** por método de pago
- Ingresa cuánto efectivo tienes físicamente en caja
- La app calcula el **sobrante o faltante** con color verde (sobrante) o rojo (faltante)
- Campo de nota para observaciones
- **Historial completo** de todos los cierres anteriores con fecha, montos, diferencia y notas
- Los cierres se guardan en SQLite y se sincronizan con el servidor
- Recordatorio automático: puedes configurar una notificación diaria a la hora que elijas para no olvidar el cierre

---

### 📈 Reportes y Estadísticas

Pantalla completa de análisis del negocio, funciona 100% offline:

**KPIs principales** (por período seleccionado):
- Ingresos totales
- Ganancia neta (ingresos menos costo de productos)
- Número de ventas
- Ticket promedio

**Filtros de período**: Hoy, 7 días, 15 días, 30 días

**Comparativa con período anterior**: muestra el porcentaje de crecimiento o caída vs el mismo número de días anterior, con indicador visual de tendencia

**Gráfica de ventas por día**: barras con los últimos 7 días del período seleccionado

**Gráfica de horarios pico**: muestra en qué horas del día se concentran más ventas (de 6am a 11pm)

**Top 10 productos más rentables**: ranking con nombre, unidades vendidas, ingresos totales, costo, ganancia neta y margen de ganancia en porcentaje

**Productos sin ventas**: lista de productos activos que nunca se han vendido, con su stock actual para facilitar decisiones de liquidación

**Desglose financiero**: ingresos totales, costo de productos, ganancia neta y barra visual del margen de ganancia

**Exportar a PDF**: genera un reporte profesional en PDF con todos los datos del período que puedes compartir por WhatsApp, email o guardar en el teléfono

---

### 🔄 Sincronización Offline/Online

El núcleo de la app:

- **Trabaja sin internet**: todas las operaciones (ventas, productos, ajustes, cierres) se guardan en SQLite en el teléfono
- **Cola de sincronización persistente**: los cambios pendientes sobreviven reinicios del teléfono — si cierras la app antes de sincronizar, los datos no se pierden
- **Sincronización automática**: cuando recupera internet, sincroniza en background sin interrumpir el trabajo
- **Resolución de conflictos**: si el mismo producto se editó tanto offline como en el servidor, gana el cambio con fecha más reciente (last-write-wins)
- **Indicador visual** en todo momento: punto verde (conectado), punto gris (offline)
- **Pantalla de sincronización**: muestra operaciones pendientes, errores, último sync exitoso y progreso en tiempo real
- **Reintentar errores**: si alguna operación falla, puedes reintentarla manualmente
- **Contador de pendientes** visible en la barra de ajustes

---

### 👥 Gestión de Empleados (Cajeros)

El dueño puede crear y gestionar cajeros desde la app:

- **Lista de empleados** con nombre, email, rol (Propietario / Cajero) y estado (Activo / Inactivo)
- **Crear cajero** con nombre, email y contraseña — el cajero queda asociado automáticamente al mismo negocio
- Los cajeros pueden **registrar ventas y consultar inventario** pero no pueden modificar productos ni ver reportes financieros
- Solo los **propietarios** ven el botón de agregar cajero
- Los cajeros se crean directamente en el servidor — requiere conexión a internet

---

### 🖼️ Imágenes de Productos

- Tomar foto directamente con la **cámara** del teléfono
- Seleccionar imagen desde la **galería**
- **Eliminar foto** del producto
- Las imágenes se procesan automáticamente: redimensionadas a máximo 800×800 píxeles, comprimidas al 70% de calidad en formato JPEG
- Las fotos se muestran en el catálogo de productos y en el POS para identificar visualmente los artículos
- Si no hay foto, se muestra el ícono de categoría del producto

---

### 💾 Copia de Seguridad

Exporta todos tus datos directamente desde el teléfono, sin necesitar internet:

**Copia de seguridad completa (PDF)**: un solo archivo PDF con todos los datos del negocio — productos, ventas, cierres de caja y ajustes de inventario. Incluye resumen ejecutivo con KPIs principales.

**Exportaciones individuales en CSV** (se abren con Excel o Google Sheets):
- **Productos**: catálogo completo con precios, costos, stock y categorías
- **Ventas**: historial con totales y métodos de pago
- **Detalle de ventas**: cada producto vendido con precio y cantidad
- **Ajustes de inventario**: historial completo de movimientos de stock
- **Cierres de caja**: todos los cierres con montos y diferencias

Los archivos se pueden compartir por **WhatsApp, email, Telegram** o guardar en el almacenamiento del teléfono. Útil para enviar información al contador o hacer respaldos manuales.

---

### ⚙️ Configuración del Negocio

Personaliza la app desde Ajustes → Configuración del negocio:

**Información del negocio:**
- Nombre del negocio (aparece en reportes y PDFs)
- Dirección (opcional)
- Teléfono (opcional)
- Pie de página personalizado para recibos

**Moneda:**
- Peso Cubano (CUP)
- Dólar (USD)
- Euro (EUR)
- MLC
- Porcentaje de impuesto configurable

**Horario de trabajo:**
- Hora de apertura y cierre del negocio (usado para calcular horas pico en reportes)

**Inventario:**
- Umbral de stock bajo: define cuántas unidades es "stock bajo" (por defecto 2)
- Categoría por defecto para nuevos productos

Todos los cambios se guardan localmente en SQLite y funcionan sin internet.

---

### 🔔 Notificaciones Locales

Notificaciones que funcionan **sin internet**, generadas directamente en el teléfono:

**Alertas de stock bajo:**
- Cuando una venta deja un producto con stock en cero: notificación inmediata con el nombre del producto
- Cuando varios productos tienen stock bajo: notificación agrupada con cuántos productos necesitan reposición

**Recordatorio de cierre de caja:**
- Notificación diaria a la hora que configures (por defecto desactivado)
- Selecciona entre las 5pm, 6pm, 7pm, 8pm o 9pm
- Se cancela automáticamente si lo desactivas

**Configuración de notificaciones:**
- Activar/desactivar alertas de stock bajo
- Activar/desactivar recordatorio de cierre de caja y configurar la hora
- Activar/desactivar confirmación de sincronización exitosa
- Si los permisos están denegados, la pantalla ofrece activarlos directamente

---

## Pantallas de la aplicación

| Pantalla | ¿Qué hace? |
|---|---|
| **Inicio de sesión** | Entrar con email y contraseña |
| **Registro** | Crear cuenta con datos del negocio |
| **Dashboard** | Resumen del día, ventas, gráfica y alertas |
| **Productos** | Catálogo completo con búsqueda y filtros |
| **Formulario de producto** | Crear o editar producto con foto y código de barras |
| **Detalle de producto** | Info completa, ganancia estimada y acceso a ajuste |
| **Punto de Venta** | Cobrar con escáner de código de barras integrado |
| **Historial de ventas** | Todas las ventas con filtros de fecha |
| **Detalle de venta** | Productos de la venta y botón de anulación |
| **Anular venta** | Selección de productos a anular con motivo |
| **Reportes** | KPIs, gráficas, rentabilidad y exportación PDF |
| **Ajuste de inventario** | Registrar entradas, salidas y correcciones |
| **Historial de ajustes** | Todos los movimientos de stock |
| **Cierre de caja** | Cuadre diario con cálculo automático |
| **Historial de cierres** | Todos los cierres anteriores |
| **Sincronización** | Cola de pendientes y estado de conexión |
| **Empleados** | Lista y creación de cajeros |
| **Formulario de cajero** | Crear cajero con validación de contraseña |
| **Copia de seguridad** | Exportar datos a CSV y PDF |
| **Configuración del negocio** | Nombre, moneda, horario, categorías |
| **Notificaciones** | Activar alertas y recordatorios |

---

## Arquitectura técnica

### Frontend (App móvil)

| Componente | Tecnología |
|---|---|
| Framework | React Native con Expo SDK 51 |
| Lenguaje | TypeScript |
| UI | React Native Paper (Material Design 3) |
| Base de datos local | expo-sqlite v13 (API WebSQL) |
| Estado global | Zustand |
| Formularios | React Hook Form + Zod |
| Navegación | React Navigation v6 |
| Almacenamiento seguro | Expo SecureStore |
| Cámara y escáner | expo-camera v15 |
| Imágenes | expo-image-picker + expo-image-manipulator |
| Notificaciones | expo-notifications |
| Exportación | expo-print + expo-sharing + expo-file-system |
| Tema | Material You con colores personalizados |

### Backend (Servidor)

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 24 |
| Framework | Express |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 7 con adapter pg |
| Autenticación | JWT (7 días) con sesiones en BD |
| Validaciones | Zod |
| Rate limiting | express-rate-limit |
| Seguridad | bcryptjs, CORS, cookies HTTP-only |

### Base de datos local (SQLite — frontend)

| Tabla | Contenido |
|---|---|
| `products` | Catálogo completo con stock y costos |
| `sales` | Cabecera de ventas |
| `sale_items` | Líneas de cada venta |
| `void_sales` | Anulaciones de ventas |
| `void_sale_items` | Líneas de cada anulación |
| `cash_closings` | Cierres de caja diarios |
| `sync_queue` | Cola de operaciones pendientes de sincronizar |
| `inventory_adjustments` | Movimientos de entrada/salida/ajuste |
| `business_config` | Configuración del negocio (clave-valor) |

### Base de datos del servidor (PostgreSQL)

| Tabla | Contenido |
|---|---|
| `users` | Cuentas de propietarios y cajeros |
| `user_sessions` | Sesiones activas con token hash, dispositivo e IP |
| `products` | Catálogo sincronizado |
| `sales` | Ventas sincronizadas |
| `sale_items` | Items de ventas sincronizados |
| `cash_closings` | Cierres sincronizados |

---

## Seguridad

### Autenticación
- Contraseñas hasheadas con **bcryptjs** (12 rounds)
- Tokens **JWT** con expiración de 7 días
- Cada token se registra en la tabla `user_sessions` con hash SHA-256
- En cada request autenticado se verifica que la sesión esté activa en la BD
- Esto permite **invalidar tokens remotamente** sin necesidad de lista negra

### Sesiones
- Al hacer login se registra: hash del token, user-agent del dispositivo, dirección IP y fecha de expiración
- El propietario puede ver todas sus sesiones activas y cerrarlas remotamente
- Las sesiones expiradas se limpian automáticamente en background al hacer login

### Rate Limiting
- **Rutas de autenticación** (login/registro): máximo 5 intentos por IP + email cada 15 minutos. Los logins exitosos no cuentan
- **API general**: máximo 100 peticiones por IP por minuto
- **Sincronización**: máximo 30 peticiones por IP por minuto
- Las peticiones desde localhost no están limitadas

### Almacenamiento local
- El token JWT se guarda en **Expo SecureStore** (cifrado en el hardware del dispositivo)
- Los datos del usuario también se guardan cifrados en SecureStore
- La base de datos SQLite local no está cifrada (datos del negocio, no credenciales)

---

## Flujo offline completo

```
Usuario hace venta sin internet
    ↓
cartStore.processSale() guarda en SQLite (transacción atómica)
    ↓
syncQueueRepository.enqueueOperation() agrega a la cola
    ↓
App muestra venta en el historial inmediatamente
    ↓
[Usuario recupera internet]
    ↓
useNetwork detecta cambio → setOnlineStatus(true)
    ↓
syncStore.syncNow() procesa la cola
    ↓
syncService envía operaciones al servidor en orden
    ↓
Servidor responde → markSynced() actualiza SQLite
    ↓
Badge de pendientes desaparece
```

---

## Flujo de sincronización con conflictos

Si el mismo producto se editó en el teléfono (offline) y en el servidor:

```
productRepository.upsertProductFromServer()
    ↓
Comparar updated_at del servidor vs updated_at local
    ↓
Si local tiene sync_status='pending' Y updated_at más reciente
    → Conservar cambios locales (no sobreescribir)
    ↓
Si servidor es más reciente
    → Actualizar local con datos del servidor
```

Estrategia: **last-write-wins** basado en timestamp.

---

## Flujo de anulación de ventas

```
Usuario abre detalle de venta → toca "Anular venta"
    ↓
VoidSaleScreen muestra productos de la venta
    ↓
Usuario selecciona items y cantidades a anular
    ↓
Selecciona motivo (lista predefinida o texto libre)
    ↓
Confirmación con alert mostrando monto y motivo
    ↓
insertVoidSale() — transacción atómica en SQLite:
    - Inserta void_sale
    - Inserta void_sale_items
    - UPDATE products SET stock = stock + cantidad (restaurar)
    - UPDATE sales SET sync_status = 'pending'
    ↓
loadSales() y loadProducts() se recargan
    ↓
Pantalla de éxito con monto anulado
```

---

## Flujo de ajuste de inventario

```
Usuario va a Ajustes → Ajuste de inventario
    ↓
Selecciona tipo: Entrada / Salida / Ajuste
    ↓
Busca y selecciona el producto
    ↓
Ingresa cantidad (preview del nuevo stock en tiempo real)
    ↓
Para entradas: puede ingresar costo por unidad
    ↓
Selecciona motivo de la lista correspondiente al tipo
    ↓
Confirmación con alert
    ↓
insertAdjustment() — transacción atómica:
    - Inserta inventory_adjustment
    - UPDATE products SET stock = nuevo_stock
    - Para entradas con costo: UPDATE products SET cost = nuevo_costo
    ↓
loadProducts() se recarga
    ↓
Snackbar de confirmación
```

---

## Flujo de exportación de datos

```
Usuario va a Ajustes → Copia de seguridad
    ↓
Selecciona tipo de exportación (PDF o CSV por categoría)
    ↓
exportService consulta SQLite directamente
    ↓
Para CSV: genera texto con encabezados y filas escapadas
         FileSystem.writeAsStringAsync() guarda en documentDirectory
    ↓
Para PDF: genera HTML con estilos inline
         Print.printToFileAsync() convierte a PDF
    ↓
Sharing.shareAsync() abre el panel nativo de compartir
    ↓
Usuario comparte por WhatsApp, email, etc. o guarda localmente
```

---

## Estructura de archivos del proyecto

```
inventario-cuba/
├── frontend/                          # App móvil (Expo)
│   ├── App.tsx                        # Punto de entrada, inicializa DB y notificaciones
│   ├── src/
│   │   ├── components/                # Componentes reutilizables
│   │   │   ├── AppButton.tsx
│   │   │   ├── AppCard.tsx
│   │   │   ├── AppInput.tsx
│   │   │   ├── BarcodeScanner.tsx     # Modal de escaneo con expo-camera
│   │   │   ├── CartItemRow.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ImagePicker.tsx        # Selector de foto con compresión
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── NetworkBanner.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductPOSCard.tsx
│   │   │   ├── SaleCard.tsx
│   │   │   ├── SimpleBarChart.tsx
│   │   │   ├── StockBadge.tsx
│   │   │   ├── SyncBadge.tsx
│   │   │   └── SyncStatusIndicator.tsx
│   │   ├── hooks/
│   │   │   ├── useAppTheme.ts
│   │   │   ├── useHaptics.ts
│   │   │   └── useNetwork.ts
│   │   ├── lib/                       # Capa de datos local (SQLite)
│   │   │   ├── businessConfigRepository.ts
│   │   │   ├── cashClosingRepository.ts
│   │   │   ├── database.ts            # Inicialización y helpers de SQLite
│   │   │   ├── inventoryAdjustmentRepository.ts
│   │   │   ├── productRepository.ts
│   │   │   ├── reportsRepository.ts
│   │   │   ├── saleRepository.ts
│   │   │   ├── syncQueueRepository.ts
│   │   │   └── voidSaleRepository.ts
│   │   ├── navigation/
│   │   │   ├── AuthNavigator.tsx
│   │   │   ├── MainNavigator.tsx
│   │   │   └── RootNavigator.tsx
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── RegisterScreen.tsx
│   │   │   └── main/
│   │   │       ├── AdjustmentHistoryScreen.tsx
│   │   │       ├── BackupScreen.tsx
│   │   │       ├── BusinessConfigScreen.tsx
│   │   │       ├── CashClosingHistoryScreen.tsx
│   │   │       ├── CashClosingScreen.tsx
│   │   │       ├── DashboardScreen.tsx
│   │   │       ├── InventoryAdjustmentScreen.tsx
│   │   │       ├── NotificationsConfigScreen.tsx
│   │   │       ├── POSScreen.tsx
│   │   │       ├── ProductDetailScreen.tsx
│   │   │       ├── ProductFormScreen.tsx
│   │   │       ├── ProductsScreen.tsx
│   │   │       ├── ReportsScreen.tsx
│   │   │       ├── SaleDetailScreen.tsx
│   │   │       ├── SalesScreen.tsx
│   │   │       ├── SettingsScreen.tsx
│   │   │       ├── StaffFormScreen.tsx
│   │   │       ├── StaffListScreen.tsx
│   │   │       ├── SyncScreen.tsx
│   │   │       └── VoidSaleScreen.tsx
│   │   ├── services/
│   │   │   ├── api.ts                 # Cliente HTTP con autenticación
│   │   │   ├── exportService.ts       # Exportación CSV y PDF
│   │   │   ├── notificationService.ts # Notificaciones locales
│   │   │   └── syncService.ts         # Lógica de sincronización
│   │   ├── store/                     # Estado global (Zustand)
│   │   │   ├── authStore.ts           # Autenticación offline-aware
│   │   │   ├── businessConfigStore.ts
│   │   │   ├── cartStore.ts
│   │   │   ├── cashClosingStore.ts
│   │   │   ├── productStore.ts
│   │   │   ├── saleStore.ts
│   │   │   ├── staffStore.ts
│   │   │   └── syncStore.ts
│   │   ├── theme/
│   │   │   ├── colors.ts
│   │   │   ├── paperTheme.ts
│   │   │   ├── spacing.ts
│   │   │   └── typography.ts
│   │   └── types/
│   │       └── index.ts               # Tipos globales TypeScript
│
└── backend/                           # Servidor Node.js
    ├── prisma/
    │   ├── schema.prisma              # Modelos de BD
    │   └── migrations/               # Historial de migraciones
    ├── prisma.config.ts               # Configuración Prisma 7 con adapter pg
    └── src/
        ├── controllers/
        │   ├── auth.controller.ts     # Login, registro, sesiones, cajeros
        │   ├── product.controller.ts  # CRUD de productos (tipado con Prisma)
        │   └── sale.controller.ts     # Ventas y resumen del día (tipado con Prisma)
        ├── lib/
        │   ├── jwt.ts                 # generateAccessToken, verifyAccessToken
        │   ├── prisma.ts              # Cliente Prisma con adapter pg
        │   └── sessions.ts            # Gestión de sesiones (crear, validar, invalidar)
        ├── middleware/
        │   ├── auth.ts                # JWT + validación de sesión en BD
        │   ├── errorHandler.ts
        │   └── rateLimiter.ts         # authLimiter, apiLimiter, syncLimiter
        ├── routes/
        │   ├── auth.routes.ts
        │   ├── product.routes.ts
        │   └── sale.routes.ts
        ├── types/
        │   └── index.ts
        ├── validators/
        │   ├── auth.validators.ts
        │   ├── product.validators.ts
        │   └── sale.validators.ts
        └── index.ts                   # Servidor Express con rate limiting global
```

---

## Variables de entorno

### Backend (`.env`)

```env
DATABASE_URL=postgresql://inventario_user:password@localhost:5432/inventario_cuba
JWT_SECRET=tu_clave_secreta_muy_larga
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=tu_clave_refresh_secreta
JWT_REFRESH_EXPIRES_IN=30d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
```

### Frontend (`.env`)

```env
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.137.1
```

---

## Configuración de red (desarrollo)

```
PC conectada por Ethernet (IP: 10.24.11.26)
Celular conectado al hotspot de la PC (IP hotspot: 192.168.137.1)
API_URL en api.ts: http://192.168.137.1:3000
Metro bundler: REACT_NATIVE_PACKAGER_HOSTNAME=192.168.137.1
Expo Go SDK 51 (APK instalado manualmente)
```

---

## Comandos del proyecto

```bash
# ── Backend ──────────────────────────────────────────────────
cd backend
npm run dev              # Iniciar servidor en modo desarrollo
npx prisma migrate dev   # Crear y aplicar migración
npx prisma generate      # Regenerar cliente Prisma
npx tsc --noEmit         # Verificar tipos TypeScript

# ── Frontend ─────────────────────────────────────────────────
cd frontend
npx expo start --clear   # Iniciar Metro con caché limpia
npx tsc --noEmit         # Verificar tipos TypeScript

# ── Base de datos ────────────────────────────────────────────
psql -U postgres
psql -U inventario_user -d inventario_cuba
```

---

## Usuario de prueba

```
Email:    yerald@test.com
Password: 123456
Negocio:  Mi Cafeteria
Rol:      owner
```

---

## Requisitos del sistema

### Teléfono (usuarios finales)
- Android 6.0 o superior
- iOS 13 o superior
- Al menos 150 MB de espacio libre
- Conexión a internet ocasional para sincronizar

### Servidor (administrador técnico)
- Node.js 24 o superior
- PostgreSQL 16 o superior
- 512 MB RAM mínimo

---

## Preguntas frecuentes

**¿Qué pasa si el token expira mientras no hay internet?**
La app detecta que el token expiró pero mantiene la sesión activa en modo offline. Muestra un banner amarillo indicando "Sesión offline activa". Cuando recupera internet, renueva el token automáticamente sin interrumpir al usuario.

**¿Puedo usar la app en varios teléfonos al mismo tiempo?**
Sí. Cada login crea una sesión independiente. Desde Ajustes puedes ver todas las sesiones activas y cerrar las que no reconoces.

**¿Qué pasa si hago una venta y se va la corriente?**
Cada acción se guarda en SQLite de forma atómica antes de intentar llegar al servidor. Si la app se cierra en medio de una venta, al reabrir la venta estará guardada y en la cola de sincronización.

**¿Puedo anular solo parte de una venta?**
Sí. En el detalle de la venta puedes seleccionar solo los productos que quieres anular y ajustar la cantidad de cada uno. El stock se restaura solo por las unidades anuladas.

**¿Los reportes funcionan sin internet?**
Completamente. Los reportes leen directamente de la base de datos SQLite del teléfono. No necesitan conexión para calcular ni para exportar a PDF.

**¿Qué pasa si borro la app?**
Si tienes internet, cuando reinstales y entres con tu cuenta, todos los datos se recuperan desde el servidor. Si no tienes internet al reinstalar, los datos locales se perdieron — por eso se recomienda hacer copias de seguridad periódicas desde la pantalla de Backup.

**¿Cuántos productos y ventas puedo tener?**
No hay límite en la app. La limitación es el espacio de almacenamiento del teléfono y la capacidad del servidor PostgreSQL.

---

## Limitaciones conocidas

- Las imágenes de productos se guardan como rutas locales en el teléfono. Si cambias de dispositivo, las fotos no se sincronizan con el servidor (solo los metadatos del producto)
- El escáner de código de barras requiere buena iluminación para funcionar correctamente
- La exportación de PDF con muchos productos y ventas puede tardar varios segundos en teléfonos de gama baja
- Los cajeros no pueden ver los reportes financieros — solo el propietario tiene acceso

---

## Versión y estado

| Campo | Valor |
|---|---|
| Versión | 1.0.0 |
| SDK Expo | 51 |
| React Native | 0.74.5 |
| Prisma | 7.5.0 |
| Estado | Producción |
| Plataformas | Android 6.0+ / iOS 13+ |
| Idioma | Español |
| País objetivo | Cuba |

---

*Inventario Cuba — Desarrollado con amor para los negocios cubanos* 🇨🇺