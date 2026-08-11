# GestionConvocatorias

Sistema de gestión de convocatorias y proyectos con evaluación asistida por IA.
# Autores
Jose de Jesus Islas Lopez
Christopher Camargo Gonzalez
Felicitas Rubi Diego Garcia

# Universidad Tecnologica de Tula-Tepeji
**Ingenieria en Gestion y Desarrollo de Software Multiplataforma**

# Empresa:
**Universidad Tecnologica de Tula Tepeji**

# Asesora Academica:
**Odisey Porras Beltran**

# Nombre de el asesor colaborador:
**Jose Angel Perez Henandez**

## Arquitectura

La solución se compone de cuatro partes:

- **Frontend (React)**: Aplicación de interfaz de usuario construida con React y Tailwind CSS que consume la API REST.
- **Backend (ASP.NET Core / .NET)**: API REST que expone los endpoints de convocatorias, proyectos y evaluaciones, y persiste los datos en SQL Server.
- **Base de datos (SQL Server)**: Almacén relacional de convocatorias, proyectos, usuarios, evaluaciones y especialidades.
- **Servicio de IA (Flask / Python)**: Microservicio en Flask que sugiere evaluadores según la compatibilidad de especialidades con el proyecto.

## Prerrequisitos

- **Node.js**: v18.x o superior
- **.NET SDK**: .NET 8.0 SDK
- **Python**: 3.10 o superior

## Configuración

### Backend (`appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=GestionConvocatorias;User Id=sa;Password=TuPasswordFuerte;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "AQUI_UNA_CLAVE_SECRETA_LARGA_Y_SEGURA",
    "Issuer": "GestionConvocatorias",
    "Audience": "GestionConvocatoriasClientes"
  },
  "IaService": {
    "BaseUrl": "http://localhost:5000"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:5151
VITE_IA_URL=http://localhost:5000
```

## Ejecución

Levantar los tres servidores en terminales separadas:

### Backend (.NET Core)

```bash
cd GestionConvocatorias.Identity.Api
dotnet run
```

### Frontend (React)

```bash
cd GestionConvocatorias.Web
npm install
npm run dev
```

### Servicio de IA (Flask)

```bash
cd GestionConvocatorias.IA
pip install -r requirements.txt
python AprobacionCretido.py
```

## Roles del Sistema

- **Administrador**: Crea convocatorias, visualiza todos los proyectos del sistema y utiliza las herramientas de IA para sugerir evaluadores compatibles con cada proyecto.
- **Evaluador**: Califica los proyectos asignados mediante una puntuación (0-100) y comentarios, registrando las evaluaciones en el sistema.
- **Postulante**: Registra nuevos proyectos asociándolos a una convocatoria y consulta el estado de sus propios proyectos.

Este software fue desarrollado durante el cuatrimestre mayo-agosto 2026 en la asignatura de Nombre de la Asignatura.

Los derechos morales pertenecen a sus autores.
Queda prohibida la eliminación de los créditos originales.
