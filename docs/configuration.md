# Configuración segura

La configuración base versionada no contiene secretos. Para desarrollo local se recomienda .NET User Secrets.

## Backend

Desde `backend/MindFit_Intelligence_Backend`:

```powershell
dotnet user-secrets set "ConnectionStrings:MasterConnection" "..."
dotnet user-secrets set "ConnectionStrings:StoreConnection" "..."
dotnet user-secrets set "ConnectionStrings:TenantTemplate" "...{0}..."
dotnet user-secrets set "AppSettings:Token" "..."
```

También puede copiarse `appsettings.Local.example.json` como `appsettings.Local.json`. El archivo resultante está ignorado por Git.

### Variables disponibles

| Clave | Obligatoria | Uso |
| --- | --- | --- |
| `ConnectionStrings__MasterConnection` | Sí | Base maestra de gimnasios |
| `ConnectionStrings__StoreConnection` | Sí | Base fallback de desarrollo |
| `ConnectionStrings__TenantTemplate` | Sí | Plantilla con `{0}` para nuevas bases tenant |
| `AppSettings__Token` | Sí | Firma de JWT; debe ser largo y aleatorio |
| `OpenAI__ApiKey` | Solo para IA | Generación de propuestas de rutina |
| `PayPal__ClientId` | Solo para pagos | Credencial sandbox/live |
| `PayPal__ClientSecret` | Solo para pagos | Secreto sandbox/live |
| `Smtp__Username` | Solo para email | Usuario SMTP |
| `Smtp__Password` | Solo para email | Contraseña SMTP |

Los dos puntos de las claves JSON se reemplazan por doble guion bajo en variables de entorno.

## Frontend

El frontend utiliza únicamente:

- `VITE_API_BASE_URL`
- `VITE_RSS_PROXY_URL`

Toda variable `VITE_*` se incluye en el bundle público. Nunca debe contener claves privadas, contraseñas o secretos.

## Antes de publicar

1. Confirmar que `appsettings.Local.json` y `.env` no estén trackeados.
2. Buscar claves, emails, documentos y cadenas de conexión.
3. Rotar cualquier credencial que haya sido compartida previamente.
4. Evitar backups, archivos `.bak`, dumps SQL y bases locales.
