# =============================================================================
# Dockerfile - AdoptMe (Backend III)
# -----------------------------------------------------------------------------
# Autor: Jeshua Romero Guadarrama
#
# Se construye una imagen multi-stage que:
#   1) Resuelve dependencias en una etapa "deps" usando `npm ci`.
#   2) Compila/copia el código fuente en una etapa "builder".
#   3) Empaqueta solo los artefactos productivos en una imagen "runner"
#      basada en `node:20-alpine` ejecutándose como usuario no privilegiado.
#
# Hardening aplicado:
#   - Imagen base ligera (alpine).
#   - Multi-stage para reducir superficie y tamaño final.
#   - `npm ci --omit=dev` para instalar solo dependencias de producción.
#   - Usuario `node` (UID 1000) no root en runtime.
#   - HEALTHCHECK que consulta /health.
#   - `dumb-init` como PID 1 para correcta señal y reaping de procesos.
#   - Variable NODE_ENV=production por defecto.
#   - WORKDIR fijo y permisos correctos.
# =============================================================================

# --- Stage 1: dependencias de producción --------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Se copian primero los manifiestos para aprovechar el cache de capas.
COPY package.json package-lock.json* ./

# `npm ci` falla si lockfile y package.json desincronizan; si no existe el
# lockfile (primer build) se usa `npm install --omit=dev` como fallback.
RUN if [ -f package-lock.json ]; then \
        npm ci --omit=dev --no-audit --no-fund; \
    else \
        npm install --omit=dev --no-audit --no-fund; \
    fi

# --- Stage 2: builder con dev-deps (para tests/lint en CI) --------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
        npm ci --no-audit --no-fund; \
    else \
        npm install --no-audit --no-fund; \
    fi
COPY . .

# --- Stage 3: imagen final mínima --------------------------------------------
FROM node:20-alpine AS runner

# Se instala dumb-init para manejar señales correctamente como PID 1.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production \
    PORT=8080 \
    NPM_CONFIG_LOGLEVEL=warn

WORKDIR /app

# Se copian solo los artefactos imprescindibles desde las etapas previas.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src

# Se ajustan permisos para que el usuario `node` (no-root) sea propietario.
RUN chown -R node:node /app

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]
