# CEINCO en Vercel y Neon

El proyecto tiene dos carpetas: `frontend/` (React + Vite) y `backend/` (API Express). `vercel.json` las publica como dos **Vercel Services** en un mismo proyecto: `/api/*` va al backend y el resto al frontend, que llama a `/api` en el mismo dominio. Ambos usan Node.js 24. Despliega desde la carpeta que contiene `vercel.json` con `vercel deploy` (preview) o `vercel deploy --prod`. En local: `npm run dev` en `backend/` (puerto 5000) y en `frontend/` (puerto 3000, con proxy de `/api` al backend).

## Variables de entorno

Configura estas variables en **Settings → Environment Variables** del proyecto. Utiliza los valores de la conexión agrupada de Neon. Guarda las contraseñas y los secretos como variables sensibles.

| Variable | Valor |
|---|---|
| `DB_ENGINE` | `postgres` |
| `PGHOST` | Host agrupado de Neon (contiene `-pooler`) |
| `PGDATABASE` | `neondb` |
| `PGUSER` | Usuario de Neon |
| `PGPASSWORD` | Contraseña de Neon |
| `JWT_SECRET` | Secreto aleatorio para firmar sesiones |
| `HASH_SALT` | Secreto aleatorio para los hashes de auditoría y los intentos de acceso |

Para generar cada secreto puedes ejecutar `openssl rand -hex 32`. Hoy las variables solo existen en **Production**: un preview arranca, pero sin base de datos. Para probar previews, configura sus credenciales con una rama independiente de Neon.

## Base de datos

La base migrada ya contiene las tablas clínicas y los datos de demostración. Ejecuta `backend/postgres/vercel.sql` en la consola SQL de Neon si el destino todavía carece de `adjuntos_examen` o `intentos_login`. Esta migración es aditiva y se puede volver a ejecutar.

Los adjuntos se guardan en Neon y su descarga requiere sesión. El límite por archivo en Vercel es **4 MiB** para dejar espacio a los campos del formulario multipart. Los adjuntos históricos guardados en un volumen local requieren transferir su contenido a Neon para que estén disponibles en Vercel.

## Publicación

Desde la raíz del paquete, vincula el proyecto con `vercel link` y crea un preview con `vercel deploy`. En el preview comprueba `/api/health`, el inicio de sesión, una recarga directa de `/pacientes` y la carga y descarga de un adjunto de prueba. Publica con `vercel deploy --prod` cuando el preview esté validado.

El paquete de código excluye las credenciales, volúmenes, registros y dependencias instaladas.
