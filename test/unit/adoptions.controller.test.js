// =============================================================================
// test/unit/adoptions.controller.test.js
// -----------------------------------------------------------------------------
// Autor: Jeshua Romero Guadarrama
//
// Se prueban en aislamiento las funciones del controlador, sin pasar por
// Express. Se construyen objetos `solicitud` y `respuesta` falsos para
// verificar el contrato directo del controlador.
// =============================================================================

import { expect } from 'chai';
import sinon from 'sinon';

import controladorAdopciones from '../../src/controllers/adoptions.controller.js';
import {
  crearFakeAdopcion,
  crearFakeMascota,
  crearFakeUsuario,
  generarObjectId,
  instalarMocks,
  restaurarMocks
} from '../helpers/fakes.js';

const construirRespuestaFake = () => {
  const respuesta = {};
  respuesta.status = sinon.stub().returns(respuesta);
  respuesta.send = sinon.stub().returns(respuesta);
  return respuesta;
};

describe('controladorAdopciones (unitario)', () => {
  let mocks;

  beforeEach(() => {
    mocks = instalarMocks();
  });

  afterEach(() => {
    restaurarMocks();
  });

  describe('obtenerTodasLasAdopciones', () => {
    it('llama al servicio y responde 200 con el listado', async () => {
      const adopciones = [crearFakeAdopcion()];
      mocks.adopciones.getAll.resolves(adopciones);

      const respuesta = construirRespuestaFake();
      await controladorAdopciones.obtenerTodasLasAdopciones({}, respuesta);

      expect(respuesta.status.calledOnceWith(200)).to.equal(true);
      expect(respuesta.send.calledOnce).to.equal(true);
      expect(respuesta.send.firstCall.args[0]).to.deep.equal({
        status: 'success',
        payload: adopciones
      });
    });

    it('responde 500 si el servicio rechaza', async () => {
      mocks.adopciones.getAll.rejects(new Error('boom'));

      const respuesta = construirRespuestaFake();
      await controladorAdopciones.obtenerTodasLasAdopciones({}, respuesta);

      expect(respuesta.status.calledOnceWith(500)).to.equal(true);
    });
  });

  describe('obtenerAdopcion', () => {
    it('responde 200 con la adopción encontrada', async () => {
      const idAdopcion = generarObjectId('a1');
      const adopcion = crearFakeAdopcion({ _id: idAdopcion });
      mocks.adopciones.getBy.resolves(adopcion);

      const respuesta = construirRespuestaFake();
      await controladorAdopciones.obtenerAdopcion(
        { params: { idAdopcion } },
        respuesta
      );

      expect(respuesta.status.calledOnceWith(200)).to.equal(true);
      expect(respuesta.send.firstCall.args[0]).to.deep.equal({
        status: 'success',
        payload: adopcion
      });
    });

    it('responde 404 cuando no existe', async () => {
      mocks.adopciones.getBy.resolves(null);

      const respuesta = construirRespuestaFake();
      await controladorAdopciones.obtenerAdopcion(
        { params: { idAdopcion: generarObjectId('a2') } },
        respuesta
      );

      expect(respuesta.status.calledOnceWith(404)).to.equal(true);
      expect(respuesta.send.firstCall.args[0].error).to.equal(
        'Adoption not found'
      );
    });
  });

  describe('crearAdopcion', () => {
    const idUsuario = generarObjectId('u1');
    const idMascota = generarObjectId('m1');

    it('orquesta updates y create cuando todo es válido', async () => {
      mocks.usuarios.getUserById.resolves(
        crearFakeUsuario({ _id: idUsuario, pets: [] })
      );
      mocks.mascotas.getBy.resolves(
        crearFakeMascota({ _id: idMascota, adopted: false })
      );
      mocks.usuarios.update.resolves();
      mocks.mascotas.update.resolves();
      mocks.adopciones.create.resolves(crearFakeAdopcion());

      const respuesta = construirRespuestaFake();
      await controladorAdopciones.crearAdopcion(
        { params: { idUsuario, idMascota } },
        respuesta
      );

      expect(respuesta.status.calledOnceWith(200)).to.equal(true);
      expect(respuesta.send.firstCall.args[0]).to.deep.equal({
        status: 'success',
        message: 'Pet adopted'
      });
    });

    it('responde 400 cuando la mascota ya está adoptada', async () => {
      mocks.usuarios.getUserById.resolves(crearFakeUsuario({ _id: idUsuario }));
      mocks.mascotas.getBy.resolves(
        crearFakeMascota({ _id: idMascota, adopted: true })
      );

      const respuesta = construirRespuestaFake();
      await controladorAdopciones.crearAdopcion(
        { params: { idUsuario, idMascota } },
        respuesta
      );

      expect(respuesta.status.calledOnceWith(400)).to.equal(true);
      expect(respuesta.send.firstCall.args[0].error).to.equal(
        'pet is already adopted'
      );
    });
  });
});
