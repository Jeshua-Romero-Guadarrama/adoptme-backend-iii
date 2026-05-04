// =============================================================================
// PetRepository.js
// -----------------------------------------------------------------------------
// Se hereda el comportamiento del repositorio genérico sin añadir consultas
// adicionales por ahora. Se mantiene la clase para preservar la simetría
// con el resto de los repositorios.
// =============================================================================

import RepositorioGenerico from './GenericRepository.js';

export default class RepositorioMascotas extends RepositorioGenerico {
  constructor(dao) {
    super(dao);
  }
}
