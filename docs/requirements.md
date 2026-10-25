# Requisitos - Rastreador de Hábitos

## Problema a resolver

App web para un solo usuario (sin login) que permite crear hábitos
personalizados (lectura, estudio, u otros), registrar su cumplimiento diario,
visualizar el progreso en calendario/gráficas/tablas, con un diseño moderno
(modo claro y oscuro) que use principios de psicología del comportamiento
para facilitar la formación de hábitos.

## Alcance

### Incluido en esta versión

- Un solo usuario, sin autenticación.
- Stack: Astro + React (islas de interactividad), sin backend.
- Persistencia en `localStorage` del navegador.
- Exportar/importar un respaldo en JSON (mitiga el riesgo real de pérdida:
  borrado accidental de caché/datos del navegador).
- Hábitos con valor/cantidad, no solo sí/no: cada hábito puede tener su
  propia unidad (ej. páginas, minutos) y una meta diaria opcional.
- Calendario para marcar cumplimiento de cada día, incluyendo de forma
  retroactiva.
- Dashboard con gráficas y tablas de progreso.
- Modo claro y oscuro, con el tema elegido persistido entre sesiones.

### Fuera de alcance (edición 2)

- Backend con base de datos (ej. Supabase).
- Multiusuario / autenticación.
- Contenedorización con Docker.
- Despliegue en Vercel/Netlify.

## Decisiones clave y por qué

| Decisión | Alternativas consideradas | Por qué esta opción |
|---|---|---|
| localStorage en vez de backend/Docker | Backend + SQLite en volumen Docker | Un solo usuario, sin necesidad de acceso multi-dispositivo ahora; más simple y rápido de construir. El riesgo real de pérdida es borrado manual de caché, no corrupción espontánea, así que se mitiga con export/import en vez de montar un backend. |
| Hábitos con cantidad/unidad | Solo booleano sí/no | El usuario quiere metas medibles (ej. páginas leídas, minutos de estudio), no solo marcar como hecho. |
| nanostores para estado compartido | Context de React, prop drilling | Astro hidrata cada isla de forma aislada; nanostores es la solución recomendada por Astro para compartir estado entre islas sin acoplar todo a un solo framework. |
| Días no cumplidos en gris, nunca en rojo | Rojo/alerta para incumplimiento | Principio de refuerzo positivo sin culpa: evitar el diseño basado en culpa que desmotiva la formación de hábitos. |

## Criterios de éxito

- Se pueden crear, editar, archivar y eliminar hábitos personalizados.
- Se puede registrar el cumplimiento de hoy en un clic/tap.
- Se puede corregir el cumplimiento de un día pasado desde el calendario.
- El dashboard, el calendario y las estadísticas reflejan los mismos datos
  de forma consistente.
- Los datos sobreviven a recargar la página y a cerrar/abrir el navegador.
- Existe una forma de exportar e importar un respaldo completo en JSON.
- La app es usable y legible tanto en modo claro como en modo oscuro.
