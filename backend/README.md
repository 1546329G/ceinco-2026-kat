# CEINCO HCI · Backend (API)

API REST del sistema de **historia clínica electrónica CEINCO**. Gestiona pacientes, citas, consultas médicas
(signos vitales, antecedentes, examen físico, diagnósticos CIE-10, recetas y exámenes auxiliares), reportes
y usuarios con tres roles: **administrador**, **doctor** y **asistente**.

- **Stack:** Node.js 24 · Express 5 · JWT · bcrypt · multer · pdfkit
- **Base de datos:** PostgreSQL (Neon, en producción) o MariaDB (local / Docker), con el mismo código
- **Zona horaria:** America/Lima

---

## Índice

1. [Puesta en marcha](#puesta-en-marcha)
2. [Variables de entorno](#variables-de-entorno)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Base de datos](#base-de-datos)
5. [Roles y permisos](#roles-y-permisos)
6. [Flujo clínico](#flujo-clínico)
7. [Referencia de la API](#referencia-de-la-api)
8. [Seguridad](#seguridad)
9. [Pruebas](#pruebas)
10. [Despliegue](#despliegue)

---

## Puesta en marcha

```bash
npm install
# crea .env con las variables de la tabla siguiente
npm run dev               # node --watch server.js → http://localhost:5000
```

| Script         | Descripción                                   |
|----------------|-----------------------------------------------|
| `npm start`    | Inicia el servidor (`node server.js`)         |
| `npm run dev`  | Inicia con recarga automática (`--watch`)     |
| `npm test`     | Ejecuta las pruebas con `node --test test/`   |

Comprobación rápida: `GET http://localhost:5000/api/health` debe responder `{"status":"OK", ...}`
(devuelve `503` si la base de datos no está disponible).

El frontend (`H_CLINICA`) corre en el puerto 3000 y redirige `/api` a este servidor.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No | Puerto HTTP (por defecto `3000`; en desarrollo se usa `5000`) |
| `JWT_SECRET` | **Sí** | Secreto para firmar las sesiones (genera uno con `openssl rand -hex 32`) |
| `HASH_SALT` | **Sí** | Sal (≥ 16 caracteres) para los hashes del log de auditoría y de los intentos de acceso |
| `DB_ENGINE` | No | `postgres` para PostgreSQL/Neon; cualquier otro valor usa MariaDB |
| `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGPORT` | Con Postgres | Conexión a PostgreSQL (SSL obligatorio; en Neon usa el host *pooler*) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Con MariaDB | Conexión a MariaDB |
| `CORS_ORIGIN` | No | Orígenes permitidos separados por comas. Sin valor, solo `localhost`/`127.0.0.1` |
| `CEINCO_FILE_STORAGE` | No | `postgres` guarda los adjuntos en la base (en Vercel se activa solo) |
| `CEINCO_SHARED_LOGIN` | No | `1` guarda los intentos de acceso en la base (solo PostgreSQL; en Vercel se activa solo) |
| `CEINCO_WEB_DIR` | No | Carpeta con el frontend compilado para servirlo desde Express (Docker) |
| `NODE_ENV` | No | `development` muestra el detalle de los errores 500 |

> Nunca subas `.env` al repositorio (está en `.gitignore`).

## Estructura del proyecto

```
backend/
├── server.js                 # App Express: middlewares, rutas, adjuntos, manejo de errores
├── config/
│   ├── db.js                 # Pool de conexión (MariaDB o PostgreSQL según DB_ENGINE)
│   ├── postgres.js           # Adaptador pg → interfaz de mysql2 (?, mayúsculas, insertId)
│   ├── database.js           # Helpers SQL compatibles con ambos motores (fechas, edad)
│   ├── roles.js              # Roles y grupos de permisos
│   ├── attachments.js        # Límite y almacenamiento de adjuntos
│   └── runtime.js            # Detección de Vercel
├── routes/                   # Definición de endpoints y permisos por rol
├── controllers/              # Lógica de cada endpoint
│   └── recetaPdfController.js  # Receta médica en PDF (A5)
├── models/                   # Consultas SQL por entidad
├── middleware/
│   ├── authMiddleware.js     # verifyToken (JWT + sesión única) y verifyRole
│   ├── loginAttempts.js      # Bloqueo tras 10 intentos fallidos (5 min)
│   ├── logActivity.js        # Log de auditoría (DNI con hash SHA-256)
│   └── fileUpload.js         # multer: tipos permitidos y tamaño máximo
├── utils/validator.js        # Validaciones (DNI, correo, PA, usuario)
├── assets/logo.png           # Logo usado en los PDF
├── postgres/                 # Esquema PostgreSQL y migración aditiva para Vercel
├── container/                # Esquema MariaDB, migración y arranque del contenedor Docker
└── test/                     # Pruebas unitarias y HTTP (node:test)
```

### Compatibilidad MariaDB / PostgreSQL

Los modelos escriben SQL con parámetros `?` y nombres en MAYÚSCULAS. `config/postgres.js` convierte los `?`
en `$1, $2…`, devuelve las columnas en mayúsculas (respetando los alias `AS`) y añade `RETURNING id` a los
`INSERT` para exponer `insertId`, igual que `mysql2`. Para diferencias de sintaxis usa los helpers de
`config/database.js` (`dateOnly`, `ageYears`, `isPostgres`). **Todo cambio SQL debe funcionar en ambos motores.**

## Base de datos

| Tabla | Contenido |
|---|---|
| `usuarios` | Personal: DNI, correo (inicio de sesión), cargo, contraseña (bcrypt), estado, sesión activa |
| `ficha_clinica` | Pacientes (identificados por DNI) |
| `antecedentes` | Antecedentes del paciente (`datos_formulario` en JSON + columnas migradas) |
| `citas` | Citas: `programada` → `atendida` / `cancelada` |
| `signos_vitales_preconsulta` | Signos vitales que registra el asistente antes de la consulta (JSON) |
| `consulta` | Consulta médica: relato, examen físico (simplificado y detallado en JSON), plan |
| `examen_clinico` | Signos vitales asociados a la consulta (PA, pulso, SaO₂, FR, peso, talla, T°, IMC) |
| `diagnosticos_consulta` | Diagnósticos CIE-10 (`principal` / `secundario`) |
| `catalogo_cie10`, `medicamentos` | Catálogos |
| `recetas`, `receta_detalle` | Receta de la consulta (una por consulta) y sus medicamentos |
| `examenes_auxiliares`, `adjuntos_examen` | Exámenes solicitados/resultados y sus archivos |
| `log` | Auditoría de acciones |
| `intentos_login` | Intentos fallidos de acceso (modo compartido) |

- Esquema PostgreSQL: `postgres/schema.sql`. Migración aditiva y re-ejecutable: `postgres/vercel.sql`.
- Esquema MariaDB: `container/schema.sql` (+ `container/upgrade.sql`, que se aplica al arrancar el contenedor).

## Roles y permisos

| Acción | Administrador | Doctor | Asistente |
|---|:-:|:-:|:-:|
| Ver y registrar pacientes | ✔ | ✔ | ✔ |
| Crear, editar, cancelar y eliminar citas | ✔ | | ✔ |
| Marcar cita como atendida | ✔ | ✔ | |
| **Registrar signos vitales** | | | ✔ |
| Ver signos vitales | ✔ | ✔ | ✔ |
| Antecedentes, consulta, examen físico, diagnósticos, recetas | ✔ | ✔ | |
| Subir exámenes auxiliares | ✔ | ✔ | ✔ |
| Ver / descargar la receta en PDF | ✔ | ✔ | ✔ |
| Historia clínica completa y PDF | ✔ | ✔ | |
| Reportes | ✔ | ✔ | |
| Gestión de usuarios | ✔ | | |

Los signos vitales los registra **solo el asistente**: el doctor (y el administrador) solo los ven. Al registrar
la consulta, el servidor usa exclusivamente los signos de la preconsulta e ignora los que envíe el cliente.

## Flujo clínico

1. **Asistente** registra los signos vitales del día (`POST /api/consultas/signos-vitales`).
2. **Doctor** busca al paciente; si es su primera consulta completa los **antecedentes**.
3. Registra la **consulta** (`POST /api/consultas/completa`), que vincula los signos de la preconsulta y, si
   viene de una cita, la marca como atendida.
4. Agrega **diagnósticos** CIE-10, el **examen físico** detallado y los **exámenes auxiliares**.
5. Registra la **receta** (`POST /api/consultas/:id/recetas`; si ya existe se reemplaza) y la muestra/imprime en
   PDF (`GET /api/consultas/:id/receta/pdf`).

## Referencia de la API

Todas las rutas (excepto `login` y `health`) requieren `Authorization: Bearer <token>`.
Leyenda de roles: **A** administrador · **D** doctor · **S** asistente.

### Autenticación y usuarios — `/api/auth`

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| POST | `/login` | público | Inicia sesión con `{ email, contrasena }`. Devuelve `token` (8 h) y datos del usuario |
| POST | `/logout` | todos | Cierra la sesión activa |
| GET | `/profile` | todos | Perfil del usuario actual |
| PUT | `/change-password` | todos | Cambia la contraseña propia `{ contrasena_actual, contrasena_nueva }` |
| POST | `/register` | A | Crea un usuario `{ dni, email, nombre, apellido, cargo, contrasena }` |
| GET | `/users` | A | Lista de usuarios |
| PUT | `/users/email` | A | Cambia el correo de inicio de sesión `{ dni, email }` |
| PUT | `/users/toggle-status` | A | Habilita / deshabilita `{ dni }` |
| PUT | `/users/:dni` | A | Edita nombre, apellido, cargo y correo |
| PUT | `/users/:dni/password` | A | Restablece la contraseña de otro usuario `{ contrasena }` |
| DELETE | `/users/:dni` | A | Elimina un usuario sin registros clínicos (si tiene, responde `409`) |

Reglas: no puedes eliminarte, cambiar tu propio cargo ni restablecer tu contraseña desde estas rutas, y siempre
debe quedar al menos un administrador activo. Cambiar cargo, correo o contraseña cierra la sesión del usuario.

### Pacientes — `/api/pacientes`

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/` | A D S | Todos los pacientes |
| POST | `/` | A D S | Registra un paciente (`dni`, `nombre_apellido`, `fecha_nacimiento` obligatorios) |
| GET | `/buscar/:termino` | A D S | Búsqueda por DNI, nombre o teléfono (≥ 2 caracteres, máx. 30) |
| GET | `/:dni` | A D S | Ficha del paciente (incluye edad) |
| PUT | `/:dni` | A D S | Actualiza la ficha |
| GET | `/:dni/consultas` | A D S | Consultas del paciente |
| GET | `/:dni/primera-consulta` | A D S | Indica si es primera consulta y si tiene antecedentes |
| GET | `/:dni/antecedentes` | A D S | Antecedentes registrados |
| PUT | `/:dni/antecedentes` | A D | Guarda los antecedentes |
| GET | `/:dni/historia` | A D | Historia clínica completa |
| GET | `/:dni/pdf` | A D | Historia clínica en PDF |

### Citas — `/api/citas`

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| POST | `/` | A S | Crea una cita `{ dni, fecha, hora, servicio, id_doctor }` |
| GET | `/today` | A D S | Citas del día |
| GET | `/search?fecha&dni&estado` | A D S | Búsqueda de citas |
| GET | `/:idCita` | A D S | Detalle de una cita |
| PUT | `/:idCita` | A S | Reprograma (fecha, hora, servicio, doctor) |
| PATCH | `/:idCita/cancelar` | A S | Cancela una cita programada |
| PATCH | `/:idCita/atender` | A D | Marca como atendida |
| DELETE | `/:idCita` | A S | Elimina una cita cancelada |

### Consultas — `/api/consultas`

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| POST | `/signos-vitales` | **S** | Registra los signos vitales de la preconsulta |
| GET | `/signos-vitales/hoy/:idFicha` | A D S | Signos vitales pendientes de hoy |
| POST | `/completa` | A D | Registra la consulta (relato, examen, plan, diagnósticos…) |
| GET | `/:idConsulta` | A D S | Consulta completa (signos, diagnósticos, receta, exámenes) |
| PUT | `/:idConsulta` | A D | Edita relato, examen físico simplificado y plan |
| GET / PUT | `/:idConsulta/examen-fisico` | A D | Lee / guarda el examen físico detallado |
| POST | `/:idConsulta/diagnosticos` | A D | Agrega un diagnóstico secundario `{ codigoCIE }` |
| DELETE | `/:idConsulta/diagnosticos/:idDiagnostico` | A D | Elimina un diagnóstico secundario |
| POST | `/:idConsulta/recetas` | A D | Guarda la receta `{ indicaciones, medicamentos: [{ id_medicamento, dosis, frecuencia, duracion }] }` |
| GET | `/:idConsulta/receta/pdf` | A D S | Receta en PDF (A5, `inline`) |
| POST | `/:idConsulta/examenes` | A D S | Sube un examen auxiliar (`multipart/form-data`, campo `archivo`) |
| GET | `/paciente/:dni` | A D S | Consultas de un paciente |
| GET | `/cie10/search?q=` | A D S | Búsqueda CIE-10 |

### Catálogos, doctores y reportes

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/api/catalogos/sexos` | A D S | Catálogo de sexos |
| GET | `/api/catalogos/medicamentos` | A D S | Medicamentos activos |
| GET | `/api/catalogos/cie10/buscar/:termino` | A D S | Búsqueda CIE-10 |
| GET | `/api/catalogos/cie10/:codigo` | A D S | Detalle de un código CIE-10 |
| GET | `/api/doctores` | A D S | Doctores registrados |
| GET | `/api/reportes/diagnostico?fechaInicio&fechaFin&codigoCIE` | A D | Pacientes con un diagnóstico en un periodo |
| GET | `/api/reportes/diagnosticos` | A D | Ranking de diagnósticos (PDF) |
| GET | `/api/reportes/citas` | A D | Resumen de citas por periodo |
| GET | `/api/reportes/actividad-usuarios` | A D | Actividad por usuario |

### Adjuntos y salud

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/adjuntos/:archivo` | Descarga un adjunto (requiere sesión; `Cache-Control: no-store`) |
| GET | `/api/health` | Estado del servidor y de la base de datos |

Tipos de adjunto permitidos: imágenes, PDF, Word, Excel y texto. Tamaño máximo: 10 MB (4 MB en Vercel).

## Seguridad

- **Sesión única:** cada inicio de sesión genera un identificador (`sid`) guardado en `usuarios`; iniciar sesión en
  otro equipo invalida la sesión anterior. El token expira en 8 horas.
- **Bloqueo por intentos:** 10 intentos fallidos bloquean el correo durante 5 minutos (en memoria, o en la tabla
  `intentos_login` cuando hay varias instancias, como en Vercel).
- **Auditoría:** las acciones relevantes se registran en `log` con el DNI del usuario cifrado con SHA-256 + `HASH_SALT`.
- **Contraseñas** con bcrypt (10 rondas). **CORS** restringido a `CORS_ORIGIN` o a `localhost`.
- Los adjuntos solo se descargan con sesión y se sirven como `attachment` con `nosniff`.

## Pruebas

```bash
npm test
```

Pruebas sin base de datos: conversión de parámetros SQL, validadores, control de roles, rutas protegidas (401),
404 en JSON y política CORS.

## Despliegue

### Vercel + Neon (producción)

El proyecto se publica como **Vercel Services** desde una carpeta que contiene `backend/`, `frontend/` y un
`vercel.json` que envía `/api/*` a este backend y el resto al frontend (mismo dominio, sin CORS):

```bash
vercel deploy          # preview
vercel deploy --prod   # producción
```

Configura en Vercel las variables `DB_ENGINE=postgres`, `PGHOST` (host *pooler* de Neon), `PGDATABASE`,
`PGUSER`, `PGPASSWORD`, `JWT_SECRET` y `HASH_SALT`. Ejecuta `postgres/vercel.sql` en Neon si faltan las tablas
`adjuntos_examen` o `intentos_login`. En Vercel los adjuntos se guardan en la base (máx. 4 MB por archivo).

### Docker (MariaDB incluida)

El `Dockerfile` de la carpeta superior compila el frontend, instala el backend y lo ejecuta junto a MariaDB 11.4.
`container/start.sh` espera a la base, aplica `container/upgrade.sql` y arranca la API en el puerto 5000 sirviendo
también el frontend (`CEINCO_WEB_DIR`). Con `DB_ENGINE=postgres` arranca solo la API.
