// =============================================================================
// Users.dao.js
// -----------------------------------------------------------------------------
// Se define el DAO de usuarios. Encapsula el acceso al modelo de Mongoose
// exponiendo una API uniforme: get, getBy, save, update y delete.
// =============================================================================

import modeloUsuario from './models/User.js';

export default class DaoUsuarios {
  // Se obtienen documentos que cumplan el filtro recibido.
  get = (filtro) => modeloUsuario.find(filtro);

  // Se obtiene un único documento que cumpla el filtro.
  getBy = (filtro) => modeloUsuario.findOne(filtro);

  // Se persiste un nuevo documento.
  save = (documento) => modeloUsuario.create(documento);

  // Se actualiza el documento identificado por id.
  update = (id, documento) =>
    modeloUsuario.findByIdAndUpdate(id, documento);

  // Se elimina el documento identificado por id.
  delete = (id) => modeloUsuario.findByIdAndDelete(id);
}
