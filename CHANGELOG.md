# Changelog

Todos los cambios relevantes de Flux Balance se documentan en este archivo.

## [1.5.2] - 2026-10-27

Tema e idioma persistentes con opción Sistema.

### Añadido

- Tema e idioma persistentes, con `Sistema` por defecto y selección desde Ajustes.

### Cambiado

- Las preferencias se cargan antes del primer render, sin parpadeos.
- `Sistema` sigue en vivo los cambios del dispositivo.
- Un idioma distinto de ES o EN se resuelve como inglés.
- El formato de montos sigue el idioma efectivo.
- Los usuarios existentes arrancan en `Sistema`; no se migra el idioma guardado antes.

### Compatibilidad

- No cambian datos financieros, cálculos ni rutas existentes.

## [1.5.1] - 2026-10-27

Espaciado uniforme y sombras compactas en el inicio.

### Añadido

- Token `cardShadowSm` y prop `shadowSize` en `Card`.

### Cambiado

- Separación uniforme entre los títulos de sección del inicio y sus cards.
- El carrusel de cuentas reserva espacio para la sombra y reduce la altura de sus cards.

## [1.5.0] - 2026-10-27

Estilo visual de cards unificado.

### Añadido

- Componente base `Card` con variantes `default`, `raised` y `flat`.
- Tokens `radius.card` y `cardShadow`.

### Cambiado

- Todas las cards comparten radio, borde y fondo; se eliminan sombras y fondos locales.
- El carrusel, el resumen del inicio y las filas de la app usan el nuevo estilo.
- Se elimina el token `shadow`.

## [1.4.0] - 2026-10-27

Barra de navegación inferior flotante, tipo píldora.

### Añadido

- Tabs centralizados en `tabConfig.ts`.
- Componente `BottomFade` para el degradado inferior.
- La barra se oculta al abrir el teclado.

### Cambiado

- La barra pasa de franja fija a píldora flotante, con animación en el tab activo.
- El botón central de nuevo movimiento se separa de la barra y conserva su función.
- Los tabs inactivos muestran solo el ícono; el activo usa el color de acento.

## [1.3.2] - 2026-10-27

Modo desarrollador en Ajustes.

### Añadido

- Bandera `IS_DEVELOPMENT_MODE` basada en `NODE_ENV`.

### Cambiado

- La sección Datos de Ajustes pasa a Modo desarrollador y solo aparece fuera de producción.
- El menú del Inicio aplica la misma regla para datos demo y reinicio.

## [1.3.1] - 2026-10-27

Configuración de moneda y limpieza de los importes.

### Añadido

- Selector de 15 divisas en Ajustes, con la preferencia guardada en la base local.
- Formato de montos por moneda e idioma, con decimales propios para JPY y CLP.

### Cambiado

- Todos los montos usan la moneda elegida; se elimina el prefijo fijo `$ USD`.

### Compatibilidad

- La moneda solo cambia el formato; no se convierten valores. La moneda por defecto es USD.

## [1.3.0] - 2026-10-27

Rediseño de la pestaña Cuentas.

### Añadido

- Encabezado con total consolidado y distribución por cuenta con porcentajes.
- Cuentas agrupadas por tipo, con saldo y movimientos del mes por cuenta.
- Estado vacío con acción para crear una cuenta.
- Visibilidad de saldos compartida entre Inicio y Cuentas.

### Cambiado

- La pestaña Cuentas reemplaza el carrusel por una lista agrupada por tipo.
- El detalle de cuenta muestra cada movimiento en una tarjeta.

## [1.2.1] - 2026-10-27

Fondos y tema oscuro renovados en el Dashboard.

### Cambiado

- El tema oscuro pasa a una paleta azul marino con niveles de elevación.
- El héroe usa degradados con `expo-linear-gradient`; sus textos e íconos usan el token `onHero`.
- Se reemplazan colores hex sueltos por tokens.

### Corregido

- La barra de estado y la barra inferior respetan el nuevo tema.

## [1.2.0] - 2026-10-26

Categorías de ingresos y gastos separadas, editables y con color propio.

### Añadido

- Gestión de categorías por tipo en Ajustes: listar, crear, editar y eliminar.
- Paletas de 54 colores: azul para ingresos y naranja para gastos.
- Validación de nombre único por tipo y traslado de movimientos a Sin categoría al eliminar.

### Cambiado

- Las categorías se guardan en tablas separadas: `income_categories` y `expense_categories`.
- Las categorías heredadas se migran sin perder movimientos ni divisiones.
- Las predeterminadas se pueden editar, pero no eliminar.
- El selector de movimientos y Stats usan solo categorías del tipo correspondiente.

### Compatibilidad

- La migración es idempotente y crea un respaldo en `categories_backup_v1`.
- Las categorías personalizadas heredadas se conservan en ambos tipos para no romper referencias.

## [1.1.2] - 2026-10-26

Stats pasa a ser funcional con análisis mensual de movimientos.

### Añadido

- Selector de mes y de ingresos/gastos.
- Gráfico de dona y desglose por categorías, con porcentajes que suman `100%`.
- Estados vacíos para meses sin movimientos.

### Cambiado

- Stats carga y analiza los movimientos reales desde SQLite.

### Corregido

- Se evita que cargas anteriores sobrescriban datos más recientes.

## [1.1.1] - 2026-10-26

Nueva pestaña Stats en la navegación principal, con estado próximamente y traducciones ES/EN.

## [1.1.0] - 2026-10-26

Navegación inferior persistente y estado compartido del dashboard.

### Añadido

- Tabs Inicio, Cuentas y Ajustes con barra inferior personalizada y botón central de nuevo movimiento.
- `DashboardContext` centraliza cuentas, balance, movimientos, filtros y modales.
- Ajustes como pantalla independiente con tema, idioma, datos demo y reinicio.

### Cambiado

- La pantalla inicial pasa a un grupo de rutas `(tabs)` de Expo Router.
- Los modales se montan una sola vez en `DashboardProvider`.
- Las pantallas reservan espacio para la barra inferior y el área segura.

### Corregido

- La barra inferior ya no cubre el final de las listas.
- El botón flotante ya no se solapa con la navegación.

## [1.0.5] - 2026-10-26

Rediseño visual del dashboard.

### Mejorado

- Zona superior azul con hoja superpuesta para reforzar la jerarquía del balance.
- Tarjeta resumen de Ingresos, Gastos y Neto y carrusel de cuentas con sombras corregidas.

## [1.0.4] - 2026-10-26

Cierre animado del `BottomSheetModal`.

## [1.0.3] - 2026-10-21

Primera versión formal documentada del producto.

### Añadido

- Proyección financiera para plazo fijo y fondos flexibles, con interés compuesto diario.
- Internacionalización ES/EN con detección del idioma del dispositivo, fallback a inglés y persistencia local.
- Menú de ajustes con tema, idioma, datos demo y reinicio.
- Soporte de `expo-localization`, `expo-blur` y `expo-system-ui`.

### Corregido

- Duplicación del capital inicial en cuentas de plazo fijo.
- Persistencia visual obsoleta tras reiniciar los datos.
- Seed de datos demo alineado al esquema SQLite actual.

### Mejorado

- Animaciones, diseño responsive y contraste en temas claro/oscuro.

## Versionado

- `package.json` y `app.json` mantienen la misma versión de la aplicación.
- Este proyecto comienza el versionado formal con `1.0.3`; no existen tags anteriores en el historial de Git de `main`.
