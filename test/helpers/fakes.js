// =============================================================================
// test/helpers/fakes.js
// -----------------------------------------------------------------------------
// Autor: Jeshua Romero Guadarrama
//
// Se centralizan en este módulo las utilidades para construir dobles de
// prueba (mocks y fakes) reutilizables. El objetivo es aislar por completo
// los tests funcionales de cualquier dependencia externa (Mongo, red, etc.)
// y mantener cada caso de prueba determinista.
//
// Convenciones:
//   - `crearFakeUsuario`, `crearFakeMascota`, `crearFakeAdopcion` devuelven
//      objetos planos con la forma esperada por los controladores.
//   - `instalarMocks` / `restaurarMocks` reemplazan los métodos de los
//      servicios reales por stubs de sinon, permitiendo verificar llamadas
//      e imponer respuestas controladas por test.
// =============================================================================

import sinon from 'sinon';

import {
  servicioAdopciones,
  servicioMascotas,
  servicioUsuarios
} from '../../src/services/index.js';

/**
 * Se construye un identificador con forma de ObjectId (24 hex) determinista
 * para cada test. Permite mantener legibilidad y aislamiento.
 */
export const generarObjectId = (semilla = '1') => {
  const base = String(semilla).padStart(24, 'a');
  return base.slice(0, 24).toLowerCase().replace(/[^a-f0-9]/g, 'a');
};

/** Se devuelve un usuario plano para pruebas. */
export const crearFakeUsuario = (sobrescribir = {}) => ({
  _id: generarObjectId('u1'),
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  password: 'hashed',
  role: 'user',
  pets: [],
  ...sobrescribir
});

/** Se devuelve una mascota plana para pruebas. */
export const crearFakeMascota = (sobrescribir = {}) => ({
  _id: generarObjectId('m1'),
  name: 'Firulais',
  specie: 'dog',
  birthDate: new Date('2020-05-01'),
  adopted: false,
  owner: null,
  image: '',
  ...sobrescribir
});

/** Se devuelve una adopción plana para pruebas. */
export const crearFakeAdopcion = (sobrescribir = {}) => ({
  _id: generarObjectId('a1'),
  owner: generarObjectId('u1'),
  pet: generarObjectId('m1'),
  ...sobrescribir
});

/**
 * Se instalan stubs sobre los servicios reales y se devuelve una caja con
 * todos ellos para configurarlos por test. La instalación se hace siempre
 * con `sinon.stub(objeto, 'metodo')` para que pueda restaurarse limpiamente.
 */
export const instalarMocks = () => {
  const mocks = {
    usuarios: {
      getUserById: sinon.stub(servicioUsuarios, 'getUserById'),
      getAll: sinon.stub(servicioUsuarios, 'getAll'),
      update: sinon.stub(servicioUsuarios, 'update')
    },
    mascotas: {
      getBy: sinon.stub(servicioMascotas, 'getBy'),
      getAll: sinon.stub(servicioMascotas, 'getAll'),
      update: sinon.stub(servicioMascotas, 'update')
    },
    adopciones: {
      getAll: sinon.stub(servicioAdopciones, 'getAll'),
      getBy: sinon.stub(servicioAdopciones, 'getBy'),
      create: sinon.stub(servicioAdopciones, 'create')
    }
  };
  return mocks;
};

/**
 * Se restauran todos los stubs instalados por sinon, dejando los servicios
 * en su estado original. Se invoca desde `afterEach` para asegurar que cada
 * test arranca con dependencias limpias.
 */
export const restaurarMocks = () => {
  sinon.restore();
};

export default {
  generarObjectId,
  crearFakeUsuario,
  crearFakeMascota,
  crearFakeAdopcion,
  instalarMocks,
  restaurarMocks
};
