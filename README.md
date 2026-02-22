# GYM Flow – Sistema de Gestión para Gimnasios

Aplicación **Full Stack** para la gestión de usuarios, planes, pagos y
notificaciones en un gimnasio, desarrollada bajo una arquitectura **MERN** y
orientada a seguridad, automatización y escalabilidad.

---

## 🚀 Descripción del Proyecto

GYM Flow es un sistema web que permite administrar usuarios, planes de
entrenamiento y vencimientos, incorporando **autenticación segura**, **tareas
programadas** y **notificaciones automáticas** por correo electrónico.

El proyecto fue desarrollado con una separación clara entre frontend y backend,
consumiendo una **API REST protegida con JWT**.

---

## 🧠 Arquitectura General

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** Node.js + Express
- **Base de Datos:** MongoDB (Mongoose)
- **Autenticación:** JWT
- **Notificaciones:** Email automático
- **Automatización:** Tareas programadas (cron jobs)

---

## ⚙️ Backend – Tecnologías y Funcionalidad

### Node.js + Express
- Servidor principal y estructura de la API REST.
- Definición de rutas como:
  - `/api/auth`
  - `/api/usuarios`
- Uso de middlewares para seguridad y manejo de JSON.

### Autenticación y Seguridad
- **JSON Web Token (JWT):**
  - Generación y validación de tokens para rutas protegidas.
- **bcryptjs:**
  - Hash y verificación segura de contraseñas.
- **CORS:**
  - Comunicación segura entre frontend (puerto 3000) y backend (puerto 5000).

### Automatización y Notificaciones
- **node-cron:**
  - Ejecución de tareas programadas (ej. revisión diaria de planes por vencer).
- **nodemailer:**
  - Envío de correos para recuperación de contraseña y notificaciones automáticas.

### Configuración
- **dotenv:**
  - Manejo seguro de variables de entorno (credenciales, JWT secret, correo).

---

## 🗄️ Base de Datos

### MongoDB + Mongoose
- Modelado de datos mediante esquemas.
- Validaciones automáticas (email único, campos obligatorios).
- Gestión de relaciones y consultas a la base de datos.

---

## 🎨 Frontend – Tecnologías

- **React:** Construcción de la interfaz de usuario.
- **Vite:** Servidor de desarrollo rápido y proxy hacia el backend.
- **Tailwind CSS:** Estilizado rápido mediante clases utilitarias.
- **PostCSS + Autoprefixer:** Compatibilidad entre navegadores.

---

## 🎯 Funcionalidades Clave

- Registro e inicio de sesión de usuarios.
- Gestión de planes de gimnasio.
- Autenticación basada en JWT.
- Envío automático de correos.
- Tareas programadas para control de vencimientos.
- Comunicación frontend-backend mediante API REST.

---

## 🛠️ Estado del Proyecto
🟢 Funcional / En mejora continua.

---

## 👤 Autor

**Johan David Toro Ortiz**  
Ingeniero de Sistemas  
Desarrollador Backend / Full Stack Junior  
📧 davidortiz634@gmail.com  
🔗 LinkedIn: https://www.linkedin.com/in/david-ortiz-ba76953a6/
