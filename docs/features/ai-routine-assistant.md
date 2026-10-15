# Asistente de rutinas con IA

El asistente genera una propuesta de rutina para que un entrenador la revise. La generación no modifica la base ni crea historial por sí sola.

## Flujo

1. El entrenador selecciona socio, día y contexto de la rutina.
2. Puede agregar instrucciones, restricciones u objetivos.
3. La API reúne el perfil permitido y el catálogo de ejercicios disponible.
4. El proveedor de IA devuelve una propuesta estructurada.
5. El entrenador revisa advertencias y ejercicios.
6. **Aplicar propuesta** modifica únicamente el borrador de la interfaz.
7. **Guardar** persiste la rutina y genera el historial correspondiente.

## Endpoint

```http
POST /api/Rutina/{idRutina}/ia/recomendacion
```

Requiere:

- JWT válido.
- Permiso `EDITAR_RUTINA`.
- Tenant resuelto.
- Rutina activa.
- Catálogo de ejercicios disponible.
- `OpenAI:ApiKey` configurada localmente.

## Principios de seguridad

- No se versionan ni muestran claves de API.
- No se persisten prompts, respuestas ni borradores generados.
- La propuesta solo puede utilizar ejercicios del catálogo enviado por el backend.
- El resultado no reemplaza criterio profesional ni debe presentar diagnósticos médicos.
- La decisión final y la persistencia siempre pertenecen al entrenador.
