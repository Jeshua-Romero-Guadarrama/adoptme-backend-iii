# Política de Seguridad

**Autor:** Jeshua Romero Guadarrama

## Defensas implementadas

- **Helmet** — Cabeceras HTTP seguras (CSP, HSTS, `X-Content-Type-Options`, etc.).
- **CORS estricto** — Lista blanca configurable mediante `CORS_ORIGINS`.
- **Rate limit** — 120 peticiones por minuto por IP.
- **express-mongo-sanitize** — Neutraliza operadores Mongo en query y body.
- **Body size limit** — `100kb` para JSON y `urlencoded` para mitigar DoS.
- **Validación de ObjectId** — Rechaza con `400` cualquier id mal formado.
- **Manejo de errores genérico** — Nunca se filtra el stack ni detalles internos al cliente.
- **Imagen Docker hardening** — Usuario `node` (no root), `dumb-init` como PID 1, `node:20-alpine` y `npm ci --omit=dev`.
- **HEALTHCHECK** — Verifica `/health` desde el contenedor.

## Reporte de vulnerabilidades

Si se identifica una vulnerabilidad, contactar al autor por canales privados.
**No** abrir issues públicos con detalles explotables.
