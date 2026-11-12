# CEINCO HCI · Frontend

Aplicación web del sistema de **historia clínica electrónica CEINCO**: pacientes, citas, consulta médica
completa (signos vitales, antecedentes, consulta, diagnósticos CIE-10, receta, examen físico y exámenes
auxiliares), reportes y gestión de usuarios.

- **Stack:** React 19 · TypeScript 5.9 · Vite (rolldown-vite) · React Router 7 · Axios
- **API:** backend CEINCO (repositorio `backend`), consumido en `/api`
- **Idioma:** español (Perú), fechas en `es-PE`

---

## Puesta en marcha

Requisitos: Node.js 24 y el backend corriendo en `http://localhost:5000`.

```bash
npm install
npm run dev        # http://localhost:3000 (proxy de /api → localhost:5000)
```

| Script            | Descripción                                    |
|-------------------|------------------------------------------------|
| `npm run dev`     | Servidor de desarrollo con recarga en caliente |
| `npm run build`   | Verificación de tipos (`tsc -b`) y compilación en `dist/` |
| `npm run preview` | Sirve la compilación de `dist/`                |
| `npm run lint`    | ESLint                                         |

### Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API. Por defecto `/api` (mismo dominio; recomendado) |

## Estructura

```
src/
├── main.tsx, App.tsx              # Arranque: ErrorBoundary → AuthProvider → ModoAdminProvider → rutas
├── context/
│   ├── AuthContext.tsx            # Sesión (token en localStorage), perfil y cierre de sesión
│   └── ModoAdminContext.tsx       # Modos del administrador (editor / lectura / ver como doctor / asistente)
├── services/apiService.ts         # Cliente Axios y servicios por módulo
├── types/models.ts                # Tipos de la API
├── utils/fechas.ts                # Fechas sin desfase de zona horaria
├── styles/main.css                # Estilos globales (tokens CSS, layout, impresión)
├── pages/                         # Dashboard, Pacientes, Citas, Consulta, Reporte, Usuario, Perfil, Login,
│                                  # ConsultaDetalle (/consultas/:id) y RecetaImprimir
└── components/
    ├── layout/                    # Layout, Sidebar y barra de modos del administrador
    ├── router/                    # AppRouter y ProtectedRoute (por rol)
    ├── Paciente/                  # Búsqueda en vivo, tabla, ficha, detalle e historial
    ├── Cita/                      # Filtros, lista y modal de cita
    ├── Consulta/                  # Pestañas de la consulta y visor de receta
    ├── Reporte/                   # Filtros y reporte por diagnóstico
    ├── Usuario/                   # Modal para editar, cambiar contraseña y eliminar usuarios
    └── ui/                        # Alert, ErrorBoundary, LoadingSpinner, Paginacion
```

## Pantallas y permisos

| Ruta | Pantalla | Roles |
|---|---|---|
| `/login` | Inicio de sesión con correo y contraseña | público |
| `/dashboard` | Inicio: resumen del día y citas | todos |
| `/pacientes` | Pacientes: búsqueda en vivo, registro, ficha e historial de consultas | todos |
| `/citas` | Agenda: filtros, programar, reprogramar, cancelar, atender | todos (gestión: admin y asistente) |
| `/consulta` | Consulta médica por pestañas (ver abajo) | todos (según rol) |
| `/consultas/:id` | Documento completo de una consulta (imprimible) | todos |
| `/reporte` | Reporte de pacientes por diagnóstico CIE-10 | administrador, doctor |
| `/usuario` | Gestión de usuarios | administrador |
| `/perfil` | Perfil y cambio de contraseña propia | todos |

## Consulta médica

La pantalla **Consultas** guía el proceso por pestañas:

| Pestaña | Quién | Qué hace |
|---|---|---|
| **Signos Vitales** | Asistente registra · Doctor solo ve | PA, pulso, SaO₂, FR, temperatura, peso, talla e IMC |
| **Antecedentes** | Doctor | Solo en la primera consulta del paciente |
| **Consulta Médica** | Doctor | Relato, examen físico y plan. Requiere signos vitales del día |
| **Diagnósticos** | Doctor | Búsqueda CIE-10 en vivo; principal y secundarios |
| **Receta** | Doctor | Medicamentos del catálogo con dosis, frecuencia y duración + indicaciones |
| **Examen Físico** | Doctor | Examen detallado por sistemas |
| **Exámenes Aux.** | Doctor | Solicitudes, resultados y archivos adjuntos |

1. El paciente se busca **mientras se escribe** (DNI o nombre), o se llega desde **Citas → Atender**.
2. Tras guardar los diagnósticos, **Siguiente: Receta** lleva a la receta.
3. **Ver / imprimir receta** muestra el **PDF dentro de la misma página** (sin abrir otra pestaña), con
   *Descargar* e *Imprimir*. También está disponible en el historial del paciente (**Ver receta**).

## Modos del administrador

El administrador ve en la parte superior una barra con cuatro botones pequeños:

| Modo | Comportamiento |
|---|---|
| **Editor** | Puede crear, editar y eliminar en todo el sistema |
| **Lectura** | Ve sus pantallas sin botones de edición |
| **Ver como doctor** | Ve la app tal como la ve un doctor (menú, rutas y pestañas) |
| **Ver como asistente** | Ve la app tal como la ve un asistente |

En todos los modos distintos de *Editor* el cliente bloquea cualquier petición que modifique datos y muestra un
aviso. El modo se recuerda en el navegador. Es una ayuda de revisión: los permisos reales los aplica el backend.

## Gestión de usuarios

En **Usuarios** el administrador puede registrar, **editar** (nombre, apellido, correo, cargo), **cambiar la
contraseña**, habilitar/deshabilitar y **eliminar** usuarios. Un usuario con registros clínicos no se puede
eliminar: se deshabilita.

## Búsquedas

Todos los buscadores (pacientes, paciente en consulta, citas, CIE-10 y reportes) buscan **en vivo**, sin botón:
a partir de 2 caracteres y con una espera de 300 ms entre pulsaciones. Se descartan las respuestas antiguas para
que los resultados siempre correspondan a lo último escrito.

## Detalles técnicos

- **Sesión:** el token JWT se guarda en `localStorage`; ante un `401` la app limpia la sesión y vuelve a `/login`.
- **Fechas:** `utils/fechas.ts` interpreta las fechas `YYYY-MM-DD` como locales para evitar el desfase de un día
  en Lima (UTC−5).
- **Impresión:** los documentos usan estilos `@media print` (A4) y la clase `no-print` para ocultar controles.

## Despliegue

En producción se publica en **Vercel** junto al backend como *Vercel Services* (mismo dominio: `/api/*` va al
backend y el resto a este frontend, con *rewrite* a `index.html` para las rutas de React):

```bash
vercel deploy --prod   # desde la carpeta que contiene vercel.json, backend/ y frontend/
```

En Docker, el `Dockerfile` compila este frontend y el backend lo sirve como archivos estáticos.
