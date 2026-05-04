// =============================================================================
// users.router.js
// -----------------------------------------------------------------------------
// Se define un router mínimo para el recurso "usuarios".
// Únicamente se expone el listado, suficiente para validar que el resto de
// rutas no se ven afectadas por los tests del router de adopciones.
// =============================================================================

import { Router } from 'express';
import { servicioUsuarios } from '../services/index.js';

const router = Router();

router.get('/', async (_solicitud, respuesta) => {
  // Se delegan los detalles de persistencia al servicio.
  const usuarios = await servicioUsuarios.getAll();
  respuesta.send({ status: 'success', payload: usuarios });
});

export default router;
