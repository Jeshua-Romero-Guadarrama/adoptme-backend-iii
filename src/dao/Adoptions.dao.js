// =============================================================================
// Adoptions.dao.js
// -----------------------------------------------------------------------------
// Se define el DAO de adopciones. Persiste pares (usuario, mascota) que
// representan una adopción concretada.
// =============================================================================

import modeloAdopcion from './models/Adoption.js';

export default class DaoAdopciones {
  get = (filtro) => modeloAdopcion.find(filtro);
  getBy = (filtro) => modeloAdopcion.findOne(filtro);
  save = (documento) => modeloAdopcion.create(documento);
  update = (id, documento) => modeloAdopcion.findByIdAndUpdate(id, documento);
  delete = (id) => modeloAdopcion.findByIdAndDelete(id);
}
