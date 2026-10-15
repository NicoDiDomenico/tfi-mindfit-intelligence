# Desarrollo local

## Requisitos

- Git.
- .NET SDK 10.0.301 o compatible.
- Node.js 24 y npm 11.
- SQL Server Express o Developer.
- EF Core CLI 10.x.

```powershell
dotnet tool install --global dotnet-ef --version 10.*
```

## Backend

```powershell
cd backend\MindFit_Intelligence_Backend
dotnet restore
dotnet dev-certs https --trust
```

Configure las conexiones y el secreto JWT como explica [configuration.md](./configuration.md). Luego aplique las migraciones:

```powershell
dotnet ef database update --context MindFitMasterContext
dotnet ef database update --context MindFitIntelligenceContext
dotnet run --launch-profile https
```

La API escucha en `https://localhost:7199` y expone Swagger en `/swagger` durante desarrollo.

## Frontend

```powershell
cd frontend
npm ci
npm run dev
```

El proxy de Vite envía `/api` a la API local. Si se utiliza otro host, copie `.env.example` como `.env.local` y modifique `VITE_API_BASE_URL`.

## Crear un gimnasio de prueba

Con ambas aplicaciones levantadas:

1. Abrir `http://localhost:5173/registro-gym`.
2. Crear un gimnasio usando datos inequívocamente ficticios.
3. Esperar a que el backend aplique migraciones y seed.
4. Iniciar sesión con el gimnasio recién creado.

El proceso registra primero el gimnasio como inactivo y solo lo activa cuando la base tenant, los catálogos y el administrador están listos.

## Comprobaciones antes de un commit

```powershell
dotnet build backend\MindFit_Intelligence_Backend.sln --configuration Release
npm --prefix frontend ci
npm --prefix frontend run lint
npm --prefix frontend run build
```

No se deben usar backups de bases reales para validar el proyecto. Las migraciones de EF Core son la fuente reproducible del esquema.
