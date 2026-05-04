// =============================================================================
// middlewares/validarObjectId.js
// -----------------------------------------------------------------------------
// Autor: Jeshua Romero Guadarrama
//
// Se exporta una factoría de middlewares de Express que valida que cada uno
// de los parámetros de ruta indicados sea un ObjectId de Mongo bien formado
// (24 caracteres hexadecimales). De este modo se evita exponer la base de
// datos a entradas maliciosas y se acortan los recorridos de error.
// =============================================================================

const PATRON_OBJECT_ID = /^[a-fA-F0-9]{24}$/;

/**
 * Se construye un middleware que valida los parámetros de ruta indicados.
 * @param  {...string} nombresDeParametros - Nombres de los parámetros que
 *   se esperan como ObjectId (por ejemplo "idAdopcion", "idUsuario").
 * @returns Middleware de Express.
 */
export const validarObjectId = (...nombresDeParametros) => {
  return (solicitud, respuesta, siguiente) => {
    for (const nombre of nombresDeParametros) {
      const valor = solicitud.params[nombre];
      if (!valor || !PATRON_OBJECT_ID.test(valor)) {
        return respuesta.status(400).send({
          status: 'error',
          error: `invalid ${nombre}`
        });
      }
    }
    return siguiente();
  };
};

export default validarObjectId;
