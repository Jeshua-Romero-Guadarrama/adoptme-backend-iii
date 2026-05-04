# Changelog

**Autor:** Jeshua Romero Guadarrama

## [1.0.1]

### Seguridad
- Bump `bcrypt` 5.1.1 → 6.0.0 (cierra GHSA en `tar` transitivo).
- Bump `multer` 1.4.5 → 2.1.1 (cierra 4 GHSA de DoS en multer 1.x).
- Bump `express` 4.19.2 → 4.22.1 (cierra GHSA en `body-parser` y `cookie`).
- Bump `compression` 1.7.4 → 1.8.1, `cookie-parser` 1.4.6 → 1.4.7.
- Bump `helmet` 7.1.0 → 8.1.0, `mongoose` 8.4.1 → 8.18.3, `morgan` 1.10.0 → 1.10.1, `express-rate-limit` 7.4.0 → 7.5.1.
- `npm audit --omit=dev` ahora reporta **0 vulnerabilidades**.
- `npm overrides` fuerza `serialize-javascript@7.0.5` para cerrar
  CVEs transitivos en mocha (dev). `npm audit` global: **0 vulnerabilidades**.

## [1.0.0]

### Agregado
- Router `adoption.router.js` con 3 endpoints (GET listar, GET por id, POST crear).
- Controlador, repositorios, DAOs y modelos de Mongoose.
- Defensas de seguridad: Helmet, CORS, rate limit, mongo sanitize, body limit.
- Validación de `ObjectId` en parámetros de ruta.
- Suite de tests funcionales con Mocha + Chai + Supertest + Sinon.
- Tests unitarios para controlador y middleware.
- `Dockerfile` multi-stage endurecido (no root, dumb-init, healthcheck).
- `docker-compose.yml` con MongoDB.
- Documentación OpenAPI servida en `/api/docs`.
- Workflow de CI con GitHub Actions.
- ESLint y EditorConfig.
- Archivo `requests.http` para pruebas manuales.
