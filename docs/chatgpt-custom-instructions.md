# Instrucciones personalizadas para ChatGPT - Rastreador de Hábitos

Pega este contenido como "Custom Instructions" / "Project Instructions" en
un proyecto o GPT personalizado de ChatGPT dedicado a este repositorio.
ChatGPT no tiene un sistema de "skills" instalables como Kiro; este
documento es el equivalente funcional: un bloque de instrucciones que el
modelo debe seguir en toda la conversación.

---

Estás ayudando a desarrollar "Rastreador de Hábitos", una app Astro +
React de un solo usuario, sin backend, con datos en `localStorage`. Sigue
estas reglas en cualquier código, revisión o sugerencia que hagas para
este proyecto:

## Astro

- Usa `.astro` para todo lo que no necesita interactividad en el cliente.
- Toda isla que lea `localStorage` usa **`client:only="react"`**, nunca
  `client:load`/`client:visible` (el servidor no tiene `localStorage`; si
  se renderiza ahí con datos vacíos, React detecta un mismatch de
  hidratación al llegar al cliente con los datos reales).
- Para islas sin esa dependencia: `client:visible`/`client:idle` por
  defecto; `client:load` solo si deben responder de inmediato al cargar.
- TypeScript en modo `strict`, sin `any` implícito.
- Estructura de carpetas por dominio:
  `src/components/{habits,calendar,stats,ui}/`,
  `src/lib/{storage,stores,utils}/`, `src/layouts/`, `src/pages/`.

## React

- Solo componentes funcionales con hooks, respetando sus reglas.
- Memoiza solo cuando hay un costo de cálculo real que lo justifique.
- Accesibilidad obligatoria: `aria-label` en controles sin texto visible,
  calendario navegable por teclado, alternativa textual para cada
  gráfica, `focus-visible` en elementos interactivos.
- Tests con Vitest + React Testing Library, centrados en comportamiento.

## Diseño claro/oscuro

- Tailwind con `darkMode: "class"`; tema persistido en `localStorage`
  (`habit-tracker:theme`), con `prefers-color-scheme` como default inicial.
- Paleta (ver `docs/design.md` para el detalle completo):
  - Progreso/en curso: azul/sky.
  - Cumplido: verde esmeralda.
  - Racha/logro: ámbar.
  - No cumplido: gris neutro, **nunca rojo**.
- Contraste AA (4.5:1 mínimo) obligatorio en ambos modos.

## Principios psicológicos (requisitos de producto, no detalles estéticos)

1. Racha visible + heatmap mensual tipo GitHub ("don't break the chain").
2. Refuerzo positivo sin culpa: sin mensajes de "fallaste", sin rojo para
   días no cumplidos.
3. Fricción mínima para registrar un hábito (un tap/click; "hoy" siempre
   primero).
4. Retroalimentación visual de progreso (barras, %, mejor racha).
5. Campo opcional "por qué" para anclar el hábito a una identidad
   (concepto de *Atomic Habits*).

## Datos y persistencia

- Toda lectura/escritura de datos pasa por una única capa de storage
  (`src/lib/storage/storage.ts`), nunca accedas a `localStorage`
  directamente desde componentes.
- El modelo de datos (`Habit`, `HabitLog`) y la versión de esquema están
  en `docs/design.md`; cualquier cambio de modelo debe reflejarse ahí.
- Hay una función de exportar/importar JSON como respaldo manual; no se
  usa backend ni Docker en esta versión.

## Testing

- TDD en lógica pura (storage, cálculo de rachas, agregaciones): el test
  va antes del código.
- Simula `localStorage` en los tests, no dependas de un navegador real.

Si una sugerencia tuya rompe alguno de estos puntos, señálalo
explícitamente en vez de aplicarlo en silencio.
