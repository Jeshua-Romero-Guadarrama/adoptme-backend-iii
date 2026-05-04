// =============================================================================
// adoption.router.js
// -----------------------------------------------------------------------------
// Autor: Jeshua Romero Guadarrama
//
// Se define el router del recurso "adopciones". Se exponen tres endpoints:
//   GET  /api/adopciones                              -> listar todas
//   GET  /api/adopciones/:idAdopcion                  -> obtener una por id
//   POST /api/adopciones/:idUsuario/:idMascota        -> crear adopción
//
// Se delegan las reglas de negocio al controlador correspondiente. Antes de
// llegar al controlador se valida con un middleware que los parámetros de
// ruta sean ObjectId bien formados, lo que reduce la superficie de ataque
// frente a entradas maliciosas.
// =============================================================================

import { Router } from 'express';
import controladorAdopciones from '../controllers/adoptions.controller.js';
import { validarObjectId } from '../middlewares/validarObjectId.js';

// Se instancia el Router de Express que agrupa las rutas de este recurso.
const router = Router();

/**
 * @openapi
 * /api/adopciones:
 *   get:
 *     summary: Devuelve todas las adopciones registradas.
 *     tags: [Adopciones]
 *     responses:
 *       200:
 *         description: Listado de adopciones.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/', controladorAdopciones.obtenerTodasLasAdopciones);

/**
 * @openapi
 * /api/adopciones/{idAdopcion}:
 *   get:
 *     summary: Devuelve una única adopción por su identificador.
 *     tags: [Adopciones]
 *     parameters:
 *       - in: path
 *         name: idAdopcion
 *         required: true
 *         schema: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *     responses:
 *       200: { description: Adopción encontrada. }
 *       400: { description: Identificador inválido. }
 *       404: { description: La adopción no existe. }
 *       500: { description: Error interno del servidor. }
 */
router.get(
  '/:idAdopcion',
  validarObjectId('idAdopcion'),
  controladorAdopciones.obtenerAdopcion
);

/**
 * @openapi
 * /api/adopciones/{idUsuario}/{idMascota}:
 *   post:
 *     summary: Crea una adopción enlazando un usuario con una mascota.
 *     tags: [Adopciones]
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *       - in: path
 *         name: idMascota
 *         required: true
 *         schema: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *     responses:
 *       200: { description: Mascota adoptada correctamente. }
 *       400: { description: Identificador inválido o mascota ya adoptada. }
 *       404: { description: Usuario o mascota inexistentes. }
 *       500: { description: Error interno del servidor. }
 */
router.post(
  '/:idUsuario/:idMascota',
  validarObjectId('idUsuario', 'idMascota'),
  controladorAdopciones.crearAdopcion
);

// Se exporta el router para que sea montado desde `app.js`.
export default router;
