# ControlTec – Digitalización de Productos Controlados (ASP.NET Core)

![.NET](https://img.shields.io/badge/.NET-10.0-purple)
![Language](https://img.shields.io/badge/Language-C%23-blue)
![Architecture](https://img.shields.io/badge/Architecture-MVC-green)
![Auth](https://img.shields.io/badge/Auth-Firebase-orange)
![Database](https://img.shields.io/badge/Database-SQLite-lightgrey)

> Sistema web para la digitalización del flujo de solicitudes, evaluación y emisión de certificados y permisos de productos controlados.

---

## 📋 Descripción del Proyecto

**ControlTec** es una aplicación web desarrollada para automatizar el proceso institucional de gestión de productos controlados, eliminando el manejo manual de expedientes y mejorando la trazabilidad del proceso.

El sistema permite a los diferentes actores (Usuario, VUS, UPC, Dirección y DNCD) interactuar dentro de un flujo digital estructurado que replica el procedimiento oficial.

La solución gestiona el ciclo completo:

- Depósito de solicitudes  
- Validación inicial  
- Evaluación técnica  
- Aprobación y firma  
- Emisión de certificados y permisos  

---

## ✨ Características del Sistema

El sistema implementado soporta:

- 🔐 **Autenticación por roles** con Firebase.
- 📝 **Depósito electrónico de solicitudes** con adjuntos.
- ✅ **Validación formal en VUS** (Cumple / No cumple).
- 🔍 **Evaluación técnica por UPC**.
- 📄 **Generación automática de comunicaciones de devolución**.
- ✍️ **Firma digital simulada por Dirección**.
- 🔄 **Trazabilidad completa del expediente**.
- 📱 **Interfaz responsive por tipo de usuario**.

---

## 🧩 Módulos Principales

El sistema está dividido según el flujo institucional:

- **Usuario / Solicitante** → Registro y envío de solicitudes  
- **VUS** → Revisión formal inicial  
- **UPC (Técnico)** → Evaluación técnica  
- **Dirección** → Firma y aprobación  
- **DNCD** → Autorización final (según tipo)

---

## 🏗️ Arquitectura del Sistema

El proyecto sigue una arquitectura web basada en MVC:

