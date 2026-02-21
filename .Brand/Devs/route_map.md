# Mapa de Rutas — Sexteo

> Última actualización: 2026-02-20

## Rutas Públicas
Accesibles sin ningún tipo de sesión.

| Ruta | Archivo | Descripción |
|------|---------|------------|
| `/` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/+page.svelte) | Landing page |
| `/auth` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/auth/+page.svelte) | Login / Registro / Recuperar contraseña |
| `/verify` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/verify/+page.svelte) | Verificación de edad (+18) |
| `/welcome` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/welcome/+page.svelte) | Pantalla de bienvenida pre-registro |

## Rutas de Onboarding (Sesión anónima OK)
Requieren sesión (anónima o registrada). Flujo de descubrimiento inicial.

| Ruta | Archivo | Flujo | Descripción |
|------|---------|-------|------------|
| `/discovery/intent` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/discovery/intent/+page.svelte) | — | Selección de intención (explorar/crear/chatear) |
| `/discovery/limits` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/discovery/limits/+page.svelte) | Explore | Configuración de límites |
| `/discovery/discover` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/discovery/discover/+page.svelte) | Explore | Descubrir experiencias |
| `/discovery/identity` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/discovery/identity/+page.svelte) | Create | Crear identidad de personaje |
| `/discovery/personality` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/discovery/personality/+page.svelte) | Create | Personalidad del personaje |
| `/discovery/preferences` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/discovery/preferences/+page.svelte) | Chat | Preferencias de chat |
| `/discovery/matching` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/discovery/matching/+page.svelte) | Chat | Pantalla de matching |
| `/discovery/tutorial` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/discovery/tutorial/+page.svelte) | Todos | Tutorial de plataforma |
| `/discovery/done` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/discovery/done/+page.svelte) | Todos | Onboarding completado |

## Rutas Privadas (Requieren registro)
Solo accesibles para usuarios registrados con email/contraseña.

| Ruta | Archivo | Descripción |
|------|---------|------------|
| `/stories` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/stories/+page.svelte) | Explorador de historias (mis rooms) |
| `/profile` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/profile/+page.svelte) | Editar perfil y avatar |
| `/chat/[roomId]` | [+page.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/chat/[roomId]/+page.svelte) | Chat en tiempo real dentro de una sala |

## Protección de Rutas

Definida en [+layout.svelte](file:///f:/Proyectos/Sexteo.com/ONBOARDING/src/routes/+layout.svelte):

```
Público     → PUBLIC_ROUTES      → Sin sesión
Anónimo OK  → ANONYMOUS_OK_ROUTES → /discovery/*
Privado     → Todo lo demás       → Requiere $isRegistered
```

## Flujos de Navegación

```mermaid
graph TD
    A["/ (Landing)"] --> B["/welcome"]
    B --> C["/verify (+18)"]
    C --> D["/auth (Login/Registro)"]    
    C --> E["/discovery/intent"]
    E --> F1["/discovery/limits"]
    E --> F2["/discovery/identity"]
    E --> F3["/discovery/preferences"]
    F1 --> G1["/discovery/discover"]
    F2 --> G2["/discovery/personality"]
    F3 --> G3["/discovery/matching"]
    G1 & G2 & G3 --> H["/discovery/tutorial"]
    H --> I["/discovery/done"]
    D --> J["/stories (Mis Historias)"]
    J --> K["/chat/roomId"]
    J --> L["/profile"]
