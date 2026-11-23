# Diseño de Flux Balance

Reglas de UI extraídas de correcciones del usuario. Antes de construir o cambiar UI, leer este archivo.

## Surfaces

- **Antes de crear un formulario, replicar la estructura de una pantalla existente** (`Record expense`, `New reminder`). No inventar patrones nuevos.
  Why: *inferido* — el usuario corrigió repetidamente que los formularios nuevos no se parecían a los ya construidos.
  <!-- 2026-11-23: "no te estás fijando en lo que ya está construido" -->

## Color

- **Todo icono lucide pasado como nodo a `IconButton` lleva `color` explícito con un token.** La prop `color` de `IconButton` se ignora cuando se pasa un nodo `icon`.
  Why: en tema oscuro los iconos sin color caen al negro y casi no se ven.
  <!-- 2026-11-23: "los íconos casi ni se ven en dark" -->

- **El botón destructive en tema oscuro usa `colors.error` (`#be123c`) con `colors.onError` (`#fff1f2`).** Nunca `#f43f5e`.
  Why: el rojo saturado original no queda bien en dark y el usuario pidió mejor contraste; el par actual da 5.72:1.
  <!-- 2026-11-23: "en dark el rojo no queda o no hace buen contraste" -->

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

- **Las confirmaciones usan `appConfirm`. Está prohibido usar `appAlert` con botones de cancelar/confirmar.**
  Why: en Android `appAlert` con dos botones cae al diálogo nativo del sistema, que no sigue el tema de la app.
  <!-- 2026-11-23: "esto no debe ser el nativo mira los demás componentes" -->

- **Los campos de fecha usan `DatePicker` con `minDate={new Date()}`. Nunca un `TextInput` con formato `YYYY-MM-DD`.**
  Why: *inferido* — el usuario señaló el date-picker del formulario de recordatorios y pidió que no se pudiera elegir una fecha pasada.
  <!-- 2026-11-23: "fíjate en el formulario de reminders ahí tengo un componente de calendario… que no le deje seleccionar una fecha del pasado" -->
