# Momentum

Pequeños pasos. Grandes cambios.

Momentum es una app web para construir hábitos, aprender de forma guiada
(inglés, japonés, Java) y cuidar rutinas de bienestar básicas. Todo corre
en el navegador: tus datos viven en `localStorage`, sin backend ni
cuentas, con exportar/importar como respaldo manual.

## Stack

- [Astro](https://astro.build) (salida estática) + islas de [React](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [nanostores](https://github.com/nanostores/nanostores) para estado compartido entre islas
- [date-fns](https://date-fns.org) para fechas y rachas
- [recharts](https://recharts.org) para las gráficas de `/stats`
- [Vitest](https://vitest.dev) + React Testing Library

Ver `docs/design.md` para el detalle de arquitectura y sistema de diseño.

## Desarrollo

```sh
npm install
npm run dev        # http://localhost:4321
npm run test       # suite de Vitest
npm run astro check # chequeo de tipos de Astro
npm run build       # build de producción en ./dist/
npm run preview     # sirve el build localmente
```

## Desplegar

Es un sitio 100% estático (`output: "static"` en `astro.config.mjs`), sin
variables de entorno ni backend. Tanto [Vercel](https://vercel.com) como
[Netlify](https://netlify.com) detectan Astro automáticamente:

- **Build command:** `npm run build`
- **Output directory:** `dist`

Conecta el repositorio desde el dashboard de la plataforma elegida, o usa
su CLI (`vercel` / `netlify deploy`) desde la raíz del proyecto.

## Datos y privacidad

No hay servidor: todo se guarda en `localStorage` del navegador. Desde
`/settings` se puede exportar un respaldo en JSON y volver a importarlo
(por ejemplo, si cambias de navegador o quieres migrar tus datos).

## Licencia

[MIT](./LICENSE)
