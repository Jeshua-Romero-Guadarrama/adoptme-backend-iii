// =============================================================================
// test/unit/validarObjectId.test.js
// -----------------------------------------------------------------------------
// Autor: Jeshua Romero Guadarrama
//
// Se prueba en aislamiento el middleware de validación de ObjectId.
// =============================================================================

import { expect } from 'chai';
import sinon from 'sinon';

import { validarObjectId } from '../../src/middlewares/validarObjectId.js';

const construirRespuestaFake = () => {
  const respuesta = {};
  respuesta.status = sinon.stub().returns(respuesta);
  respuesta.send = sinon.stub().returns(respuesta);
  return respuesta;
};

describe('validarObjectId (middleware)', () => {
  it('llama a next cuando todos los ids son válidos', () => {
    const middleware = validarObjectId('idAdopcion');
    const siguiente = sinon.spy();
    const respuesta = construirRespuestaFake();
    const solicitud = { params: { idAdopcion: 'a'.repeat(24) } };

    middleware(solicitud, respuesta, siguiente);

    expect(siguiente.calledOnce).to.equal(true);
    expect(respuesta.status.called).to.equal(false);
  });

  it('responde 400 cuando un parámetro es inválido', () => {
    const middleware = validarObjectId('idUsuario', 'idMascota');
    const siguiente = sinon.spy();
    const respuesta = construirRespuestaFake();
    const solicitud = {
      params: { idUsuario: 'a'.repeat(24), idMascota: 'no-id' }
    };

    middleware(solicitud, respuesta, siguiente);

    expect(siguiente.called).to.equal(false);
    expect(respuesta.status.calledOnceWith(400)).to.equal(true);
    expect(respuesta.send.firstCall.args[0].error).to.equal(
      'invalid idMascota'
    );
  });

  it('responde 400 cuando un parámetro está ausente', () => {
    const middleware = validarObjectId('idAdopcion');
    const siguiente = sinon.spy();
    const respuesta = construirRespuestaFake();
    const solicitud = { params: {} };

    middleware(solicitud, respuesta, siguiente);

    expect(siguiente.called).to.equal(false);
    expect(respuesta.status.calledOnceWith(400)).to.equal(true);
  });
});
