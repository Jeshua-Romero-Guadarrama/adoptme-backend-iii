// =============================================================================
// SessionRepository.js
// -----------------------------------------------------------------------------
// Se hereda el comportamiento del repositorio genérico para el recurso
// "sesiones".
// =============================================================================

import RepositorioGenerico from './GenericRepository.js';

export default class RepositorioSesiones extends RepositorioGenerico {
  constructor(dao) {
    super(dao);
  }
}
