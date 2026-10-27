<div align="center">

# 🌱 Momentum

**Pequeños pasos. Grandes cambios.**

Un espacio personal para construir hábitos, aprender inglés, japonés y Java,
y continuar con el mismo progreso desde tu celular y tu laptop.

[Usar Momentum](https://momentum-blond-tau.vercel.app) · [Mi perfil](https://momentum-blond-tau.vercel.app/profile)

[![License: MIT](https://img.shields.io/badge/license-MIT-397257.svg)](./LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7-ff5d01.svg?logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=white)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_y_Postgres-3ecf8e.svg?logo=supabase&logoColor=white)](https://supabase.com)

</div>

## Qué incluye

- **Mi día:** hábitos visibles, progreso diario, registro rápido, corrección del total y deshacer el último cambio.
- **Hábitos personalizados:** marcar como hecho, contar cantidades o registrar minutos. Metas, iconos, colores y motivación editables.
- **Aprendizaje guiado:** rutas de inglés, japonés y Java con explicaciones, materiales, prácticas, repasos y evidencia. Temario desplegable y acceso al siguiente paso pendiente.
- **Bienestar:** hábitos iniciales de higiene personal, cepillado y movimiento, con metas ajustables.
- **Calendario y estadísticas:** historial, rachas, cumplimiento y mapa de actividad.
- **Mi perfil:** identidad de la cuenta, resumen del progreso, carga y sincronización, cierre de sesión y respaldos.
- **Diseño adaptable:** móvil y escritorio, modo claro/oscuro y respeto a la preferencia de movimiento reducido.

Completar módulos documenta tu autoevaluación; no certifica un nivel ni suma minutos automáticamente a los hábitos.

## Vincular celular y laptop

1. Abre **Mi perfil** desde el avatar de la barra superior o el acceso de la barra lateral.
2. En el navegador que contiene tu progreso actual, elige **Continuar con Google** o solicita un enlace por correo.
3. Si tu cuenta aún está vacía, elige **Vincular mi progreso actual**.
4. En el otro dispositivo, entra con **la misma cuenta o el mismo correo**.
5. Usa **Cargar y sincronizar** para recuperar avances de la nube y enviar cambios pendientes. La sincronización también ocurre automáticamente.

El indicador superior muestra si estás en modo local, sincronizando, sin conexión o al día. Espera **Sincronizado** antes de cerrar si acabas de registrar algo.

Sin iniciar sesión puedes seguir usando la app en modo local. Entrar en una cuenta existente carga sus datos; no combina automáticamente los registros locales de un segundo dispositivo. Si ambos tienen progreso diferente, exporta sus respaldos primero.

## Datos y privacidad

- **Sin sesión:** el progreso se guarda en el navegador.
- **Con sesión:** hábitos, registros y notas/marcas de aprendizaje se guardan en tu cuenta de Supabase, con una copia local para cambios pendientes.
- Las lecturas están protegidas por **Row Level Security**. Las escrituras verifican la identidad autenticada y una revisión atómica.
- Los cambios independientes se combinan. Si dos dispositivos cambian el mismo registro de forma incompatible, se solicita elegir una versión y se conservan copias de ambas.
- Una pestaña por cuenta y navegador puede editar a la vez. Celular y laptop sí pueden usarse simultáneamente.
- El modo sin conexión permite trabajar en una página ya abierta. La app no garantiza abrirse desde cero sin internet.
- Cerrar sesión vuelve al progreso local original. No se permite hacerlo con cambios pendientes de enviar.
- El tema visual es propio de cada navegador. Las evidencias son texto; no se suben archivos adjuntos.

Puedes exportar/importar JSON desde **Mi perfil** o **Ajustes**. Importar reemplaza los datos actuales y, si tienes sesión, ese reemplazo se sincroniza también con los otros dispositivos.

## Desarrollo local

Requiere **Node.js 22.23.4 o posterior** y npm.

```sh
npm ci
npm run dev
```

| Comando | Función |
|---|---|
| `npm run dev` | Servidor local en el puerto 4321 |
| `npm run build` | Compilar en `dist/` |
| `npm run preview` | Revisar la compilación local |
| `npm test` | Pruebas de componentes, datos, sincronización y permisos SQL |
| `npx astro check` | Comprobar tipos de Astro y TypeScript |

## Supabase y despliegue

El frontend es estático y se despliega en **Vercel**. **Supabase Auth y PostgreSQL** proporcionan las cuentas y la persistencia compartida.

Este repositorio incluye en `src/lib/cloud/project.ts` la URL y la clave **publishable** del proyecto de Momentum. Son configuración pública del navegador, no credenciales administrativas. Si haces un fork, configura tu propio proyecto antes de utilizarlo.

Para conectar otro proyecto:

1. Copia `.env.example` a `.env.local` y completa **ambas** variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
2. Inicia sesión con `npx supabase login` y vincula tu proyecto con `npx supabase link --project-ref TU_REFERENCIA`.
3. Aplica la migración con `npx supabase db push --linked`.
4. Ajusta las URL de tu despliegue y de `/profile` en `supabase/config.toml`. Revisa con `npx supabase config diff` antes de ejecutar `npx supabase config push`.
5. Configura esas dos variables públicas también en Vercel y vuelve a desplegar.

Nunca uses una clave `service_role`, `sb_secret_` o un token de la CLI en variables `PUBLIC_` ni en archivos versionados.

| Ajuste en Vercel | Valor |
|---|---|
| Framework | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |

El correo de acceso depende de Supabase. Su servicio predeterminado tiene restricciones; para usuarios fuera del equipo del proyecto configura SMTP propio.

## Stack y documentación

Astro + React + TypeScript, Tailwind CSS, nanostores, date-fns, Recharts, Lucide y Supabase. Pruebas con Vitest, React Testing Library y PostgreSQL local mediante PGlite.

- [Configuración y funcionamiento de Supabase](./docs/supabase.md)
- [Diseño del sistema](./docs/design.md)

## Licencia

[MIT](./LICENSE) © Guillermo Díaz Ramos
