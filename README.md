# 🏃 GYM Flow — Gym Management Platform

> Full-stack MERN application for gym management with automated membership workflows, role-based access control, and an admin dashboard.

![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=flat&logo=docker&logoColor=white)
![Status](https://img.shields.io/badge/Status-Functional-brightgreen?style=flat)

---

## 📌 Overview

**GYM Flow** is a web platform designed for gym internal management. It handles user registration, subscription plans, membership expiry, and automated notifications — reducing manual admin workload through scheduled background tasks.

Built with the **MERN stack** (MongoDB, Express, React, Node.js) with emphasis on security, scalability, and process automation.

---

## 📸 Screenshots

> 📸 *Add your screenshots to the `/docs` folder and uncomment the lines below*

<!-- 
![Dashboard](docs/dashboard.png)
![User management](docs/users.png)
-->

---

## ⚙️ Features

### 👥 User & Role Management
- User registration with secure login (JWT + Bcrypt)
- Role-based access control: **Admin** and **Client** roles
- Admin panel for full user and plan management

### 📋 Subscription & Plan Management
- Create and assign subscription plans to members
- Track membership start and expiry dates
- Automatic expiry detection via scheduled cron jobs

### 🤖 Automation
- **Automated email reminders** sent before membership expiry (Node-cron)
- **Renewal notifications** triggered automatically on expiry
- Reduces manual admin intervention by ~80%

### 🖥️ Admin Dashboard
- Real-time overview of active members and expiring plans
- Full CRUD for users and plans
- Responsive UI built with React, Vite and Tailwind CSS

---

## 🛠️ Tech Stack

**Backend**
| Technology | Purpose |
|---|---|
| Node.js + Express.js | Server and REST API |
| MongoDB + Mongoose | NoSQL database and data modeling |
| JWT + Bcryptjs | Authentication and password hashing |
| Node-cron | Scheduled tasks (expiry checks) |
| Nodemailer | Automated email delivery |
| CORS + Dotenv | Security and environment config |
| Docker | Containerization |
| GitHub Actions | CI/CD pipeline |

**Frontend**
| Technology | Purpose |
|---|---|
| React + Vite | Fast SPA development |
| Tailwind CSS | Modern responsive styling |
| PostCSS + Autoprefixer | Cross-browser compatibility |
| Context API | Global auth state management |

---

## 🏗️ Architecture (MERN)

```
Flujo-de-gimnasio/
├── backend/
│   ├── routes/          # API endpoints
│   ├── controllers/     # Business logic
│   ├── models/          # Mongoose schemas
│   ├── middlewares/     # Auth and validation
│   ├── jobs/            # Cron jobs (expiry automation)
│   ├── services/        # Email service
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route pages
│   │   ├── context/     # Auth context
│   │   └── api/         # API client layer
│   └── vite.config.js
└── docker-compose.yml
```

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js 18+
MongoDB (local or Atlas)
Docker (optional)
```

### Installation

```bash
# Clone the repository
git clone https://github.com/david323902/Flujo-de-gimnasio.git
cd Flujo-de-gimnasio

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, email credentials
```

### Run in development

```bash
# Backend
cd backend && npm run dev

# Frontend (separate terminal)
cd frontend && npm run dev
```

### Run with Docker

```bash
docker-compose up --build
```

---

## 🔑 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gymflow
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 👤 Author

**Johan David Toro Ortiz** — full backend development, MERN architecture, DB modeling, automation, frontend integration  
📧 davidortiz634@gmail.com · [LinkedIn](https://www.linkedin.com/in/johan-david-toro-ortiz-512680349/) · [GitHub](https://github.com/david323902)

---

## 🇪🇸 Descripción en español

Plataforma web MERN para la gestión interna de gimnasios. Incluye autenticación con JWT, control de acceso por roles (admin/cliente), gestión de planes y membresías, automatización de recordatorios por correo mediante cron jobs, y un panel de administración construido con React y Tailwind CSS. El sistema detecta vencimientos automáticamente y notifica a los usuarios sin intervención manual.
