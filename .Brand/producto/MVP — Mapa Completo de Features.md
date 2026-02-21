
# 🧭 MVP — Mapa Completo de Features

**Sexteo — Plataforma de Storytelling Adulto Interactivo**

---

## 1) Sistema de Usuarios (Core obligatorio)

Base mínima para que exista red social.

**Cuenta**

* registro / login
* verificación +18
* recuperación contraseña

**Perfil**

* avatar
* bio narrativa
* tags de interés
* límites narrativos
* nivel de experiencia

**Estado**

* disponible
  en historia
  ocupado
  invisible

---

## 2) Personajes (Feature Diferencial)

El usuario no chatea como él mismo sino como personaje.

* crear personaje
* editar personaje
* seleccionar personaje activo
* múltiples personajes guardados

**Campos**

* nombre
* personalidad
* estilo narrativo
* deseos de trama
* límites
* género narrativo

---

## 3) Sistema de Matching Inteligente (MVP simple)

Primer versión sin IA compleja.

Matching basado en:

* tags
* límites compatibles
* intensidad narrativa
* género de historia

Botones:

* buscar historia
* aceptar
* rechazar

---

## 4) Motor de Chat Narrativo (Núcleo del producto)

Debe sentirse distinto a un chat normal.

**Funciones mínimas**

* chat en tiempo real
* formato texto libre
* indicador escribiendo
* historial persistente

**Extras MVP**

* formato acción (*camina lentamente*)
* formato diálogo
* emojis narrativos

---

## 5) Salas

Solo dos tipos en MVP:

* privadas 1 a 1
* privadas grupales (máx 5)

(no públicas aún para simplificar moderación)

---

## 6) Sistema de Consentimiento y Límites (Clave competitiva)

Antes de iniciar chat aparece panel de compatibilidad:

Checklist:

* intensidad narrativa
* temas permitidos
* temas prohibidos
* ritmo narrativo

Botón:
**Aceptar dinámica**

---

## 7) Seguridad y Control

Indispensable para confianza.

* botón salir inmediato
* bloquear usuario
* reportar usuario
* silenciar usuario
* finalizar historia

---

## 8) Sistema de Reputación

Gamifica el comportamiento.

Cada sesión permite calificar:

* creatividad
* respeto
* coherencia narrativa

Score visible en perfil.

---

## 9) Panel Moderador (Admin interno)

Herramientas mínimas:

* ver reportes
* suspender cuentas
* banear
* logs de chat reportados
* métricas activas

---

## 10) Sistema de Notificaciones

* match encontrado
* invitación a historia
* respuesta recibida
* solicitud aceptada

---

## 11) Onboarding Inteligente (Importante para retención)

Primer login:

1. elegí personaje
2. elegí intereses
3. elegí límites
4. probá historia demo

---

## 12) Monetización MVP (simple)

No compliques el primer lanzamiento.

Opciones iniciales:

* suscripción premium
* personajes extra
* más slots de personajes
* prioridad en matching

---

## 13) Analytics Internos

Para iterar producto.

Trackear:

* duración promedio historia
* matches exitosos
* abandonos tempranos
* usuarios activos diarios
* tasa de reporte

---

## 14) Tech Stack sugerido MVP

Simple + escalable:

Frontend → React / Next
Backend → Node + WebSockets
DB → PostgreSQL
Realtime → Socket.io
Auth → Firebase/Auth0
Hosting → Vercel + AWS

---

# 🧱 Arquitectura de MVP (prioridad real de desarrollo)

**Fase 1 — Esqueleto**

* login
* perfil
* chat 1-1

**Fase 2 — Identidad narrativa**

* personajes
* matching
* límites

**Fase 3 — Retención**

* reputación
* notificaciones
* salas grupales

---

# 🏆 Feature Clave que Define el Producto

El verdadero diferencial no es el chat.
Es esta combinación:

> personaje + consentimiento + narrativa en vivo

Eso crea una experiencia que ninguna app de chat tiene.

---

✅ **Definición simple del MVP listo para lanzar**

> Una plataforma donde adultos crean personajes, hacen match por compatibilidad narrativa y viven historias privadas en tiempo real.
