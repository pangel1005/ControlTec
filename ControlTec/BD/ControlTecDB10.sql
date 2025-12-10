USE [master]
GO
/****** Object:  Database [ControlTecDb]    Script Date: 10/12/2025 1:42:28 ******/
CREATE DATABASE [ControlTecDb]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'ControlTecDb', FILENAME = N'C:\Users\pange\ControlTecDb.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'ControlTecDb_log', FILENAME = N'C:\Users\pange\ControlTecDb_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT
GO
ALTER DATABASE [ControlTecDb] SET COMPATIBILITY_LEVEL = 150
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [ControlTecDb].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [ControlTecDb] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [ControlTecDb] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [ControlTecDb] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [ControlTecDb] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [ControlTecDb] SET ARITHABORT OFF 
GO
ALTER DATABASE [ControlTecDb] SET AUTO_CLOSE ON 
GO
ALTER DATABASE [ControlTecDb] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [ControlTecDb] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [ControlTecDb] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [ControlTecDb] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [ControlTecDb] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [ControlTecDb] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [ControlTecDb] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [ControlTecDb] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [ControlTecDb] SET  ENABLE_BROKER 
GO
ALTER DATABASE [ControlTecDb] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [ControlTecDb] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [ControlTecDb] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [ControlTecDb] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [ControlTecDb] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [ControlTecDb] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [ControlTecDb] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [ControlTecDb] SET RECOVERY SIMPLE 
GO
ALTER DATABASE [ControlTecDb] SET  MULTI_USER 
GO
ALTER DATABASE [ControlTecDb] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [ControlTecDb] SET DB_CHAINING OFF 
GO
ALTER DATABASE [ControlTecDb] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [ControlTecDb] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [ControlTecDb] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [ControlTecDb] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [ControlTecDb] SET QUERY_STORE = OFF
GO
USE [ControlTecDb]
GO
/****** Object:  Table [dbo].[Documentos]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Documentos](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [nvarchar](100) NOT NULL,
	[Tipo] [nvarchar](50) NULL,
	[Ruta] [nvarchar](255) NULL,
	[SolicitudId] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DocumentosRequeridos]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DocumentosRequeridos](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [nvarchar](200) NULL,
	[ServicioId] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FormularioDigital]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FormularioDigital](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SubservicioId] [int] NOT NULL,
	[EstructuraJson] [nvarchar](max) NOT NULL,
	[FechaCreacion] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HistorialEstados]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HistorialEstados](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SolicitudId] [int] NOT NULL,
	[EstadoAnterior] [nvarchar](50) NULL,
	[EstadoNuevo] [nvarchar](50) NOT NULL,
	[Comentario] [nvarchar](500) NULL,
	[UsuarioId] [int] NOT NULL,
	[FechaCambio] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RespuestaFormularioDigital]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RespuestaFormularioDigital](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SolicitudId] [int] NOT NULL,
	[FormularioDigitalId] [int] NOT NULL,
	[RespuestasJson] [nvarchar](max) NOT NULL,
	[FechaEnvio] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Servicios]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Servicios](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [nvarchar](150) NULL,
	[Descripcion] [nvarchar](500) NULL,
	[Costo] [decimal](18, 2) NULL,
	[RequierePago] [bit] NULL,
	[Activo] [bit] NULL,
	[RutaFormularioBase] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Solicitudes]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Solicitudes](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Estado] [nvarchar](50) NOT NULL,
	[FechaCreacion] [datetime] NOT NULL,
	[UsuarioId] [int] NULL,
	[ServicioId] [int] NULL,
	[RutaCertificado] [nvarchar](300) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Subservicio]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Subservicio](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [nvarchar](100) NOT NULL,
	[Descripcion] [nvarchar](500) NULL,
	[ServicioId] [int] NOT NULL,
	[RutaFormularioBase] [nvarchar](255) NULL,
	[Activo] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Usuarios]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Usuarios](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [nvarchar](100) NOT NULL,
	[Correo] [nvarchar](100) NOT NULL,
	[Contraseña] [nvarchar](100) NOT NULL,
	[Roll] [nvarchar](50) NOT NULL,
	[Activo] [bit] NOT NULL,
	[EsInternoPendiente] [bit] NOT NULL,
	[Cedula] [varchar](11) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[Documentos] ON 

INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (1, N'Proyecto final laboratorio de ingenieria en factores humanos.pdf', N'application/pdf', N'/uploads/solicitudes/1/Proyecto_final_laboratorio_de_ingenieria_en_factores_humanos.pdf', 1)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (2, N'Proyecto final laboratorio de ingenieria en factores humanos AAAAAA.pdf', N'application/pdf', N'/uploads/solicitudes/2/Proyecto_final_laboratorio_de_ingenieria_en_factores_humanos_AAAAAA.pdf', 2)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (3, N'Swagger_UI_a.pdf', N'application/pdf', N'/uploads/solicitudes/2/Swagger_UI_a.pdf', 2)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (4, N'PedroEncarnacionComandosNVS8L.pdf', N'application/pdf', N'/uploads/solicitudes/3/PedroEncarnacionComandosNVS8L.pdf', 3)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (5, N'IDS329- Entrega de la QUINTA ACTIVIDAD DE COUSERA (Prototipos).pdf', N'application/pdf', N'/uploads/solicitudes/3/IDS329-_Entrega_de_la_QUINTA_ACTIVIDAD_DE_COUSERA_(Prototipos).pdf', 3)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (6, N'LI-UPC-01.pdf', N'application/pdf', N'/uploads/solicitudes/4/LI-UPC-01.pdf', 4)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (7, N'Formato 2025_Mario Luciano_Diseño de Software_Homework02.pdf', N'application/pdf', N'/uploads/solicitudes/4/Formato_2025_Mario_Luciano_Diseño_de_Software_Homework02.pdf', 4)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (1006, N'A.pdf', N'application/pdf', N'/uploads/solicitudes/1004/A.pdf', 1004)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (1007, N'EncarnacionPedroTFAO2025.pdf', N'application/pdf', N'/uploads/solicitudes/1004/EncarnacionPedroTFAO2025.pdf', 1004)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (1008, N'Practica 2.pdf', N'application/pdf', N'/uploads/solicitudes/1005/Practica_2.pdf', 1005)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (1009, N'Investigación sobre la Incidencia CrowdStrike y Microsoft.pdf', N'application/pdf', N'/uploads/solicitudes/1006/Investigación_sobre_la_Incidencia_CrowdStrike_y_Microsoft.pdf', 1006)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (1010, N'DF-SGC-00 Diagrama de flujo de Productos Controlados ck[1].pdf', N'application/pdf', N'/uploads/solicitudes/1007/DF-SGC-00_Diagrama_de_flujo_de_Productos_Controlados_ck[1].pdf', 1007)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (1011, N'Certificado_1009.pdf', N'application/pdf', N'/uploads/certificados/Certificado_1009.pdf', 1009)
INSERT [dbo].[Documentos] ([Id], [Nombre], [Tipo], [Ruta], [SolicitudId]) VALUES (1012, N'Solicitud_A.pdf', N'application/pdf', N'/uploads/solicitudes/1016/Solicitud_A.pdf', 1016)
SET IDENTITY_INSERT [dbo].[Documentos] OFF
GO
SET IDENTITY_INSERT [dbo].[DocumentosRequeridos] ON 

INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (3, N'Formulario LI-UPC-01 completado y firmado', 1)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (4, N'Copia de cédula del representante legal', 1)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (5, N'Registro Mercantil', 1)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (6, N'Comunicación oficial solicitando la inscripción Clase A', 1)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (7, N'Recibo de depósito BanReservas por el pago del servicio', 1)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (8, N'Documento requerido en PDF', 1)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (9, N'Otro documento opcional', 1)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (10, N'Formulario LI-UPC-02 completado y firmado', 2)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (11, N'Copia de cédula del representante legal', 2)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (12, N'Registro Mercantil', 2)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (13, N'Contrato de alquiler o título de propiedad del local', 2)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (14, N'Recibo de depósito BanReservas por el pago del servicio', 2)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (15, N'Documento requerido en PDF', 2)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (16, N'Otro documento opcional', 2)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (17, N'Formulario LI-UPC-03 completado y firmado', 3)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (18, N'Comunicación oficial de la institución pública solicitando la inscripción', 3)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (19, N'Copia del decreto o acto de creación de la institución', 3)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (20, N'Nombramiento del director o responsable', 3)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (21, N'Plano o descripción del área donde se almacenarán las sustancias', 3)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (22, N'Documentos requeridos en PDF', 3)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (23, N'Otro documento opcional', 3)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (24, N'Formulario LI-UPC-04 completado y firmado', 4)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (25, N'Proforma invoice o factura proforma detallando la materia prima', 4)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (26, N'Registro Sanitario o documento equivalente (si aplica)', 4)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (27, N'Copia de RNC de la empresa', 4)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (28, N'Copia del Registro Mercantil de la empresa', 4)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (29, N'Recibo de depósito BanReservas por el pago del servicio', 4)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (30, N'Documento requerido en PDF', 4)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (31, N'Formulario LI-UPC-05 completado y firmado', 5)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (32, N'Proforma invoice o factura proforma de los medicamentos', 5)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (33, N'Listado de productos con concentración y forma farmacéutica', 5)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (34, N'Registro Sanitario de los medicamentos (si aplica)', 5)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (35, N'Copia del RNC de la empresa importadora', 5)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (36, N'Copia del Registro Mercantil de la empresa', 5)
INSERT [dbo].[DocumentosRequeridos] ([Id], [Nombre], [ServicioId]) VALUES (37, N'Recibo de depósito BanReservas por el pago del servicio', 5)
SET IDENTITY_INSERT [dbo].[DocumentosRequeridos] OFF
GO
SET IDENTITY_INSERT [dbo].[FormularioDigital] ON 

INSERT [dbo].[FormularioDigital] ([Id], [SubservicioId], [EstructuraJson], [FechaCreacion]) VALUES (3, 1, N'{
  "campos": [
    { "tipo": "texto", "nombre": "nombreProfesional", "etiqueta": "Nombre del Profesional", "requerido": true },
    { "tipo": "texto", "nombre": "direccionPostal", "etiqueta": "Dirección/Correo Postal", "requerido": true },
    { "tipo": "texto", "nombre": "cedulaIdentidad", "etiqueta": "Cédula de Identidad y Electoral", "requerido": true },
    { "tipo": "texto", "nombre": "exequatur", "etiqueta": "Exequátur", "requerido": true },
    { "tipo": "texto", "nombre": "colegiatura", "etiqueta": "No. Colegiatura", "requerido": false },
    { "tipo": "texto", "nombre": "telefonoResidencial", "etiqueta": "Teléfono(s) Residencial", "requerido": false },
    { "tipo": "texto", "nombre": "celular", "etiqueta": "Celular", "requerido": false },
    { "tipo": "texto", "nombre": "lugarTrabajo", "etiqueta": "Lugar de Trabajo", "requerido": false },
    { "tipo": "texto", "nombre": "email", "etiqueta": "E-mail", "requerido": false },
    { "tipo": "texto", "nombre": "direccionTrabajo", "etiqueta": "Dirección del Lugar de Trabajo", "requerido": false },
    { "tipo": "texto", "nombre": "telefonoTrabajo", "etiqueta": "Teléfono(s) Trabajo", "requerido": false },
    { "tipo": "seleccion", "nombre": "profesion", "etiqueta": "Profesión", "opciones": ["Medicina", "Medicina Veterinaria", "Odontología", "Otra"], "requerido": true },
    { "tipo": "checkbox", "nombre": "categoriaII", "etiqueta": "Categoría II", "requerido": false },
    { "tipo": "checkbox", "nombre": "categoriaIII", "etiqueta": "Categoría III", "requerido": false },
    { "tipo": "checkbox", "nombre": "categoriaIV", "etiqueta": "Categoría IV", "requerido": false },
    { "tipo": "seleccion", "nombre": "estatus", "etiqueta": "Estatus", "opciones": ["Primera Solicitud", "Renovación", "Solicitud anterior negada", "CIDC reprobado, suspendido", "Otra"], "requerido": true },
    { "tipo": "texto", "nombre": "detalleEstatus", "etiqueta": "Detalles C, D y E", "requerido": false }
  ]
}', CAST(N'2025-12-09T18:17:37.697' AS DateTime))
INSERT [dbo].[FormularioDigital] ([Id], [SubservicioId], [EstructuraJson], [FechaCreacion]) VALUES (4, 2, N'{
  "campos": [
    { "tipo": "texto", "nombre": "nombreProfesional", "etiqueta": "Nombre del Profesional", "requerido": true },
    { "tipo": "texto", "nombre": "direccionPostal", "etiqueta": "Dirección/Correo Postal", "requerido": true },
    { "tipo": "texto", "nombre": "cedulaIdentidad", "etiqueta": "Cédula de Identidad y Electoral", "requerido": true },
    { "tipo": "texto", "nombre": "exequatur", "etiqueta": "Exequátur", "requerido": true },
    { "tipo": "texto", "nombre": "colegiatura", "etiqueta": "No. Colegiatura", "requerido": false },
    { "tipo": "texto", "nombre": "telefonoResidencial", "etiqueta": "Teléfono(s) Residencial", "requerido": false },
    { "tipo": "texto", "nombre": "celular", "etiqueta": "Celular", "requerido": false },
    { "tipo": "texto", "nombre": "lugarTrabajo", "etiqueta": "Lugar de Trabajo", "requerido": false },
    { "tipo": "texto", "nombre": "email", "etiqueta": "E-mail", "requerido": false },
    { "tipo": "texto", "nombre": "direccionTrabajo", "etiqueta": "Dirección del Lugar de Trabajo", "requerido": false },
    { "tipo": "texto", "nombre": "telefonoTrabajo", "etiqueta": "Teléfono(s) Trabajo", "requerido": false },
    { "tipo": "seleccion", "nombre": "profesion", "etiqueta": "Profesión", "opciones": ["Medicina", "Medicina Veterinaria", "Odontología", "Otra"], "requerido": true },
    { "tipo": "checkbox", "nombre": "categoriaII", "etiqueta": "Categoría II", "requerido": false },
    { "tipo": "checkbox", "nombre": "categoriaIII", "etiqueta": "Categoría III", "requerido": false },
    { "tipo": "checkbox", "nombre": "categoriaIV", "etiqueta": "Categoría IV", "requerido": false },
    { "tipo": "seleccion", "nombre": "estatus", "etiqueta": "Estatus", "opciones": ["Primera Solicitud", "Renovación", "Solicitud anterior negada", "CIDC reprobado, suspendido", "Otra"], "requerido": true },
    { "tipo": "texto", "nombre": "detalleEstatus", "etiqueta": "Detalles C, D y E", "requerido": false }
  ]
}', CAST(N'2025-12-09T18:17:37.697' AS DateTime))
INSERT [dbo].[FormularioDigital] ([Id], [SubservicioId], [EstructuraJson], [FechaCreacion]) VALUES (5, 3, N'{
  "campos": [
    { "tipo": "texto", "nombre": "nombreProfesional", "etiqueta": "Nombre del Profesional", "requerido": true },
    { "tipo": "texto", "nombre": "direccionPostal", "etiqueta": "Dirección/Correo Postal", "requerido": true },
    { "tipo": "texto", "nombre": "cedulaIdentidad", "etiqueta": "Cédula de Identidad y Electoral", "requerido": true },
    { "tipo": "texto", "nombre": "exequatur", "etiqueta": "Exequátur", "requerido": true },
    { "tipo": "texto", "nombre": "colegiatura", "etiqueta": "No. Colegiatura", "requerido": false },
    { "tipo": "texto", "nombre": "telefonoResidencial", "etiqueta": "Teléfono(s) Residencial", "requerido": false },
    { "tipo": "texto", "nombre": "celular", "etiqueta": "Celular", "requerido": false },
    { "tipo": "texto", "nombre": "lugarTrabajo", "etiqueta": "Lugar de Trabajo", "requerido": false },
    { "tipo": "texto", "nombre": "email", "etiqueta": "E-mail", "requerido": false },
    { "tipo": "texto", "nombre": "direccionTrabajo", "etiqueta": "Dirección del Lugar de Trabajo", "requerido": false },
    { "tipo": "texto", "nombre": "telefonoTrabajo", "etiqueta": "Teléfono(s) Trabajo", "requerido": false },
    { "tipo": "seleccion", "nombre": "profesion", "etiqueta": "Profesión", "opciones": ["Medicina", "Medicina Veterinaria", "Odontología", "Otra"], "requerido": true },
    { "tipo": "checkbox", "nombre": "categoriaII", "etiqueta": "Categoría II", "requerido": false },
    { "tipo": "checkbox", "nombre": "categoriaIII", "etiqueta": "Categoría III", "requerido": false },
    { "tipo": "checkbox", "nombre": "categoriaIV", "etiqueta": "Categoría IV", "requerido": false },
    { "tipo": "seleccion", "nombre": "estatus", "etiqueta": "Estatus", "opciones": ["Primera Solicitud", "Renovación", "Solicitud anterior negada", "CIDC reprobado, suspendido", "Otra"], "requerido": true },
    { "tipo": "texto", "nombre": "detalleEstatus", "etiqueta": "Detalles C, D y E", "requerido": false }
  ]
}', CAST(N'2025-12-09T18:17:37.697' AS DateTime))
INSERT [dbo].[FormularioDigital] ([Id], [SubservicioId], [EstructuraJson], [FechaCreacion]) VALUES (6, 4, N'{
  "campos": [
    { "tipo": "texto", "nombre": "nombreEmpresa", "etiqueta": "Nombre de la Empresa / Razón Social", "requerido": true },
    { "tipo": "texto", "nombre": "direccionPostal", "etiqueta": "Dirección/Correo Postal", "requerido": true },
    { "tipo": "texto", "nombre": "email", "etiqueta": "E-mail", "requerido": true },
    { "tipo": "texto", "nombre": "rnc", "etiqueta": "RNC", "requerido": true },
    { "tipo": "texto", "nombre": "telefono", "etiqueta": "Teléfono(s)", "requerido": true },
    { "tipo": "checkbox", "nombre": "actividadImportadora", "etiqueta": "Importadora", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadExportadora", "etiqueta": "Exportadora", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadFabricante", "etiqueta": "Fabricante", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadDistribuidor", "etiqueta": "Distribuidor", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadLaboratorio", "etiqueta": "Laboratorio analítico", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadFarmacia", "etiqueta": "Farmacia", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadClinicaPrivada", "etiqueta": "Clínica privada", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadVeterinaria", "etiqueta": "Clínica veterinaria", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadInstitucion", "etiqueta": "Institución de enseñanza superior", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadHospital", "etiqueta": "Hospital Público o Institución Oficial", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadInvestigacion", "etiqueta": "Investigación categoría I", "requerido": false },
    { "tipo": "texto", "nombre": "actividadOtra", "etiqueta": "Otra, especifique", "requerido": false },
    { "tipo": "seleccion", "nombre": "estatus", "etiqueta": "Estatus", "opciones": ["Primera Solicitud", "Renovación", "Solicitud anterior negada", "CIDC reprobado, suspendido", "Otra"], "requerido": true },
    { "tipo": "texto", "nombre": "detalleEstatus", "etiqueta": "Detalles C, D y E", "requerido": false }
  ]
}', CAST(N'2025-12-09T18:19:44.283' AS DateTime))
INSERT [dbo].[FormularioDigital] ([Id], [SubservicioId], [EstructuraJson], [FechaCreacion]) VALUES (7, 5, N'{
  "campos": [
    { "tipo": "texto", "nombre": "nombreEmpresa", "etiqueta": "Nombre de la Empresa / Razón Social", "requerido": true },
    { "tipo": "texto", "nombre": "direccionPostal", "etiqueta": "Dirección/Correo Postal", "requerido": true },
    { "tipo": "texto", "nombre": "email", "etiqueta": "E-mail", "requerido": true },
    { "tipo": "texto", "nombre": "rnc", "etiqueta": "RNC", "requerido": true },
    { "tipo": "texto", "nombre": "telefono", "etiqueta": "Teléfono(s)", "requerido": true },
    { "tipo": "checkbox", "nombre": "actividadImportadora", "etiqueta": "Importadora", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadExportadora", "etiqueta": "Exportadora", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadFabricante", "etiqueta": "Fabricante", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadDistribuidor", "etiqueta": "Distribuidor", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadLaboratorio", "etiqueta": "Laboratorio analítico", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadFarmacia", "etiqueta": "Farmacia", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadClinicaPrivada", "etiqueta": "Clínica privada", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadVeterinaria", "etiqueta": "Clínica veterinaria", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadInstitucion", "etiqueta": "Institución de enseñanza superior", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadHospital", "etiqueta": "Hospital Público o Institución Oficial", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadInvestigacion", "etiqueta": "Investigación categoría I", "requerido": false },
    { "tipo": "texto", "nombre": "actividadOtra", "etiqueta": "Otra, especifique", "requerido": false },
    { "tipo": "seleccion", "nombre": "estatus", "etiqueta": "Estatus", "opciones": ["Primera Solicitud", "Renovación", "Solicitud anterior negada", "CIDC reprobado, suspendido", "Otra"], "requerido": true },
    { "tipo": "texto", "nombre": "detalleEstatus", "etiqueta": "Detalles C, D y E", "requerido": false }
  ]
}', CAST(N'2025-12-09T18:19:44.283' AS DateTime))
INSERT [dbo].[FormularioDigital] ([Id], [SubservicioId], [EstructuraJson], [FechaCreacion]) VALUES (8, 6, N'{
  "campos": [
    { "tipo": "texto", "nombre": "nombreEmpresa", "etiqueta": "Nombre de la Empresa / Razón Social", "requerido": true },
    { "tipo": "texto", "nombre": "direccionPostal", "etiqueta": "Dirección/Correo Postal", "requerido": true },
    { "tipo": "texto", "nombre": "email", "etiqueta": "E-mail", "requerido": true },
    { "tipo": "texto", "nombre": "rnc", "etiqueta": "RNC", "requerido": true },
    { "tipo": "texto", "nombre": "telefono", "etiqueta": "Teléfono(s)", "requerido": true },
    { "tipo": "checkbox", "nombre": "actividadImportadora", "etiqueta": "Importadora", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadExportadora", "etiqueta": "Exportadora", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadFabricante", "etiqueta": "Fabricante", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadDistribuidor", "etiqueta": "Distribuidor", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadLaboratorio", "etiqueta": "Laboratorio analítico", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadFarmacia", "etiqueta": "Farmacia", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadClinicaPrivada", "etiqueta": "Clínica privada", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadVeterinaria", "etiqueta": "Clínica veterinaria", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadInstitucion", "etiqueta": "Institución de enseñanza superior", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadHospital", "etiqueta": "Hospital Público o Institución Oficial", "requerido": false },
    { "tipo": "checkbox", "nombre": "actividadInvestigacion", "etiqueta": "Investigación categoría I", "requerido": false },
    { "tipo": "texto", "nombre": "actividadOtra", "etiqueta": "Otra, especifique", "requerido": false },
    { "tipo": "seleccion", "nombre": "estatus", "etiqueta": "Estatus", "opciones": ["Primera Solicitud", "Renovación", "Solicitud anterior negada", "CIDC reprobado, suspendido", "Otra"], "requerido": true },
    { "tipo": "texto", "nombre": "detalleEstatus", "etiqueta": "Detalles C, D y E", "requerido": false }
  ]
}', CAST(N'2025-12-09T18:19:44.283' AS DateTime))
SET IDENTITY_INSERT [dbo].[FormularioDigital] OFF
GO
SET IDENTITY_INSERT [dbo].[HistorialEstados] ON 

INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1, 1, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 1, CAST(N'2025-11-23T22:22:26.9755699' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (2, 2, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 1, CAST(N'2025-11-23T22:41:36.8704233' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (3, 2, N'Pendiente', N'Depositada', N'Envío final de la solicitud.', 1, CAST(N'2025-11-23T22:42:46.9372318' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (4, 3, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 1, CAST(N'2025-11-23T22:44:59.8005368' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (5, 3, N'Pendiente', N'Depositada', N'Envío final de la solicitud.', 1, CAST(N'2025-11-23T22:45:38.5128358' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (6, 4, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 1, CAST(N'2025-11-25T11:50:01.7034141' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (7, 4, N'Pendiente', N'Depositada', N'Envio final', 1, CAST(N'2025-11-25T11:51:01.3523388' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (8, 5, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 1, CAST(N'2025-11-25T12:06:48.4973237' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (9, 5, N'Pendiente', N'Depositada', N'Envio final', 1, CAST(N'2025-11-25T12:07:04.6986053' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1006, 1004, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 1, CAST(N'2025-11-27T18:22:38.4787116' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1007, 1004, N'Pendiente', N'Depositada', N'Si por favor', 1, CAST(N'2025-11-27T18:24:29.0671581' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1008, 1004, N'Depositada', N'Validación Recepción', N'Documentos revisados en recepción.', 10, CAST(N'2025-11-27T18:29:02.7823769' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1009, 1004, N'Validación Recepción', N'Evaluación Técnica', N'Evaluación técnica completada.', 9, CAST(N'2025-11-27T18:30:06.7887286' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1010, 1004, N'Evaluación Técnica', N'Aprobación DIGEAMPS', N'Aprobado por DIGEAMPS.', 6, CAST(N'2025-11-27T18:31:14.7962141' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1011, 1004, N'Aprobación DIGEAMPS', N'Aprobación DNCD', N'Validado por DNCD.', 12, CAST(N'2025-11-27T18:32:26.7774684' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1012, 1004, N'Aprobación DNCD', N'Revisión VUS', N'Revisión en Ventanilla Única.', 8, CAST(N'2025-11-27T18:34:12.6972684' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1013, 1004, N'Revisión VUS', N'Aprobada', N'Solicitud aprobada por Dirección.', 11, CAST(N'2025-11-27T18:34:57.5346142' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1014, 1005, NULL, N'Pendiente', NULL, 1, CAST(N'2025-11-29T22:26:27.4700000' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1015, 1005, N'Pendiente', N'Depositada', N'azul', 1, CAST(N'2025-11-29T22:28:11.2728619' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1016, 1005, N'Depositada', N'Validación Recepción', N'Documentación recibida correctamente.', 10, CAST(N'2025-11-29T22:32:44.1462500' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1017, 1006, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 1, CAST(N'2025-11-29T23:22:45.8187003' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1018, 1006, N'Pendiente', N'Depositada', N'Envío mi solicitud con toda la documentación.', 1, CAST(N'2025-11-29T23:24:47.6565519' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1019, 1006, N'Depositada', N'Validación Recepción', N'Documentos completos, pasa a Validación de Recepción.', 8, CAST(N'2025-11-29T23:35:08.3600781' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1020, 1006, N'Validación Recepción', N'Evaluación Técnica', N'Expediente evaluado, cumple requisitos técnicos.', 9, CAST(N'2025-11-29T23:36:10.6996220' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1021, 1006, N'Evaluación Técnica', N'Rechazada', N'DIGEAMPS rechaza por inconsistencias en la documentación.', 10, CAST(N'2025-11-29T23:37:10.7917511' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1022, 1007, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 7, CAST(N'2025-11-30T00:00:19.2946090' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1023, 1007, N'Pendiente', N'Depositada', N'Envio mi solicitud para revision.', 7, CAST(N'2025-11-30T00:01:22.8326630' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1024, 1007, N'Depositada', N'Validación Recepción', N'Recibida en ventanilla, pasa a validación.', 8, CAST(N'2025-11-30T00:02:44.5378493' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1025, 1007, N'Validación Recepción', N'Devuelta', N'Faltan documentos obligatorios, se devuelve a ventanilla.', 9, CAST(N'2025-11-30T00:05:15.5526411' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1026, 1007, N'Devuelta', N'Depositada', N'Solicitud reenviada por el usuario después de correcciones', 7, CAST(N'2025-11-30T00:22:34.8028701' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1027, 1008, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 1, CAST(N'2025-11-30T01:28:11.0767452' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1028, 1008, N'Pendiente', N'Depositada', N'Envío mi solicitud con la documentación inicial.', 1, CAST(N'2025-11-30T01:28:37.9431616' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1029, 1009, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 1, CAST(N'2025-11-30T01:56:35.0920958' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1030, 1009, N'Pendiente', N'Depositada', N'Envío inicial de la solicitud.', 1, CAST(N'2025-11-30T01:56:56.0582487' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1031, 1009, N'Depositada', N'Validación Recepción', N'Documentación recibida y verificada por VUS.', 8, CAST(N'2025-11-30T01:57:41.4566644' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1032, 1009, N'Validación Recepción', N'Evaluación Técnica', N'Evaluación técnica en proceso.', 9, CAST(N'2025-11-30T01:58:18.2371959' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1033, 1009, N'Evaluación Técnica', N'Aprobación UPC', N'Expediente aprobado por Encargado UPC.', 10, CAST(N'2025-11-30T01:58:53.1694591' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1034, 1009, N'Aprobación UPC', N'Revisión DNCD', N'Revisión realizada por DNCD.', 12, CAST(N'2025-11-30T01:59:39.0744136' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1035, 1009, N'Revisión DNCD', N'Aprobada', N'Solicitud aprobada por Dirección.', 11, CAST(N'2025-11-30T02:00:17.2185629' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1036, 1016, NULL, N'Pendiente', N'Solicitud iniciada desde el portal.', 1, CAST(N'2025-12-09T20:32:20.6387244' AS DateTime2))
INSERT [dbo].[HistorialEstados] ([Id], [SolicitudId], [EstadoAnterior], [EstadoNuevo], [Comentario], [UsuarioId], [FechaCambio]) VALUES (1037, 1016, N'Pendiente', N'Depositada', N'Prueba', 1, CAST(N'2025-12-09T21:07:44.4472218' AS DateTime2))
SET IDENTITY_INSERT [dbo].[HistorialEstados] OFF
GO
SET IDENTITY_INSERT [dbo].[RespuestaFormularioDigital] ON 

INSERT [dbo].[RespuestaFormularioDigital] ([Id], [SolicitudId], [FormularioDigitalId], [RespuestasJson], [FechaEnvio]) VALUES (2, 1016, 3, N'{"nombreProfesional":"Pedro Pérez","direccionPostal":"Av. Principal 123","cedulaIdentidad":"001-1234567-8","exequatur":"12345","profesion":"Medicina","estatus":"Primera Solicitud"}', CAST(N'2025-12-09T20:50:26.717' AS DateTime))
SET IDENTITY_INSERT [dbo].[RespuestaFormularioDigital] OFF
GO
SET IDENTITY_INSERT [dbo].[Servicios] ON 

INSERT [dbo].[Servicios] ([Id], [Nombre], [Descripcion], [Costo], [RequierePago], [Activo], [RutaFormularioBase]) VALUES (1, N'LI-UPC-01 Certificado de Inscripción de Drogas Controladas Clase A', N'Certificado necesario para la importación de medicamentos y sustancias controladas de Clase A.', CAST(1500.00 AS Decimal(18, 2)), 1, 1, N'/uploads/forms/LI-UPC-01.pdf')
INSERT [dbo].[Servicios] ([Id], [Nombre], [Descripcion], [Costo], [RequierePago], [Activo], [RutaFormularioBase]) VALUES (2, N'LI-UPC-02 Certificado de Inscripción de Drogas Controladas Clase B para Establecimientos Privados', N'Certificado de inscripción Clase B para clínicas, farmacias y otros establecimientos privados.', CAST(1200.00 AS Decimal(18, 2)), 1, 1, N'/uploads/forms/LI-UPC-02.pdf')
INSERT [dbo].[Servicios] ([Id], [Nombre], [Descripcion], [Costo], [RequierePago], [Activo], [RutaFormularioBase]) VALUES (3, N'LI-UPC-03 Certificado de Inscripción de Drogas Controladas Clase B para Hospitales Públicos y otras Instituciones Públicas', N'Certificado de inscripción Clase B para hospitales públicos y otras instituciones públicas.', CAST(0.00 AS Decimal(18, 2)), 0, 1, N'/uploads/forms/LI-UPC-03.pdf')
INSERT [dbo].[Servicios] ([Id], [Nombre], [Descripcion], [Costo], [RequierePago], [Activo], [RutaFormularioBase]) VALUES (4, N'LI-UPC-04 Permiso de Importación de Materia Prima de Sustancias Controladas', N'Permiso previo para importar materia prima de sustancias controladas.', CAST(2000.00 AS Decimal(18, 2)), 1, 1, N'/uploads/forms/LI-UPC-04.pdf')
INSERT [dbo].[Servicios] ([Id], [Nombre], [Descripcion], [Costo], [RequierePago], [Activo], [RutaFormularioBase]) VALUES (5, N'LI-UPC-05 Permiso de Importación de Medicamentos con Sustancia Controlada', N'Permiso previo para importar medicamentos que contienen sustancias controladas.', CAST(1500.00 AS Decimal(18, 2)), 1, 1, N'/uploads/forms/LI-UPC-05.pdf')
INSERT [dbo].[Servicios] ([Id], [Nombre], [Descripcion], [Costo], [RequierePago], [Activo], [RutaFormularioBase]) VALUES (6, N'Solicitud A - Inscripción de Drogas Controladas', N'Formulario general de solicitud A para inscripciones.', CAST(0.00 AS Decimal(18, 2)), 0, 1, N'/uploads/forms/Solicitud_A.pdf')
INSERT [dbo].[Servicios] ([Id], [Nombre], [Descripcion], [Costo], [RequierePago], [Activo], [RutaFormularioBase]) VALUES (7, N'Solicitud B-2 - Permiso de Importación', N'Formulario general de solicitud B-2 para permisos de importación.', CAST(0.00 AS Decimal(18, 2)), 0, 1, N'/uploads/forms/Solicitud_B-2.pdf')
SET IDENTITY_INSERT [dbo].[Servicios] OFF
GO
SET IDENTITY_INSERT [dbo].[Solicitudes] ON 

INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1, N'Pendiente', CAST(N'2025-11-23T22:22:26.867' AS DateTime), 1, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (2, N'Pendiente', CAST(N'2025-11-23T22:41:36.760' AS DateTime), 1, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (3, N'Pendiente', CAST(N'2025-11-23T22:44:59.793' AS DateTime), 1, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (4, N'Pendiente', CAST(N'2025-11-25T11:50:01.610' AS DateTime), 1, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (5, N'Pendiente', CAST(N'2025-11-25T12:06:48.413' AS DateTime), 1, 2, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1004, N'Aprobada', CAST(N'2025-11-27T18:22:38.387' AS DateTime), 1, 4, N'/uploads/certificados/1004/Certificado_1004.pdf')
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1005, N'Validación Recepción', CAST(N'2025-11-29T22:26:27.470' AS DateTime), 1, 2, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1006, N'Rechazada', CAST(N'2025-11-29T23:22:45.730' AS DateTime), 1, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1007, N'Depositada', CAST(N'2025-11-30T00:00:19.200' AS DateTime), 7, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1008, N'Depositada', CAST(N'2025-11-30T01:28:10.973' AS DateTime), 1, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1009, N'Aprobada', CAST(N'2025-11-30T01:56:35.000' AS DateTime), 1, 1, N'/uploads/certificados/1009/Certificado_1009.pdf')
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1010, N'Depositada', CAST(N'2025-12-05T11:39:57.700' AS DateTime), 7, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1011, N'Devuelta', CAST(N'2025-12-05T11:39:57.700' AS DateTime), 7, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1012, N'Aprobación DNCD', CAST(N'2025-12-05T11:39:57.700' AS DateTime), 7, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1013, N'Validación Recepción', CAST(N'2025-12-05T11:39:57.700' AS DateTime), 7, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1014, N'Evaluación Técnica', CAST(N'2025-12-05T11:39:57.700' AS DateTime), 7, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1015, N'Aprobación DIGEAMPS', CAST(N'2025-12-05T11:39:57.700' AS DateTime), 7, 1, NULL)
INSERT [dbo].[Solicitudes] ([Id], [Estado], [FechaCreacion], [UsuarioId], [ServicioId], [RutaCertificado]) VALUES (1016, N'Depositada', CAST(N'2025-12-09T20:32:20.460' AS DateTime), 1, 1, NULL)
SET IDENTITY_INSERT [dbo].[Solicitudes] OFF
GO
SET IDENTITY_INSERT [dbo].[Subservicio] ON 

INSERT [dbo].[Subservicio] ([Id], [Nombre], [Descripcion], [ServicioId], [RutaFormularioBase], [Activo]) VALUES (1, N'Nueva Solicitud', N'Nueva inscripción Clase A', 1, N'/uploads/forms/Solicitud_A.pdf', 1)
INSERT [dbo].[Subservicio] ([Id], [Nombre], [Descripcion], [ServicioId], [RutaFormularioBase], [Activo]) VALUES (2, N'Renovación Certificado', N'Renovación inscripción Clase A', 1, N'/uploads/forms/Solicitud_A.pdf', 1)
INSERT [dbo].[Subservicio] ([Id], [Nombre], [Descripcion], [ServicioId], [RutaFormularioBase], [Activo]) VALUES (3, N'Pérdida del Certificado', N'Reposición por pérdida Clase A', 1, N'/uploads/forms/Solicitud_A.pdf', 1)
INSERT [dbo].[Subservicio] ([Id], [Nombre], [Descripcion], [ServicioId], [RutaFormularioBase], [Activo]) VALUES (4, N'Solicitud/Renovación', N'Solicitud o Renovación Clase B', 2, N'/uploads/forms/Solicitud_B-2.pdf', 1)
INSERT [dbo].[Subservicio] ([Id], [Nombre], [Descripcion], [ServicioId], [RutaFormularioBase], [Activo]) VALUES (5, N'Nueva Solicitud Certificado', N'Nueva inscripción Clase B', 3, N'/uploads/forms/Solicitud_B-2.pdf', 1)
INSERT [dbo].[Subservicio] ([Id], [Nombre], [Descripcion], [ServicioId], [RutaFormularioBase], [Activo]) VALUES (6, N'Renovación Certificado', N'Renovación inscripción Clase B', 3, N'/uploads/forms/Solicitud_B-2.pdf', 1)
INSERT [dbo].[Subservicio] ([Id], [Nombre], [Descripcion], [ServicioId], [RutaFormularioBase], [Activo]) VALUES (7, N'Permiso de Importación de Materia Prima', N'Permiso de importación de materia prima de sustancias controladas (dos fases en el mismo formulario)', 4, NULL, 1)
INSERT [dbo].[Subservicio] ([Id], [Nombre], [Descripcion], [ServicioId], [RutaFormularioBase], [Activo]) VALUES (8, N'Permiso de Importación de Medicamentos', N'Permiso de importación de medicamentos con sustancia controlada (dos fases en el mismo formulario)', 5, NULL, 1)
INSERT [dbo].[Subservicio] ([Id], [Nombre], [Descripcion], [ServicioId], [RutaFormularioBase], [Activo]) VALUES (9, N'Solicitud General', N'Formulario general de solicitud A', 6, N'/uploads/forms/Solicitud_A.pdf', 1)
INSERT [dbo].[Subservicio] ([Id], [Nombre], [Descripcion], [ServicioId], [RutaFormularioBase], [Activo]) VALUES (10, N'Solicitud General', N'Formulario general de solicitud B-2', 7, N'/uploads/forms/Solicitud_B-2.pdf', 1)
SET IDENTITY_INSERT [dbo].[Subservicio] OFF
GO
SET IDENTITY_INSERT [dbo].[Usuarios] ON 

INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (1, N'Pedro', N'pedro@example.com', N'password123', N'Solicitante', 1, 0, N'40228051328')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (2, N'Ana', N'ana@example.com', N'password123', N'Admin', 1, 0, N'00145782137')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (3, N'Carlos Pérez', N'carlos@example.com', N'Password123!', N'Solicitante', 1, 0, N'00198357214')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (4, N'Pedro', N'pedro@example.com', N'password123', N'Solicitante', 1, 0, N'40288412937')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (5, N'Ana', N'ana@example.com', N'password123', N'Admin', 1, 0, N'00133851927')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (6, N'Carlos Analista', N'analista@example.com', N'password123', N'Analista', 1, 0, N'40299381245')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (7, N'Solicitante Demo', N'solicitante@example.com', N'password123', N'Solicitante', 1, 0, N'00177283941')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (8, N'Usuario VUS', N'vus@example.com', N'password123', N'VUS', 1, 0, N'40211893724')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (9, N'Técnico UPC', N'tecnico.upc@example.com', N'password123', N'TecnicoUPC', 1, 0, N'00199831244')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (10, N'Encargado UPC', N'encargado.upc@example.com', N'password123', N'EncargadoUPC', 1, 0, N'40233456712')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (11, N'Dirección', N'direccion@example.com', N'password123', N'Direccion', 1, 0, N'40222991533')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (12, N'Usuario DNCD', N'dncd@example.com', N'password123', N'DNCD', 1, 0, N'00188329122')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (13, N'Admin ControlTec', N'admin@example.com', N'password123', N'Admin', 1, 0, N'40255328111')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (1007, N'Juan', N'juan.solicitante@example.com', N'otra', N'Solicitante', 1, 0, N'00177299134')
INSERT [dbo].[Usuarios] ([Id], [Nombre], [Correo], [Contraseña], [Roll], [Activo], [EsInternoPendiente], [Cedula]) VALUES (1008, N'Lucia Interna', N'lucia.interna@example.com', N'password123', N'VUS', 1, 0, N'40244811239')
SET IDENTITY_INSERT [dbo].[Usuarios] OFF
GO
/****** Object:  Index [IX_HistorialEstados_SolicitudId]    Script Date: 10/12/2025 1:42:29 ******/
CREATE NONCLUSTERED INDEX [IX_HistorialEstados_SolicitudId] ON [dbo].[HistorialEstados]
(
	[SolicitudId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_HistorialEstados_UsuarioId]    Script Date: 10/12/2025 1:42:29 ******/
CREATE NONCLUSTERED INDEX [IX_HistorialEstados_UsuarioId] ON [dbo].[HistorialEstados]
(
	[UsuarioId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Usuarios_Cedula]    Script Date: 10/12/2025 1:42:29 ******/
ALTER TABLE [dbo].[Usuarios] ADD  CONSTRAINT [UQ_Usuarios_Cedula] UNIQUE NONCLUSTERED 
(
	[Cedula] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[FormularioDigital] ADD  DEFAULT (getdate()) FOR [FechaCreacion]
GO
ALTER TABLE [dbo].[HistorialEstados] ADD  DEFAULT (sysutcdatetime()) FOR [FechaCambio]
GO
ALTER TABLE [dbo].[RespuestaFormularioDigital] ADD  DEFAULT (getdate()) FOR [FechaEnvio]
GO
ALTER TABLE [dbo].[Subservicio] ADD  DEFAULT ((1)) FOR [Activo]
GO
ALTER TABLE [dbo].[Usuarios] ADD  CONSTRAINT [DF_Usuarios_Activo]  DEFAULT ((1)) FOR [Activo]
GO
ALTER TABLE [dbo].[Usuarios] ADD  CONSTRAINT [DF_Usuarios_EsInternoPendiente]  DEFAULT ((0)) FOR [EsInternoPendiente]
GO
ALTER TABLE [dbo].[Documentos]  WITH CHECK ADD FOREIGN KEY([SolicitudId])
REFERENCES [dbo].[Solicitudes] ([Id])
GO
ALTER TABLE [dbo].[DocumentosRequeridos]  WITH CHECK ADD FOREIGN KEY([ServicioId])
REFERENCES [dbo].[Servicios] ([Id])
GO
ALTER TABLE [dbo].[FormularioDigital]  WITH CHECK ADD FOREIGN KEY([SubservicioId])
REFERENCES [dbo].[Subservicio] ([Id])
GO
ALTER TABLE [dbo].[HistorialEstados]  WITH CHECK ADD  CONSTRAINT [FK_HistorialEstados_Solicitudes] FOREIGN KEY([SolicitudId])
REFERENCES [dbo].[Solicitudes] ([Id])
GO
ALTER TABLE [dbo].[HistorialEstados] CHECK CONSTRAINT [FK_HistorialEstados_Solicitudes]
GO
ALTER TABLE [dbo].[HistorialEstados]  WITH CHECK ADD  CONSTRAINT [FK_HistorialEstados_Usuarios] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])
GO
ALTER TABLE [dbo].[HistorialEstados] CHECK CONSTRAINT [FK_HistorialEstados_Usuarios]
GO
ALTER TABLE [dbo].[RespuestaFormularioDigital]  WITH CHECK ADD FOREIGN KEY([FormularioDigitalId])
REFERENCES [dbo].[FormularioDigital] ([Id])
GO
ALTER TABLE [dbo].[RespuestaFormularioDigital]  WITH CHECK ADD FOREIGN KEY([SolicitudId])
REFERENCES [dbo].[Solicitudes] ([Id])
GO
ALTER TABLE [dbo].[Solicitudes]  WITH CHECK ADD FOREIGN KEY([ServicioId])
REFERENCES [dbo].[Servicios] ([Id])
GO
ALTER TABLE [dbo].[Solicitudes]  WITH CHECK ADD FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])
GO
ALTER TABLE [dbo].[Subservicio]  WITH CHECK ADD FOREIGN KEY([ServicioId])
REFERENCES [dbo].[Servicios] ([Id])
GO
/****** Object:  StoredProcedure [dbo].[sp_AprobarUsuarioInterno]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_AprobarUsuarioInterno]
    @UsuarioId INT,
    @NuevoRol  NVARCHAR(50)   -- Ej: 'VUS', 'DNCD', 'EncargadoUPC', 'TecnicoUPC', 'Analista', 'Direccion', 'Admin'
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Usuarios
    SET Roll = @NuevoRol,
        Activo = 1,
        EsInternoPendiente = 0
    WHERE Id = @UsuarioId;

    SELECT Id, Nombre, Correo, Roll, Activo, EsInternoPendiente, Cedula
    FROM Usuarios
    WHERE Id = @UsuarioId;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_CambiarEstado]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_CambiarEstado]
    @SolicitudId INT,
    @EstadoNuevo VARCHAR(100),
    @Comentario VARCHAR(500),
    @UsuarioId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EstadoAnterior VARCHAR(100);

    -- Obtener estado previo
    SELECT @EstadoAnterior = Estado
    FROM Solicitudes
    WHERE Id = @SolicitudId;

    -- Actualizar solicitud
    UPDATE Solicitudes
    SET Estado = @EstadoNuevo
    WHERE Id = @SolicitudId;

    -- Insertar historial
    INSERT INTO HistorialEstados (SolicitudId, EstadoAnterior, EstadoNuevo, Comentario, UsuarioId, FechaCambio)
    VALUES (@SolicitudId, @EstadoAnterior, @EstadoNuevo, @Comentario, @UsuarioId, GETDATE());

    -- Devolver datos actualizados
    SELECT s.*, u.Nombre AS UsuarioNombre
    FROM Solicitudes s
    INNER JOIN Usuarios u ON u.Id = s.UsuarioId
    WHERE s.Id = @SolicitudId;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_CambiarEstadoSolicitud]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_CambiarEstadoSolicitud]
    @SolicitudId INT,
    @EstadoNuevo VARCHAR(100),
    @Comentario  VARCHAR(500),
    @UsuarioId   INT
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_CambiarEstado @SolicitudId, @EstadoNuevo, @Comentario, @UsuarioId;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_CrearSolicitud]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_CrearSolicitud]
    @UsuarioId INT,
    @ServicioId INT,
    @Comentario VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Crear solicitud
    INSERT INTO Solicitudes (UsuarioId, ServicioId, Estado, FechaCreacion)
    VALUES (@UsuarioId, @ServicioId, 'Pendiente', GETDATE());

    DECLARE @SolicitudId INT = SCOPE_IDENTITY();

    -- Registrar historial inicial
    INSERT INTO HistorialEstados (SolicitudId, EstadoAnterior, EstadoNuevo, Comentario, UsuarioId, FechaCambio)
    VALUES (@SolicitudId, NULL, 'Pendiente', @Comentario, @UsuarioId, GETDATE());

    -- Devolver la solicitud creada
    SELECT *
    FROM Solicitudes
    WHERE Id = @SolicitudId;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_IniciarSolicitud]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_IniciarSolicitud]
    @UsuarioId INT,
    @ServicioId INT,
    @Comentario VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_CrearSolicitud @UsuarioId, @ServicioId, @Comentario;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_ListarSolicitudesFiltradas]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_ListarSolicitudesFiltradas]
    @Estado      VARCHAR(100) = NULL,
    @ServicioId  INT          = NULL,
    @UsuarioId   INT          = NULL,
    @FechaDesde  DATE         = NULL,
    @FechaHasta  DATE         = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.Id,
        s.Estado,
        s.FechaCreacion,
        u.Id   AS UsuarioId,
        u.Nombre AS UsuarioNombre,
        u.Correo,
        serv.Id AS ServicioId,
        serv.Nombre AS ServicioNombre
    FROM Solicitudes s
    LEFT JOIN Usuarios  u    ON u.Id    = s.UsuarioId
    LEFT JOIN Servicios serv ON serv.Id = s.ServicioId
    WHERE
        (@Estado IS NULL OR s.Estado = @Estado)
        AND (@ServicioId IS NULL OR s.ServicioId = @ServicioId)
        AND (@UsuarioId IS NULL OR s.UsuarioId = @UsuarioId)
        AND (@FechaDesde IS NULL OR s.FechaCreacion >= @FechaDesde)
        AND (@FechaHasta IS NULL OR s.FechaCreacion < DATEADD(DAY, 1, @FechaHasta))
    ORDER BY s.FechaCreacion DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_ListarSolicitudesPorUsuario]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_ListarSolicitudesPorUsuario]
    @UsuarioId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.Id,
        s.Estado,
        s.FechaCreacion,
        serv.Nombre AS Servicio,
        serv.Costo
    FROM Solicitudes s
    INNER JOIN Servicios serv ON serv.Id = s.ServicioId
    WHERE s.UsuarioId = @UsuarioId
    ORDER BY s.FechaCreacion DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_ObtenerSolicitudesPorUsuario]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_ObtenerSolicitudesPorUsuario]
    @UsuarioId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.Id,
        s.Estado,
        s.FechaCreacion,
        serv.Nombre AS Servicio,
        serv.Costo,
        COUNT(h.Id) AS CantMovimientos
    FROM Solicitudes s
    LEFT JOIN Servicios        serv ON serv.Id = s.ServicioId
    LEFT JOIN HistorialEstados h    ON h.SolicitudId = s.Id
    WHERE s.UsuarioId = @UsuarioId
    GROUP BY s.Id, s.Estado, s.FechaCreacion, serv.Nombre, serv.Costo
    ORDER BY s.FechaCreacion DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_RegistrarUsuario]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_RegistrarUsuario]
    @Nombre           NVARCHAR(100),
    @Correo           NVARCHAR(150),
    @Password         NVARCHAR(200),
    @Cedula           CHAR(11),
    @TipoUsuario      NVARCHAR(20),        -- 'Solicitante' o 'Interno'
    @RolInternoDeseado NVARCHAR(50) = NULL -- solo informativo (no se guarda en columna)
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar correo único
    IF EXISTS (SELECT 1 FROM Usuarios WHERE Correo = @Correo)
    BEGIN
        RAISERROR('Ya existe un usuario con ese correo.', 16, 1);
        RETURN;
    END

    DECLARE @Roll NVARCHAR(50);
    DECLARE @Activo BIT;
    DECLARE @EsInternoPendiente BIT;

    IF (@TipoUsuario = 'Interno')
    BEGIN
        -- Usuario interno pendiente de aprobación
        SET @Roll = 'Pendiente';
        SET @Activo = 0;
        SET @EsInternoPendiente = 1;
    END
    ELSE
    BEGIN
        -- Usuario solicitante normal
        SET @Roll = 'Solicitante';
        SET @Activo = 1;
        SET @EsInternoPendiente = 0;
    END

    INSERT INTO Usuarios (Nombre, Correo, Contraseña, Roll, Activo, EsInternoPendiente, Cedula)
    VALUES (@Nombre, @Correo, @Password, @Roll, @Activo, @EsInternoPendiente, @Cedula);

    DECLARE @UsuarioId INT = SCOPE_IDENTITY();

    SELECT Id, Nombre, Correo, Roll, Activo, EsInternoPendiente, Cedula
    FROM Usuarios
    WHERE Id = @UsuarioId;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_SubirDocumento]    Script Date: 10/12/2025 1:42:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_SubirDocumento]
    @SolicitudId INT,
    @Nombre      NVARCHAR(260),
    @Tipo        NVARCHAR(100),
    @Ruta        NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Documentos (Nombre, Tipo, Ruta, SolicitudId)
    VALUES (@Nombre, @Tipo, @Ruta, @SolicitudId);

    DECLARE @DocumentoId INT = SCOPE_IDENTITY();

    SELECT *
    FROM Documentos
    WHERE Id = @DocumentoId;
END;
GO
USE [master]
GO
ALTER DATABASE [ControlTecDb] SET  READ_WRITE 
GO
