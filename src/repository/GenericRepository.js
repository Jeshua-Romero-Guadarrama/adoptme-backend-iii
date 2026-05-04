// =============================================================================
// GenericRepository.js
// -----------------------------------------------------------------------------
// Se define un repositorio genérico que delega cada operación al DAO que se
// inyecta por constructor. Los repositorios concretos extienden esta clase
// para añadir métodos específicos del dominio.
// =============================================================================

export default class RepositorioGenerico {
  constructor(dao) {
    // Se guarda la dependencia del DAO inyectado.
    this.dao = dao;
  }

  // Se obtienen documentos a partir de un filtro.
  getAll = (filtro) => this.dao.get(filtro);

  // Se obtiene un único documento a partir de un filtro.
  getBy = (filtro) => this.dao.getBy(filtro);

  // Se crea un nuevo documento.
  create = (documento) => this.dao.save(documento);

  // Se actualiza el documento identificado por id.
  update = (id, documento) => this.dao.update(id, documento);

  // Se elimina el documento identificado por id.
  delete = (id) => this.dao.delete(id);
}
