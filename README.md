# AdoptMe API — Backend III (Entregable Final)

**Autor:** Jeshua Romero Guadarrama
**Curso:** Programación Backend III — Coderhouse
**Versión:** 1.0.0

---

## ¿De qué trata este proyecto?

`AdoptMe` es una **API REST de una plataforma de adopción de mascotas**.
No es un sitio de comercio: el dominio modela la relación entre **usuarios** y
**mascotas** disponibles para adopción, registrando cada adopción concretada
en una colección dedicada.

Reglas de negocio principales:

- Un **usuario** puede adoptar una o varias mascotas; el listado de mascotas
  adoptadas se mantiene en `usuario.pets`.
- Una **mascota** comienza disponible (`adopted: false`) y, al ser adoptada,
  se marca `adopted: true` y se guarda referencia al `owner`.
- Una **adopción** es el registro inmutable que enlaza `(usuario, mascota)`.

El entregable se enfoca en el router `adoption.router.js`: tres endpoints
expuestos bajo `/api/adopciones`, con tests funcionales exhaustivos, una
imagen Docker endurecida y documentación reproducible.

---

## Estructura del proyecto

```
.
├── Dockerfile                       # Imagen multi-stage endurecida (no root, dumb-init, healthcheck)
├── docker-compose.yml               # API + MongoDB para entorno local
├── package.json
├── package-lock.json
├── README.md                        # Este archivo
├── SECURITY.md                      # Política y defensas aplicadas
├── CHANGELOG.md
├── LICENSE
├── .dockerignore / .gitignore
├── .editorconfig / .eslintrc.json
├── .env.example                     # Variables de entorno documentadas
├── requests.http                    # Ejemplos REST Client
├── .github/
│   └── workflows/
│       └── ci.yml                   # Pipeline de tests + build de imagen
├── evidencia/
│   ├── tests.log                    # Salida completa de la suite de tests
│   ├── docker-build.log             # Log del docker build
│   ├── docker-run.log               # Log del contenedor en ejecución
│   └── arbol.txt                    # Árbol de archivos
├── src/
│   ├── app.js                       # Entry point: middlewares, routers, errores
│   ├── controllers/
│   │   └── adoptions.controller.js  # Lógica del recurso adopciones
│   ├── dao/                         # Acceso a datos (Mongoose)
│   │   ├── Users.dao.js
│   │   ├── Pets.dao.js
│   │   ├── Adoptions.dao.js
│   │   ├── Sessions.dao.js
│   │   └── models/
│   │       ├── User.js
│   │       ├── Pet.js
│   │       └── Adoption.js
│   ├── middlewares/
│   │   └── validarObjectId.js       # Valida ObjectId en parámetros de ruta
│   ├── repository/                  # Repositorios (capa de servicios)
│   │   ├── GenericRepository.js
│   │   ├── UserRepository.js
│   │   ├── PetRepository.js
│   │   ├── AdoptionRepository.js
│   │   └── SessionRepository.js
│   ├── routes/
│   │   ├── adoption.router.js       # ★ router objetivo del entregable
│   │   ├── users.router.js
│   │   ├── pets.router.js
│   │   └── sessions.router.js
│   └── services/
│       └── index.js                 # Wiring de DAOs + repositorios
└── test/
    ├── .mocharc.json
    ├── helpers/
    │   └── fakes.js                 # Mocks/fakes reutilizables (sinon)
    ├── integration/
    │   ├── adoption.router.test.js  # Tests funcionales del router de adopciones
    │   ├── health.test.js
    │   └── security.test.js         # Tests de defensas transversales
    └── unit/
        ├── adoptions.controller.test.js
        └── validarObjectId.test.js
```

---

## Endpoints principales (router `adoption.router.js`)

| Método | Ruta                                            | Descripción                                  |
|-------:|-------------------------------------------------|----------------------------------------------|
| GET    | `/api/adopciones`                               | Lista todas las adopciones                   |
| GET    | `/api/adopciones/:idAdopcion`                   | Obtiene una adopción por id                  |
| POST   | `/api/adopciones/:idUsuario/:idMascota`         | Enlaza usuario y mascota (crea adopción)     |

Códigos de respuesta:

- `200` éxito.
- `400` parámetro inválido (ObjectId mal formado, mascota ya adoptada, JSON inválido).
- `404` adopción/usuario/mascota inexistente.
- `413` payload mayor al límite (`100kb`).
- `500` fallo interno (sin filtración de detalles).

Documentación interactiva OpenAPI: **`GET /api/docs`** una vez levantada la API.

---

## Defensas de seguridad aplicadas

| Capa             | Mecanismo                                      |
|------------------|------------------------------------------------|
| Cabeceras HTTP   | `helmet`                                       |
| CORS             | Lista blanca configurable (`CORS_ORIGINS`)     |
| Rate limit       | 120 req/min por IP                             |
| NoSQL injection  | `express-mongo-sanitize`                       |
| Body limit       | `100kb` JSON / urlencoded                      |
| Validación input | Middleware `validarObjectId`                   |
| Errores          | Envelope uniforme, sin stack ni detalles       |
| Imagen Docker    | `node:20-alpine`, no root, dumb-init, healthcheck |

Ver `SECURITY.md` para detalles.

---

## Imagen Docker en DockerHub

| Campo        | Valor                                                              |
|--------------|--------------------------------------------------------------------|
| Repositorio  | `jeshuarg/adoptme-backend-iii`                                     |
| Tags         | `1.0.1`, `1.0.0`, `latest`                                         |
| URL pública  | https://hub.docker.com/r/jeshuarg/adoptme-backend-iii              |
| Pull         | `docker pull jeshuarg/adoptme-backend-iii:1.0.1`                   |
| Tamaño       | ~65 MB comprimida / 299 MB descomprimida                           |

---

## Cómo reproducir todo desde cero

### 0) Requisitos

- Docker Desktop (con motor Linux) **o** Node.js ≥ 18 + npm.
- Git (opcional).

### 1) Correr los tests funcionales

**Sin instalar Node localmente** (recomendado, usa contenedor Node):

```powershell
docker run --rm `
  -v "${PWD}:/app" -w /app -e NODE_ENV=test `
  node:20-alpine sh -c "npm install --no-audit --no-fund && npm test"
```

**Con Node instalado:**

```bash
npm install
npm test
```

Resultado esperado: **33 tests passing**.

### 2) Construir la imagen Docker

```powershell
docker build -t jeshuarg/adoptme-backend-iii:1.0.1 `
             -t jeshuarg/adoptme-backend-iii:latest .
```

### 3) Ejecutar el contenedor

Modo simple (sin Mongo) — pulleando directo de DockerHub:

```powershell
docker run --rm -p 8080:8080 jeshuarg/adoptme-backend-iii:1.0.1
```

Con Mongo y compose:

```powershell
docker compose up --build
```

Verificar:

```powershell
curl http://localhost:8080/health
curl http://localhost:8080/api/docs/
```

### 4) Subir la imagen a DockerHub

```powershell
docker login -u jeshuarg
docker push jeshuarg/adoptme-backend-iii:1.0.1
docker push jeshuarg/adoptme-backend-iii:latest
```

### 5) Escaneo de seguridad básico

```powershell
docker scout quickview jeshuarg/adoptme-backend-iii:1.0.1
docker scout cves      jeshuarg/adoptme-backend-iii:1.0.1
```

---

## Variables de entorno

| Variable        | Default                                | Descripción                              |
|-----------------|----------------------------------------|------------------------------------------|
| `PORT`          | `8080`                                 | Puerto HTTP                              |
| `MONGO_URL`     | _(vacía)_                              | URL Mongo. Si vacía, se omite conexión.  |
| `CORS_ORIGINS`  | `*`                                    | CSV de orígenes permitidos               |
| `NODE_ENV`      | `production` (en imagen)               | `development` / `production` / `test`    |

Ver `.env.example`.

---

## Evidencia de ejecución

- **Tests:** `evidencia/tests.log` — 33 tests passing en 306ms.
- **Build de imagen:** `evidencia/docker-build.log`.
- **Contenedor en ejecución:** `evidencia/docker-run.log`.
- **Árbol del proyecto:** `evidencia/arbol.txt`.

Resumen de la corrida de tests:

```
33 passing (306ms)
```

Cobertura del router `adoption.router.js`:

- GET `/` (200/200-vacío/500)
- GET `/:idAdopcion` (200/404/400-id-inválido/500)
- POST `/:idUsuario/:idMascota` (200/404-user/404-pet/400-already-adopted/400-id-inválido/500/edge: pets undefined)
- Métodos no soportados y subrutas inexistentes (404)
- Defensas: Helmet, body limit, JSON inválido, mongo-sanitize, 404 envelope.

---

## CI/CD

Pipeline en `.github/workflows/ci.yml`:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `docker build` (sin push) usando cache de GHA.

---

## Licencia

MIT — ver `LICENSE`.
