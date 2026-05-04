// =============================================================================
// Pets.dao.js
// -----------------------------------------------------------------------------
// Se define el DAO de mascotas, análogo al de usuarios pero apuntando al
// modelo de Mongoose `modeloMascota`.
// =============================================================================

import modeloMascota from './models/Pet.js';

export default class DaoMascotas {
  get = (filtro) => modeloMascota.find(filtro);
  getBy = (filtro) => modeloMascota.findOne(filtro);
  save = (documento) => modeloMascota.create(documento);
  update = (id, documento) => modeloMascota.findByIdAndUpdate(id, documento);
  delete = (id) => modeloMascota.findByIdAndDelete(id);
}
