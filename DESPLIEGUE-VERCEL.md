# CEINCO en Vercel y Neon

Despliega desde la carpeta que contiene `vercel.json`, `api/`, `backend/` y `H_CLINICA/`. El paquete incluye ambos proyectos. En Vercel selecciona **Other** como framework y usa la raíz del paquete como **Root Directory**. La configuración versionada instala ambos proyectos y compila React con Node.js 24. La interfaz llama a `/api` en el mismo dominio.

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

Para generar cada secreto puedes ejecutar `openssl rand -hex 32`. Para que un entorno Preview use datos de prueba separados, configura sus credenciales con una rama independiente de Neon.

## Base de datos

La base migrada ya contiene las tablas clínicas y los datos de demostración. Ejecuta `backend/postgres/vercel.sql` en la consola SQL de Neon si el destino todavía carece de `adjuntos_examen` o `intentos_login`. Esta migración es aditiva y se puede volver a ejecutar.

Los adjuntos se guardan en Neon y su descarga requiere sesión. El límite por archivo en Vercel es **4 MiB** para dejar espacio a los campos del formulario multipart. Los adjuntos históricos guardados en un volumen local requieren transferir su contenido a Neon para que estén disponibles en Vercel.

## Publicación

Desde la raíz del paquete, vincula el proyecto con `vercel link` y crea un preview con `vercel deploy`. En el preview comprueba `/api/health`, el inicio de sesión, una recarga directa de `/pacientes` y la carga y descarga de un adjunto de prueba. Publica con `vercel deploy --prod` cuando el preview esté validado.

El paquete de código excluye las credenciales, volúmenes, registros y dependencias instaladas.
