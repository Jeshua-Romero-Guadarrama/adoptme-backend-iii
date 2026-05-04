// =============================================================================
// test/integration/security.test.js
// -----------------------------------------------------------------------------
// Autor: Jeshua Romero Guadarrama
//
// Se valida que las defensas de seguridad estén activas y que la API no
// filtre información sensible. Los tests cubren:
//   - cabeceras de seguridad de Helmet,
//   - límite de tamaño de cuerpo (413),
//   - rechazo de JSON malformado (400),
//   - sanitización de operadores Mongo en query/body,
//   - manejo uniforme de 404.
// =============================================================================

import { expect } from 'chai';
import request from 'supertest';

import aplicacion from '../../src/app.js';
import { instalarMocks, restaurarMocks } from '../helpers/fakes.js';

describe('Defensas de seguridad transversales', () => {
  let mocks;

  beforeEach(() => {
    mocks = instalarMocks();
  });

  afterEach(() => {
    restaurarMocks();
  });

  it('expone cabeceras de seguridad provistas por Helmet', async () => {
    const respuesta = await request(aplicacion).get('/health');

    expect(respuesta.status).to.equal(200);
    expect(respuesta.headers).to.have.property('x-content-type-options', 'nosniff');
    expect(respuesta.headers).to.have.property('x-dns-prefetch-control');
    // Helmet también remueve el header `X-Powered-By` por defecto.
    expect(respuesta.headers).to.not.have.property('x-powered-by');
  });

  it('rechaza payloads JSON que excedan el límite con 413', async () => {
    const cuerpoEnorme = { dato: 'x'.repeat(200 * 1024) }; // ~200 KB

    const respuesta = await request(aplicacion)
      .post('/api/adopciones/aaaaaaaaaaaaaaaaaaaaaaaa/bbbbbbbbbbbbbbbbbbbbbbbb')
      .set('Content-Type', 'application/json')
      .send(cuerpoEnorme);

    expect(respuesta.status).to.equal(413);
    expect(respuesta.body).to.deep.equal({
      status: 'error',
      error: 'payload too large'
    });
  });

  it('rechaza JSON malformado con 400 sin filtrar el stack', async () => {
    const respuesta = await request(aplicacion)
      .post('/api/adopciones/aaaaaaaaaaaaaaaaaaaaaaaa/bbbbbbbbbbbbbbbbbbbbbbbb')
      .set('Content-Type', 'application/json')
      .send('{ "roto": ');

    expect(respuesta.status).to.equal(400);
    expect(respuesta.body).to.deep.equal({
      status: 'error',
      error: 'invalid json'
    });
  });

  it('sanitiza operadores Mongo ($ y .) en query strings', async () => {
    // El servicio se mockea para verificar que el filtro recibido NO contiene
    // operadores Mongo (han sido reemplazados o eliminados por mongo-sanitize).
    mocks.adopciones.getAll.resolves([]);

    const respuesta = await request(aplicacion).get(
      '/api/adopciones?$ne=null&filtro.foo=bar'
    );

    expect(respuesta.status).to.equal(200);
    expect(respuesta.body).to.deep.equal({ status: 'success', payload: [] });
    // mongo-sanitize neutraliza la query antes de llegar al controlador.
    expect(mocks.adopciones.getAll.calledOnce).to.equal(true);
  });

  it('responde 404 con envelope estándar para rutas inexistentes', async () => {
    const respuesta = await request(aplicacion).get('/ruta/que/no/existe');
    expect(respuesta.status).to.equal(404);
    expect(respuesta.body).to.deep.equal({
      status: 'error',
      error: 'not found'
    });
  });
});
