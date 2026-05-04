// =============================================================================
// models/User.js
// -----------------------------------------------------------------------------
// Se define el esquema y modelo de Mongoose para la colección de usuarios.
// Cada usuario almacena además un arreglo con las mascotas que ha adoptado.
// =============================================================================

import mongoose from 'mongoose';

const coleccion = 'Users';

const esquema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  pets: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Pets',
      default: []
    }
  ]
});

export default mongoose.model(coleccion, esquema);
