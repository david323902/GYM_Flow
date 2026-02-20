const socketIO = require('socket.io');

module.exports = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  io.on('connection', (socket) => {
    console.log('🔌 Nuevo cliente conectado:', socket.id);
    
    // Unirse a sala de asistencias
    socket.on('unirse-sala-asistencias', () => {
      socket.join('asistencias');
      console.log(`👥 Cliente ${socket.id} se unió a sala de asistencias`);
    });
    
    // Unirse a sala de notificaciones
    socket.on('unirse-sala-notificaciones', (usuarioId) => {
      socket.join(`usuario-${usuarioId}`);
      console.log(`📱 Cliente ${socket.id} se unió a notificaciones de usuario ${usuarioId}`);
    });
    
    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log('🔌 Cliente desconectado:', socket.id);
    });
  });
  
  return io;
};