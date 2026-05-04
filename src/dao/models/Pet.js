// =============================================================================
// models/Pet.js
// -----------------------------------------------------------------------------
// Se define el esquema y modelo de Mongoose para la colección de mascotas.
// La bandera `adopted` marca si la mascota se encuentra disponible o no.
// =============================================================================

import mongoose from 'mongoose';

const coleccion = 'Pets';

const esquema = new mongoose.Schema({
  name: String,
  specie: String,
  birthDate: Date,
  adopted: { type: Boolean, default: false },
  owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'Users' },
  image: String
});

export default mongoose.model(coleccion, esquema);
