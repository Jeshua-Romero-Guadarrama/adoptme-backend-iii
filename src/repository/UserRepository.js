// =============================================================================
// UserRepository.js
// -----------------------------------------------------------------------------
// Se especializa el repositorio genérico con consultas propias del dominio
// de usuarios (búsqueda por id y por email).
// =============================================================================

import RepositorioGenerico from './GenericRepository.js';

export default class RepositorioUsuarios extends RepositorioGenerico {
  constructor(dao) {
    super(dao);
  }

  // Se obtiene un usuario por su identificador.
  getUserById = (id) => this.getBy({ _id: id });

  // Se obtiene un usuario por su email (campo único).
  getUserByEmail = (email) => this.getBy({ email });
}
