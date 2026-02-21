# 📦 Storage & Media Plan — Sexteo Platform

> **Backend**: Appwrite Storage
> **Limitación actual**: Appwrite Cloud Free Plan → 1 bucket máximo

---

## Buckets Necesarios

### En Cloud Free (Actual)

Un solo bucket `avatars` que almacena **todos los archivos**:

| Bucket ID | Uso | Max Size |
|-----------|-----|----------|
| `avatars` | Avatars de usuarios, avatars de personajes, media adjunta en chat | 100MB |

### En Self-Hosted (Futuro)

| Bucket ID | Uso | Max Size | Extensiones |
|-----------|-----|----------|-------------|
| `avatars` | Fotos de perfil de usuarios | 10MB | jpg, jpeg, png, webp |
| `character_assets` | Avatares e imágenes de personajes | 20MB | jpg, jpeg, png, webp, gif |
| `chat_media` | Archivos adjuntos en mensajes | 50MB | jpg, jpeg, png, webp, gif, mp4, webm |
| `story_exports` | Historias exportadas como PDF/doc | 20MB | pdf, docx, txt |
| `audio` | Audio narrativo (voice RP) | 100MB | mp3, ogg, wav |

---

## Reglas de Storage

### Permisos

```
Lectura:  Role.any()          → Cualquiera puede ver avatars/media públicos
Crear:    Role.users()        → Solo usuarios autenticados pueden subir
Actualizar: Role.users()      → Solo usuarios autenticados
Eliminar: Role.users()        → Solo usuarios autenticados
```

### Reglas por Tipo de Archivo

| Tipo | Max Size | Compresión | Thumbnail |
|------|----------|-----------|-----------|
| Avatar de usuario | 5MB | Re-escalar a 400×400px | 100×100px |
| Avatar de personaje | 10MB | Re-escalar a 600×600px | 150×150px |
| Media en chat (imagen) | 20MB | Mantener original | 300px max-width |
| Media en chat (video) | 50MB | No procesar client-side | Preview frame |
| Audio | 100MB | No procesar | N/A |

### Naming Convention

```
Avatars:       {userId}_avatar_{timestamp}.{ext}
Characters:    {characterId}_avatar_{timestamp}.{ext}
Chat Media:    {roomId}_{messageId}_{timestamp}.{ext}
Exports:       {roomId}_export_{timestamp}.{ext}
Audio:         {roomId}_{senderId}_{timestamp}.{ext}
```

---

## Limpieza y Retención

### Política de Retención

| Tipo | Retención | Acción al vencer |
|------|-----------|------------------|
| Avatars de usuarios | Permanente (mientras la cuenta exista) | Eliminar con la cuenta |
| Avatars de personajes | Permanente (mientras el personaje exista) | Eliminar con el personaje |
| Media en chat | 90 días para FREE, permanente para PREMIUM | Archivar o eliminar |
| Historias exportadas | 30 días para FREE, permanente para PREMIUM | Eliminar |
| Audio | 30 días para FREE, 90 días para PREMIUM | Eliminar |

### Limpieza de Cuenta Eliminada
1. Eliminar todos los archivos del usuario en todos los buckets
2. Anonimizar mensajes en rooms (reemplazar con "[Usuario eliminado]")
3. Mantener rooms y feedback para integridad del sistema

---

## Cuotas por Plan

| Recurso | FREE | PREMIUM | CREATOR_PRO |
|---------|------|---------|-------------|
| Storage total | 100MB | 1GB | 5GB |
| Subida por archivo | 10MB | 50MB | 100MB |
| Retención media | 90 días | Permanente | Permanente |

---

## Referencias en Código

```javascript
// src/lib/appwrite.js
export const BUCKETS = {
    AVATARS: 'avatars',
    MEDIA: 'avatars',  // En Cloud free plan: mismo bucket
    // Futuro self-hosted:
    // CHARACTER_ASSETS: 'character_assets',
    // CHAT_MEDIA: 'chat_media',
    // STORY_EXPORTS: 'story_exports',
    // AUDIO: 'audio',
};
```

---

## Notas de Implementación

> [!WARNING]
> En Cloud Free Plan, todo va al bucket `avatars`. Al migrar a self-hosted, crear los buckets separados y actualizar las constantes `BUCKETS` en `src/lib/appwrite.js`.

> [!NOTE]
> Appwrite gestiona automáticamente la deduplicación de archivos con el mismo hash. No es necesario implementar lógica de deduplicación client-side.
