// =============================================================================
// AdoptionRepository.js
// -----------------------------------------------------------------------------
// Se hereda el comportamiento del repositorio genérico para el recurso
// "adopciones".
// =============================================================================

import RepositorioGenerico from './GenericRepository.js';

export default class RepositorioAdopciones extends RepositorioGenerico {
  constructor(dao) {
    super(dao);
  }
}
