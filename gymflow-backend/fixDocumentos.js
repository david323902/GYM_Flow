require('dotenv').config();
const mongoose = require('mongoose');

async function fixDocumentos() {
  console.log('🔧 Reparando documentos de usuarios...');
  
  // Usar URI del entorno o fallback local
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gymflow';
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const usuariosCollection = db.collection('usuarios');
    
    // Buscar usuarios que NO tienen documento, o es null, o string vacío
    const usuariosSinDocumento = await usuariosCollection.find({
      $or: [
        { documento: { $exists: false } },
        { documento: null },
        { documento: '' }
      ]
    }).toArray();
    
    if (usuariosSinDocumento.length > 0) {
      console.log(`⚠️ Se encontraron ${usuariosSinDocumento.length} usuarios sin documento. Asignando valores...`);
      
      for (let i = 0; i < usuariosSinDocumento.length; i++) {
        const usuario = usuariosSinDocumento[i];
        // Generar documento único: DOC + timestamp + índice para evitar colisiones
        const documento = `DOC${Date.now().toString().slice(-6)}${i}`; 
        
        await usuariosCollection.updateOne(
          { _id: usuario._id },
          { 
            $set: { 
              documento: documento,
              documento_backup: usuario.documento || 'sin-documento' 
            } 
          }
        );
        
        console.log(`✅ Usuario ${usuario.nombre || 'Sin nombre'} (${usuario._id}): documento asignado = ${documento}`);
      }
    } else {
      console.log('✅ Todos los usuarios ya tienen un documento válido.');
    }
    
    console.log('\n✅ Reparación completada');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error crítico:', error.message);
    process.exit(1);
  }
}

fixDocumentos();