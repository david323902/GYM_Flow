// initData.js
const inicializarDatos = async (Plan, Usuario) => {
  try {
    // Verificar si ya hay planes
    const planesCount = await Plan.countDocuments();
    if (planesCount === 0) {
      console.log('📝 Creando planes iniciales...');
      
      const planesIniciales = [
        {
          nombre: 'Plan Básico',
          tipo: 'tiempo',
          duracion_dias: 30,
          precio: 50000,
          estado: 'activo',
          descripcion: 'Acceso básico por 30 días'
        },
        {
          nombre: 'Plan Premium',
          tipo: 'tiempo', 
          duracion_dias: 30,
          precio: 80000,
          estado: 'activo',
          descripcion: 'Acceso premium por 30 días'
        },
        {
          nombre: 'Plan por Entradas',
          tipo: 'entradas',
          cantidad_entradas: 12,
          precio: 60000,
          estado: 'activo',
          descripcion: '12 entradas mensuales'
        }
      ];
      
      await Plan.insertMany(planesIniciales);
      console.log('✅ Planes iniciales creados en MongoDB');
    } else {
      console.log(`📋 Ya existen ${planesCount} planes en la base de datos`);
    }

    // Verificar si ya hay usuarios
    const usuariosCount = await Usuario.countDocuments();
    if (usuariosCount === 0) {
      console.log('📝 Creando usuario inicial...');
      const planBasico = await Plan.findOne({ nombre: 'Plan Básico' });
      const planEntradas = await Plan.findOne({ nombre: 'Plan por Entradas' });
      
      if (planBasico) {
        const usuarioInicial = {
          nombre: 'Juan Pérez',
          documento: '12345678',
          email: 'juan@email.com',
          telefono: '3001234567',
          estado: 'activo',
          planId: planBasico._id,
          plan_nombre: planBasico.nombre,
          fecha_inicio: new Date(),
          fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          huellaId: 'huella_001',
          metodoPreferido: 'documento',
          notificacionesActivas: true
        };
        await Usuario.create(usuarioInicial);
        console.log('✅ Usuario inicial creado en MongoDB');
      }

      if (planEntradas) {
        const usuarioEntradas = {
          nombre: 'María García',
          documento: '87654321', 
          email: 'maria@email.com',
          telefono: '3007654321',
          estado: 'activo',
          planId: planEntradas._id,
          plan_nombre: planEntradas.nombre,
          fecha_inicio: new Date(),
          entradasRestantes: 12,
          huellaId: 'huella_002',
          metodoPreferido: 'huella',
          notificacionesActivas: true
        };
        await Usuario.create(usuarioEntradas);
        console.log('✅ Usuario con plan por entradas creado');
      }
    } else {
      console.log(`👥 Ya existen ${usuariosCount} usuarios en la base de datos`);
    }

    // Verificar asistencias
    const Asistencia = require('./server').Asistencia; // Ajusta la ruta según tu estructura
    const asistenciasCount = await Asistencia.countDocuments();
    console.log(`📊 Existen ${asistenciasCount} asistencias registradas`);

  } catch (error) {
    console.error('❌ Error inicializando datos:', error);
  }
};

module.exports = { inicializarDatos };