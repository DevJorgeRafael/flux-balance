# Changelog

Todos los cambios relevantes de Flux Balance se documentan en este archivo.

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
