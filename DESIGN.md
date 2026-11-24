# Diseño de Flux Balance

Reglas de UI extraídas de correcciones del usuario. Antes de construir o cambiar UI, leer este archivo.

## Surfaces

- **Antes de crear un formulario, replicar la estructura de una pantalla existente** (`Record expense`, `New reminder`). No inventar patrones nuevos.
  Why: *inferido* — el usuario corrigió repetidamente que los formularios nuevos no se parecían a los ya construidos.
  <!-- 2026-11-23: "no te estás fijando en lo que ya está construido" -->

- **Cada sección del home lleva una sola `Card`**, con las filas separadas por divisores finos, nunca Cards apiladas.
  Why: los bordes repetidos y las sombras múltiples hacían que el home pareciera generado y desordenado.
  <!-- 2026-11-23: aprobado en el pulido de "Próximos recordatorios", "Anticipaciones" y "Metas" -->

- **Las listas largas se paginan en bloques de 20 con «Ver más movimientos».**
  Why: renderizar cientos de filas de una vez castiga el scroll en Android.
  <!-- 2026-11-23: aprobado en la evaluación crítica (rendimiento) -->

- **Todas las Cards usan `colors.surface`, igual que la barra inferior.** La elevación se expresa con sombra, nunca con un fondo más claro.
  Why: en dark la cuenta seleccionada y las cards quedaban más claras que la navegación y rompían la paleta.
  <!-- 2026-11-23: "el color de las cards es igual al del seleccionada y diferente al del bottom navigationbar eso también hay que corregir" -->

- **El azul del hero en la status bar se desvanece durante los primeros 100 px de scroll; luego el área usa el fondo del tema.**
  Why: el azul acompaña al balance arriba, pero estorba cuando el contenido ya scrolleó; el cambio sigue al dedo en vez de ser decoración.
  <!-- 2026-11-23: "ese azul superior es molestoso" / "asimilar el comportamiento de Flutter" -->

- **La `Card` de una sección del home es navegable a su pantalla; no lleva un enlace adicional.**
  Why: el usuario pidió simplificar: el mismo gesto que abre Metas debe abrir Recordatorios y Anticipaciones, sin un «Ver todos» ni «Ver presupuestos» separados.
  <!-- 2026-11-23: "quitar eso de esas 3 y que tenga la misma funcionalidad que el de metas navegar a su pantalla" -->

- **Si una sección muestra más de un elemento, el encabezado incluye el conteo.**
  Why: el usuario necesita saber cuántos avisos hay sin leerlos uno por uno.
  <!-- 2026-11-23: aprobado en el pulido del home -->

- **Las Cards del carrusel de cuentas son compactas y no repiten etiquetas ni badges decorativos.**
  Why: «Todas las cuentas» aparecía dos veces y, al quitar la insignia de rendimiento, quedaban huecos muertos por una altura fija antigua.
  <!-- 2026-11-23: aprobado en la simplificación del home y cuentas -->

## Color

- **Todo icono lucide pasado como nodo a `IconButton` lleva `color` explícito con un token.** La prop `color` de `IconButton` se ignora cuando se pasa un nodo `icon`.
  Why: en tema oscuro los iconos sin color caen al negro y casi no se ven.
  <!-- 2026-11-23: "los íconos casi ni se ven en dark" -->

- **El botón destructive en tema oscuro usa `colors.error` (`#be123c`) con `colors.onError` (`#fff1f2`).** Nunca `#f43f5e`.
  Why: el rojo saturado original no queda bien en dark y el usuario pidió mejor contraste; el par actual da 5.72:1.
  <!-- 2026-11-23: "en dark el rojo no queda o no hace buen contraste" -->

- **El color de ingreso/gasto vive en el importe, no en el fondo del icono.** Los iconos de las cards van en `colors.primarySoft` sobre `colors.primaryText`.
  Why: los círculos verde/rojo competían entre sí y hacían ruido; el importe ya comunica el tipo con signo y color.
  <!-- 2026-11-23: aprobado en el pulido del home -->

- **El progreso usa `colors.primary` sobre `colors.controlTrack`.** No se introducen colores nuevos para barras ni anillos.
  Why: el usuario pidió usar solo los colores del tema y organizar los existentes.
  <!-- 2026-11-23: aprobado en el pulido del home -->

- **La distribución usa una sola familia de acento con opacidades; los badges de estado no usan fondos semánticos.**
  Why: el usuario pidió menos colores sueltos; el `Zap` verde y la barra multicolor competían con el saldo.
  <!-- 2026-11-23: aprobado en la simplificación de cuentas -->

## Spacing & layout

- **Toda hoja con botón primario lleva `bottomPaddingExtra={16}` y el formulario `paddingBottom: spacing.xl`.**
  Why: *inferido* — el botón quedaba pegado al teclado en el modal.
  <!-- 2026-11-23: "un poquito de padding sobre el botón de guardar o Aceptar en la captura" -->

- **Los formularios no envuelven los campos en `Card`, no repiten el título de la pantalla en un `SectionLabel`, y sus placeholders son valores de ejemplo, no la etiqueta del campo.** Los inputs usan `colors.inputBackground`, radio 16, `minHeight: 52` y `fontWeight: 600`.
  Why: *inferido* — el simulador seguía viéndose distinto de los formularios existentes pese a haber igualado tokens.
  <!-- 2026-11-23: "el formulario del simulador sigue siendo diferente", "aplica los mismos estilos" -->

## Interaction

- **Las acciones de fila (editar/borrar) usan `IconButton` con nodo de icono, nunca botones de texto.**
  Why: *inferido* — los botones de texto rompían la homogeneidad con el resto de la app.
  <!-- 2026-11-23: "en el edit y el delete en lugar de texto sería mejor con íconos" -->

- **Las acciones principales de una sección llevan nombre; el icono solo acompaña.** El patrón es `Ver todos ›`, `Ver presupuestos ›`, `Nuevo`.
  Why: un botón con solo `+` obliga a adivinar; nombrarlo hace la interfaz predecible y profesional.
  <!-- 2026-11-23: aprobado en el pulido del home -->

- **El texto respeta el escalado del sistema, las filas interactivas llevan etiqueta y los backdrops son invisibles al lector de pantalla.**
  Why: la accesibilidad no puede depender de que el usuario adivine qué anuncia cada control.
  <!-- 2026-11-23: aprobado en la evaluación crítica (accesibilidad) -->

- **Los formularios largos conservan un borrador en `app_settings`; los términos del dominio llevan ayuda contextual.**
  Why: una interrupción no debe destruir lo escrito y «anticipaciones», «cerebro local» o «TNA» no deben exigir memoria previa.
  <!-- 2026-11-23: aprobado en la evaluación crítica (borrador y ayuda) -->

- **Las confirmaciones usan `appConfirm`. Está prohibido usar `appAlert` con botones de cancelar/confirmar.**
  Why: en Android `appAlert` con dos botones cae al diálogo nativo del sistema, que no sigue el tema de la app.
  <!-- 2026-11-23: "esto no debe ser el nativo mira los demás componentes" -->

- **Los campos de fecha usan `DatePicker` con `minDate={new Date()}`. Nunca un `TextInput` con formato `YYYY-MM-DD`.**
  Why: *inferido* — el usuario señaló el date-picker del formulario de recordatorios y pidió que no se pudiera elegir una fecha pasada.
  <!-- 2026-11-23: "fíjate en el formulario de reminders ahí tengo un componente de calendario… que no le deje seleccionar una fecha del pasado" -->
