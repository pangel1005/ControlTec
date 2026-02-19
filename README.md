# ControlTec – Digitalización de Productos Controlados (ASP.NET Core + React)

![.NET](https://img.shields.io/badge/.NET-10.0-purple)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB)
![Language](https://img.shields.io/badge/Language-C%23-blue)
![Database](https://img.shields.io/badge/Database-SQL%20Server-red)

> Sistema web para la digitalización del flujo de solicitudes, evaluación y emisión de certificados y permisos de productos controlados.

---

## 📋 Descripción del Proyecto

**ControlTec** es una aplicación web desarrollada para automatizar el proceso institucional de gestión de productos controlados, eliminando el manejo manual de expedientes y mejorando la trazabilidad del proceso.

La solución implementa un frontend moderno en **React** y un backend en **ASP.NET Core**, permitiendo a los distintos actores del proceso gestionar expedientes de forma digital, segura y trazable.

El sistema cubre el ciclo completo:

- Depósito de solicitudes  
- Validación inicial  
- Evaluación técnica  
- Verificación del Encargado UPC  
- Aprobación por Dirección  
- Emisión de certificados y permisos  

---

## ✨ Características del Sistema

El sistema implementado soporta:

- 🔐 Autenticación por roles  
- 📝 Depósito electrónico de solicitudes con adjuntos  
- ✅ Validación formal en VUS (Cumple / No cumple)  
- 🔍 Evaluación técnica por UPC  
- 👨‍💼 Verificación por Encargado de la UPC  
- 📄 Generación automática de comunicaciones de devolución  
- ✍️ Firma digital simulada por Dirección  
- 🔄 Trazabilidad completa del expediente  
- 📱 Interfaz responsive desarrollada en React  

---

## 🧩 Roles del Sistema

- **Usuario / Solicitante** → Registra y deposita solicitudes  
- **VUS** → Revisión formal inicial  
- **Técnico UPC** → Evalúa expediente  
- **Encargado UPC** → Verifica la opinión del técnico  
- **Dirección** → Firma y aprueba  
- **DNCD** → Autorización final (según tipo)  

---

## 🏗️ Arquitectura del Sistema

Arquitectura full-stack desacoplada:

React Frontend → ASP.NET Core API → SQL Server


Pipeline del proceso:

Solicitud → Validación → Evaluación Técnica → Verificación UPC → Aprobación → Emisión → Entrega


---

## 🧪 Tecnologías Utilizadas

### Frontend
- React  
- JavaScript  
- Tailwind / Bootstrap  
- Axios  

### Backend
- ASP.NET Core  
- C#  
- Entity Framework Core  

### Base de Datos
- SQL Server  

### DevOps
- Git  
- GitHub  

---

## 👨‍💻 Mi Contribución (Angel Concepción)

### 🎨 Frontend (Principal)

- Desarrollo de interfaces en React por rol  
- Formularios dinámicos de solicitudes  
- Validaciones en cliente  
- Manejo visual de estados del expediente  
- Integración con API ASP.NET Core  
- Implementación responsive  
- Mejora de la experiencia de usuario del flujo  

### ⚙️ Backend (Apoyo)

- Conexión de vistas con endpoints  
- Ajustes menores en modelos  
- Integración con SQL Server  
- Pruebas funcionales  

---

## 📂 Estructura del Proyecto

ControlTec/
│
├── frontend/ (React)
├── backend/ (ASP.NET Core)
├── Controllers/
├── Models/
├── Data/
├── Services/
└── wwwroot/


---

## 🚀 Instalación y Ejecución

### 1️⃣ Clonar repositorio

```bash
git clone https://github.com/TU-USUARIO/controltec.git
2️⃣ Configurar Base de Datos (SQL Server)
Editar:

backend/appsettings.json
Ejemplo:

"ConnectionStrings": {
  "DefaultConnection": "Server=.;Database=ControlTecDB;Trusted_Connection=True;TrustServerCertificate=True"
}
3️⃣ Ejecutar Backend
cd backend
dotnet restore
dotnet ef database update
dotnet run
4️⃣ Ejecutar Frontend (React)
cd frontend
npm install
npm run dev
🎯 Aprendizajes Clave
Digitalización de procesos institucionales reales

Arquitectura React + ASP.NET Core

Manejo de flujos multi-rol complejos

Integración frontend–backend

Uso de Entity Framework con SQL Server

Trabajo colaborativo con Git

🔮 Mejoras Futuras
Firma digital real

Notificaciones por correo

Dashboard analítico por rol

Integración con APIs externas

Despliegue en la nube

👤 Autor
Angel Concepción
Frontend Developer – Proyecto ControlTec
