# CEINCO HCI · Historia Clínica Electrónica

Sistema web de historia clínica para el consultorio **CEINCO**: pacientes, citas, consulta médica completa
(signos vitales, antecedentes, consulta, diagnósticos CIE-10, receta en PDF, examen físico y exámenes
auxiliares), reportes y gestión de usuarios con roles **administrador**, **doctor** y **asistente**.

| Carpeta | Contenido | Documentación |
|---|---|---|
| [`backend/`](backend/) | API REST · Node.js 24 + Express 5 · PostgreSQL (Neon) o MariaDB | [backend/README.md](backend/README.md) |
| [`frontend/`](frontend/) | Aplicación web · React 19 + TypeScript + Vite | [frontend/README.md](frontend/README.md) |
| `vercel.json` | Publicación en Vercel como *Services*: `/api/*` → backend, resto → frontend | [DESPLIEGUE-VERCEL.md](DESPLIEGUE-VERCEL.md) |
| `Dockerfile` | Imagen única con frontend, backend y MariaDB 11.4 | [backend/README.md#docker-mariadb-incluida](backend/README.md#docker-mariadb-incluida) |

## Inicio rápido (desarrollo)

```bash
# 1. API (puerto 5000) — requiere un .env con la conexión a la base de datos, JWT_SECRET y HASH_SALT
cd backend && npm install && npm run dev

# 2. Web (puerto 3000, con proxy de /api hacia el puerto 5000)
cd frontend && npm install && npm run dev
```

Abre http://localhost:3000 e inicia sesión con un usuario registrado (correo y contraseña).

## Flujo de atención

1. **Asistente:** programa la cita y registra los **signos vitales** del paciente.
2. **Doctor:** abre la consulta (desde la cita o buscando al paciente), completa los **antecedentes** si es la
   primera vez, registra la **consulta**, los **diagnósticos**, la **receta** (que se ve e imprime como PDF dentro
   de la misma página), el **examen físico** y los **exámenes auxiliares**.
3. **Administrador:** gestiona usuarios y puede revisar la app en modo lectura o "ver como" doctor o asistente.

## Producción

Se publica en Vercel con la base de datos en Neon (PostgreSQL):

```bash
vercel deploy --prod
```

Las variables de entorno (conexión a Neon, `JWT_SECRET`, `HASH_SALT`) se configuran en el proyecto de Vercel y
nunca se suben al repositorio. Detalles en [DESPLIEGUE-VERCEL.md](DESPLIEGUE-VERCEL.md).

## Pruebas y calidad

```bash
cd backend && npm test          # pruebas con node:test
cd frontend && npm run lint && npm run build
```
