// =============================================================================
// Sessions.dao.js
// -----------------------------------------------------------------------------
// Se define el DAO de sesiones. Reutiliza el modelo de usuarios porque las
// sesiones se identifican por la cuenta del usuario autenticado.
// =============================================================================

import modeloUsuario from './models/User.js';

export default class DaoSesiones {
  getBy = (filtro) => modeloUsuario.findOne(filtro);
  save = (documento) => modeloUsuario.create(documento);
}
