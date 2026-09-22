# WebZaraV.1 — Sistema de Gestión de Inventario

Sistema web para el control de inventario: gestión de tiendas, bodegas, centros de distribución y productos desde un único sistema integrado. Proyecto académico.

## 📌 Descripción del proyecto

La aplicación permite a los usuarios autenticarse (login con JWT) y, según su rol (`ROLE_USER` / `ROLE_ADMIN`), acceder a distintas funcionalidades de administración de inventario.

## 🛠️ Stack tecnológico

**Backend**
- Java 17
- Spring Boot 3
- Spring Security + JWT (autenticación y autorización)
- PostgreSQL (base de datos)
- Maven

**Frontend**
- React (Vite)
- Tailwind CSS

## ✅ Requisitos previos

Antes de clonar el proyecto, cada integrante del equipo debe instalar:

| Herramienta | Uso | Descarga |
|---|---|---|
| Java JDK 17+ | Correr el backend | [adoptium.net](https://adoptium.net) |
| IntelliJ IDEA o VS Code | Editar el backend | — |
| PostgreSQL | Base de datos | [postgresql.org](https://www.postgresql.org/download/) |
| pgAdmin 4 | Administrar la base de datos (opcional, viene con PostgreSQL) | — |
| Node.js (LTS) | Correr el frontend (incluye npm) | [nodejs.org](https://nodejs.org) |
| Git | Control de versiones | [git-scm.com](https://git-scm.com/download) |
| Postman | Probar los endpoints (opcional) | [postman.com](https://www.postman.com/downloads) |

Verifica las instalaciones:
```bash
java -version
node -v
npm -v
git --version
```

## 🚀 Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

### 2. Configurar la base de datos

Crea la base de datos en PostgreSQL (por consola `psql` o desde pgAdmin):

```sql
CREATE DATABASE university;
```

> Puedes usar el nombre que prefieras, solo asegúrate de que coincida con la URL en `application.properties`.

### 3. Configurar variables de entorno

El proyecto usa variables de entorno para no exponer credenciales en el código. Crea estas dos variables **a nivel de tu sistema operativo** (no se suben a Git):

| Variable | Valor |
|---|---|
| `DB_USERNAME` | Tu usuario de PostgreSQL (por defecto `postgres`) |
| `DB_PASSWORD` | Tu contraseña de PostgreSQL |

**Windows:** Buscar "variables de entorno" → Editar las variables de entorno del sistema → Variables de entorno → Nueva (en "Variables de usuario").

Después de crearlas, **reinicia tu IDE** para que las reconozca.

### 4. Correr el backend

Abre la carpeta `backend` (donde está el `pom.xml`) en tu IDE y ejecuta la clase principal:

```
Springboot3SecurityApplication.java
```

El servidor debe quedar corriendo en `http://localhost:8080`.

Al arrancar por primera vez, se crea automáticamente un usuario **admin** por defecto (ver `DataInitializer.java` para las credenciales).

### 5. Correr el frontend

En otra terminal, dentro de la carpeta `frontend`:

```bash
npm install
npm run dev
```

El frontend queda corriendo en `http://localhost:5173`.

## 📡 Endpoints de la API

Base URL: `http://localhost:8080`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/auth/welcome` | Endpoint de prueba, confirma que el servidor está activo | Público |
| POST | `/auth/addNewUser` | Registra un nuevo usuario | Público |
| POST | `/auth/generateToken` | Login. Recibe `username` y `password`, devuelve un JWT | Público |
| GET/POST | `/auth/user/**` | Endpoints exclusivos para usuarios con rol `ROLE_USER` | Requiere JWT |
| GET/POST | `/auth/admin/**` | Endpoints exclusivos para usuarios con rol `ROLE_ADMIN` | Requiere JWT |

**Autenticación:** para los endpoints protegidos, enviar el token recibido en `/generateToken` en el header:
```
Authorization: Bearer <token>
```

**Ejemplo de body para login:**
```json
{
  "username": "admin",
  "password": "tu_contraseña"
}
```

> 📁 Los endpoints se definen en clases anotadas con `@RestController` dentro de `src/main/java/.../controller/`. Cada nueva funcionalidad (productos, tiendas, etc.) debería seguir esta misma convención: `NombreController.java`.

## 🌿 Flujo de trabajo en equipo (Git)

- La rama `main` contiene el código estable.
- Cada funcionalidad se desarrolla en su propia rama (feature/HU), con nombre descriptivo, ej: `feature-login`, `HU-01-registro-usuario`.
- Al terminar una funcionalidad, se abre un Pull Request hacia `main` para revisión antes de fusionar.

```bash
git checkout -b nombre-de-tu-rama
# ... trabajas y haces commits ...
git push -u origin nombre-de-tu-rama
```

## 👥 Equipo

| Nombre | Rol |
|---|---|
| _(agregar integrantes)_ | Backend |
| _(agregar integrantes)_ | Frontend |

## 📄 Licencia

Proyecto académico — uso educativo.
