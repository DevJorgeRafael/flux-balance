# Changelog

Todos los cambios relevantes de Flux Balance se documentan en este archivo.

## [1.1.1] - 2026-10-26

Esta versión añade la nueva sección de estadísticas a la navegación principal.
La pestaña queda preparada como punto de entrada para futuras métricas
financieras sin modificar la lógica existente de cuentas, movimientos,
persistencia ni navegación de detalle.

### Añadido

- Nueva pestaña **Stats** dentro de la navegación inferior de Expo Router.
- Nueva ruta `src/app/(tabs)/stats.tsx` con:
  - Título localizado de la sección.
  - Estado inicial de funcionalidad próximamente disponible.
  - Iconografía específica de estadísticas mediante `ChartColumn`.
  - Tarjeta vacía preparada para incorporar métricas y visualizaciones futuras.
  - Espaciado inferior compatible con la barra de navegación y el área segura
    de Android e iOS.
- Nuevas traducciones `stats` y `comingSoon` en español e inglés.

### Cambiado

- La barra inferior ahora muestra cuatro destinos:
  - **Inicio**.
  - **Cuentas**.
  - **Stats**.
  - **Ajustes**.
- Se añadió el icono de estadísticas al `AppTabBar`.
- Se incrementó el tamaño base de los iconos de navegación para mejorar su
  legibilidad al incorporar el nuevo destino.
- La distribución de la barra inferior se ajustó para conservar el botón
  flotante central y mostrar correctamente los tabs adicionales.
- La superficie de la barra inferior utiliza una sombra explícita compatible
  con Android y una superficie oscura dedicada para mantener el contraste en
  el tema oscuro.

### Compatibilidad

- `package.json` y `app.json` quedan sincronizados en la versión `1.1.1`.
- La nueva ruta se integra en el `DashboardProvider` existente y conserva el
  estado compartido de la aplicación.
- No se modifican las rutas de detalle de cuenta ni de movimiento.
- No se modifica la persistencia SQLite ni el cálculo de balances, ingresos,
  gastos o rendimientos.
- Se mantiene la compatibilidad con los idiomas español e inglés y con los
  temas claro y oscuro.

## [1.1.0] - 2026-10-26

Esta versión incorpora una reorganización importante de la navegación y de la
arquitectura de la pantalla principal. El dashboard conserva la lógica
existente de cuentas, movimientos, filtros y modales, pero ahora forma parte
de una navegación inferior persistente y comparte su estado mediante un
contexto dedicado.

### Añadido

- Navegación inferior con tabs para:
  - **Inicio**, con el dashboard y el balance consolidado.
  - **Cuentas**, con el carrusel y la gestión de cuentas.
  - **Ajustes**, con las preferencias de tema, idioma y acciones de desarrollo.
- Barra inferior personalizada en `AppTabBar` con:
  - Iconos y etiquetas localizados.
  - Estado activo/inactivo según el tema.
  - Botón central flotante para crear rápidamente un movimiento.
  - Soporte para el inset inferior del dispositivo.
  - Separación visual para que el botón central no interfiera con los tabs.
- Constantes compartidas de layout para la barra inferior:
  - Altura de la barra.
  - Solapamiento superior.
  - Espacio inferior de contenido.
  - Separación adicional para evitar que la navegación tape listas o tarjetas.
- `DashboardContext` para centralizar y compartir:
  - Cuentas y categorías.
  - Balance total y totales mensuales.
  - Estado de carga y refresco.
  - Cuenta filtrada y movimientos visibles.
  - Apertura de los modales de nueva cuenta y nuevo movimiento.
  - Acciones de datos demo y reinicio de la base local.
- Nuevas pantallas Expo Router:
  - `src/app/(tabs)/index.tsx`
  - `src/app/(tabs)/accounts.tsx`
  - `src/app/(tabs)/settings.tsx`
- Ajustes y preferencias como pantalla independiente, incluyendo:
  - Cambio entre tema claro y oscuro.
  - Cambio de idioma.
  - Carga de datos demo en desarrollo.
  - Reinicio de datos en desarrollo.

### Cambiado

- Migración de la pantalla inicial a un grupo de rutas `(tabs)` de Expo Router.
- Actualización del layout raíz para presentar el navegador de tabs como
  entrada principal de la aplicación.
- Eliminación de la responsabilidad de los modales del dashboard:
  ahora se montan una sola vez dentro de `DashboardProvider`, evitando
  duplicación de estado y manteniendo el flujo disponible desde cualquier tab.
- El refresco desde el dashboard también recarga los movimientos filtrados,
  manteniendo sincronizados el balance, las cuentas y el historial.
- El carrusel de cuentas ahora admite distintos usos:
  - Filtrado completo desde Inicio.
  - Vista de cuentas sin el filtro “Todas” desde la pestaña Cuentas.
  - Navegación directa al detalle de una cuenta.
- Ajuste del espaciado inferior de las pantallas desplazables para convivir con
  la barra inferior y el área segura de Android/iOS.
- Ajuste de traducciones para las nuevas etiquetas de navegación:
  - Inicio / Home.
  - Cuentas / Accounts.
  - Ajustes / Settings.
- El dashboard mantiene la composición visual azul superior y hoja inferior,
  pero ahora se adapta correctamente al espacio reservado por la navegación.

### Corregido

- Evita que la barra inferior cubra el contenido final de las listas.
- Evita que el botón flotante de nuevo movimiento se solape con los botones de
  navegación.
- Mantiene los modales de cuenta y movimiento accesibles desde el nuevo flujo
  de navegación.
- Conserva la selección de cuenta y la lista de movimientos al refrescar los
  datos desde el contexto compartido.
- Corrige la alineación del carrusel cuando se utiliza dentro de una pantalla
  con padding horizontal propio.
- Mantiene el comportamiento de tema, idioma, datos demo y reinicio después de
  separar Ajustes en su propia ruta.

### Internacionalización

- Añadidas las claves de navegación en español e inglés:
  - `home`
  - `accountsTab`
  - `settings`
  - `newMovement`
- Las etiquetas de la barra inferior se resuelven mediante el proveedor de
  traducciones existente y respetan el idioma seleccionado.

### Compatibilidad

- `package.json` y `app.json` quedan sincronizados en la versión `1.1.0`.
- La navegación continúa utilizando Expo Router y mantiene las rutas existentes
  de detalle de cuenta y detalle de movimiento.
- La lógica de persistencia SQLite, cuentas, depósitos, movimientos y cálculos
  financieros no se reemplaza; únicamente se reorganiza su acceso desde la UI.

## [1.0.5] - 2026-10-26

### Mejorado

- Rediseño de la pantalla principal con una zona superior azul y una hoja
  superpuesta para reforzar la jerarquía visual del balance.
- Tarjeta resumen de Ingresos, Gastos y Neto con tres columnas alineadas,
  contraste consistente y mejor profundidad en modo claro y oscuro.
- Carrusel de cuentas con espaciado lateral y elevación corregidos para evitar
  sombras recortadas.

## [1.0.4] - 2026-10-26

### Mejorado

- Cierre animado del `BottomSheetModal` con desmontaje posterior y backdrop sincronizado.

## [1.0.3] - 2026-10-21

Primera versión formal documentada del producto. Consolida el trabajo implementado
en la rama `main` hasta el merge de `dev`.

### Añadido

- Proyección financiera para cuentas de plazo fijo y fondos flexibles.
- Cálculo de ganancia mensual, monto al vencimiento e interés compuesto diario.
- Vista de proyección en el detalle de cuenta y vista previa durante la creación.
- Internacionalización español/inglés con detección del idioma del dispositivo,
  fallback a inglés y persistencia local.
- Menú unificado de ajustes con selector de tema, idioma, datos demo y reinicio.
- Efecto blur reutilizable para el menú de ajustes y formularios.
- Soporte de `expo-localization`, `expo-blur` y `expo-system-ui`.
- Fondo nativo y de navegación sincronizado con el tema claro/oscuro.

### Corregido

- Duplicación del capital inicial en cuentas de plazo fijo.
- Orden de Ingresos/Gastos en el formulario de movimientos.
- Ocultación y revelación del balance consolidado y sus métricas.
- Altura del dashboard al ocultar los importes de las métricas.
- Interacción del botón del ojo frente al overlay del encabezado.
- Persistencia visual obsoleta de movimientos después de reiniciar los datos.
- Seed de datos demo para usar el esquema SQLite actual (`snake_case`,
  categorías y claves foráneas correctas).
- Capas, posicionamiento y captura del blur al alternar el tema.
- Advertencia por `blurTarget` ausente en Android.
- Migración del uso propio de `SafeAreaView` a `react-native-safe-area-context`.

### Mejorado

- Animaciones de modales, menú de ajustes y acciones rápidas.
- Diseño responsive del dashboard, tarjetas, estados vacíos y acciones.
- Formateo monetario con decimales y signos consistentes.
- Alineación de dependencias con Expo SDK 57.
- Contraste y estilos visuales para los temas claro y oscuro.

## Versionado

- `package.json` y `app.json` mantienen la misma versión de la aplicación.
- Este proyecto comienza el versionado formal con `1.0.3`; no existen tags
  anteriores en el historial de Git de `main`.
