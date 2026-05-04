// =============================================================================
// models/Adoption.js
// -----------------------------------------------------------------------------
// Se define el esquema y modelo de Mongoose para la colección de adopciones.
// Se almacena el par usuario-mascota como referencia a las otras colecciones.
// =============================================================================

import mongoose from 'mongoose';

const coleccion = 'Adoptions';

const esquema = new mongoose.Schema({
  owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'Users' },
  pet: { type: mongoose.SchemaTypes.ObjectId, ref: 'Pets' }
});

export default mongoose.model(coleccion, esquema);
