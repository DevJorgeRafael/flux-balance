# Changelog

Todos los cambios relevantes de Flux Balance se documentan en este archivo.

## [No publicado]

### Añadido

- El formulario de movimientos conserva un borrador en el dispositivo si se interrumpe o se cierra la app.
- Ayuda contextual para «anticipaciones», «cerebro local» y la tasa nominal anual.

## [2.5.3] - 2026-11-23

### Cambiado

- El azul del hero en la status bar se desvanece con el scroll; al desplazarse, la barra adopta el fondo del tema.

## [2.5.2] - 2026-11-23

### Cambiado

- Home más limpio: una sola Card por sección, iconos neutros, acciones con nombre y anillo de progreso compartido entre el inicio y la pantalla de Metas.
- Todas las Cards usan el mismo fondo que la barra inferior; la elevación se expresa con sombra.

## [2.5.1] - 2026-11-23

### Añadido

- Desde el selector de categorías del formulario principal de movimientos se puede crear una categoría nueva sin salir del flujo. Al volver, la categoría creada queda seleccionada y el resto del formulario se conserva.

## [2.5.0] - 2026-11-23

### Cambiado

- El estado de la app usa Zustand en lugar de la mayoría de los React Context: tarjetas del inicio, splash, tema, idioma, moneda, dashboard, alertas y notificaciones.

## [2.4.4] - 2026-11-23

### Añadido

- Filtro por fecha en el historial de movimientos de cada cuenta: permite elegir un solo día o un rango con el DatePicker, sin fechas futuras. El filtro comparte fila con los filtros Todos/Ingresos/Gastos.

### Cambiado

- «Ver más» del inicio muestra como máximo 10 movimientos adicionales por vez, sin ocultar el acceso al historial de la cuenta.

### Corregido

- Eliminado el botón «Ajustar saldo» que aparecía en el detalle de cuenta fuera de contexto.

## [2.4.3] - 2026-11-23

### Añadido

- «Personalizar inicio» en Ajustes: permite ocultar o volver a mostrar las tarjetas de anticipaciones, progreso de metas y próximos recordatorios.
- Acceso directo a la nueva pantalla desde los engranajes de Presupuestos y Metas. La preferencia se guarda en el dispositivo y se conserva en el respaldo.

## [2.4.2] - 2026-11-23

### Cambiado

- Ajustes reordenados: Sistema aparece primero, seguido de Recordatorios y Categorías; Presupuestos, Cerebro local, Metas y Simulador de ahorro se agrupan en Planificación.
- Datos y Modo desarrollador se mantienen juntos y por encima de Acerca de.

## [2.4.1] - 2026-11-21

### Añadido

- Metas de ahorro con importe objetivo, fecha límite y cuenta opcional.
- Simulador de ahorro con interés compuesto y cálculo de la aportación necesaria.
- Tarjeta de progreso de la meta en el inicio.

### Mejorado

- El botón destructivo de las confirmaciones usa un rojo más sobrio en tema oscuro, con contraste AA.

## [2.4.0] - 2026-11-21

### Añadido

- Cerebro local: sugiere la categoría al escribir la descripción y aprende de las correcciones, sin enviar datos a ningún servidor.
- Pantalla de reglas aprendidas en Ajustes, con opción de borrarlas.

## [2.3.1] - 2026-11-21

### Añadido

- Presupuestos mensuales por categoría, con alta, edición y borrado en Ajustes.
- Tarjeta de anticipaciones en el inicio: avisa de presupuestos al límite, plazos fijos por vencer, saldo bajo y gastos atípicos.
- Notificación del sistema una vez al día cuando hay anticipaciones; al tocarla se abre la pantalla de presupuestos.

## [2.3.0] - 2026-11-21

### Añadido

- Transferencias reales entre cuentas: descuentan del origen, abonan en el destino y no contaminan las estadísticas.
- Ajuste manual de saldo en el detalle de cuenta, registrado como un movimiento.
- Los respaldos conservan las transferencias con sus dos cuentas.

## [2.2.5] - 2026-11-21

### Añadido

- Los respaldos JSON y Excel incluyen los recordatorios con sus vínculos de cuenta y categoría.
- Los respaldos conservan las preferencias de tema e idioma.
- El resumen de importación muestra cuántos recordatorios contiene el respaldo.

### Mejorado

- Los respaldos de versiones anteriores se migran automáticamente al formato v2.

## [2.2.4] - 2026-11-21

### Añadido

- Los próximos recordatorios aparecen en el inicio con creación rápida.
- Ajustes muestra los recordatorios activos y acceso directo a crear uno.

### Mejorado

- El inicio muestra 5 movimientos y permite expandirlos en la misma pantalla.
- “Ver historial” aparece solo cuando no quedan movimientos por expandir.

## [2.2.3] - 2026-11-21

### Añadido

- Los movimientos simples se editan desde su detalle.
- La edición cambia tipo, importe, descripción, cuenta y categoría.
- Los saldos se ajustan al cambiar de cuenta.

### Mejorado

- El detalle y el saldo se actualizan al volver de editar.

## [2.2.2] - 2026-11-20

### Corregido

- Las esquinas del selector de ingresos y gastos de Estadísticas quedan alineadas con su tarjeta.

## [2.2.1] - 2026-11-20

### Mejorado

- Los datos demo reparten movimientos realistas en las últimas 3 semanas.

### Corregido

- El inicio muestra solo los movimientos del mes actual.
- Si no hay movimientos del mes, muestra los últimos 5.
- La moneda del splash se ve redondeada y sin el recorte inferior.

## [2.2.0] - 2026-11-20

### Añadido

- Nueva vista Tendencia con la evolución diaria de ingresos y gastos.
- Nueva vista Saldo con la evolución diaria del saldo del mes.
- Filtro por cuenta en la vista Saldo.
- Resumen con saldo inicial, saldo final y variación.

### Mejorado

- Las estadísticas muestran los decimales de la moneda.
- Los gráficos permiten tocar un día para ver su detalle.
- La vista Tendencia resume promedio diario, día más alto y días con ingresos o gastos.
- La vista Saldo admite cuentas con saldo negativo.

### Corregido

- Los movimientos con fecha sin hora ya no se agrupan en el día anterior.
- La vista Saldo no muestra importes antes de crear la cuenta.

## [2.1.1] - 2026-11-20

### Corregido

- El ojo que oculta saldos también oculta Todas las cuentas, cada cuenta y los movimientos del inicio.

## [2.1.0] - 2026-11-20

### Añadido

- El splash anima al cerdo y la moneda.
- El balance del inicio hace un conteo ascendente.

### Mejorado

- El splash aparece antes y el arranque es más rápido.
- El conteo se reproduce una vez por sesión y respeta la reducción de movimiento.
- Las animaciones usan una sola librería y la app pesa menos.

### Corregido

- El ícono adaptativo de Android coincide con el arte de Play Store.

## [2.0.4] - 2026-11-18

### Mejorado

- Selectores de cuenta y categoría unificados en movimientos y recordatorios, con búsqueda y hoja inferior.
- Los formularios usan chips de cuenta cuando hay pocas y una fila con hoja inferior cuando hay muchas.
- Los segmentos de ingreso/gasto y los filtros de movimientos usan fondos suaves con texto de alto contraste en modo claro.
- El botón Guardar movimiento usa el color principal del tema.
- Mejor contraste y jerarquía en el resumen de cuenta, el indicador de rendimiento y las tarjetas del inicio.
- La navegación entre pestañas usa un fundido breve y respeta la reducción de movimiento.

### Corregido

- El selector de categorías ya no requiere desplazamiento horizontal.
- La app admite rotación y ya no declara la pantalla vertical como requisito obligatorio, ampliando la disponibilidad en Google Play.

## [2.0.3] - 2026-11-17

### Mejorado

- Selector de tipo unificado en movimientos y recordatorios.
- Chips, tarjetas y botones con áreas táctiles de al menos 44 pt y etiquetas accesibles.
- Fechas, cuentas y movimientos respetan el idioma y la configuración regional.
- Se unificaron los estados presionados de la interfaz.

### Cambiado

- Se reemplazaron los TouchableOpacity restantes por Pressable.

### Corregido

- Los botones y segmentos de ingreso y gasto tienen mejor contraste en modo claro.
- El punto de color de la categoría se distingue sobre el chip seleccionado.
- Guardar el tema ya no puede fallar por una base de datos bloqueada.
- Ya no aparece el aviso de splash al usar Expo Go.

## [2.0.2] - 2026-11-17

### Añadido

- Selector de fecha con calendario en recordatorios.
- Selector de hora con ruedas de hora y minuto.

### Mejorado

- Fecha y hora se eligen en una hoja inferior.
- Los selectores respetan el idioma y el tema.
- El calendario inicia en lunes en español.

### Cambiado

- orn-ui actualizado a 0.3.1.

## [2.0.1] - 2026-11-09

### Corregido

- El teclado ya no tapa los campos del formulario de recordatorios.
- El botón Guardar recordatorio permanece visible con el teclado abierto.

### Mejorado

- "Siguiente" recorre los campos y "Listo" cierra el teclado.
- El selector de categorías usa una fila con hoja inferior y búsqueda.
- La búsqueda de categorías ignora mayúsculas y acentos.
- El selector de cuentas usa chips o fila según la cantidad.

## [2.0.0] - 2026-11-09

Versión mayor por la nueva función de recordatorios. Tus datos existentes no cambian.

### Añadido

- Nuevos recordatorios de gastos e ingresos.
- Notificaciones locales para avisar de cada recordatorio.
- Toca una notificación para registrar el movimiento.
- El monto de los recordatorios ahora es opcional.
- Los recordatorios archivados se pueden eliminar con confirmación.
- Nueva nota sobre el ahorro de batería del teléfono.
- Nuevo ícono para las notificaciones de recordatorios.

### Corregido

- Las notificaciones de recordatorios ya no se duplican.
- Al conceder notificaciones ya no aparece un aviso adicional.
- El encabezado de recordatorios ya no muestra un bloque vacío.
- Los respaldos aceptan cuentas con saldo negativo.

## [1.6.7] - 2026-11-04

### Corregido

- El teclado ya no tapa los campos ni el botón de guardar en los formularios de movimiento y cuenta.
- El enlace de privacidad ya aparece en Acerca de.

## [1.6.6] - 2026-11-01

Versión para la prueba cerrada.

### Añadido

- Nueva política de privacidad.

### Mejorado

- La pantalla de licencias abre más rápido y ya no apila pantallas al tocar varias veces.
- Nuevo splash y nuevos íconos.

## [1.6.5] - 2026-10-31

Migración del proyecto a npm.

### Cambiado

- Dependencias y scripts usan npm en lugar de pnpm.
- README actualizado con los comandos de npm.
- React Native actualizado a 0.88.1.
- La generación de licencias lee `package-lock.json`.

### Corregido

- La pantalla de licencias aparece al instante con un indicador de carga.
- El catálogo de licencias se genera agrupado y ordenado.
- Los toques repetidos ya no apilan la pantalla de licencias.

## [1.6.4] - 2026-10-31

Nuevo ícono, splash y arranque más consistente.

### Añadido

- Ícono de app 1024 y variantes adaptive y monochrome.
- Splash con variantes clara y oscura.
- Nombre visible `Flux Balance`.

### Cambiado

- El splash espera base de datos, preferencias y moneda.
- Tope de 8 s con pantalla de error si el arranque falla.

### Corregido

- La moneda guardada ya no parpadea al iniciar.

## [1.6.3] - 2026-10-31

Alertas migradas a orn-ui y atribución de licencias.

### Cambiado

- Alertas y confirmaciones usan orn-ui.
- Las alertas respetan el tema y el idioma.
- Licencias de terceros incluye orn-ui, versión y MIT.

### Añadido

- `THIRD_PARTY_LICENSES.md` con la atribución de orn-ui.

## [1.6.2] - 2026-10-30

Exportación e importación rediseñadas con opciones JSON/Excel y sin respaldo previo.

## [1.6.1] - 2026-10-30

Exportación e importación de respaldos en Excel.

### Añadido

- Exportar e importar copias de seguridad en Excel.
- Hojas de cuentas, categorías y movimientos en español e inglés.
- Plantilla de Excel cuando faltan hojas o columnas.
- Se conservan depósitos a plazo y movimientos divididos.
- Errores de importación con hoja y fila.
- Respaldo automático antes de reemplazar los datos.

### Corregido

- La importación de Excel lee el archivo elegido en Android y Expo Go.

## [1.6.0] - 2026-10-29

Exportación e importación de copias de seguridad.

### Añadido

- Exportar cuentas, categorías, movimientos y moneda a un JSON.
- Importar un respaldo con validación, resumen y confirmación.
- Respaldo automático antes de reemplazar los datos.
- Reemplazo transaccional de todos los datos.

### Corregido

- La importación lee el archivo elegido en Android y Expo Go.

## [1.5.5] - 2026-10-29

Ajustes reorganizados y reinicio de datos seguro.

### Añadido

- Sección Datos con Reiniciar datos.
- Doble confirmación escribiendo BORRAR o DELETE.
- Reinicio transaccional que conserva moneda, tema e idioma y restaura las categorías por defecto.
- Pruebas de visibilidad, confirmación y rollback.

### Cambiado

- Modo desarrollador solo conserva Cargar datos demo.
- Modo desarrollador sigue oculto en producción.
- Datos queda visible en producción.
- Tras reiniciar, la app vuelve al inicio y actualiza todas las pantallas sin reiniciar.

## [1.5.4] - 2026-10-28

Sección Acerca de y catálogo de licencias.

### Añadido

- Sección Acerca de con versión, código abierto, licencias y apoyo.
- Pantalla de licencias de terceros agrupada por licencia.
- Buscador de paquetes y textos de licencia colapsables.
- Apoyo voluntario mediante Ko-fi.
- Licencia MIT del proyecto y enlace al archivo `LICENSE`.

## [1.5.3] - 2026-10-28

Contraste AA en chips de Stats y ajustes visuales.

### Corregido

- Chips de porcentaje de Stats con texto blanco y fondo oscurecido hasta contraste AA; el donut mantiene el color original.
- Check del selector de color de categorías legible sobre cualquier muestra.

### Cambiado

- El total del donut se ajusta al diámetro interior.
- El placeholder de importe usa el separador decimal del idioma (`0,00` / `0.00`).

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
