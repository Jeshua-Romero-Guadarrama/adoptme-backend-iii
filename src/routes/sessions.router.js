// =============================================================================
// sessions.router.js
// -----------------------------------------------------------------------------
// Se define un router mínimo para el recurso "sesiones". Únicamente se expone
// /current a modo de placeholder.
// =============================================================================

import { Router } from 'express';

const router = Router();

router.get('/current', (_solicitud, respuesta) => {
  respuesta.send({ status: 'success', payload: { user: null } });
});

export default router;
