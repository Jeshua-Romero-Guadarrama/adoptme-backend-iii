---
title: "AdoptMe API — Entregable Final Backend III"
author: "Jeshua Romero Guadarrama"
date: "Mayo 2026"
---

# AdoptMe API — Entregable Final Backend III

**Autor:** Jeshua Romero Guadarrama
**Curso:** Programación Backend III — Coderhouse
**Versión:** 1.0.0

---

## 1. ¿De qué trata este proyecto?

`AdoptMe` es una **API REST de una plataforma de adopción de mascotas**. No es un sitio de comercio: el dominio modela la relación entre **usuarios** y **mascotas** disponibles para adopción, registrando cada adopción concretada en una colección dedicada.

Reglas de negocio principales:

- Un **usuario** puede adoptar una o varias mascotas; el listado se mantiene en `usuario.pets`.
- Una **mascota** comienza disponible (`adopted: false`) y, al ser adoptada, se marca `adopted: true` y se guarda referencia al `owner`.
- Una **adopción** es el registro inmutable que enlaza `(usuario, mascota)`.

El entregable se enfoca en el router `adoption.router.js`: tres endpoints expuestos bajo `/api/adopciones`, con tests funcionales exhaustivos, una imagen Docker endurecida y documentación reproducible.

---

## 2. Estructura del proyecto

### 2.1 Árbol de directorios

```
.
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
├── README.md
├── SECURITY.md
├── CHANGELOG.md
├── LICENSE
├── .dockerignore / .gitignore / .editorconfig / .eslintrc.json / .env.example
├── requests.http
├── .github/workflows/ci.yml
├── evidencia/
│   ├── tests.log
│   ├── docker-build.log
│   ├── docker-run.log
│   ├── arbol.txt
│   └── entregable.md (este documento)
├── src/
│   ├── app.js
│   ├── controllers/adoptions.controller.js
│   ├── dao/{Users,Pets,Adoptions,Sessions}.dao.js
│   ├── dao/models/{User,Pet,Adoption}.js
│   ├── middlewares/validarObjectId.js
│   ├── repository/{Generic,User,Pet,Adoption,Session}Repository.js
│   ├── routes/{adoption,users,pets,sessions}.router.js
│   └── services/index.js
└── test/
    ├── helpers/fakes.js
    ├── integration/{adoption.router,health,security}.test.js
    └── unit/{adoptions.controller,validarObjectId}.test.js
```

### 2.2 Propósito de archivos y carpetas

- **`src/app.js`** — Punto de entrada: middlewares globales (Helmet, CORS, rate-limit, sanitización Mongo, body-limit), montaje de routers, manejadores 404/500 y arranque del servidor.
- **`src/routes/adoption.router.js`** — Router objetivo del entregable (3 endpoints).
- **`src/controllers/adoptions.controller.js`** — Lógica de negocio del recurso adopciones.
- **`src/middlewares/validarObjectId.js`** — Valida que los `ObjectId` de ruta sean hex de 24 caracteres antes de tocar la base de datos.
- **`src/services/index.js`** — Wiring de DAOs + Repositorios (inyección de dependencias).
- **`src/repository/`** — Capa de servicios; `RepositorioGenerico` define `getAll/getBy/create/update/delete` y los específicos (`Usuarios`, `Mascotas`, `Adopciones`, `Sesiones`) extienden.
- **`src/dao/`** — Acceso a datos con Mongoose; cada DAO encapsula un modelo.
- **`src/dao/models/`** — Esquemas y modelos Mongoose para Usuarios, Mascotas y Adopciones.
- **`test/helpers/fakes.js`** — Constructores de dobles de prueba (mocks/fakes) reutilizables, basados en `sinon`.
- **`test/integration/`** — Tests funcionales con `supertest` contra la app montada.
- **`test/unit/`** — Tests unitarios sin Express.
- **`Dockerfile`** — Imagen multi-stage endurecida (no root, dumb-init, healthcheck).
- **`docker-compose.yml`** — Stack local API + Mongo.
- **`.github/workflows/ci.yml`** — Pipeline (lint + tests + build de imagen).

---

## 3. Tests funcionales

### 3.1 Estrategia

Los tests funcionales usan **Mocha + Chai + Supertest**, con dobles de prueba construidos con **Sinon** en `test/helpers/fakes.js`. Las dependencias externas (Mongo, red) son sustituidas por *fakes* deterministas, de modo que cada test es:

- **Aislado** — no toca base de datos real.
- **Determinista** — mismo input → mismo output.
- **Rápido** — la suite completa corre en ~300 ms.

Se cubren casos **positivos**, **negativos** y **de borde** para cada endpoint, y además se valida el comportamiento ante **defensas de seguridad** transversales.

### 3.2 Qué valida cada grupo

| Bloque                                     | Qué se valida                                                                 |
|--------------------------------------------|-------------------------------------------------------------------------------|
| `GET /api/adopciones`                      | Listado completo, listado vacío, error del servicio (200/200/500).            |
| `GET /api/adopciones/:idAdopcion`          | Encontrada, no existe, id inválido, error del servicio (200/404/400/500).     |
| `POST /api/adopciones/:idUsuario/:idMascota` | Camino feliz, usuario inexistente, mascota inexistente, mascota ya adoptada, ids inválidos, edge cases, errores de servicio (200/404/404/400/400/200/500/500). |
| Métodos / subrutas no soportados           | 404 con envelope estándar.                                                    |
| Defensas de seguridad                      | Cabeceras Helmet, body-limit (413), JSON inválido (400), mongo-sanitize, 404 estándar. |
| Controlador unitario                       | Cada función responde con el status y payload esperados.                      |
| Middleware `validarObjectId`               | Pasa si los ids son válidos, 400 si no.                                       |

### 3.3 Código completo del router probado (`src/routes/adoption.router.js`)

```javascript
import { Router } from 'express';
import controladorAdopciones from '../controllers/adoptions.controller.js';
import { validarObjectId } from '../middlewares/validarObjectId.js';

const router = Router();

router.get('/', controladorAdopciones.obtenerTodasLasAdopciones);

router.get(
  '/:idAdopcion',
  validarObjectId('idAdopcion'),
  controladorAdopciones.obtenerAdopcion
);

router.post(
  '/:idUsuario/:idMascota',
  validarObjectId('idUsuario', 'idMascota'),
  controladorAdopciones.crearAdopcion
);

export default router;
```

### 3.4 Código completo de los tests funcionales del router (`test/integration/adoption.router.test.js`)

```javascript
import { expect } from 'chai';
import request from 'supertest';

import aplicacion from '../../src/app.js';
import {
  crearFakeAdopcion,
  crearFakeMascota,
  crearFakeUsuario,
  generarObjectId,
  instalarMocks,
  restaurarMocks
} from '../helpers/fakes.js';

describe('Router de adopciones - /api/adopciones', () => {
  let mocks;

  beforeEach(() => { mocks = instalarMocks(); });
  afterEach(() => { restaurarMocks(); });

  describe('GET /api/adopciones', () => {
    it('responde 200 y devuelve el listado completo de adopciones', async () => {
      mocks.adopciones.getAll.resolves([crearFakeAdopcion({ _id: generarObjectId('a1') })]);
      const r = await request(aplicacion).get('/api/adopciones');
      expect(r.status).to.equal(200);
      expect(r.body.payload).to.be.an('array').with.lengthOf(1);
    });
    it('responde 200 con arreglo vacío', async () => {
      mocks.adopciones.getAll.resolves([]);
      const r = await request(aplicacion).get('/api/adopciones');
      expect(r.status).to.equal(200);
      expect(r.body.payload).to.be.an('array').with.lengthOf(0);
    });
    it('responde 500 ante error del servicio', async () => {
      mocks.adopciones.getAll.rejects(new Error('boom'));
      const r = await request(aplicacion).get('/api/adopciones');
      expect(r.status).to.equal(500);
      expect(r.body).to.deep.equal({ status: 'error', error: 'internal server error' });
    });
  });

  describe('GET /api/adopciones/:idAdopcion', () => {
    it('200 cuando existe', async () => {
      const id = generarObjectId('a2');
      mocks.adopciones.getBy.resolves(crearFakeAdopcion({ _id: id }));
      const r = await request(aplicacion).get(`/api/adopciones/${id}`);
      expect(r.status).to.equal(200);
      expect(r.body.payload).to.deep.include({ _id: id });
    });
    it('404 cuando no existe', async () => {
      mocks.adopciones.getBy.resolves(null);
      const r = await request(aplicacion).get(`/api/adopciones/${generarObjectId('a3')}`);
      expect(r.status).to.equal(404);
    });
    it('400 cuando id no es ObjectId', async () => {
      const r = await request(aplicacion).get('/api/adopciones/no-es-un-id');
      expect(r.status).to.equal(400);
      expect(r.body.error).to.equal('invalid idAdopcion');
    });
    it('500 ante error del servicio', async () => {
      mocks.adopciones.getBy.rejects(new Error('db down'));
      const r = await request(aplicacion).get(`/api/adopciones/${generarObjectId('a4')}`);
      expect(r.status).to.equal(500);
    });
  });

  describe('POST /api/adopciones/:idUsuario/:idMascota', () => {
    const idUsuario = generarObjectId('u9');
    const idMascota = generarObjectId('m9');

    it('200 cuando todo es válido y persiste', async () => {
      mocks.usuarios.getUserById.resolves(crearFakeUsuario({ _id: idUsuario, pets: [] }));
      mocks.mascotas.getBy.resolves(crearFakeMascota({ _id: idMascota, adopted: false }));
      mocks.usuarios.update.resolves();
      mocks.mascotas.update.resolves();
      mocks.adopciones.create.resolves(crearFakeAdopcion());
      const r = await request(aplicacion).post(`/api/adopciones/${idUsuario}/${idMascota}`);
      expect(r.status).to.equal(200);
      expect(r.body).to.deep.equal({ status: 'success', message: 'Pet adopted' });
    });
    it('404 cuando usuario no existe', async () => {
      mocks.usuarios.getUserById.resolves(null);
      const r = await request(aplicacion).post(`/api/adopciones/${idUsuario}/${idMascota}`);
      expect(r.status).to.equal(404);
      expect(r.body.error).to.equal('user not found');
    });
    it('404 cuando mascota no existe', async () => {
      mocks.usuarios.getUserById.resolves(crearFakeUsuario({ _id: idUsuario }));
      mocks.mascotas.getBy.resolves(null);
      const r = await request(aplicacion).post(`/api/adopciones/${idUsuario}/${idMascota}`);
      expect(r.status).to.equal(404);
      expect(r.body.error).to.equal('pet not found');
    });
    it('400 cuando mascota ya está adoptada', async () => {
      mocks.usuarios.getUserById.resolves(crearFakeUsuario({ _id: idUsuario }));
      mocks.mascotas.getBy.resolves(crearFakeMascota({ _id: idMascota, adopted: true }));
      const r = await request(aplicacion).post(`/api/adopciones/${idUsuario}/${idMascota}`);
      expect(r.status).to.equal(400);
      expect(r.body.error).to.equal('pet is already adopted');
    });
    it('400 cuando idUsuario inválido', async () => {
      const r = await request(aplicacion).post(`/api/adopciones/no-id/${idMascota}`);
      expect(r.status).to.equal(400);
      expect(r.body.error).to.equal('invalid idUsuario');
    });
    it('400 cuando idMascota inválido', async () => {
      const r = await request(aplicacion).post(`/api/adopciones/${idUsuario}/no-id`);
      expect(r.status).to.equal(400);
      expect(r.body.error).to.equal('invalid idMascota');
    });
    it('inicializa pets vacío si usuario.pets es undefined', async () => {
      mocks.usuarios.getUserById.resolves(crearFakeUsuario({ _id: idUsuario, pets: undefined }));
      mocks.mascotas.getBy.resolves(crearFakeMascota({ _id: idMascota }));
      mocks.usuarios.update.resolves();
      mocks.mascotas.update.resolves();
      mocks.adopciones.create.resolves(crearFakeAdopcion());
      const r = await request(aplicacion).post(`/api/adopciones/${idUsuario}/${idMascota}`);
      expect(r.status).to.equal(200);
    });
    it('500 si servicioUsuarios.getUserById falla', async () => {
      mocks.usuarios.getUserById.rejects(new Error('mongo timeout'));
      const r = await request(aplicacion).post(`/api/adopciones/${idUsuario}/${idMascota}`);
      expect(r.status).to.equal(500);
    });
    it('500 si servicioAdopciones.create falla', async () => {
      mocks.usuarios.getUserById.resolves(crearFakeUsuario({ _id: idUsuario }));
      mocks.mascotas.getBy.resolves(crearFakeMascota({ _id: idMascota }));
      mocks.usuarios.update.resolves();
      mocks.mascotas.update.resolves();
      mocks.adopciones.create.rejects(new Error('write conflict'));
      const r = await request(aplicacion).post(`/api/adopciones/${idUsuario}/${idMascota}`);
      expect(r.status).to.equal(500);
    });
  });

  describe('Métodos / subrutas no soportadas', () => {
    it('404 para método no definido', async () => {
      const r = await request(aplicacion).delete('/api/adopciones');
      expect(r.status).to.equal(404);
    });
    it('404 para subruta inexistente', async () => {
      const r = await request(aplicacion).get('/api/adopciones/foo/bar/baz');
      expect(r.status).to.equal(404);
    });
  });
});
```

### 3.5 Helper de mocks/fakes (`test/helpers/fakes.js`)

```javascript
import sinon from 'sinon';
import {
  servicioAdopciones, servicioMascotas, servicioUsuarios
} from '../../src/services/index.js';

export const generarObjectId = (semilla = '1') => {
  const base = String(semilla).padStart(24, 'a');
  return base.slice(0, 24).toLowerCase().replace(/[^a-f0-9]/g, 'a');
};

export const crearFakeUsuario = (s = {}) => ({
  _id: generarObjectId('u1'), first_name: 'Ada', last_name: 'Lovelace',
  email: 'ada@example.com', password: 'hashed', role: 'user', pets: [], ...s
});

export const crearFakeMascota = (s = {}) => ({
  _id: generarObjectId('m1'), name: 'Firulais', specie: 'dog',
  birthDate: new Date('2020-05-01'), adopted: false, owner: null, image: '', ...s
});

export const crearFakeAdopcion = (s = {}) => ({
  _id: generarObjectId('a1'), owner: generarObjectId('u1'), pet: generarObjectId('m1'), ...s
});

export const instalarMocks = () => ({
  usuarios: {
    getUserById: sinon.stub(servicioUsuarios, 'getUserById'),
    getAll:      sinon.stub(servicioUsuarios, 'getAll'),
    update:      sinon.stub(servicioUsuarios, 'update')
  },
  mascotas: {
    getBy:       sinon.stub(servicioMascotas, 'getBy'),
    getAll:      sinon.stub(servicioMascotas, 'getAll'),
    update:      sinon.stub(servicioMascotas, 'update')
  },
  adopciones: {
    getAll:      sinon.stub(servicioAdopciones, 'getAll'),
    getBy:       sinon.stub(servicioAdopciones, 'getBy'),
    create:      sinon.stub(servicioAdopciones, 'create')
  }
});

export const restaurarMocks = () => sinon.restore();
```

### 3.6 Evidencia de ejecución (log completo)

```
$ docker run --rm -v "$(pwd):/app" -w /app -e NODE_ENV=test node:20-alpine npm test

> adoptame-backend-iii@1.0.0 test
> cross-env NODE_ENV=test mocha --recursive --timeout 10000 --exit "test/**/*.test.js"

  Router de adopciones - /api/adopciones
    GET /api/adopciones
      ✔ responde 200 y devuelve el listado completo de adopciones
      ✔ responde 200 con arreglo vacío cuando no hay adopciones
      ✔ responde 500 cuando el servicio lanza un error inesperado
    GET /api/adopciones/:idAdopcion
      ✔ responde 200 cuando la adopción existe
      ✔ responde 404 cuando la adopción no existe
      ✔ responde 400 cuando el id no tiene forma de ObjectId
      ✔ responde 500 cuando el servicio falla
    POST /api/adopciones/:idUsuario/:idMascota
      ✔ responde 200 y persiste la adopción cuando todo es válido
      ✔ responde 404 cuando el usuario no existe
      ✔ responde 404 cuando la mascota no existe
      ✔ responde 400 cuando la mascota ya está adoptada
      ✔ responde 400 cuando idUsuario no es ObjectId válido
      ✔ responde 400 cuando idMascota no es ObjectId válido
      ✔ inicializa pets vacío si el usuario no trae arreglo previo
      ✔ responde 500 si servicioUsuarios.getUserById falla
      ✔ responde 500 si servicioAdopciones.create falla
    Comportamiento ante métodos y rutas no soportados
      ✔ responde 404 para métodos no definidos en el recurso
      ✔ responde 404 para subrutas no registradas

  GET /health
    ✔ responde 200 con un payload de estado

  Defensas de seguridad transversales
    ✔ expone cabeceras de seguridad provistas por Helmet
    ✔ rechaza payloads JSON que excedan el límite con 413
    ✔ rechaza JSON malformado con 400 sin filtrar el stack
    ✔ sanitiza operadores Mongo ($ y .) en query strings
    ✔ responde 404 con envelope estándar para rutas inexistentes

  controladorAdopciones (unitario)
    obtenerTodasLasAdopciones
      ✔ llama al servicio y responde 200 con el listado
      ✔ responde 500 si el servicio rechaza
    obtenerAdopcion
      ✔ responde 200 con la adopción encontrada
      ✔ responde 404 cuando no existe
    crearAdopcion
      ✔ orquesta updates y create cuando todo es válido
      ✔ responde 400 cuando la mascota ya está adoptada

  validarObjectId (middleware)
    ✔ llama a next cuando todos los ids son válidos
    ✔ responde 400 cuando un parámetro es inválido
    ✔ responde 400 cuando un parámetro está ausente


  33 passing (306ms)
```

---

## 4. Dockerización

### 4.1 Contenido del `Dockerfile`

```dockerfile
# Stage 1: dependencias de producción
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
        npm ci --omit=dev --no-audit --no-fund; \
    else \
        npm install --omit=dev --no-audit --no-fund; \
    fi

# Stage 2: builder con dev-deps (para tests/lint en CI)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
        npm ci --no-audit --no-fund; \
    else \
        npm install --no-audit --no-fund; \
    fi
COPY . .

# Stage 3: imagen final mínima
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production PORT=8080 NPM_CONFIG_LOGLEVEL=warn
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
RUN chown -R node:node /app
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]
```

### 4.2 Decisiones de optimización y seguridad

- **Imagen base `node:20-alpine`** — superficie mínima (~150 MB base) y soporte LTS.
- **Multi-stage build** — la imagen final no contiene dev-dependencies ni código innecesario; solo `node_modules` de producción + `src/` + `package.json`.
- **`npm ci --omit=dev`** — instalación reproducible y determinista (lockfile), sin paquetes de prueba.
- **`USER node`** — el contenedor ejecuta como UID 1000 no-root, mitigando escalado en caso de RCE.
- **`dumb-init` como PID 1** — manejo correcto de señales SIGTERM/SIGINT y reaping de zombies.
- **`HEALTHCHECK`** — el orquestador puede detectar instancias caídas vía `/health`.
- **`.dockerignore`** — excluye `node_modules`, `.git`, tests, logs, IDE.
- **Capas optimizadas** — primero copian manifiestos (alta cacheabilidad) y luego el código.

### 4.3 Log de construcción

```
$ docker build -t jeshuarg/adoptme-backend-iii:1.0.1 \
               -t jeshuarg/adoptme-backend-iii:latest .

#1 [internal] load build definition from Dockerfile        DONE 0.1s
#2 [internal] load metadata for node:20-alpine             DONE 0.1s
#3 [internal] load .dockerignore                            DONE 0.1s
#4 [builder 1/5] FROM docker.io/library/node:20-alpine     DONE 0.4s
#5 [internal] load build context (230.48kB)                DONE 0.3s
#6 [builder 2/5] WORKDIR /app                              DONE 0.1s
#7 [runner 2/7] RUN apk add --no-cache dumb-init           DONE 2.2s
#8 [builder 3/5] COPY package.json package-lock.json* ./   DONE 0.2s
#9 [builder 4/5] RUN npm install (with dev deps)           DONE 11.8s
   added 428 packages in 11s
#10 [runner 3/7] WORKDIR /app                              DONE 0.2s
#11 [deps 4/4] RUN npm install --omit=dev                  DONE 10.6s
   added 217 packages in 10s
#12 [runner 4/7] COPY --from=deps /app/node_modules        DONE 0.5s
#13 [builder 5/5] COPY . .                                 DONE 0.2s
#14 [runner 5/7] COPY --from=builder /app/package.json     DONE 0.2s
#15 [runner 6/7] COPY --from=builder /app/src              DONE 0.1s
#16 [runner 7/7] RUN chown -R node:node /app               DONE 18.9s
#17 exporting to image                                     DONE 4.3s
   naming to docker.io/jeshuarg/adoptme-backend-iii:1.0.1
   naming to docker.io/jeshuarg/adoptme-backend-iii:latest
```

---

## 5. Imagen Docker

| Campo                | Valor                                                              |
|----------------------|--------------------------------------------------------------------|
| Repositorio DockerHub | `jeshuarg/adoptme-backend-iii`                                     |
| Tags                 | `1.0.1`, `1.0.0`, `latest`                                         |
| Tamaño               | ~65 MB comprimida / 299 MB descomprimida                           |
| URL pública          | <https://hub.docker.com/r/jeshuarg/adoptme-backend-iii>            |
| Pull                 | `docker pull jeshuarg/adoptme-backend-iii:1.0.1`                   |
| Repo GitHub          | <https://github.com/Jeshua-Romero-Guadarrama/adoptme-backend-iii>  |

### 5.1 Evidencia de build

```
$ docker images jeshuarg/adoptme-backend-iii --format "{{.Repository}}:{{.Tag}}\t{{.Size}}"
jeshuarg/adoptme-backend-iii:1.0.1   299MB
jeshuarg/adoptme-backend-iii:latest  299MB

$ docker push jeshuarg/adoptme-backend-iii:1.0.1
1.0.0: digest: sha256:844cf7845df191386a24f74b09c3423113e6bc698a3519fa02de0eb1057f4b50 size: 856

$ docker push jeshuarg/adoptme-backend-iii:latest
latest: digest: sha256:844cf7845df191386a24f74b09c3423113e6bc698a3519fa02de0eb1057f4b50 size: 856
```

### 5.2 Evidencia de ejecución del contenedor

```
$ docker run --rm -d --name adoptme-prueba -p 8080:8080 jeshuarg/adoptme-backend-iii:1.0.1
845c698240468affcab9be58156f29bd66f6e16c117d354e17e04236c83ffdae

$ curl http://localhost:8080/health
HTTP/1.1 200 OK
{"status":"ok","uptime":8.595416726,"timestamp":"2026-05-04T01:12:53.621Z","env":"production"}

$ curl http://localhost:8080/api/adopciones/no-id-malo
HTTP/1.1 400 Bad Request
{"status":"error","error":"invalid idAdopcion"}

$ curl http://localhost:8080/ruta/inexistente
HTTP/1.1 404 Not Found
{"status":"error","error":"not found"}

$ curl http://localhost:8080/api/docs/
HTTP/1.1 200 OK
(Swagger UI - 3106 bytes)

$ docker logs adoptme-prueba
MONGO_URL no definida - se omite la conexion a la base de datos.
Servidor escuchando en el puerto :8080
GET /health 200 94 - 6.994 ms
GET /api/adopciones/no-id-malo 400 47 - 1.458 ms
GET /ruta/inexistente 404 38 - 0.896 ms
GET /api/docs/ 200 3106 - 2.904 ms
```

---

## 6. Ejecución del proyecto

### 6.1 Construir la imagen

```powershell
docker build -t jeshuarg/adoptme-backend-iii:1.0.1 `
             -t jeshuarg/adoptme-backend-iii:latest .
```

### 6.2 Ejecutar el contenedor

```powershell
docker run --rm -p 8080:8080 jeshuarg/adoptme-backend-iii:1.0.1
```

Con base de datos:

```powershell
docker compose up --build
```

### 6.3 Correr los tests

```powershell
docker run --rm `
  -v "${PWD}:/app" -w /app -e NODE_ENV=test `
  node:20-alpine sh -c "npm install --no-audit --no-fund && npm test"
```

Resultado esperado:

```
33 passing (306ms)
```

### 6.4 Subir a DockerHub

```powershell
docker login -u jeshuarg
docker push jeshuarg/adoptme-backend-iii:1.0.1
docker push jeshuarg/adoptme-backend-iii:latest
```

### 6.5 Escaneo de vulnerabilidades

```powershell
docker scout quickview jeshuarg/adoptme-backend-iii:1.0.1
docker scout cves      jeshuarg/adoptme-backend-iii:1.0.1
```

---

## 7. README.md

A continuación el contenido completo del archivo `README.md`. Permite reproducir el proyecto sin información adicional.

```markdown
# AdoptMe API — Backend III (Entregable Final)

**Autor:** Jeshua Romero Guadarrama

## ¿De qué trata?

API REST de una plataforma de adopción de mascotas. Modela usuarios,
mascotas y registros de adopción. Tres endpoints en /api/adopciones.

## Endpoints

| Método | Ruta                                            | Descripción              |
|-------:|-------------------------------------------------|--------------------------|
| GET    | /api/adopciones                                 | Lista todas              |
| GET    | /api/adopciones/:idAdopcion                     | Obtiene una por id       |
| POST   | /api/adopciones/:idUsuario/:idMascota           | Enlaza usuario y mascota |

## Defensas de seguridad

- Helmet, CORS estricto, rate-limit, mongo-sanitize, body-limit 100kb.
- Validación de ObjectId. Errores con envelope sin fuga de detalles.
- Imagen Docker no-root + dumb-init + healthcheck.

## Imagen Docker

- Repositorio: jeshuarg/adoptme-backend-iii
- Tags: 1.0.0, latest
- URL: https://hub.docker.com/r/jeshuarg/adoptme-backend-iii
- Pull: docker pull jeshuarg/adoptme-backend-iii:1.0.1
- Repo GitHub: https://github.com/Jeshua-Romero-Guadarrama/adoptme-backend-iii

## Reproducción

# Tests
docker run --rm -v "${PWD}:/app" -w /app -e NODE_ENV=test \
  node:20-alpine sh -c "npm install && npm test"

# Build
docker build -t jeshuarg/adoptme-backend-iii:1.0.1 .

# Run
docker run --rm -p 8080:8080 jeshuarg/adoptme-backend-iii:1.0.1

curl http://localhost:8080/health
curl http://localhost:8080/api/docs/

# Pull (publicada en DockerHub)
docker pull jeshuarg/adoptme-backend-iii:1.0.1
```
