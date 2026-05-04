// =============================================================================
// pets.router.js
// -----------------------------------------------------------------------------
// Se define un router mínimo para el recurso "mascotas". Sólo se expone el
// listado a modo de utilidad.
// =============================================================================

import { Router } from 'express';
import { servicioMascotas } from '../services/index.js';

const router = Router();

router.get('/', async (_solicitud, respuesta) => {
  const mascotas = await servicioMascotas.getAll();
  respuesta.send({ status: 'success', payload: mascotas });
});

export default router;
