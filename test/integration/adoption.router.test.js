// =============================================================================
// test/integration/adoption.router.test.js
// -----------------------------------------------------------------------------
// Autor: Jeshua Romero Guadarrama
//
// Se prueban funcionalmente todos los endpoints del router
// `adoption.router.js`. Se cubren casos:
//   - positivos (camino feliz),
//   - negativos (404 / 400 / 500),
//   - de borde (ids mal formados, errores de servicio, datos vacíos).
//
// Las dependencias externas se sustituyen por mocks construidos con sinon
// (ver `test/helpers/fakes.js`), de modo que ningún test toca la base de
// datos real ni hace I/O fuera del proceso.
// =============================================================================

import { expect } from 'chai';
import request from 'supertest';

import aplicacion from '../../src/app.js';
import {
  crearFakeAdopcion,
  crearFakeMascota,
  crearFakeUsuario,
  generarObjectId,
  instalarMocks,
  restaurarMocks
} from '../helpers/fakes.js';

describe('Router de adopciones - /api/adopciones', () => {
  let mocks;

  beforeEach(() => {
    // Se instalan los mocks antes de cada test.
    mocks = instalarMocks();
  });

  afterEach(() => {
    // Se restauran los stubs para no contaminar el siguiente test.
    restaurarMocks();
  });

  // ---------------------------------------------------------------------------
  // GET /api/adopciones
  // ---------------------------------------------------------------------------
  describe('GET /api/adopciones', () => {
    it('responde 200 y devuelve el listado completo de adopciones', async () => {
      const adopciones = [crearFakeAdopcion({ _id: generarObjectId('a1') })];
      mocks.adopciones.getAll.resolves(adopciones);

      const respuesta = await request(aplicacion).get('/api/adopciones');

      expect(respuesta.status).to.equal(200);
      expect(respuesta.body).to.have.property('status', 'success');
      expect(respuesta.body.payload).to.be.an('array').with.lengthOf(1);
      expect(mocks.adopciones.getAll.calledOnce).to.equal(true);
    });

    it('responde 200 con arreglo vacío cuando no hay adopciones', async () => {
      mocks.adopciones.getAll.resolves([]);

      const respuesta = await request(aplicacion).get('/api/adopciones');

      expect(respuesta.status).to.equal(200);
      expect(respuesta.body.payload).to.be.an('array').with.lengthOf(0);
    });

    it('responde 500 cuando el servicio lanza un error inesperado', async () => {
      mocks.adopciones.getAll.rejects(new Error('boom'));

      const respuesta = await request(aplicacion).get('/api/adopciones');

      expect(respuesta.status).to.equal(500);
      expect(respuesta.body).to.deep.equal({
        status: 'error',
        error: 'internal server error'
      });
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/adopciones/:idAdopcion
  // ---------------------------------------------------------------------------
  describe('GET /api/adopciones/:idAdopcion', () => {
    it('responde 200 cuando la adopción existe', async () => {
      const idAdopcion = generarObjectId('a2');
      const adopcion = crearFakeAdopcion({ _id: idAdopcion });
      mocks.adopciones.getBy.resolves(adopcion);

      const respuesta = await request(aplicacion).get(
        `/api/adopciones/${idAdopcion}`
      );

      expect(respuesta.status).to.equal(200);
      expect(respuesta.body).to.have.property('status', 'success');
      expect(respuesta.body.payload).to.deep.include({ _id: idAdopcion });
      expect(
        mocks.adopciones.getBy.calledOnceWithExactly({ _id: idAdopcion })
      ).to.equal(true);
    });

    it('responde 404 cuando la adopción no existe', async () => {
      const idAdopcion = generarObjectId('a3');
      mocks.adopciones.getBy.resolves(null);

      const respuesta = await request(aplicacion).get(
        `/api/adopciones/${idAdopcion}`
      );

      expect(respuesta.status).to.equal(404);
      expect(respuesta.body).to.deep.equal({
        status: 'error',
        error: 'Adoption not found'
      });
    });

    it('responde 400 cuando el id no tiene forma de ObjectId', async () => {
      const respuesta = await request(aplicacion).get(
        '/api/adopciones/no-es-un-id'
      );

      expect(respuesta.status).to.equal(400);
      expect(respuesta.body).to.deep.equal({
        status: 'error',
        error: 'invalid idAdopcion'
      });
      // El servicio NO debe haberse invocado si la validación falla.
      expect(mocks.adopciones.getBy.called).to.equal(false);
    });

    it('responde 500 cuando el servicio falla', async () => {
      const idAdopcion = generarObjectId('a4');
      mocks.adopciones.getBy.rejects(new Error('db down'));

      const respuesta = await request(aplicacion).get(
        `/api/adopciones/${idAdopcion}`
      );

      expect(respuesta.status).to.equal(500);
      expect(respuesta.body.error).to.equal('internal server error');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/adopciones/:idUsuario/:idMascota
  // ---------------------------------------------------------------------------
  describe('POST /api/adopciones/:idUsuario/:idMascota', () => {
    const idUsuario = generarObjectId('u9');
    const idMascota = generarObjectId('m9');

    it('responde 200 y persiste la adopción cuando todo es válido', async () => {
      const usuario = crearFakeUsuario({ _id: idUsuario, pets: [] });
      const mascota = crearFakeMascota({ _id: idMascota, adopted: false });

      mocks.usuarios.getUserById.resolves(usuario);
      mocks.mascotas.getBy.resolves(mascota);
      mocks.usuarios.update.resolves();
      mocks.mascotas.update.resolves();
      mocks.adopciones.create.resolves(crearFakeAdopcion());

      const respuesta = await request(aplicacion).post(
        `/api/adopciones/${idUsuario}/${idMascota}`
      );

      expect(respuesta.status).to.equal(200);
      expect(respuesta.body).to.deep.equal({
        status: 'success',
        message: 'Pet adopted'
      });
      // Se verifica el orden y los argumentos de las llamadas.
      expect(mocks.usuarios.getUserById.calledOnceWith(idUsuario)).to.equal(true);
      expect(mocks.mascotas.getBy.calledOnceWith({ _id: idMascota })).to.equal(
        true
      );
      expect(mocks.usuarios.update.calledOnce).to.equal(true);
      expect(
        mocks.mascotas.update.calledOnceWith(idMascota, {
          adopted: true,
          owner: idUsuario
        })
      ).to.equal(true);
      expect(
        mocks.adopciones.create.calledOnceWith({
          owner: idUsuario,
          pet: idMascota
        })
      ).to.equal(true);
    });

    it('responde 404 cuando el usuario no existe', async () => {
      mocks.usuarios.getUserById.resolves(null);

      const respuesta = await request(aplicacion).post(
        `/api/adopciones/${idUsuario}/${idMascota}`
      );

      expect(respuesta.status).to.equal(404);
      expect(respuesta.body).to.deep.equal({
        status: 'error',
        error: 'user not found'
      });
      // No debe consultarse la mascota ni crearse adopción.
      expect(mocks.mascotas.getBy.called).to.equal(false);
      expect(mocks.adopciones.create.called).to.equal(false);
    });

    it('responde 404 cuando la mascota no existe', async () => {
      mocks.usuarios.getUserById.resolves(crearFakeUsuario({ _id: idUsuario }));
      mocks.mascotas.getBy.resolves(null);

      const respuesta = await request(aplicacion).post(
        `/api/adopciones/${idUsuario}/${idMascota}`
      );

      expect(respuesta.status).to.equal(404);
      expect(respuesta.body).to.deep.equal({
        status: 'error',
        error: 'pet not found'
      });
      expect(mocks.adopciones.create.called).to.equal(false);
    });

    it('responde 400 cuando la mascota ya está adoptada', async () => {
      mocks.usuarios.getUserById.resolves(crearFakeUsuario({ _id: idUsuario }));
      mocks.mascotas.getBy.resolves(
        crearFakeMascota({ _id: idMascota, adopted: true })
      );

      const respuesta = await request(aplicacion).post(
        `/api/adopciones/${idUsuario}/${idMascota}`
      );

      expect(respuesta.status).to.equal(400);
      expect(respuesta.body).to.deep.equal({
        status: 'error',
        error: 'pet is already adopted'
      });
      expect(mocks.adopciones.create.called).to.equal(false);
    });

    it('responde 400 cuando idUsuario no es ObjectId válido', async () => {
      const respuesta = await request(aplicacion).post(
        `/api/adopciones/no-id/${idMascota}`
      );

      expect(respuesta.status).to.equal(400);
      expect(respuesta.body.error).to.equal('invalid idUsuario');
      expect(mocks.usuarios.getUserById.called).to.equal(false);
    });

    it('responde 400 cuando idMascota no es ObjectId válido', async () => {
      const respuesta = await request(aplicacion).post(
        `/api/adopciones/${idUsuario}/no-id`
      );

      expect(respuesta.status).to.equal(400);
      expect(respuesta.body.error).to.equal('invalid idMascota');
    });

    it('inicializa pets vacío si el usuario no trae arreglo previo', async () => {
      const usuario = crearFakeUsuario({ _id: idUsuario, pets: undefined });
      const mascota = crearFakeMascota({ _id: idMascota, adopted: false });

      mocks.usuarios.getUserById.resolves(usuario);
      mocks.mascotas.getBy.resolves(mascota);
      mocks.usuarios.update.resolves();
      mocks.mascotas.update.resolves();
      mocks.adopciones.create.resolves(crearFakeAdopcion());

      const respuesta = await request(aplicacion).post(
        `/api/adopciones/${idUsuario}/${idMascota}`
      );

      expect(respuesta.status).to.equal(200);
      // El servicio recibe el arreglo recién inicializado con la nueva mascota.
      const llamadaUpdate = mocks.usuarios.update.firstCall;
      expect(llamadaUpdate.args[0]).to.equal(idUsuario);
      expect(llamadaUpdate.args[1].pets).to.be.an('array').with.lengthOf(1);
    });

    it('responde 500 si servicioUsuarios.getUserById falla', async () => {
      mocks.usuarios.getUserById.rejects(new Error('mongo timeout'));

      const respuesta = await request(aplicacion).post(
        `/api/adopciones/${idUsuario}/${idMascota}`
      );

      expect(respuesta.status).to.equal(500);
    });

    it('responde 500 si servicioAdopciones.create falla', async () => {
      mocks.usuarios.getUserById.resolves(crearFakeUsuario({ _id: idUsuario }));
      mocks.mascotas.getBy.resolves(crearFakeMascota({ _id: idMascota }));
      mocks.usuarios.update.resolves();
      mocks.mascotas.update.resolves();
      mocks.adopciones.create.rejects(new Error('write conflict'));

      const respuesta = await request(aplicacion).post(
        `/api/adopciones/${idUsuario}/${idMascota}`
      );

      expect(respuesta.status).to.equal(500);
      expect(respuesta.body.error).to.equal('internal server error');
    });
  });

  // ---------------------------------------------------------------------------
  // Métodos no permitidos / rutas inexistentes
  // ---------------------------------------------------------------------------
  describe('Comportamiento ante métodos y rutas no soportados', () => {
    it('responde 404 para métodos no definidos en el recurso', async () => {
      const respuesta = await request(aplicacion).delete('/api/adopciones');
      expect(respuesta.status).to.equal(404);
    });

    it('responde 404 para subrutas no registradas', async () => {
      const respuesta = await request(aplicacion).get(
        '/api/adopciones/foo/bar/baz'
      );
      expect(respuesta.status).to.equal(404);
    });
  });
});
