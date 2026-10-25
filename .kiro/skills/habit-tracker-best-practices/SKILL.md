---
name: habit-tracker-best-practices
description: Reglas de buenas prácticas de Astro, React y del sistema de diseño (claro/oscuro, principios psicológicos) para el proyecto Rastreador de Hábitos. Úsalo cuando implementes o revises código de este proyecto.
---

# Buenas prácticas - Rastreador de Hábitos

Reglas a seguir al escribir o revisar código de este proyecto. Ver
`docs/design.md` para el detalle completo de arquitectura y sistema de
diseño; este documento es el resumen operativo para trabajar día a día.

## Astro

- Usa `.astro` para todo lo que no necesita interactividad en el cliente
  (layouts, estructura de página, texto estático).
- Regla dura: toda isla que lea `localStorage` (directo o vía
  `habitsStore`/`themeStore`) usa **`client:only="react"`**, nunca
  `client:load` ni `client:visible`. El servidor no tiene `localStorage`;
  si la isla se renderiza en el servidor con datos vacíos y en el cliente
  con datos reales, React detecta un mismatch de hidratación y regenera el
  árbol de forma inestable (bug real visto en este proyecto, no solo
  teórico).
- Para islas sin dependencia de `localStorage`, usar `client:visible` o
  `client:idle` por defecto; `client:load` solo si deben responder de
  inmediato al cargar.
- TypeScript en modo `strict`. No uses `any` implícito.
- Estructura de carpetas por dominio:
  ```
  src/
    components/{habits,calendar,stats,ui}/
    lib/{storage,stores,utils}/
    layouts/
    pages/
  ```
- Las islas de React se suscriben al store de `nanostores` directamente o
  reciben props acotadas; evita pasar el store completo como prop.

## React

- Solo componentes funcionales con hooks.
- Respeta las reglas de hooks (nunca condicionales ni dentro de loops).
- Memoiza (`useMemo`/`useCallback`) solo cuando hay un costo de cálculo
  real que lo justifique, no por defecto.
- Accesibilidad obligatoria:
  - `aria-label` en controles sin texto visible.
  - Calendario navegable por teclado (flechas, Enter).
  - Alternativa textual/tabular para cada gráfica.
  - `focus-visible` en todo elemento interactivo.
- Tests con Vitest + React Testing Library, enfocados en comportamiento
  (qué ve y hace el usuario), no en detalles internos.

## Sistema de diseño: modo claro/oscuro

- Tailwind con `darkMode: "class"`.
- Tema guardado en `localStorage` (`habit-tracker:theme`); si no hay valor
  guardado, usar `prefers-color-scheme` como default inicial.
- No introducir nuevos colores fuera de la paleta de `docs/design.md` sin
  actualizar ese documento primero.
- Regla dura: un día no cumplido se muestra en gris neutro
  (`neutral-missed`), **nunca** en rojo ni con iconografía de error. Es
  parte del principio de refuerzo positivo sin culpa, no un detalle
  estético.
- Verificar contraste AA (4.5:1 mínimo para texto) en ambos modos antes de
  considerar una pantalla terminada.

## Principios psicológicos (no son decorativos, son requisitos de producto)

1. Racha visible + heatmap mensual ("don't break the chain").
2. Refuerzo positivo sin culpa (colores, sin mensajes de "fallaste").
3. Fricción mínima para registrar un hábito (un tap/click; "hoy" siempre
   primero en el dashboard).
4. Retroalimentación visual de progreso (barras, %, mejor racha).
5. Campo opcional "por qué" para anclar el hábito a una identidad.

Al implementar cualquier pantalla de hábitos, calendario o stats, revisa
que no se esté rompiendo alguno de estos cinco puntos.

## Testing

- TDD en lógica pura (`storage.ts`, cálculo de rachas, agregaciones):
  escribe el test antes del código.
- Simula `localStorage` en tests (jsdom), no dependas de un navegador real.
- Tests de comportamiento para flujos críticos: alta de hábito,
  exportar/importar.
