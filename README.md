# Minimalist Classroom Analytics

Plataforma minimalista para visualizar cursos, estudiantes, profesores, tareas y el estado de las entregas desde Google Classroom. Incluye filtros globales por cohorte y profesor, un dashboard con métricas, vistas de alumnos/profesores/tareas, y un endpoint de progreso por alumno.


## Características
- Conexión OAuth2 con Google Classroom.
- Ingesta de datos: cursos, estudiantes, profesores, tareas y entregas.
- Filtros globales por Cohorte y Profesor que afectan Dashboard y la lista de Estudiantes.
- Filtro por Estado de entrega en la vista de Tareas (entregado, atrasado, faltante, pendiente, reentrega).
- Dashboard con métricas agregadas (entregas a tiempo, tardías y pendientes).
- Progreso por alumno (porcentaje de entregas a tiempo y desglose por estado).
- Caché en memoria para mejorar el rendimiento de llamadas repetidas.


## Arquitectura
- Frontend: Vite + React + TypeScript (carpeta `src/`).
- Backend: Node.js + Express (carpeta `server/`).
- Integración con Google Classroom API vía OAuth2.
- Caché simple en memoria con TTL (no distribuido) ubicado en `server/utils/cache.js`.

Estructura principal:
```
project/
├─ server/
│  ├─ routes/
│  │  ├─ auth.js                # OAuth2: login/callback/logout
│  │  └─ classroom.js           # Endpoints de Classroom y agregados
│  ├─ utils/
│  │  ├─ google.js              # Cliente OAuth2 y clientes de Google APIs
│  │  ├─ tokenStore.js          # Almacenamiento de tokens en memoria
│  │  └─ cache.js               # Caché en memoria con TTL
│  └─ index.js                  # Servidor Express y montaje de rutas
├─ src/
│  ├─ api/
│  │  └─ classroom.ts           # Cliente HTTP del frontend
│  ├─ components/               # UI (Dashboard, StudentsView, etc.)
│  ├─ types/                    # Tipos compartidos en el frontend
│  └─ App.tsx                   # App principal con filtros globales
├─ .env.example                 # Variables de entorno de ejemplo
└─ README.md                    # Este archivo
```


## Requisitos previos
- Node.js 18+
- Cuenta de Google Cloud con un proyecto y credenciales OAuth 2.0
- Google Classroom habilitado y con datos accesibles por la cuenta


## Variables de entorno
Crea un archivo `.env` en `project/` basado en `.env.example`.

Backend (Express):
- `BACKEND_PORT` ( `5001`)
- `FRONTEND_URL` ( `http://localhost:5173`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` ( `http://localhost:5001/oauth/callback`)

Frontend (Vite):
- `VITE_BACKEND_URL` (ej. `http://localhost:5173`)


## Instalación y ejecución
Instala dependencias y levanta ambos servicios.

1) Instalar dependencias
```
npm install
```

2) Ejecutar en desarrollo (Vite + Express)
- Usualmente hay dos scripts: uno para frontend (Vite) y otro para backend (Express). Si está configurado un script conjunto, úsalo. En caso contrario:

Frontend (Vite):
```
npm run dev
```
Se abrirá en: `http://localhost:5173`

Backend (Express):
```
node server/index.js
```
Se levantará en: `http://localhost:5001`

3) Autenticación con Google
- Abre `http://localhost:5001/oauth/callback`.
- Si no estás autenticado, verás un banner con el botón “Conectar con Google”.
- Serás redirigido al flujo OAuth y de regreso a la app.


## Uso de la aplicación
- Filtros globales (parte superior de la app):
  - Cohorte: derivado de `course.section` o `course.name` (fallback `General`).
  - Profesor: profesores agregados únicos según la cohorte seleccionada.
  - Estos filtros afectan el Dashboard (métricas) y la lista de Estudiantes.

- Vista Estudiantes (`src/components/StudentsView.tsx`):
  - Búsqueda por nombre o email.
  - Filtro por Cohorte (controlado por App) y Profesor (controlado por App).
  - Muestra por alumno:
    - Barra de “Entregas a tiempo (%)” real si está disponible (backend), o fallback de “Cursos inscritos”.
    - Desglose con conteos: Entregado, Atrasado, Faltante, Pendiente, Reentrega.

- Vista Profesores (`src/components/TeachersView.tsx`):
  - Búsqueda por nombre/email.
  - Muestra la cantidad de cursos por profesor.

- Vista Tareas (`src/components/AssignmentsView.tsx`):
  - Filtro por estado de entrega (entregado, atrasado, faltante, pendiente, reentrega).
  - Muestra tasa de entrega a tiempo por tarea y barras de estado.

- Dashboard (`src/components/Dashboard.tsx`):
  - Tarjetas: Estudiantes, Profesores, Cursos, Tareas.
  - Estado de Entregas: Entregas a tiempo, Tardías, Pendientes.


## Endpoints del backend (principales)
Base URL: `${VITE_BACKEND_URL}` (`http://localhost:5001`)

Autenticación:
- `GET /auth/google` → inicia OAuth (redirige a Google)
- `GET /auth/google/callback` → callback de OAuth (configurar como redirect URI)
- `POST /auth/logout` → cierra sesión y borra tokens

Salud:
- `GET /api/health` → `{ ok: true }` si el backend está vivo

Classroom (crudos):
- `GET /api/classroom/courses?cohort=&teacherId=&pageSize=`
- `GET /api/classroom/courses/:courseId/students?pageSize=`
- `GET /api/classroom/courses/:courseId/teachers?pageSize=`
- `GET /api/classroom/courses/:courseId/courseWork?pageSize=`
- `GET /api/classroom/courses/:courseId/courseWork/:courseWorkId/submissions?pageSize=&status=`
  - `status`: `entregado|atrasado|faltante|reentrega`

Agregados:
- `GET /api/classroom/students?cohort=&teacherId=` → estudiantes únicos agregados
- `GET /api/classroom/teachers?cohort=` → profesores únicos agregados
- `GET /api/classroom/summary?cohort=&teacherId=&status=` → métricas para Dashboard
- `GET /api/classroom/students/progress?cohort=&teacherId=` → progreso por alumno

Notas de filtros:
- `cohort`: se deriva de `course.section` o `course.name`.
- `teacherId`: se compara contra `courses.teachers.list()` (`userId` / `profile.id`).


## Cliente Frontend (`src/api/classroom.ts`)
Funciones clave:
- `getHealth()`
- `getAuthUrl()`
- `listCourses(pageSize?)`
- `listCoursesFiltered({ cohort?, teacherId?, pageSize? })`
- `listStudents(courseId, pageSize?)`
- `listTeachers(courseId, pageSize?)`
- `listCourseWork(courseId, pageSize?)`
- `listSubmissions(courseId, courseWorkId, pageSize?)`
- `listSubmissionsFiltered(courseId, courseWorkId, { status?, pageSize? })`
- `getSummary({ cohort?, teacherId?, status? })`
- `listAggregatedStudents({ cohort?, teacherId? })`
- `listAggregatedTeachers({ cohort? })`
- `listStudentsProgress({ cohort?, teacherId? })`


## Flujo de datos (alto nivel)
1. Usuario inicia sesión vía `/auth/google` → backend almacena tokens (en memoria).
2. Frontend hace ping a `getSummary()` y endpoints agregados según filtros globales.
3. Backend consulta Google Classroom usando los tokens del usuario, aplica caché y computa agregados.
4. Frontend renderiza Dashboard, Estudiantes, Profesores y Tareas.


## Caché
- Módulo: `server/utils/cache.js`.
- TTL por defecto: 60 segundos.
- Claves por tipo: `courses:list`, `courses:teachers`, `courses:students`, `courses:courseWork`, `courseWork:submissions`.
- Ideal para desarrollo y single-instance. Para producción multi-instancia, usar Redis u otro cache distribuido.


## Solución de problemas
- “Not authenticated. Visit /auth/google first.”
  - Ve a `http://localhost:5173` y usa “Conectar con Google”.
  - Verifica `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI` en `.env`.

- 401 al llamar a `/api/classroom/*`
  - La sesión no está activa. Repite el flujo OAuth.

- No aparecen cohortes o profesores
  - Asegúrate de que existan cursos/rosters en Classroom.
  - Las cohortes se derivan de `course.section` o `course.name`.

- Rendimiento
  - El primer llamado puede tardar más (sin caché).
  - Reintenta dentro de 60s para notar la mejora por caché.

- Browserslist desactualizado (mensaje Vite)
  - Ejecuta:
    ```bash
    npx update-browserslist-db@latest
    ```


## Scripts útiles (ejemplos)
- Iniciar frontend: `npm run dev`
- Iniciar backend: `node server/index.js`
- Lint/format (si está configurado en tu `package.json`): `npm run lint`, `npm run format`


## Roadmap sugerido
- Cache distribuido (Redis) para despliegues multi-instancia.
- Selector global adicional por estado de entrega (opcional) para impactar el summary.
- Widgets en Dashboard: “Top alumnos” y “Alumnos en riesgo”, usando `/students/progress`.
- Exportaciones CSV/Excel de reportes.


## Licencia
MIT ().
