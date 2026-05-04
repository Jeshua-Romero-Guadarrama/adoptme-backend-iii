// =============================================================================
// services/index.js
// -----------------------------------------------------------------------------
// Se ensamblan aquí los servicios de la aplicación (capa de repositorios).
// Cada servicio se construye inyectando un DAO concreto a un repositorio,
// favoreciendo la inversión de dependencias y facilitando la sustitución
// por dobles de prueba en los tests funcionales.
// =============================================================================

import DaoUsuarios from '../dao/Users.dao.js';
import DaoMascotas from '../dao/Pets.dao.js';
import DaoAdopciones from '../dao/Adoptions.dao.js';
import DaoSesiones from '../dao/Sessions.dao.js';

import RepositorioUsuarios from '../repository/UserRepository.js';
import RepositorioMascotas from '../repository/PetRepository.js';
import RepositorioAdopciones from '../repository/AdoptionRepository.js';
import RepositorioSesiones from '../repository/SessionRepository.js';

// Se exportan instancias listas para usar desde controladores y tests.
export const servicioUsuarios = new RepositorioUsuarios(new DaoUsuarios());
export const servicioMascotas = new RepositorioMascotas(new DaoMascotas());
export const servicioAdopciones = new RepositorioAdopciones(new DaoAdopciones());
export const servicioSesiones = new RepositorioSesiones(new DaoSesiones());
