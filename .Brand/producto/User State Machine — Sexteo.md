# 🧠 User State Machine — Sexteo

## 🎯 ¿Qué es?

Un sistema que define:

* En qué estado se encuentra el usuario
* Qué puede hacer
* Qué eventos lo hacen cambiar de estado
* Qué triggers activan monetización o retención

---

# 🌐 Estados Globales del Usuario

---

## 1️⃣ VISITANTE

No registrado.

Puede:

* Ver landing
* Explorar previews públicas limitadas

Transición:
→ Registro

---

## 2️⃣ REGISTRADO (Sin personaje)

Cuenta creada pero sin identidad narrativa.

Puede:

* Configurar límites
* Crear personaje

No puede:

* Entrar a historias

Transición:
→ Crear personaje → ACTIVO INICIAL

---

## 3️⃣ ACTIVO INICIAL

Tiene personaje pero no inició historia.

Puede:

* Buscar matching
* Entrar a sala
* Invitar usuario

Eventos:

* Match exitoso
* Entrar a sala

Transición:
→ EN HISTORIA

---

## 4️⃣ EN HISTORIA

Participando activamente en una narrativa.

Subestados:

* Escribiendo
* Esperando respuesta
* Intensidad alta
* Pausado
* En conflicto (reporte o límite activado)

Eventos:

* Pausa
* Abandono
* Finalización narrativa

Transición:
→ HISTORIA FINALIZADA
→ PAUSA EMOCIONAL
→ BLOQUEO

---

## 5️⃣ HISTORIA FINALIZADA

Historia cerrada formalmente.

Puede:

* Guardar
* Puntuar experiencia
* Repetir con usuario
* Buscar nueva historia

Transición:
→ EN HISTORIA
→ ACTIVO EXPLORANDO

---

## 6️⃣ ACTIVO EXPLORANDO

Usuario navega sin estar en historia activa.

Puede:

* Ajustar límites
* Crear nuevo personaje
* Entrar a eventos

Eventos:

* Match
* Invitación

Transición:
→ EN HISTORIA

---

## 7️⃣ PAUSA EMOCIONAL

Usuario activó botón de pausa o límite.

Puede:

* Reflexionar
* Ajustar configuración
* Salir

Sistema:

* Reduce intensidad
* Notifica contraparte

Transición:
→ ACTIVO EXPLORANDO
→ EN HISTORIA

---

## 8️⃣ REPUTACIÓN EN RIESGO

Por reportes o conducta inconsistente con límites.

Sistema:

* Reduce visibilidad
* Limita matching
* Requiere revisión

Transición:
→ NORMALIZADO
→ BLOQUEADO

---

## 9️⃣ BLOQUEADO

No puede interactuar.

---

# 💎 Estados de Monetización (Paralelos)

Estos no reemplazan estados principales, se superponen:

* FREE
* PREMIUM
* CREADOR PRO
* NARRADOR IA PLUS

Cambian acceso a:

* Salas exclusivas
* Matching prioritario
* Personajes múltiples
* Eventos privados

---

# 🔄 Eventos Clave que Cambian Estados

* Registro
* Crear personaje
* Match aceptado
* Primer mensaje enviado
* Activar pausa
* Reporte recibido
* Suscripción pagada
* Cancelación premium

---

# 📊 Estados de Engagement (Tracking interno)

Para growth:

* NUEVO (0–1 historia)
* EXPLORADOR (2–5 historias)
* INVOLUCRADO (6–20)
* CORE USER (20+)
* EMBAJADOR (invita usuarios)

Esto no se muestra al usuario pero activa:

* recompensas
* eventos personalizados
* ofertas premium

---

# 🧬 Arquitectura Simplificada

El usuario siempre está en:

1 Estado Global

* 1 Estado de Monetización
* 1 Nivel de Engagement
* 1 Estado Narrativo (si aplica)

Ejemplo real:

> Usuario #4821
> Estado: EN HISTORIA
> Monetización: PREMIUM
> Engagement: INVOLUCRADO
> Subestado: Intensidad media

---

# 🧠 Lo Poderoso de Esto

Te permite:

* automatizar retención
* personalizar matching
* detectar riesgo emocional
* disparar upsells en momentos correctos
* escalar moderación

---

Si querés, ahora podemos diseñar:

1️⃣ Diagrama técnico estilo backend
2️⃣ Lógica del algoritmo de matching psicológico
3️⃣ Arquitectura completa del MVP
4️⃣ Sistema de reputación y scoring

¿Cuál llevamos a nivel ingeniería ahora?
