// =============================================================================
// test/integration/health.test.js
// -----------------------------------------------------------------------------
// Autor: Jeshua Romero Guadarrama
//
// Se prueba el endpoint público /health utilizado para liveness/readiness.
// =============================================================================

import { expect } from 'chai';
import request from 'supertest';

import aplicacion from '../../src/app.js';

describe('GET /health', () => {
  it('responde 200 con un payload de estado', async () => {
    const respuesta = await request(aplicacion).get('/health');

    expect(respuesta.status).to.equal(200);
    expect(respuesta.body).to.have.property('status', 'ok');
    expect(respuesta.body).to.have.property('uptime').that.is.a('number');
    expect(respuesta.body).to.have.property('timestamp').that.is.a('string');
    expect(respuesta.body).to.have.property('env', 'test');
  });
});
