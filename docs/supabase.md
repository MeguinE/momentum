# Sincronización de Momentum

Proyecto conectado: `vmqyundwumsvsvynvsva`.
Aplicación: https://momentum-blond-tau.vercel.app

## Usarlo
1. En el navegador donde tienes tu progreso actual, abre Mi perfil → Cuenta y sincronización.
2. Elige **Continuar con Google** o solicita un enlace por correo y ábrelo en ese mismo navegador.
3. Si la cuenta está vacía, elige **Vincular mi progreso actual**.
4. En el otro dispositivo, abre Mi perfil y entra con la misma cuenta. Cargará el progreso asociado.
5. Puedes usar **Cargar y sincronizar** desde Mi perfil para recuperar y enviar avances. Espera el indicador **Sincronizado** antes de cerrar cuando acabes de registrar algo.

La copia local original se conserva. Iniciar sesión en una cuenta existente carga los datos de esa cuenta; no mezcla automáticamente los hábitos base de un dispositivo nuevo. Si ya tenías progreso distinto en dos dispositivos, exporta ambos respaldos antes de vincularlos. Importar un respaldo en una sesión abierta reemplaza el documento de la cuenta y se sincroniza.

## Configuración
- `src/lib/cloud/project.ts` contiene solo la URL y la clave **publishable**, destinadas al navegador. Se incluyen en Git para que el despliegue existente de Vercel funcione sin secretos de compilación.
- Opcionalmente se pueden sustituir con `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ambas juntas).
- Nunca incluir `service_role`, claves `sb_secret_`, contraseñas ni tokens de la CLI en el código, Vercel público o Git.
- Migraciones: `npx supabase db push --linked`.
- Revisar configuración antes de aplicarla: `npx supabase config diff`; aplicar: `npx supabase config push`. El archivo administra únicamente las URL de autenticación.
- El acceso con Google requiere habilitar el proveedor en Supabase Authentication → Providers → Google. En el cliente OAuth web de Google configura `https://vmqyundwumsvsvynvsva.supabase.co/auth/v1/callback` como URI de redirección autorizada y guarda el Client ID y Client Secret únicamente en Supabase; nunca en Git ni en variables `PUBLIC_`.
- Supabase enlaza automáticamente Google con una identidad existente que tenga el mismo correo verificado, conservando el mismo progreso.
- El acceso alternativo usa enlaces de correo de Supabase Auth. El servicio de correo predeterminado tiene límites y restricciones; para usuarios ajenos al equipo del proyecto configura SMTP propio. Ver https://supabase.com/docs/guides/auth/auth-smtp.

## Cómo se conserva el progreso
Una fila por usuario contiene hábitos, historial y las notas/marcas de aprendizaje. RLS limita las lecturas al dueño; las escrituras se realizan mediante una función que toma el usuario de la sesión, nunca del navegador, y comprueba una revisión atómica.

Cada cambio se guarda primero en una copia local por cuenta. Tras 600 ms se intenta enviar; se comprueba la nube cada 15 s mientras la página está visible y al volver a la pestaña o recuperar conexión. Esto permite seguir registrando en una página ya abierta sin red; no convierte el sitio en una PWA capaz de abrirse desde cero sin internet.

Cambios independientes se combinan mediante tres versiones (última sincronizada, local, remota). Si chocan en el mismo hábito, registro diario o ruta, se detiene la edición y se ofrece elegir una versión; las alternativas se respaldan localmente y pueden descargarse. Los totales no se suman automáticamente, para evitar duplicar minutos.

Solo una pestaña por cuenta y navegador edita a la vez (Web Locks). La laptop y el celular sí pueden trabajar simultáneamente. La cola local resiste recargas; no se descarta al fallar la red. No se permite cerrar sesión con cambios pendientes. Una sesión caducada conserva su copia pendiente por cuenta para recuperarla al volver a entrar.

Las notas son texto; no se suben archivos adjuntos. El tema visual sigue siendo propio de cada navegador.

## Verificación
- `npm test`: incluye permisos y revisión atómica ejecutados en PostgreSQL local (PGlite), mezcla de cambios y ciclo del sincronizador con cortes de red y cambios de cuenta.
- `npx astro check` y `npm run build`.
- Comprobación manual final: entrar con el mismo correo en dos dispositivos, registrar en uno, volver al otro y confirmar el total. Repetir con una nota de una ruta.
