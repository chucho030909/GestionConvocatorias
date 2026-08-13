# GestionConvocatorias.Identity.Api

API de gestión de convocatorias, proyectos, documentos, evaluaciones e históricos, construida con **.NET 10** (ASP.NET Core Web API), **Entity Framework Core** y **SQL Server**. La autenticación se realiza mediante **JWT Bearer**.

## Requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- SQL Server (LocalDB o instancia completa)
- Herramienta de línea de comandos `dotnet-ef` (opcional, para migraciones):
  ```bash
  dotnet tool install --global dotnet-ef
  ```

## Configuración

1. Clona el repositorio y entra a la carpeta del proyecto:
   ```bash
   cd GestionConvocatorias.Identity.Api
   ```
2. Ajusta la cadena de conexión `DefaultConnection` en `appsettings.json` / `appsettings.Development.json` apuntando a tu SQL Server.
3. Configura los valores JWT en `appsettings.json`:
   ```json
   "Jwt": {
     "Key": "UNA_CLAVE_SECRETA_LARGA_Y_SEGURA_DE_AL_MENOS_32_CARACTERES",
     "Issuer": "GestionConvocatoriasIdentityApi",
     "Audience": "GestionConvocatoriasClientes"
   }
   ```

## Ejecución

```bash
dotnet restore
dotnet build
dotnet run
```

Al iniciar, la API **puebla automáticamente la base de datos** (solo si está vacía) mediante `Data/DbSeeder.cs` con datos de ejemplo (1 administrador, 2 evaluadores, 3 postulantes, 2 convocatorias y 3 proyectos).

### Documentación interactiva

En entorno `Development` se exponen:

- **Scalar**: `https://localhost:{puerto}/scalar/v1`
- **Swagger UI**: `https://localhost:{puerto}/swagger`

> Ambas interfaces incluyen el candado de autorización JWT: pulsa **Authorize** y pega `Bearer {token}` para probar los endpoints protegidos.

## Base de datos

Si necesitas regenerar el esquema desde cero:

```bash
dotnet ef database update
```

Migraciones aplicadas: `AgregarConvocatoria`, `AgregarProyecto`, `AgregarDocumentos`, `AgregarEvaluacion`.

## Autenticación (JWT)

1. Registra un usuario o utiliza las credenciales sembradas.
2. `POST /api/auth/login` con `{ "CorreoElectronico": "...", "Password": "..." }` devuelve un `token` JWT.
3. Incluye el token en cada petición protegida en la cabecera:
   ```
   Authorization: Bearer <token>
   ```
4. El `UsuarioId` y el `Rol` viajan en los claims del token (`NameIdentifier` y `Role`), y la API los extrae directamente del token (nunca del body).

### Usuarios sembrados (contraseña: `Password123!`)

| Correo | Rol |
|--------|-----|
| `admin@uttt.edu.mx` | Administrador |
| `evaluador1@uttt.edu.mx` | Evaluador |
| `evaluador2@uttt.edu.mx` | Evaluador |
| `postulante1@uttt.edu.mx` | Postulante |
| `postulante2@uttt.edu.mx` | Postulante |
| `postulante3@uttt.edu.mx` | Postulante |

## Endpoints

| Método | Ruta | Rol(es) | Descripción |
|---------|------|----------|-------------|
| POST | `/api/auth/registrar` | Público | Registra un nuevo usuario |
| POST | `/api/auth/login` | Público | Autentica y devuelve un token JWT |
| GET | `/api/convocatorias` | Cualquier logueado | Lista todas las convocatorias |
| POST | `/api/convocatorias` | `Administrador` | Crea una convocatoria |
| POST | `/api/proyectos` | `Postulante`, `Administrador` | Crea un proyecto (usuario del token) |
| GET | `/api/proyectos/MisProyectos` | Cualquier logueado | Proyectos del usuario autenticado |
| GET | `/api/proyectos/Todos` | `Administrador` | Todos los proyectos + convocatoria + usuario |
| POST | `/api/documentos/subir` | `Postulante` | Sube un `.pdf` (≤20 MB) al proyecto propio |
| POST | `/api/evaluaciones/calificar` | `Evaluador` | Califica un proyecto (innovación/viabilidad 1–5) |
| GET | `/api/reportes/historico` | `Administrador` | Histórico filtrable por `cuatrimestre` y `categoria` |
| GET | `/api/reportes/exportar/{proyectoId}` | `Administrador` | Resumen JSON del proyecto (equipo, documentos, calificaciones) |

### Parámetros de consulta

- `GET /api/reportes/historico?cuatrimestre=2026-C2&categoria=Tecnología` (ambos opcionales).

## Estructura del proyecto

```
Models/      Entidades: Usuario, Convocatoria, Proyecto, Documento, Evaluacion
Data/        AppDbContext, DbSeeder
DTOs/        Objetos de transferencia (Registro, Login, Proyectos)
Controllers/ Auth, Convocatorias, Proyectos, Documentos, Evaluaciones, Reportes
Services/    PasswordHasher (hash PBKDF2)
Program.cs   Configuración de servicios, JWT, Swagger/Scalar y seeder
```

## Notas de seguridad

- Las contraseñas se almacenan con hash **PBKDF2** (`Services/PasswordHasher.cs`).
- El paquete `Microsoft.OpenApi` se mantiene en la versión **2.7.5** para mitigar CVE-2026-49451.
