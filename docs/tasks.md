# Tareas - Rastreador de Hábitos

Documento vivo. Cada tarea produce un incremento funcional y demoable,
construido con TDD cuando aplica lógica pura.

- [x] Task 1: Documentación base y skills de buenas prácticas
  - `docs/requirements.md`
  - `docs/design.md`
  - `docs/tasks.md`
  - `.kiro/skills/habit-tracker-best-practices/SKILL.md`
  - `docs/chatgpt-custom-instructions.md`
  - Demo: los documentos existen; el skill de Kiro se puede activar con
    `disclose_context`.

- [x] Task 2: Scaffolding del proyecto
  - Astro + TypeScript + `@astrojs/react` + Tailwind (`darkMode: "class"`)
    + Vitest.
  - Toggle de tema claro/oscuro funcional, persistido en `localStorage`,
    con detección inicial de `prefers-color-scheme`.
  - Demo: `npm run dev` muestra un placeholder con estilos de Tailwind y el
    toggle de tema funcionando y persistiendo al recargar. `npm test` pasa
    un test trivial.

- [x] Task 3: Capa de almacenamiento (`storage.ts`)
  - Tipos `Habit` y `HabitLog`.
  - Guardar/leer sobre `localStorage`, versión de esquema, manejo de
    errores (JSON corrupto, cuota excedida).
  - Tests Vitest primero.
  - Demo: tests en verde mostrando persistencia y recuperación ante datos
    corruptos.

- [x] Task 4: Store compartido (`nanostores`) con CRUD de hábitos
  - `addHabit`, `updateHabit`, `archiveHabit`, `deleteHabit`.
  - Tests unitarios de las acciones.
  - Demo: isla React mínima que agrega un hábito de ejemplo y lo muestra
    en lista, persistiendo entre recargas.

- [x] Task 5: Página `/habits`
  - Formulario de alta (nombre, unidad, meta diaria opcional, color,
    "por qué" opcional) y lista con editar/archivar/eliminar.
  - Sistema de diseño claro/oscuro aplicado.
  - Tests de validación del formulario y renderizado de la lista.
  - Demo: crear "Lectura" y "Estudio", editarlos, eliminarlos, persistiendo
    al recargar.

- [x] Task 6: Registro diario y rachas
  - Acción de log diario (booleano o cantidad) en el store.
  - Cálculo de racha con `date-fns`.
  - Tests unitarios de casos borde de racha.
  - Demo: widget "hoy" que actualiza la racha al instante al marcar un
    hábito.

- [x] Task 7: Dashboard (`/`)
  - Widget "hoy" + tarjetas resumen (completados hoy, racha más larga,
    días desde creación).
  - Micro-interacción de refuerzo positivo al completar todos los hábitos
    del día.
  - Demo: flujo completo de registrar hábitos de hoy con feedback visual
    inmediato.

- [x] Task 8: Calendario (`/calendar`)
  - Grilla mensual, heatmap de intensidad según % de cumplimiento diario.
  - Click en día pasado para editar retroactivamente.
  - Tests de generación de la grilla y de edición retroactiva.
  - Demo: navegar entre meses, ver heatmap con datos reales, corregir un
    día pasado.

- [x] Task 9: Página `/stats`
  - Agregación semanal/mensual por hábito.
  - Gráficas con `recharts` (línea de tendencia, barras semanales) y tabla
    de rachas/% cumplimiento.
  - Tests de las funciones de agregación.
  - Demo: `/stats` con gráficas y tabla reales basadas en los datos del
    usuario.

- [x] Task 10: Exportar/Importar (`/settings`)
  - Exportar JSON (hábitos + logs + versión de esquema).
  - Importar con validación (rechaza archivo malformado o versión
    incompatible) y confirmación antes de sobrescribir.
  - Tests de serialización y validación de import.
  - Demo: exportar, borrar `localStorage`, importar y verificar
    restauración completa desde la UI.

- [x] Task 11: Pulido e integración final
  - Layout compartido con navegación entre las 5 páginas.
  - Revisión de accesibilidad (ARIA, navegación por teclado) y contraste
    en ambos modos.
  - Revisión responsive/mobile.
  - Correr toda la suite de tests.
  - Demo: app completa, navegable, accesible, funcional en mobile y
    desktop, en ambos temas.


## Ronda 2: feedback de diseño (post Task 11)

- [x] Rediseño visual "cristal" (glassmorphism): fondo con gradiente +
  paneles translúcidos con blur (clase `.glass`), barra superior fija.
- [x] Heatmap estilo GitHub (`ContributionHeatmap`) agregado al dashboard
  como forma principal de ver el progreso; `/calendar` se mantiene para
  edición retroactiva mes por mes.
- [x] Etiquetas del formulario de hábitos reescritas con ejemplos
  concretos (antes: "Sí/no, Cantidad, Duración").
- [x] Bug real encontrado y corregido: las islas que leen `localStorage`
  deben usar `client:only="react"`, no `client:load`/`client:visible`,
  para evitar errores de hidratación de React (servidor sin
  `localStorage` vs. cliente con datos reales). Documentado en
  `docs/design.md` y en el skill de Kiro.
- [x] Bug menor corregido: el calendario mensual no distinguía días
  futuros de días no cumplidos (ambos se veían como "missed"); ahora usa
  el mismo tratamiento visual que el heatmap (borde punteado, sin color).
