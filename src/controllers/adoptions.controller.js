// =============================================================================
// adoptions.controller.js
// -----------------------------------------------------------------------------
// Autor: Jeshua Romero Guadarrama
//
// Se concentran aquí las funciones controladoras del recurso "adopciones".
// Cada función recibe (solicitud, respuesta) y orquesta:
//   1) la lectura de parámetros previamente validados por middleware,
//   2) la consulta a los servicios (capa de repositorios),
//   3) la construcción de la respuesta HTTP.
//
// Se aplica un manejo uniforme de errores: cualquier excepción inesperada
// devuelve 500 con un payload de error genérico, sin filtrar detalles
// internos al cliente para evitar exposiciones sensibles.
// =============================================================================

import {
  servicioAdopciones,
  servicioMascotas,
  servicioUsuarios
} from '../services/index.js';

/**
 * Se obtienen todas las adopciones existentes.
 * Devuelve 200 con el arreglo completo, o 500 ante un error inesperado.
 */
const obtenerTodasLasAdopciones = async (_solicitud, respuesta) => {
  try {
    const resultado = await servicioAdopciones.getAll();
    return respuesta
      .status(200)
      .send({ status: 'success', payload: resultado });
  } catch (_error) {
    return respuesta
      .status(500)
      .send({ status: 'error', error: 'internal server error' });
  }
};

/**
 * Se obtiene una única adopción por id.
 * Devuelve 200 si existe, 404 si no, o 500 si ocurre una falla interna.
 * El id ya viene validado por el middleware `validarObjectId`.
 */
const obtenerAdopcion = async (solicitud, respuesta) => {
  try {
    const { idAdopcion } = solicitud.params;
    const adopcion = await servicioAdopciones.getBy({ _id: idAdopcion });
    if (!adopcion) {
      return respuesta
        .status(404)
        .send({ status: 'error', error: 'Adoption not found' });
    }
    return respuesta
      .status(200)
      .send({ status: 'success', payload: adopcion });
  } catch (_error) {
    return respuesta
      .status(500)
      .send({ status: 'error', error: 'internal server error' });
  }
};

/**
 * Se crea una adopción enlazando un usuario y una mascota.
 *
 * Reglas validadas (los ids vienen ya verificados por middleware):
 *  - 404 si el usuario no existe.
 *  - 404 si la mascota no existe.
 *  - 400 si la mascota ya está adoptada.
 *  - 200 cuando la operación se concreta: se actualiza el usuario,
 *        se marca la mascota como adoptada y se persiste el registro
 *        en la colección de adopciones.
 */
const crearAdopcion = async (solicitud, respuesta) => {
  try {
    const { idUsuario, idMascota } = solicitud.params;

    // Se valida que el usuario exista.
    const usuario = await servicioUsuarios.getUserById(idUsuario);
    if (!usuario) {
      return respuesta
        .status(404)
        .send({ status: 'error', error: 'user not found' });
    }

    // Se valida que la mascota exista.
    const mascota = await servicioMascotas.getBy({ _id: idMascota });
    if (!mascota) {
      return respuesta
        .status(404)
        .send({ status: 'error', error: 'pet not found' });
    }

    // Se valida que la mascota no esté ya adoptada.
    if (mascota.adopted) {
      return respuesta
        .status(400)
        .send({ status: 'error', error: 'pet is already adopted' });
    }

    // Se persisten los cambios: usuario, mascota y nuevo registro de adopción.
    if (!Array.isArray(usuario.pets)) {
      usuario.pets = [];
    }
    usuario.pets.push(mascota._id);
    await servicioUsuarios.update(usuario._id, { pets: usuario.pets });
    await servicioMascotas.update(mascota._id, {
      adopted: true,
      owner: usuario._id
    });
    await servicioAdopciones.create({
      owner: usuario._id,
      pet: mascota._id
    });

    return respuesta
      .status(200)
      .send({ status: 'success', message: 'Pet adopted' });
  } catch (_error) {
    return respuesta
      .status(500)
      .send({ status: 'error', error: 'internal server error' });
  }
};

// Se exportan las funciones controladoras como un objeto único, para que
// el router pueda referenciarlas como propiedades nombradas.
export default {
  obtenerTodasLasAdopciones,
  obtenerAdopcion,
  crearAdopcion
};
