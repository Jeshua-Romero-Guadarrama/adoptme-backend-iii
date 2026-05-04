# Changelog

**Autor:** Jeshua Romero Guadarrama

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
