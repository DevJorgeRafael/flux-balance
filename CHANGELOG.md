# Changelog

Todos los cambios relevantes de Flux Balance se documentan en este archivo.

## [1.4.0] - 2026-10-27

Barra de navegación inferior flotante, tipo píldora.

### Añadido

- Configuración única de tabs en `tabConfig.ts`.
- Componente `BottomFade` con degradado inferior de 24px.
- Degradado inferior en Inicio, Cuentas, Stats y Ajustes.
- Píldora de fondo en el tab activo con ícono y etiqueta.
- Etiqueta accesible en cada tab, aunque no se vea.
- La barra se oculta cuando aparece el teclado.
- Lectores de pantalla anuncian el tab seleccionado.

### Cambiado

- La barra deja de ser una franja fija y pasa a ser una píldora flotante.
- La barra mide 64px de alto, con radio 999 y sombra suave.
- Sin borde de 1px.
- Margen lateral de 16px y margen inferior de 12px más el safe area.
- Los tabs inactivos muestran solo el ícono en gris.
- El ＋ es un círculo de 56px, con 12px de separación de la barra.
- El ＋ comparte el margen inferior con la barra.
- El ＋ sigue abriendo el modal de movimiento.
- La píldora activa se expande en 220ms al cambiar de tab.
- El tab activo usa el color de acento para ícono y etiqueta.
- En oscuro la barra usa `surface` al 94% y la píldora `cardRaised`.
- En claro la barra es blanca al 94% y la píldora un tinte del acento al 15%.
- Las pantallas dejan 20px de aire entre el contenido y la barra.
- `package.json` y `app.json` suben a `1.4.0`.

### Compatibilidad

- No cambian rutas, datos ni el contenido de las pantallas.
- El modal de movimiento sigue igual.
- No se agregaron dependencias.
- No se usa `expo-blur` en la barra.
- La animación usa `react-native-reanimated`, ya instalado.

## [1.3.2] - 2026-10-27

Modo desarrollador en Ajustes y limpieza de variables de entorno.

### Añadido

- Bandera `IS_DEVELOPMENT_MODE` basada en `NODE_ENV`.
- Sección **Modo desarrollador** en Ajustes.

### Cambiado

- La sección **Datos** de Ajustes ahora se llama **Modo desarrollador**.
- **Modo desarrollador** solo aparece cuando `NODE_ENV` no es `production`.
- El menú del Inicio usa la misma regla para datos demo y reinicio.
- `package.json` y `app.json` suben a `1.3.2`.

### Compatibilidad

- La base de datos, los modelos y los cálculos financieros no cambian.
- No se agregaron dependencias nativas.
- Expo CLI reemplaza `NODE_ENV` por el modo del comando en SDK 58.

## [1.3.1] - 2026-10-27

Configuración de moneda y limpieza de los importes mostrados en el Inicio.

### Añadido

- Selector de moneda en Ajustes con 15 divisas.
- Preferencia de moneda guardada en la base de datos local.
- Pantalla `/settings/currency` con el nombre de la divisa en ES/EN.
- Formato de montos por moneda y por idioma.
- Decimales propios para JPY y CLP, sin centavos.
- Opción `showCurrency` para mostrar montos sin el código de divisa.
- Pruebas unitarias del formateo de moneda.

### Cambiado

- Todos los montos de la app usan la moneda elegida.
- Se eliminó el prefijo fijo `$ USD` en Inicio, Cuentas, Stats y movimientos.
- Capital, saldo inicial y monto muestran la moneda vigente.
- El héroe del Inicio conserva el código de divisa.
- Ingresos, gastos y neto ya no repiten el código de divisa.
- Los últimos movimientos ya no repiten el código de divisa.
- Ajustes separa las opciones en **Sistema** y **Datos**.
- Los datos demo y el reinicio ya no están ocultos en desarrollo.
- `package.json` y `app.json` suben a `1.3.1`.

### Corregido

- El signo se mantiene delante del monto cuando no hay código de divisa.
- Los importes ocultos siguen mostrando los puntos de ocultamiento.

### Compatibilidad

- La moneda solo cambia el formato; no se convierten valores.
- La base de datos, los modelos y los cálculos financieros no cambian.
- No se agregaron dependencias nativas.
- La moneda por defecto es USD.

## [1.3.0] - 2026-10-27

Rediseño completo de la pestaña **Cuentas** y ajustes visuales en el detalle de cuenta.

### Añadido

- Encabezado con total consolidado, número de cuentas y chip **Nueva cuenta**.
- Barra de distribución apilada de 12 px con hasta cinco segmentos.
- Leyenda con color, nombre y porcentaje por cuenta.
- Agrupación del resto de cuentas en **Otras**, con color gris.
- Porcentajes enteros por mayor resto; siempre suman `100%`.
- Grupos **Corrientes**, **Ahorro flexible** y **Plazo fijo**, solo si tienen cuentas.
- Tarjeta por cuenta con ícono, nombre en una línea, saldo y movimientos del mes.
- Rendimiento flexible estimado con etiqueta **estimado**, solo si hay tasa.
- Plazo fijo con **Vence en N días** y barra fina de progreso.
- Estado vacío con mensaje y botón **Crear cuenta**.
- Visibilidad de saldos compartida entre Inicio y Cuentas.
- Traducciones ES/EN para distribución, grupos, conteo, vencimiento y estado vacío.
- Servicio puro `account-distribution` y su prueba unitaria.
- Hook `useMonthlyAccountMovementCounts` para el conteo mensual por cuenta.
- La prueba de distribución se agregó al script `test`.

### Cambiado

- La pestaña Cuentas reemplaza el carrusel por una lista agrupada por tipo.
- Los saldos ocultos en Inicio también se ocultan en Cuentas.
- Cada movimiento del detalle se muestra en una tarjeta con espacio vertical.
- Los nombres largos se ajustan para mostrarse completos en una línea.
- El Inicio solo comparte el estado de visibilidad; su diseño no cambia.
- `package.json` y `app.json` suben a `1.3.0`.

### Corregido

- Se eliminaron las líneas divisorias del historial de movimientos.
- Se conserva la navegación de cada cuenta a su pantalla de detalle.

### Compatibilidad

- La base de datos, los modelos y los cálculos financieros no cambian.
- Los totales de Inicio y Cuentas provienen del mismo balance consolidado.
- Los temas claro y oscuro usan los tokens y superficies existentes.
- No se agregaron dependencias nativas.
- El carrusel del Inicio se mantiene intacto.

## [1.2.1] - 2026-10-27

Fondos y tema oscuro renovados en el Dashboard y sus pantallas relacionadas.

### Cambiado

- El tema oscuro usa una paleta azul marino con niveles de elevación.
- El fondo nativo oscuro pasa a `#0A0E1A`.
- La hoja del Dashboard usa `#101626`.
- Las tarjetas usan `#18203A`; las superficies elevadas, `#212B4A`.
- El héroe claro usa un degradado de `#2A5BE0` a `#1A46C4`.
- El héroe oscuro usa un degradado de `#17399A` a `#0D2158`.
- El tramo principal del héroe oscuro permanece casi plano hasta el 72%.
- El último tramo se oscurece de forma leve hacia la hoja.
- La barra inferior usa las superficies y sombras del tema.
- Los modales, el blur y los velos usan tokens de fondo.
- El detalle de movimiento y las pantallas de categorías usan las nuevas superficies.
- Los textos e íconos del héroe usan el token `onHero`.
- Se añadió `expo-linear-gradient` para el fondo del héroe.

### Corregido

- La barra de estado queda cubierta por el color del héroe.
- La barra inferior ya no usa un fondo oscuro fijo.
- La tarjeta resumen mantiene contraste en oscuro.
- El héroe respeta el área segura en ambos temas.
- Se reemplazaron varios colores hex sueltos por tokens.

### Compatibilidad

- `package.json` y `app.json` quedan sincronizados en `1.2.1`.
- El modo claro conserva su paleta y sus superficies.
- Navegación, persistencia, idiomas y datos no cambian.

## [1.2.0] - 2026-10-26

Categorías de ingresos y gastos separadas, editables y con color propio.

### Añadido

- Sección **Categorías** en Ajustes con accesos a ingresos y gastos.
- Listado, creación y edición de categorías por tipo.
- Paletas de 54 colores: azul para ingresos y naranja para gastos.
- Validación de nombre obligatorio, sin duplicados por tipo y sin espacios sobrantes.
- Eliminación de categorías personalizadas con confirmación y conteo de movimientos.
- Traslado automático de movimientos a **Sin categoría** al eliminar su categoría.
- Orden estable para categorías predeterminadas.
- Migración automática de categorías legacy con respaldo previo.
- Pruebas de paletas, validación, resolución por tipo, migración, borrado y datos demo.
- Script de pruebas con soporte para TypeScript.

### Cambiado

- Las categorías se almacenan en tablas separadas: `income_categories` y `expense_categories`.
- Las categorías heredadas se migran sin perder movimientos ni divisiones.
- Las categorías predeterminadas se siembran de forma idempotente.
- Los colores predeterminados usan la nueva paleta y conservan los colores personalizados.
- El selector de movimientos muestra solo categorías del tipo activo y su color.
- Stats usa el color real de cada categoría.
- Stats trata categorías faltantes o de otro tipo como **Sin categoría**.
- Ajustes actualiza los datos al volver a enfocarse.
- Los mensajes de eliminación interpolan la cantidad de movimientos.
- Las pantallas nuevas respetan ES/EN y los temas claro/oscuro.
- `package.json` y `app.json` quedan en la versión `1.2.0`.

### Corregido

- Se impide eliminar categorías predeterminadas.
- Se evita reutilizar el mismo nombre dentro de un tipo.
- Se evita asignar categorías de ingresos a gastos y viceversa.
- Se admiten movimientos sin categoría sin errores de integridad.
- Se conservan los colores elegidos durante la migración.

### Compatibilidad

- La migración es idempotente y crea un respaldo en `categories_backup_v1`.
- Las categorías personalizadas heredadas se conservan en ambos tipos para no romper referencias.
- La navegación, cuentas, movimientos, temas e idiomas siguen funcionando.

## [1.1.2] - 2026-10-26

La pestaña **Stats** pasa a ser funcional con análisis mensual de movimientos.

### Añadido

- Selector de mes e ingresos/gastos.
- Gráfico de dona y desglose por categorías.
- Estados vacíos para meses sin movimientos.
- Datos demo reutilizables y pruebas unitarias para estadísticas y saldos.

### Cambiado

- Stats ahora carga y analiza los movimientos reales desde SQLite.
- Se añadieron colores, traducciones y soporte de temas para la nueva vista.
- El cálculo agrupa categorías adicionales en **Otros** y garantiza porcentajes
  que suman `100%`.

### Corregido

- Se mejoró la recarga de datos al volver a Stats y al actualizar movimientos.
- Se evitó que cargas anteriores sobrescriban datos más recientes.

### Compatibilidad

- `package.json` y `app.json` quedan sincronizados en `1.1.2`.
- Se mantienen la navegación, persistencia, temas e idiomas existentes.

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
