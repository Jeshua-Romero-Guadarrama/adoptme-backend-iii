// =============================================================================
// app.js
// -----------------------------------------------------------------------------
// Autor: Jeshua Romero Guadarrama
//
// Se define el punto de entrada de la aplicación AdoptMe. Se construye la
// instancia de Express, se aplican defensas de seguridad por capas y se
// registran los routers del dominio. Cuando NODE_ENV !== 'test' también se
// inicializan la conexión a MongoDB y el servidor HTTP.
//
// Defensas aplicadas (defense-in-depth):
//   - Helmet:                  cabeceras seguras (CSP, HSTS, XSS, etc.).
//   - CORS estricto:           orígenes permitidos por configuración.
//   - Rate limit global:       protege de abuso/fuerza bruta.
//   - Mongo sanitize:          neutraliza operadores $ y . en el input.
//   - Body size limit:         evita payloads excesivos (DoS).
//   - JSON inválido controlado:respuesta 400 sin filtrar el stack.
//   - Manejador 404 + 500:     respuestas uniformes sin fuga interna.
// =============================================================================

import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';

import enrutadorUsuarios from './routes/users.router.js';
import enrutadorMascotas from './routes/pets.router.js';
import enrutadorAdopciones from './routes/adoption.router.js';
import enrutadorSesiones from './routes/sessions.router.js';

// -----------------------------------------------------------------------------
// Configuración
// -----------------------------------------------------------------------------
// Se leen variables de entorno con valores por defecto seguros.
const PUERTO = process.env.PORT || 8080;
const URL_MONGO = process.env.MONGO_URL;
const ENTORNO = process.env.NODE_ENV || 'development';
const ORIGENES_PERMITIDOS = (process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);

// Se construye la especificación OpenAPI a partir de los comentarios JSDoc
// presentes en los routers. La documentación queda servida en /api/docs.
const especificacionSwagger = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API AdoptMe',
      version: '1.0.0',
      description:
        'Documentación de la API AdoptMe (entregable final de Backend III).',
      contact: { name: 'Jeshua Romero Guadarrama' },
      license: { name: 'MIT' }
    },
    servers: [{ url: `http://localhost:${PUERTO}` }]
  },
  apis: ['./src/routes/*.js']
});

// -----------------------------------------------------------------------------
// Construcción de la aplicación
// -----------------------------------------------------------------------------
const aplicacion = express();

// Se confía en un único proxy delante de la app (necesario para rate-limit
// cuando se despliega tras un balanceador).
aplicacion.set('trust proxy', 1);

// Se aplican cabeceras de seguridad por defecto.
aplicacion.use(helmet());

// Se habilita CORS limitado a los orígenes permitidos.
aplicacion.use(
  cors({
    origin: ORIGENES_PERMITIDOS.includes('*') ? true : ORIGENES_PERMITIDOS,
    credentials: true
  })
);

// Se comprimen las respuestas para reducir consumo de red.
aplicacion.use(compression());

// Se loguean las peticiones HTTP en formato compacto excepto durante los tests.
if (ENTORNO !== 'test') {
  aplicacion.use(morgan('tiny'));
}

// Se acotan los cuerpos JSON y de cookies para limitar superficie de ataque.
aplicacion.use(express.json({ limit: '100kb' }));
aplicacion.use(express.urlencoded({ extended: true, limit: '100kb' }));
aplicacion.use(cookieParser());

// Se neutralizan operadores Mongo ($, .) en query y body para evitar
// inyecciones NoSQL. Se ejecuta DESPUÉS del parseo del body.
aplicacion.use(mongoSanitize({ replaceWith: '_' }));

// Se aplica rate-limit global. En test se desactiva para que la suite sea
// determinista y rápida.
if (ENTORNO !== 'test') {
  aplicacion.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { status: 'error', error: 'too many requests' }
    })
  );
}

// -----------------------------------------------------------------------------
// Endpoints públicos auxiliares
// -----------------------------------------------------------------------------
// Se expone un endpoint de salud para healthchecks externos y de Docker.
aplicacion.get('/health', (_solicitud, respuesta) =>
  respuesta.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: ENTORNO
  })
);

// -----------------------------------------------------------------------------
// Routers de dominio
// -----------------------------------------------------------------------------
aplicacion.use('/api/usuarios', enrutadorUsuarios);
aplicacion.use('/api/mascotas', enrutadorMascotas);
aplicacion.use('/api/adopciones', enrutadorAdopciones);
aplicacion.use('/api/sesiones', enrutadorSesiones);
aplicacion.use(
  '/api/docs',
  swaggerUiExpress.serve,
  swaggerUiExpress.setup(especificacionSwagger)
);

// -----------------------------------------------------------------------------
// Manejadores 404 y 500
// -----------------------------------------------------------------------------
// Se devuelve 404 para cualquier ruta no registrada.
aplicacion.use((_solicitud, respuesta) =>
  respuesta.status(404).send({ status: 'error', error: 'not found' })
);

// Se centraliza el manejo de errores. Se loguea internamente sin filtrar
// detalles al cliente (importante para no exponer stack traces, PII o rutas).
// eslint-disable-next-line no-unused-vars
aplicacion.use((error, _solicitud, respuesta, _siguiente) => {
  if (ENTORNO !== 'test') {
    console.error('Error no controlado:', error.message);
  }
  // JSON inválido recibido en el body.
  if (error?.type === 'entity.parse.failed') {
    return respuesta.status(400).send({ status: 'error', error: 'invalid json' });
  }
  // Body excede el límite configurado.
  if (error?.type === 'entity.too.large') {
    return respuesta
      .status(413)
      .send({ status: 'error', error: 'payload too large' });
  }
  return respuesta
    .status(500)
    .send({ status: 'error', error: 'internal server error' });
});

// -----------------------------------------------------------------------------
// Inicialización (omitida durante los tests)
// -----------------------------------------------------------------------------
if (ENTORNO !== 'test') {
  if (URL_MONGO) {
    mongoose
      .connect(URL_MONGO)
      .then(() => console.log('Conexión a MongoDB establecida.'))
      .catch((error) =>
        console.error('Error conectando con MongoDB:', error.message)
      );
  } else {
    console.log(
      'MONGO_URL no definida — se omite la conexión a la base de datos.'
    );
  }
  aplicacion.listen(PUERTO, () =>
    console.log(`Servidor escuchando en el puerto :${PUERTO}`)
  );
}

// Se exporta la aplicación para que pueda ser consumida por supertest.
export default aplicacion;
